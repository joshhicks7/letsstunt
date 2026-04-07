/** Map Firebase Callable (`httpsCallable`) errors to short user-facing messages. */
export function mapDeleteAccountError(e: unknown): string {
  const code =
    e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
  if (code === 'functions/unauthenticated') {
    return 'Sign in again, then try closing your account.';
  }
  if (code === 'functions/unavailable' || code === 'functions/deadline-exceeded') {
    return 'Service temporarily unavailable. Try again later.';
  }
  if (code.startsWith('functions/')) {
    return 'Could not close your account. Try again.';
  }
  return 'Something went wrong. Try again.';
}
