import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();

const REGION = 'us-central1';

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
