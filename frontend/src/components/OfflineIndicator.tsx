import { useEffect, useState } from 'react'
import { pendingCount, replayQueue } from '../services/apiService'

/**
 * A small floating banner (bottom-left) that surfaces:
 *   - Online / Offline state
 *   - Number of writes queued for sync
 *   - "Install app" prompt when the browser fires `beforeinstallprompt`
 *
 * Designed to be lightweight and dismissible. Lives outside the main page
 * router so it shows on every screen.
 */

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[]
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function OfflineIndicator() {
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [queued, setQueued] = useState<number>(0)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissedInstall, setDismissedInstall] = useState<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('zenx_install_dismissed') === '1'
  )

  // Refresh the queued-write count
  const refreshCount = async () => {
    try {
      setQueued(await pendingCount())
    } catch {
      /* ignore — IDB unavailable */
    }
  }

  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true)
      // Replay then refresh count
      try {
        await replayQueue()
      } catch {
        /* the auto-replay in apiService also runs; ignore here */
      }
      refreshCount()
    }
    const handleOffline = () => {
      setOnline(false)
      refreshCount()
    }
    const handleInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleInstall)

    refreshCount()
    // Poll every 5s while offline so the user sees the queue grow as they work
    const interval = setInterval(refreshCount, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstall)
      clearInterval(interval)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    setInstallPrompt(null)
    if (outcome === 'dismissed') {
      localStorage.setItem('zenx_install_dismissed', '1')
      setDismissedInstall(true)
    }
  }

  const handleInstallDismiss = () => {
    localStorage.setItem('zenx_install_dismissed', '1')
    setInstallPrompt(null)
    setDismissedInstall(true)
  }

  // Nothing to show when online with no queue and no install prompt
  if (online && queued === 0 && (!installPrompt || dismissedInstall)) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        zIndex: 9999,
        maxWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {!online && (
        <div
          style={{
            background: '#fff3cd',
            color: '#664d03',
            border: '1px solid #ffe69c',
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            fontSize: '0.85rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          <strong>Offline.</strong> Your work is being saved locally and will sync when you reconnect.
          {queued > 0 && (
            <div style={{ marginTop: '0.3rem', fontSize: '0.78rem' }}>
              {queued} request{queued === 1 ? '' : 's'} queued.
            </div>
          )}
        </div>
      )}

      {online && queued > 0 && (
        <div
          style={{
            background: '#cff4fc',
            color: '#055160',
            border: '1px solid #9eeaf9',
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            fontSize: '0.85rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          Syncing {queued} pending request{queued === 1 ? '' : 's'}…
        </div>
      )}

      {installPrompt && !dismissedInstall && (
        <div
          style={{
            background: '#fff',
            color: '#0a3d62',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            fontSize: '0.85rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'space-between',
          }}
        >
          <span>Install ZenX for faster access and offline use.</span>
          <span style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={handleInstallClick}
              style={{
                background: '#0a3d62',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Install
            </button>
            <button
              onClick={handleInstallDismiss}
              style={{
                background: 'transparent',
                color: '#6c757d',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
          </span>
        </div>
      )}
    </div>
  )
}

export default OfflineIndicator
