import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';

admin.initializeApp();

const REGION = 'us-central1';

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function swipeDocId(fromUserId: string, targetType: 'profile' | 'group', targetId: string): string {
  return `${fromUserId}_${targetType}_${targetId}`;
}

function matchDocIdProfile(a: string, b: string): string {
  const [x, y] = sortedPair(a, b);
  return `p_${x}_${y}`;
}

function matchDocIdGroup(userId: string, groupId: string): string {
  const [x, y] = sortedPair(userId, groupId);
  return `g_${x}_${y}`;
}

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

function collectFcmTokens(data: admin.firestore.DocumentData | undefined): string[] {
  if (!data) return [];
  const list: string[] = [];
  const arr = data.fcmTokens;
  if (Array.isArray(arr)) {
    for (const x of arr) {
      if (typeof x === 'string' && x.length > 0) list.push(x);
    }
  }
  const legacy = data.fcmToken;
  if (typeof legacy === 'string' && legacy.length > 0) list.push(legacy);
  return [...new Set(list)];
}

async function pruneInvalidFcmToken(
  db: admin.firestore.Firestore,
  uid: string,
  token: string,
): Promise<void> {
  const ref = db.collection('users').doc(uid);
  let snap: admin.firestore.DocumentSnapshot;
  try {
    snap = await ref.get();
  } catch (err) {
    console.warn(`[pruneInvalidFcmToken] read failed`, { uid, err });
    return;
  }
  const d = snap.data();
  const updates: Record<string, unknown> = {};
  if (d?.fcmToken === token) {
    updates.fcmToken = FieldValue.delete();
  }
  if (Array.isArray(d?.fcmTokens) && d.fcmTokens.includes(token)) {
    updates.fcmTokens = FieldValue.arrayRemove(token);
  }
  if (Object.keys(updates).length === 0) return;
  try {
    await ref.update(updates);
  } catch (err) {
    console.warn(`[pruneInvalidFcmToken] update failed`, { uid, err });
  }
}

/**
 * Resolve Firebase auth UIDs to notify for a new chat message.
 * Profile matches: the other user id in `userIds`.
 * Group matches: one id may be a `groupListings` doc id — notify that listing's creator.
 */
async function resolveChatRecipientUserIds(
  db: admin.firestore.Firestore,
  matchUserIds: string[],
  senderId: string,
): Promise<string[]> {
  const out = new Set<string>();
  for (const id of matchUserIds) {
    if (id === senderId) continue;
    const userSnap = await db.collection('users').doc(id).get();
    if (userSnap.exists) {
      out.add(id);
      continue;
    }
    const listingSnap = await db.collection('groupListings').doc(id).get();
    const creatorId = listingSnap.data()?.creatorId;
    if (typeof creatorId === 'string' && creatorId !== senderId) {
      out.add(creatorId);
    }
  }
  return [...out];
}

/**
 * Send FCM to human users (reads `users/{uid}.fcmTokens` and legacy `fcmToken`).
 * Skips uids with `pushNotificationsEnabled === false` or no tokens.
 * `context` appears in logs for filtering (e.g. Cloud Logging).
 */
