/**
 * Migration: for each users/{uid}.profile.media image without optimizedUri, add users/{uid}/profile/{id}.webp
 * (max width 800, WebP q70), set optimizedPath + optimizedUri. Original Storage objects are not deleted.
 *
 * Setup: cd scripts && npm install
 * Env: GOOGLE_APPLICATION_CREDENTIALS (or gcloud ADC). Optional: FIREBASE_STORAGE_BUCKET=mybucket.appspot.com
 *
 *   npx tsx migrate-images-to-webp.ts --uid=ONE_USER_AUTH_UID
 *   npx tsx migrate-images-to-webp.ts --limit=20
 *   npx tsx migrate-images-to-webp.ts
 */

import { config as loadEnv } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(scriptDir, '.env.local') });
loadEnv({ path: resolve(scriptDir, '.env') });
/** Client Expo env (project id / bucket) when not using a service-account JSON. */
loadEnv({ path: resolve(scriptDir, '../client/.env.local') });

const require = createRequire(import.meta.url);
const admin = require('firebase-admin') as typeof import('firebase-admin');
const sharp = require('sharp') as typeof import('sharp');

const THROTTLE_MS = 75;
const BATCH_USERS = 20;
const MAX_WIDTH = 800;
const WEBP_QUALITY = 70;
const MAX_RETRIES = 3;

type MediaItem = {
  id: string;
  uri: string;
  type: string;
  path?: string | null;
  optimizedPath?: string | null;
  optimizedUri?: string | null;
};

function parseArgs(): { limitUsers: number | null; targetUid: string | null } {
  let limitUsers: number | null = null;
  let targetUid: string | null = null;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--limit=')) {
      const n = Number(a.slice('--limit='.length));
      if (Number.isFinite(n) && n > 0) limitUsers = n;
    }
    if (a.startsWith('--uid=')) {
      const u = a.slice('--uid='.length).trim();
      if (u) targetUid = u;
    }
  }
  return { limitUsers, targetUid };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function pathFromFirebaseDownloadUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const i = u.pathname.indexOf('/o/');
    if (i === -1) return null;
    return decodeURIComponent(u.pathname.slice(i + 3));
  } catch {
    return null;
  }
}

async function retry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      console.warn(`[retry ${attempt}/${MAX_RETRIES}] ${label}:`, e instanceof Error ? e.message : e);
      if (attempt < MAX_RETRIES) await sleep(500 * attempt);
    }
  }
  throw last;
}

function buildDownloadUrl(bucketName: string, objectPath: string, token: string): string {
  const enc = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${enc}?alt=media&token=${token}`;
}

type MigrateUserResult = {
  processedImages: number;
  skipped: number;
  errors: number;
  firestoreUpdated: boolean;
  skippedNoProfileOrMedia: boolean;
};

async function migrateOneUserDoc(
  userDoc: admin.firestore.DocumentSnapshot,
  db: admin.firestore.Firestore,
  bucket: ReturnType<ReturnType<typeof admin.storage>['bucket']>,
): Promise<MigrateUserResult> {
  const empty: MigrateUserResult = {
    processedImages: 0,
    skipped: 0,
    errors: 0,
    firestoreUpdated: false,
    skippedNoProfileOrMedia: true,
  };

  if (!userDoc.exists) return empty;

  const data = userDoc.data() as Record<string, unknown>;
  const profile = data.profile as Record<string, unknown> | undefined;
  if (!profile || typeof profile !== 'object') {
    return empty;
  }

  const mediaRaw = profile.media;
  if (!Array.isArray(mediaRaw) || mediaRaw.length === 0) {
    return empty;
  }

  const newMedia = JSON.parse(JSON.stringify(mediaRaw)) as MediaItem[];
  let changed = false;
  let processedImages = 0;
  let skipped = 0;
  let errors = 0;
  const uid = userDoc.id;

  for (let i = 0; i < newMedia.length; i++) {
    const item = newMedia[i];
    if (item.type !== 'image' || typeof item.uri !== 'string' || typeof item.id !== 'string') {
      continue;
    }

    if (item.optimizedUri && String(item.optimizedUri).trim()) {
      skipped++;
      continue;
    }

    const webpPath = `users/${uid}/profile/${item.id}.webp`;

    try {
      const sourcePath =
        typeof item.path === 'string' && item.path.trim()
          ? item.path.trim()
          : pathFromFirebaseDownloadUrl(item.uri);

      let buffer: Buffer;
      if (sourcePath) {
        [buffer] = await retry(() => bucket.file(sourcePath).download(), `download ${sourcePath}`);
      } else {
        const res = await retry(() => fetch(item.uri), `fetch ${item.uri.slice(0, 96)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        buffer = Buffer.from(await res.arrayBuffer());
      }

      const webpBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const dest = bucket.file(webpPath);
      const downloadToken = randomUUID();
      await retry(
        () =>
          dest.save(webpBuffer, {
            metadata: {
              contentType: 'image/webp',
              metadata: { firebaseStorageDownloadTokens: downloadToken },
            },
            resumable: false,
          }),
        `upload ${webpPath}`,
      );

      const optimizedUri = buildDownloadUrl(bucket.name, webpPath, downloadToken);

      newMedia[i] = {
        ...item,
        path: typeof item.path === 'string' && item.path.trim() ? item.path : sourcePath ?? null,
        optimizedPath: webpPath,
        optimizedUri,
      };
      changed = true;
      processedImages++;
      await sleep(THROTTLE_MS);
    } catch (e) {
      console.error(`[error] user=${uid} media=${item.id}:`, e);
      errors++;
    }
  }

  if (changed) {
    await retry(
      () =>
        userDoc.ref.update({
          'profile.media': newMedia,
        }),
      `firestore users ${userDoc.id}`,
    );
    const pubRef = db.collection('publicProfiles').doc(userDoc.id);
    const pubSnap = await pubRef.get();
    if (pubSnap.exists) {
      await retry(() => pubRef.update({ media: newMedia }), `firestore publicProfiles ${userDoc.id}`);
    }
  }

  return {
    processedImages,
    skipped,
    errors,
    firestoreUpdated: changed,
    skippedNoProfileOrMedia: false,
  };
}

