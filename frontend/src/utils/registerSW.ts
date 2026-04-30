/**
 * Service Worker registration entrypoint.
 *
 * Imports the virtual module exposed by vite-plugin-pwa and registers the SW
 * generated at build time. Called once from src/main.tsx during app boot.
 *
 * `autoUpdate` mode (set in vite.config.ts) means the SW will silently take
 * over on the next page load when a new build ships — no user prompt needed.
 */

// The virtual module is provided by vite-plugin-pwa; TS doesn't know about it,
// so we add a small ambient declaration in a .d.ts file. For now suppress.
// @ts-expect-error -- virtual module provided at build time by vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker() {
  // Only register in production builds — dev mode is configured to skip SW
  // (see devOptions.enabled in vite.config.ts).
  if (typeof window === 'undefined') return
  if (import.meta.env.DEV) return

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl: string, _registration: ServiceWorkerRegistration | undefined) {
      // No-op for now. Could surface a toast for "App ready for offline use".
    },
    onRegisterError(err: unknown) {
      console.warn('[SW] registration failed:', err)
    },
  })
}
