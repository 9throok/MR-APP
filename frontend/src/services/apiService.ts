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

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getAuthHeaders(),
  })
  return handleResponse(res)
}

export async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function apiPatch(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return handleResponse(res)
}

export async function apiUpload(path: string, formData: FormData) {
  const token = getToken()
  const headers: Record<string, string> = {}
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

export { API_BASE, getToken, getAuthHeaders }
