/**
 * Registers a small service worker so the studio page itself opens without internet
 * (model files are cached separately by the voice engines). Skipped in development
 * and inside embedded previews, where a cached page would hide fresh edits.
 */
export function registerOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;
  if (window.self !== window.top) return;
  if (window.location.hostname.startsWith("id-preview--")) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // Offline page loading is a convenience; the app works online without it.
  });
}
