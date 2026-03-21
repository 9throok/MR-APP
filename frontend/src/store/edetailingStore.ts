/**
 * eDetailing Watch History Store
 * Persists PDF, Video, and HTML logs to localStorage (app-persistent-storage)
 * Used for DCR submission flow
 */

const STORAGE_KEY = 'app-persistent-storage'
const WATCH_HISTORY_KEY = 'edetailing-watch-history'

export interface PdfPageMetadata {
  page_number: string
  description: string
  keywords: string[]
}

export interface PdfLog {
  title: string
  type: 'PDF'
  watchedSeconds: number
  pages: Record<number, number>
  contentId?: number
  description?: string
  metadata?: PdfPageMetadata[]
  viewedAt?: string
}

export interface VideoSegmentMetadata {
  description: string
  from_timestamp: string
  to_timestamp: string
  keywords: string[]
}

export interface VideoSegment {
  start: number
  end: number
  timestamp: number
  metadata?: VideoSegmentMetadata
}

export interface VideoLog {
  title: string
  type: 'Video'
  watchedSeconds: number
  segments: VideoSegment[]
  contentId?: number
  viewedAt?: string
}

export interface HtmlLog {
  title: string
  type: 'HTML'
  watchedSeconds: number
  contentId?: number
  description?: string
  viewedAt?: string
}

export interface WatchHistory {
  pdfLogs: PdfLog[]
  videoLogs: VideoLog[]
  htmlLogs: HtmlLog[]
}

const defaultHistory: WatchHistory = {
  pdfLogs: [],
  videoLogs: [],
  htmlLogs: [],
}

function loadHistory(): WatchHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const history = parsed[WATCH_HISTORY_KEY]
      if (history) {
        return {
          pdfLogs: history.pdfLogs || [],
          videoLogs: history.videoLogs || [],
          htmlLogs: history.htmlLogs || [],
        }
      }
    }
  } catch (e) {
    console.warn('[edetailingStore] Failed to load:', e)
  }
  return { ...defaultHistory }
}

function saveHistory(history: WatchHistory) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    parsed[WATCH_HISTORY_KEY] = history
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch (e) {
    console.warn('[edetailingStore] Failed to save:', e)
  }
}

function getHistory(): WatchHistory {
  return loadHistory()
}

function addPdfLog(log: PdfLog) {
  const history = loadHistory()
  const existing = history.pdfLogs.find((l) => l.title === log.title)
  if (existing) {
    existing.watchedSeconds += log.watchedSeconds
    for (const [pageStr, secs] of Object.entries(log.pages)) {
      const p = Number(pageStr)
      existing.pages[p] = (existing.pages[p] || 0) + secs
    }
    if (log.viewedAt) existing.viewedAt = log.viewedAt
  } else {
    history.pdfLogs.push(log)
  }
  saveHistory(history)
  return history
}

function addVideoLog(log: VideoLog) {
  const history = loadHistory()
  const viewedAt = new Date().toISOString()
  const existing = history.videoLogs.find((l) => l.title === log.title)
  if (existing) {
    existing.watchedSeconds += log.watchedSeconds
    existing.segments = mergeSegments([...existing.segments, ...log.segments])
    existing.viewedAt = viewedAt
  } else {
    history.videoLogs.push({ ...log, viewedAt })
  }
  saveHistory(history)
  return history
}

function mergeSegments(segments: VideoSegment[]): VideoSegment[] {
  const filtered = segments.filter((s) => !(s.start === 0 && s.end === 0))
  filtered.sort((a, b) => a.start - b.start)
  const merged: VideoSegment[] = []
  for (const s of filtered) {
    const last = merged[merged.length - 1]
    if (last && s.start - last.end <= 5 && JSON.stringify(last.metadata) === JSON.stringify(s.metadata)) {
      last.end = Math.max(last.end, s.end)
    } else {
      merged.push({ ...s })
    }
  }
  return merged
}

function addHtmlLog(log: HtmlLog) {
  const history = loadHistory()
  const viewedAt = new Date().toISOString()
  const existing = history.htmlLogs.find((l) => l.title === log.title)
  if (existing) {
    existing.watchedSeconds += log.watchedSeconds
    existing.viewedAt = viewedAt
  } else {
    history.htmlLogs.push({ ...log, viewedAt })
  }
  saveHistory(history)
  return history
}

function clearWatchHistory() {
  saveHistory({ ...defaultHistory })
}

function restoreWatchHistory(history: Partial<WatchHistory>) {
  const current = loadHistory()
  if (history.pdfLogs) current.pdfLogs = history.pdfLogs
  if (history.videoLogs) current.videoLogs = history.videoLogs
  if (history.htmlLogs) current.htmlLogs = history.htmlLogs
  saveHistory(current)
}

export const edetailingStore = {
  getWatchHistory: getHistory,
  addPdfLog,
  addVideoLog,
  addHtmlLog,
  clearWatchHistory,
  restoreWatchHistory,
}
