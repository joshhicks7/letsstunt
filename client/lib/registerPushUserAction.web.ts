import { registerPushToken } from '@/lib/registerPush.web';

/** Call after an explicit user action (Settings toggle, banner button) so iOS Safari allows the prompt. */
export function requestPushTokenWithUserGesture(uid: string) {
  return registerPushToken(uid, { allowPrompt: true });
}
