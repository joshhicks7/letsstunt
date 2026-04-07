import * as FileSystem from 'expo-file-system';
import { getDownloadURL, ref, uploadBytes, uploadString } from 'firebase/storage';
import { Platform } from 'react-native';
import { getFirebaseStorage } from '@/lib/firebaseApp';
import type { StunterProfile } from '@/types';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export function isRemoteProfileMediaUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri.trim());
}

function extFromContentType(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}

/**
 * Upload a single profile image from a local picker URI (or pass through if already a download URL).
 */
export async function uploadProfileMediaItem(
  uid: string,
  item: { id: string; uri: string; type: 'image' | 'video' },
): Promise<{ id: string; uri: string; type: 'image' | 'video' }> {
  if (item.type !== 'image') {
    throw new Error('Only image uploads are supported.');
  }
  if (isRemoteProfileMediaUri(item.uri)) {
    return item;
  }

  const storage = getFirebaseStorage();

  if (Platform.OS === 'web') {
    const res = await fetch(item.uri);
    if (!res.ok) {
      throw new Error('Could not read the selected image.');
    }
    const blob = await res.blob();
    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error('Image is too large. Choose a smaller photo.');
    }
    const contentType = (() => {
      const h = res.headers.get('content-type');
      if (h && h.startsWith('image/')) return h;
      if (blob.type && blob.type.startsWith('image/')) return blob.type;
      return 'image/jpeg';
    })();
    const ext = extFromContentType(contentType);
    const objectRef = ref(storage, `users/${uid}/profile/${item.id}.${ext}`);
    await uploadBytes(objectRef, blob, { contentType });
    const url = await getDownloadURL(objectRef);
    return { ...item, uri: url };
  }

  const info = await FileSystem.getInfoAsync(item.uri);
  if (!info.exists) {
    throw new Error('Could not read the selected image.');
  }
  if (info.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large. Choose a smaller photo.');
  }

  const lower = item.uri.toLowerCase();
  const contentType = lower.includes('.png') ? 'image/png' : 'image/jpeg';
  const ext = extFromContentType(contentType);
  const objectRef = ref(storage, `users/${uid}/profile/${item.id}.${ext}`);
  const base64 = await FileSystem.readAsStringAsync(item.uri, { encoding: 'base64' });
  await uploadString(objectRef, base64, 'base64', { contentType });
  const url = await getDownloadURL(objectRef);
  return { ...item, uri: url };
}

/** Upload any local profile images; keep remote URLs as-is. Preserves order. */
export async function ensureProfileMediaUploaded(
  uid: string,
  media: StunterProfile['media'],
): Promise<StunterProfile['media']> {
  const images = media.filter((m) => m.type === 'image');
  return Promise.all(images.map((m) => uploadProfileMediaItem(uid, m)));
}
