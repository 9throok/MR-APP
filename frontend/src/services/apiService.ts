import { enqueue, replay, size as queueSize, onOnlineReplay } from '../utils/offlineQueue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

function getToken(): string | null {
  try {
    return localStorage.getItem('zenapp_token')
  } catch {
    return null
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function handleResponse(res: Response) {
  if (res.status === 401 || res.status === 403) {
    // Token expired or invalid — clear auth state
    localStorage.removeItem('zenapp_token')
    localStorage.removeItem('isAuthenticated')
    window.location.reload()
    throw new Error('Authentication expired')
  }

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`)
  }
  return data
}

// ── Online detection ────────────────────────────────────────────────────────
// `navigator.onLine` is the primary signal. It's not perfect (a captive-portal
// network reports online but blocks API calls), so the queue replay also
// catches network errors and re-queues. For the optimistic write path here,
// `navigator.onLine === false` is a strong-enough signal to skip the network.
function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false
}

type QueuedResponse = { success: true; queued: true; offline_id: number }

async function queueWrite(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<QueuedResponse> {
  const id = await enqueue({ method, path, body, contentType: 'json' })
  return { success: true, queued: true, offline_id: id }
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getAuthHeaders(),
  })
  return handleResponse(res)
}

export async function apiPost(path: string, body: unknown) {
  if (!isOnline()) return queueWrite('POST', path, body)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  } catch (err) {
    // Network error mid-request: queue and surface the queued sentinel so the
    // UI can show "saved offline" instead of a hard error.
    if (err instanceof TypeError) {
      return queueWrite('POST', path, body)
    }
    throw err
  }
}

export async function apiPatch(path: string, body: unknown) {
  if (!isOnline()) return queueWrite('PATCH', path, body)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  } catch (err) {
    if (err instanceof TypeError) {
      return queueWrite('PATCH', path, body)
    }
    throw err
  }
}

export async function apiDelete(path: string) {
  if (!isOnline()) return queueWrite('DELETE', path)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(res)
  } catch (err) {
    if (err instanceof TypeError) {
      return queueWrite('DELETE', path)
    }
    throw err
  }
}

export async function apiUpload(path: string, formData: FormData) {
  // Multipart uploads (receipts, knowledge files) are NOT queued — the file
  // blob isn't safely persistable to IndexedDB across page reloads, and the
  // user is typically standing in front of the device. Surface a clear error
  // so the UI can prompt them to retry when back online.
  if (!isOnline()) {
    throw new Error('File upload requires an internet connection — please try again when online')
  }
  const token = getToken()
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  // Don't set Content-Type — browser sets it with boundary for multipart
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })
  return handleResponse(res)
}

// ── Offline queue exports for the UI ────────────────────────────────────────
// Components can subscribe to online events and call replayQueue() / pendingCount()
// to drive a small "X requests pending" indicator.

export async function replayQueue() {
  return replay(API_BASE, getAuthHeaders)
}

export async function pendingCount(): Promise<number> {
  return queueSize()
}

// Auto-register a single online listener at module load so anything queued
// during an offline session gets replayed without UI involvement.
if (typeof window !== 'undefined') {
  onOnlineReplay(() => {
    replayQueue().catch((err) =>
      console.warn('[apiService] auto-replay failed:', err instanceof Error ? err.message : err)
    )
  })
}

export { API_BASE, getToken, getAuthHeaders }