async function main() {
  const { limitUsers, targetUid } = parseArgs();

  if (targetUid && limitUsers != null) {
    console.error('Use either --uid=... or --limit=..., not both.');
    process.exit(1);
  }

  const projectId =
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucketFromEnv =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.GCLOUD_STORAGE_BUCKET ||
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!admin.apps.length) {
    const opts: { projectId?: string; storageBucket?: string } = {};
    if (projectId) opts.projectId = projectId;
    if (storageBucketFromEnv) opts.storageBucket = storageBucketFromEnv;
    admin.initializeApp(Object.keys(opts).length ? opts : undefined);
  }

  const db = admin.firestore();
  const app = admin.app();
  let bucketName =
    storageBucketFromEnv || (app.options.storageBucket as string | undefined);
  if (!bucketName && app.options.projectId) {
    bucketName = `${app.options.projectId}.appspot.com`;
  }
  if (!bucketName) {
    console.error(
      'Could not resolve Storage bucket. Set FIREBASE_STORAGE_BUCKET or EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET.',
    );
    process.exit(1);
  }
  const bucket = admin.storage().bucket(bucketName);

  if (targetUid) {
    const userDoc = await db.collection('users').doc(targetUid).get();
    if (!userDoc.exists) {
      console.error(`No document at users/${targetUid}.`);
      process.exit(1);
    }
    const r = await migrateOneUserDoc(userDoc, db, bucket);
    console.log(
      JSON.stringify(
        {
          mode: 'single-user',
          uid: targetUid,
          ...r,
        },
        null,
        2,
      ),
    );
    if (r.skippedNoProfileOrMedia) {
      console.warn('User doc exists but has no profile.media array to process.');
    }
    return;
  }

  let processedUsers = 0;
  let processedImages = 0;
  let skipped = 0;
  let errors = 0;

  let lastDoc: admin.firestore.QueryDocumentSnapshot | undefined;

  while (true) {
    if (limitUsers != null && processedUsers >= limitUsers) break;

    let q: admin.firestore.Query = db
      .collection('users')
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(BATCH_USERS);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;

    for (const userDoc of snap.docs) {
      if (limitUsers != null && processedUsers >= limitUsers) break;

      const r = await migrateOneUserDoc(userDoc, db, bucket);
      processedImages += r.processedImages;
      skipped += r.skipped;
      errors += r.errors;
      processedUsers++;
      console.log(`[user] ${userDoc.id} (${processedUsers} users)`);
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < BATCH_USERS) break;
  }

  console.log(JSON.stringify({ processedUsers, processedImages, skippedAlreadyOptimized: skipped, errors }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
