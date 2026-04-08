/**
 * Web-only helpers for PWA / mobile browser push behavior.
 * Safe to import from shared code; guard with Platform.OS === 'web' before using window.
 */

export function isWebStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

export function isIOSMobileWebBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroidMobileWebBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/** True when we should show “Add to Home Screen” to improve push on mobile web. */
export function shouldShowInstallWebAppBanner(): boolean {
  if (typeof window === 'undefined') return false;
  if (isWebStandalone()) return false;
  return isIOSMobileWebBrowser() || isAndroidMobileWebBrowser();
}