async function sendPushToUserIds(
  db: admin.firestore.Firestore,
  userIds: string[],
  payload: PushPayload,
  context: string,
): Promise<void> {
  const unique = [...new Set(userIds.filter((id) => typeof id === 'string' && id.length > 0))];
  const tokenMeta: { token: string; uid: string }[] = [];
  const uidsSkippedPrefs: string[] = [];
  const uidsMissingToken: string[] = [];
  for (const uid of unique) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const data = userDoc.data();
      if (data?.pushNotificationsEnabled === false) {
        uidsSkippedPrefs.push(uid);
        continue;
      }
      const forUser = collectFcmTokens(data);
      if (forUser.length === 0) {
        uidsMissingToken.push(uid);
        continue;
      }
      for (const token of forUser) {
        tokenMeta.push({ token, uid });
      }
    } catch (err) {
      console.error(`[sendPushToUserIds:${context}] token fetch failed`, { uid, err });
    }
  }

  const tokens = tokenMeta.map((m) => m.token);

  console.log(`[sendPushToUserIds:${context}]`, {
    targetUids: unique.length,
    tokenCount: tokens.length,
    skippedPrefsUids: uidsSkippedPrefs,
    missingTokenUids: uidsMissingToken,
    notificationTitle: payload.title,
    dataKeys: payload.data ? Object.keys(payload.data) : [],
  });

  if (tokens.length === 0) {
    console.warn(`[sendPushToUserIds:${context}] skip send: no FCM tokens`);
    return;
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title: payload.title, body: payload.body },
    };
    if (payload.data) {
      message.data = payload.data;
    }
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[sendPushToUserIds:${context}] FCM multicast`, {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
    if (response.failureCount > 0) {
      const failures = response.responses
        .map((r, i) => (!r.success ? { index: i, error: r.error?.code ?? r.error?.message } : null))
        .filter(Boolean)
        .slice(0, 5);
      console.warn(`[sendPushToUserIds:${context}] partial failure samples`, failures);
      const pruneOps: Promise<void>[] = [];
      for (let i = 0; i < response.responses.length; i++) {
        const r = response.responses[i];
        if (r.success) continue;
        const code = r.error?.code;
        if (
          code !== 'messaging/registration-token-not-registered' &&
          code !== 'messaging/invalid-registration-token'
        ) {
          continue;
        }
        const meta = tokenMeta[i];
        if (meta) {
          pruneOps.push(pruneInvalidFcmToken(db, meta.uid, meta.token));
        }
      }
      await Promise.all(pruneOps);
    }
  } catch (err) {
    console.error(`[sendPushToUserIds:${context}] sendEachForMulticast error`, err);
  }
}

async function sendMatchPushNotifications(db: admin.firestore.Firestore, userIds: string[]): Promise<void> {
  await sendPushToUserIds(
    db,
    userIds,
    {
      title: "It's a Match",
      body: 'You matched on LetsStunt — open the app to say hi.',
    },
    'match',
  );
}

/**
 * When a user likes (swipe doc with direction like), create a match server-side if rules are satisfied,
 * then send push notifications. Replaces client-side mutual checks and match writes.
 */
export const createMatchWhenSwipeLiked = onDocumentWritten(
  { document: 'swipes/{swipeId}', region: REGION },
  async (event) => {
    const swipeId = event.params.swipeId;
    const after = event.data?.after;
    if (!after?.exists) {
      console.log('[createMatchWhenSwipeLiked] skip: doc deleted or missing after', { swipeId });
      return;
    }

    const data = after.data();
    if (!data) {
      console.log('[createMatchWhenSwipeLiked] skip: no data', { swipeId });
      return;
    }
    if (data.direction !== 'like') {
      console.log('[createMatchWhenSwipeLiked] skip: not a like', { swipeId, direction: data.direction });
      return;
    }

    const fromUserId = data.fromUserId;
    const targetId = data.targetId;
    const targetType = data.targetType;
    if (typeof fromUserId !== 'string' || typeof targetId !== 'string') {
      console.log('[createMatchWhenSwipeLiked] skip: invalid fromUserId/targetId', { swipeId });
      return;
    }
    if (targetType !== 'profile' && targetType !== 'group') {
      console.log('[createMatchWhenSwipeLiked] skip: bad targetType', { swipeId, targetType });
      return;
    }

    const db = admin.firestore();

    if (targetType === 'group') {
      const matchId = matchDocIdGroup(fromUserId, targetId);
      const ref = db.collection('matches').doc(matchId);
      const created = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) return false;
        const [x, y] = sortedPair(fromUserId, targetId);
        tx.set(ref, {
          userIds: [x, y],
          kind: 'group',
          matchedAt: FieldValue.serverTimestamp(),
        });
        return true;
      });
      if (!created) {
        console.log('[createMatchWhenSwipeLiked] group match already exists', { swipeId, matchId, fromUserId, listingId: targetId });
        return;
      }

      console.log('[createMatchWhenSwipeLiked] group match created', { swipeId, matchId, fromUserId, listingId: targetId });

      const notifyIds = [fromUserId];
      try {
        const listing = await db.collection('groupListings').doc(targetId).get();
        const creatorId = listing.data()?.creatorId;
        if (typeof creatorId === 'string' && creatorId !== fromUserId) notifyIds.push(creatorId);
      } catch (e) {
        console.error('[createMatchWhenSwipeLiked] group listing lookup failed', { listingId: targetId, err: e });
      }
      console.log('[createMatchWhenSwipeLiked] notifying group match', { matchId, notifyUids: notifyIds });
      await sendMatchPushNotifications(db, notifyIds);
      return;
    }

    // profile: require reciprocal like
    const reciprocalId = swipeDocId(targetId, 'profile', fromUserId);
    ProfileMutual:
    {
      const recSnap = await db.collection('swipes').doc(reciprocalId).get();
      const rec = recSnap.data();
      if (!rec || rec.direction !== 'like') {
        console.log('[createMatchWhenSwipeLiked] profile: waiting for mutual like', {
          swipeId,
          fromUserId,
          targetId,
          reciprocalId,
          reciprocalExists: recSnap.exists,
          reciprocalDirection: rec?.direction,
        });
        return;
      }

      const matchId = matchDocIdProfile(fromUserId, targetId);
      const ref = db.collection('matches').doc(matchId);
      const created = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) return false;
        const [x, y] = sortedPair(fromUserId, targetId);
        tx.set(ref, {
          userIds: [x, y],
          kind: 'profile',
          matchedAt: FieldValue.serverTimestamp(),
        });
        return true;
      });
      if (!created) {
        console.log('[createMatchWhenSwipeLiked] profile match already exists', { swipeId, matchId, fromUserId, targetId });
        return;
      }

      console.log('[createMatchWhenSwipeLiked] profile match created', { swipeId, matchId, userPair: sortedPair(fromUserId, targetId) });
      console.log('[createMatchWhenSwipeLiked] notifying profile match', { matchId, notifyUids: [fromUserId, targetId] });
      await sendMatchPushNotifications(db, [fromUserId, targetId]);
    }
  },
);

/**
 * Push notify the other participant(s) when a new DM is created under `matches/{matchId}/messages`.
 */
export const notifyOnChatMessageCreated = onDocumentCreated(
  { document: 'matches/{matchId}/messages/{messageId}', region: REGION },
  async (event) => {
    const matchId = event.params.matchId;
    const snap = event.data;
    if (!snap?.exists) return;

    const msg = snap.data();
    const senderId = typeof msg.senderId === 'string' ? msg.senderId : '';
    const bodyRaw = typeof msg.body === 'string' ? msg.body : '';
    if (!senderId || !bodyRaw) return;

    const db = admin.firestore();
    const matchSnap = await db.collection('matches').doc(matchId).get();
    const md = matchSnap.data();
    const userIds = Array.isArray(md?.userIds)
      ? md.userIds.filter((x: unknown): x is string => typeof x === 'string')
      : [];
    if (userIds.length === 0) return;

    const recipientUids = await resolveChatRecipientUserIds(db, userIds, senderId);
    if (recipientUids.length === 0) return;

    let senderLabel = 'Someone';
    try {
      const pub = await db.collection('publicProfiles').doc(senderId).get();
      const name = pub.data()?.displayName;
      if (typeof name === 'string' && name.trim()) senderLabel = name.trim().slice(0, 40);
    } catch {
      /* use default label */
    }

    const messageId = event.params.messageId;
    console.log('[notifyOnChatMessageCreated]', {
      matchId,
      messageId,
      senderId,
      recipientCount: recipientUids.length,
      recipientUids,
    });

    const preview = bodyRaw.length > 120 ? `${bodyRaw.slice(0, 117)}...` : bodyRaw;
    await sendPushToUserIds(
      db,
      recipientUids,
      {
        title: `Message from ${senderLabel}`,
        body: preview,
        data: { type: 'chat', matchId: String(matchId) },
      },
      'chat',
    );
  },
);

/**
 * Soft-delete then remove Auth: Storage profile media, squad + listing cleanup,
 * tombstone Firestore user + public profile, delete blocks involving uid, then Auth delete.
 */
export const deleteMyAccount = onCall({ region: REGION }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  const uid = request.auth.uid;
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  try {
    await bucket.deleteFiles({ prefix: `users/${uid}/profile/` }).catch(() => undefined);
  } catch {
    /* non-fatal */
  }

  const squadsSnap = await db.collection('squads').where('memberIds', 'array-contains', uid).get();
  for (const doc of squadsSnap.docs) {
    const data = doc.data();
    const memberIds: string[] = Array.isArray(data.memberIds)
      ? data.memberIds.filter((x: unknown): x is string => typeof x === 'string')
      : [];
    const creatorId = typeof data.creatorId === 'string' ? data.creatorId : '';
    const others = memberIds.filter((id) => id !== uid);

    try {
      if (others.length === 0) {
        await doc.ref.delete();
        continue;
      }
      if (creatorId === uid) {
        const nextCreator = others.slice().sort()[0];
        await doc.ref.update({
          creatorId: nextCreator,
          memberIds: FieldValue.arrayRemove(uid),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        await doc.ref.update({
          memberIds: FieldValue.arrayRemove(uid),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } catch {
      /* unknown squad shape; try remove user only */
      try {
        await doc.ref.update({
          memberIds: FieldValue.arrayRemove(uid),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch {
        /* ignore */
      }
    }
  }

  const listingsSnap = await db.collection('groupListings').where('creatorId', '==', uid).get();
  for (const doc of listingsSnap.docs) {
    await doc.ref.delete().catch(() => undefined);
  }

  const blocksAsBlocker = await db.collection('blocks').where('blockerId', '==', uid).get();
  const blocksAsBlocked = await db.collection('blocks').where('blockedId', '==', uid).get();
  let writeBatch = db.batch();
  let batchCount = 0;
  const flushBlocks = async () => {
    if (batchCount === 0) return;
    await writeBatch.commit();
    writeBatch = db.batch();
    batchCount = 0;
  };
  for (const d of [...blocksAsBlocker.docs, ...blocksAsBlocked.docs]) {
    writeBatch.delete(d.ref);
    batchCount++;
    if (batchCount >= 400) await flushBlocks();
  }
  await flushBlocks();

  const closedAt = FieldValue.serverTimestamp();
  const redactedProfile = {
    displayName: 'Former user',
    birthday: '2000-01-01',
    primaryRole: 'coed-flyer',
    secondaryRoles: [] as string[],
    positions: ['coed-flyer'],
    skillLevel: 'beginner',
    yearsExperience: 0,
    availability: [] as string[],
    skillTags: [] as string[],
    currentlyWorkingOn: '',
    instagramHandle: null,
    media: [] as unknown[],
    location: null,
    teamGym: null,
    bio: '',
    createdAt: '',
    updatedAt: '',
  };

  await db.collection('users').doc(uid).set(
    {
      accountClosedAt: closedAt,
      onboardingComplete: false,
      profile: redactedProfile,
    },
    { merge: true },
  );

  await db.collection('publicProfiles').doc(uid).set({
    accountClosedAt: closedAt,
  });

  try {
    await admin.auth().deleteUser(uid);
  } catch (e: unknown) {
    console.error('deleteUser failed', uid, e);
    throw new HttpsError('internal', 'Could not finish account closure. Try again or contact support.');
  }

  return { ok: true };
});
