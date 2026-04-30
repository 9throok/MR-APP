/**
 * Offline Request Queue
 *
 * Persists API write requests (POST / PATCH / PUT / DELETE) to IndexedDB when
 * the browser is offline, then replays them in order once connectivity is
 * restored. Used by services/apiService.ts.
 *
 * Design notes:
 *   - We deliberately don't queue GETs. Reads aren't durable — the user can
 *     refresh later. Writes (DCR submission, expense save, etc.) MUST persist.
 *   - Each queued request stores method, path, body, headers (without auth —
 *     the token is re-attached at replay time so an expired token doesn't
 *     poison every queued request), and a created_at for ordering.
 *   - Replay is FIFO and stops on the first 5xx so retry-able failures don't
 *     drain the queue. 4xx is treated as terminal (the request was bad and
 *     replaying won't help) — we drop and emit a failed-replay event.
 *   - Optimistic UI: the wrapper in apiService returns { queued: true, id }
 *     so callers can show "Saved offline — will sync when online".
 */

const DB_NAME = 'zenx-offline'
const DB_VERSION = 1
const STORE_NAME = 'queue'

type QueuedRequest = {
  id?: number
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  path: string                  // path *without* the API_BASE prefix, e.g. "/dcr"
  body?: unknown
  contentType: 'json' | 'multipart-skip'   // multipart can't be safely re-built; we skip queueing those
  created_at: number            // epoch ms
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function enqueue(req: Omit<QueuedRequest, 'id' | 'created_at'>): Promise<number> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const record: QueuedRequest = { ...req, created_at: Date.now() }
    const addReq = store.add(record)
    addReq.onsuccess = () => resolve(addReq.result as number)
    addReq.onerror = () => reject(addReq.error)
  })
}

export async function size(): Promise<number> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function listAll(): Promise<QueuedRequest[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve((req.result as QueuedRequest[]).sort((a, b) => a.created_at - b.created_at))
    req.onerror = () => reject(req.error)
  })
}

async function remove(id: number): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/**
 * Replay all queued requests against the live API. Stops on the first 5xx
 * so transient failures don't drain the queue. Returns a summary the caller
 * can surface to the user (e.g., "synced 3 of 5 — 2 still queued").
 */
export async function replay(
  apiBase: string,
  getAuthHeaders: () => Record<string, string>
): Promise<{ replayed: number; remaining: number; failed: Array<{ id: number; reason: string }> }> {
  const items = await listAll()
  let replayed = 0
  const failed: Array<{ id: number; reason: string }> = []

  for (const item of items) {
    if (!item.id) continue
    if (item.contentType === 'multipart-skip') {
      // Multipart uploads can't be safely re-serialised — drop with a note.
      await remove(item.id)
      failed.push({ id: item.id, reason: 'multipart upload cannot be replayed' })
      continue
    }

    try {
      const headers = getAuthHeaders()
      const res = await fetch(`${apiBase}${item.path}`, {
        method: item.method,
        headers,
        body: item.body == null ? undefined : JSON.stringify(item.body),
      })

      if (res.ok) {
        await remove(item.id)
        replayed++
        continue
      }

      // 4xx: terminal — drop and log so the user knows it was tried.
      if (res.status >= 400 && res.status < 500) {
        let reason = `HTTP ${res.status}`
        try { reason = (await res.json())?.error || reason } catch { /* ignore */ }
        await remove(item.id)
        failed.push({ id: item.id, reason })
        continue
      }

      // 5xx: stop replay — likely transient, retry on next online event.
      break
    } catch (err) {
      // Network blip during replay — stop and try again later.
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('[OfflineQueue] replay halted on network error:', msg)
      break
    }
  }

  const remaining = await size()
  return { replayed, remaining, failed }
}

/**
 * Wire up a listener for the browser's `online` event so the queue
 * auto-replays whenever connectivity returns. Idempotent — safe to call
 * multiple times.
 */
let registered = false
type OnlineHandler = () => void
const onlineHandlers = new Set<OnlineHandler>()

export function onOnlineReplay(handler: OnlineHandler) {
  onlineHandlers.add(handler)
  if (!registered) {
    registered = true
    window.addEventListener('online', () => {
      for (const h of onlineHandlers) h()
    })
  }
  return () => onlineHandlers.delete(handler)
}
