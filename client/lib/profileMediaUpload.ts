import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { getDownloadURL, ref, uploadBytes, uploadString } from 'firebase/storage';
import { Platform } from 'react-native';
import { getFirebaseStorage } from '@/lib/firebaseApp';
import type { ProfileMediaItem, StunterProfile } from '@/types';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export function isRemoteProfileMediaUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri.trim());
}

function mediaItemWithoutOptimized(item: ProfileMediaItem): Pick<ProfileMediaItem, 'id' | 'uri' | 'type'> {
  return { id: item.id, uri: item.uri, type: item.type };
}

/** Resize (max width 800), encode WebP q~0.7 — matches migration-style “optimized” asset. */
async function compressToProfileWebp(localUri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 800 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.WEBP,
    },
  );
  return result.uri;
}

/**
 * Upload a single profile image: local picks are compressed to WebP and only that file is stored
 * at `users/{uid}/profile/{id}.webp`. Remote `https` URLs are returned unchanged.
 */
export async function uploadProfileMediaItem(uid: string, item: ProfileMediaItem): Promise<ProfileMediaItem> {
  if (item.type !== 'image') {
    throw new Error('Only image uploads are supported.');
  }
  if (isRemoteProfileMediaUri(item.uri)) {
    return item;
  }

  const base = mediaItemWithoutOptimized(item);
  const storage = getFirebaseStorage();
  const webpRef = ref(storage, `users/${uid}/profile/${base.id}.webp`);

  if (Platform.OS === 'web') {
    const res = await fetch(item.uri);
    if (!res.ok) {
      throw new Error('Could not read the selected image.');
    }
    const blob = await res.blob();
    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error('Image is too large. Choose a smaller photo.');
    }
    const webpLocalUri = await compressToProfileWebp(item.uri);
    const webpRes = await fetch(webpLocalUri);
    if (!webpRes.ok) {
      throw new Error('Could not prepare the image for upload.');
    }
    const webpBlob = await webpRes.blob();
    await uploadBytes(webpRef, webpBlob, { contentType: 'image/webp' });
    const url = await getDownloadURL(webpRef);
    return { ...base, uri: url, path: webpRef.fullPath };
  }

  const info = await FileSystem.getInfoAsync(base.uri);
  if (!info.exists) {
    throw new Error('Could not read the selected image.');
  }
  if (info.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large. Choose a smaller photo.');
  }

  const webpLocalUri = await compressToProfileWebp(base.uri);
  const webpInfo = await FileSystem.getInfoAsync(webpLocalUri);
  if (!webpInfo.exists) {
    throw new Error('Could not prepare the image for upload.');
  }

  const base64 = await FileSystem.readAsStringAsync(webpLocalUri, { encoding: 'base64' });
  await uploadString(webpRef, base64, 'base64', { contentType: 'image/webp' });
  const url = await getDownloadURL(webpRef);
  return { ...base, uri: url, path: webpRef.fullPath };
}

/** Upload any local profile images; keep remote URLs as-is. Preserves order. */
export async function ensureProfileMediaUploaded(
  uid: string,
  media: StunterProfile['media'],
): Promise<StunterProfile['media']> {
  const images = media.filter((m) => m.type === 'image');
  return Promise.all(images.map((m) => uploadProfileMediaItem(uid, m)));
}
