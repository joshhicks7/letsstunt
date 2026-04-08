import { registerPushToken } from '@/lib/registerPush.native';

export function requestPushTokenWithUserGesture(uid: string) {
  return registerPushToken(uid);
}
