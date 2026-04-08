import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

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

/**
 * Notify human users with stored FCM tokens. Skips non-user ids (e.g. group listing doc ids).
 */
async function sendMatchPushNotifications(db: admin.firestore.Firestore, userIds: string[]): Promise<void> {
  const unique = [...new Set(userIds.filter((id) => typeof id === 'string' && id.length > 0))];
  const tokens: string[] = [];
  for (const uid of unique) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const token = userDoc.data()?.fcmToken;
      if (typeof token === 'string' && token.length > 0) tokens.push(token);
    } catch (err) {
      console.error(`Failed to fetch FCM token for uid ${uid}`, err);
    }
  }
  if (tokens.length === 0) return;

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "It's a Match",
        body: 'You matched on LetsStunt — open the app to say hi.',
      },
    });
    if (response.failureCount > 0) {
      console.warn('FCM match notify partial failure', response.failureCount, response.responses.slice(0, 3));
    }
  } catch (err) {
    console.error('Error sending FCM match notifications:', err);
  }
}

/**
 * When a user likes (swipe doc with direction like), create a match server-side if rules are satisfied,
 * then send push notifications. Replaces client-side mutual checks and match writes.
 */
export const createMatchWhenSwipeLiked = onDocumentWritten(
  { document: 'swipes/{swipeId}', region: REGION },
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;

    const data = after.data();
    if (!data) return;
    if (data.direction !== 'like') return;

    const fromUserId = data.fromUserId;
    const targetId = data.targetId;
    const targetType = data.targetType;
    if (typeof fromUserId !== 'string' || typeof targetId !== 'string') return;
    if (targetType !== 'profile' && targetType !== 'group') return;

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
      if (!created) return;

      const notifyIds = [fromUserId];
      try {
        const listing = await db.collection('groupListings').doc(targetId).get();
        const creatorId = listing.data()?.creatorId;
        if (typeof creatorId === 'string' && creatorId !== fromUserId) notifyIds.push(creatorId);
      } catch (e) {
        console.error('group listing lookup for match notify', e);
      }
      await sendMatchPushNotifications(db, notifyIds);
      return;
    }

    // profile: require reciprocal like
    const reciprocalId = swipeDocId(targetId, 'profile', fromUserId);
    const recSnap = await db.collection('swipes').doc(reciprocalId).get();
    const rec = recSnap.data();
    if (!rec || rec.direction !== 'like') return;

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
    if (!created) return;

    await sendMatchPushNotifications(db, [fromUserId, targetId]);
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
