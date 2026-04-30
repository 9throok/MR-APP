import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPatch } from '../services/apiService'
// Reuse the KnowledgeUpload page chrome — same layout pattern (.knowledge-page,
// .knowledge-content, .entries-section). Avoids a new CSS file for an admin tool.
import './KnowledgeUpload.css'

interface MLRReviewQueueProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface QueueItem {
  review_id: number
  reviewer_role: 'medical' | 'legal' | 'regulatory'
  decision: 'pending' | 'approved' | 'changes_requested' | 'rejected'
  decision_notes: string | null
  reviewed_at: string | null
  version_id: number
  version_number: number
  version_status: string
  file_url: string
  mime_type: string | null
  submitted_at: string | null
  ai_pre_review_notes: { findings?: AiFinding[]; summary?: string; finding_count?: number; ready_for_human_review?: boolean } | null
  asset_id: number
  asset_title: string
  asset_type: string
  therapeutic_area: string | null
  product_name: string | null
}

interface AiFinding {
  category: string
  severity?: 'low' | 'medium' | 'high'
  excerpt?: string
  explanation?: string
  suggested_fix?: string
}

interface OtherReview {
  reviewer_role: 'medical' | 'legal' | 'regulatory'
  decision: string
  reviewer_user_id: string | null
  reviewer_name?: string | null
  decision_notes: string | null
  reviewed_at: string | null
}

interface ContentClaim {
  id: number
  claim_text: string
  source_doc_id: number | null
  reviewer_status: 'auto' | 'confirmed' | 'needs_citation' | 'dismissed'
}

interface VersionDetail {
  id: number
  version_number: number
  status: string
  file_url: string
  asset_title: string
  asset_type: string
  ai_pre_review_notes: QueueItem['ai_pre_review_notes']
}

const SEVERITY_COLOR: Record<string, string> = {
  low: '#6b7280',
  medium: '#b45309',
  high: '#b91c1c',
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function MLRReviewQueue({ onLogout, onBack, userName, onNavigate }: MLRReviewQueueProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeReviewId, setActiveReviewId] = useState<number | null>(null)
  const [versionDetail, setVersionDetail] = useState<VersionDetail | null>(null)
  const [otherReviews, setOtherReviews] = useState<OtherReview[]>([])
  const [claims, setClaims] = useState<ContentClaim[]>([])
  const [decision, setDecision] = useState<'approved' | 'changes_requested' | 'rejected'>('approved')
  const [decisionNotes, setDecisionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadQueue()
  }, [])

  const loadQueue = async () => {
    setLoading(true)
    try {
      const resp = await apiGet('/mlr/queue')
      setQueue(resp.data || [])
    } catch (err) {
      console.error('[MLRQueue] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const openReview = async (item: QueueItem) => {
    setActiveReviewId(item.review_id)
    setDecision('approved')
    setDecisionNotes('')
    setMessage('')
    // Fetch full version detail (includes other reviewers' decisions + claims)
    try {
      const resp = await apiGet(`/mlr/reviews/${item.version_id}`)
      setVersionDetail({
        id: resp.data.version.id,
        version_number: resp.data.version.version_number,
        status: resp.data.version.status,
        file_url: resp.data.version.file_url,
        asset_title: resp.data.version.asset_title,
        asset_type: resp.data.version.asset_type,
        ai_pre_review_notes: resp.data.version.ai_pre_review_notes,
      })
      // Filter out the caller's own review row from the "other reviewers" list
      setOtherReviews((resp.data.reviews || []).filter((r: OtherReview & { id: number }) => r.id !== item.review_id))
      setClaims(resp.data.claims || [])
    } catch (err) {
      console.error('[MLRQueue] detail fetch error:', err)
    }
  }

  const closeReview = () => {
    setActiveReviewId(null)
    setVersionDetail(null)
    setOtherReviews([])
    setClaims([])
  }

  const submitDecision = async () => {
    if (!activeReviewId) return
    if (decision !== 'approved' && !decisionNotes.trim()) {
      setMessage('Notes are required when requesting changes or rejecting.')
      return
    }
    setSubmitting(true)
    try {
      const resp = await apiPatch(`/mlr/reviews/${activeReviewId}`, {
        decision,
        decision_notes: decisionNotes.trim() || null,
      })
      const flipMsg = resp.data?.version_status_changed_to
        ? ` Version flipped to ${resp.data.version_status_changed_to}.`
        : ''
      setMessage(`Decision recorded.${flipMsg}`)
      // Refresh the queue (the just-decided item drops off; possibly a state-flip
      // also clears related items if the version moved out of in_review).
      await loadQueue()
      closeReview()
    } catch (err) {
      setMessage(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Detail panel for a selected queue item ────────────────────────────────
  const renderDetail = () => {
    if (!activeReviewId || !versionDetail) return null
    const findings = versionDetail.ai_pre_review_notes?.findings || []
    const summary = versionDetail.ai_pre_review_notes?.summary
    const aiReady = versionDetail.ai_pre_review_notes?.ready_for_human_review

    return (
      <section className="entries-section" style={{ marginTop: 24 }}>
        <div className="entries-section-header">
          <h3>{versionDetail.asset_title} — v{versionDetail.version_number}</h3>
          <button className="back-button" onClick={closeReview} style={{ width: 'auto', padding: '6px 12px' }}>
            Close
          </button>
        </div>

        <div style={{ marginBottom: 16, fontSize: 14, color: '#6b7280' }}>
          {versionDetail.asset_type.replace('_', ' ')} · Status: <strong>{versionDetail.status}</strong>
        </div>

        <div style={{ marginBottom: 20 }}>
          <a href={versionDetail.file_url} target="_blank" rel="noopener noreferrer"
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', textDecoration: 'none', color: '#0a3d62', fontSize: 14 }}>
            Open file →
          </a>
        </div>

        {/* AI pre-review summary + findings */}
        {(summary || findings.length > 0) && (
          <div style={{ marginBottom: 20, padding: 16, background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: 6 }}>
            <h4 style={{ margin: '0 0 8px 0' }}>AI pre-review</h4>
            {summary && <p style={{ marginBottom: 12 }}>{summary}</p>}
            {findings.length > 0 ? (
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {findings.map((f, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                      background: (f.severity ? SEVERITY_COLOR[f.severity] : '#6b7280') + '22',
                      color: f.severity ? SEVERITY_COLOR[f.severity] : '#6b7280',
                      fontSize: 11, fontWeight: 600, marginRight: 6,
                    }}>
                      {f.category} · {f.severity || 'unknown'}
                    </span>
                    {f.excerpt && <em style={{ color: '#4b5563' }}>"{f.excerpt}"</em>}
                    {f.explanation && <div style={{ fontSize: 13, marginTop: 4 }}>{f.explanation}</div>}
                    {f.suggested_fix && <div style={{ fontSize: 13, color: '#059669', marginTop: 2 }}>↳ {f.suggested_fix}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: 13, color: '#6b7280' }}>No findings flagged.</p>
            )}
            {aiReady === false && (
              <p style={{ fontSize: 13, color: '#b45309', marginTop: 8, marginBottom: 0 }}>
                AI flagged this content as not ready for human review.
              </p>
            )}
          </div>
        )}

        {/* Other reviewers' decisions */}
        {otherReviews.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 8 }}>Other reviewers</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {otherReviews.map((r, i) => (
                <div key={i} style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                  <strong style={{ textTransform: 'capitalize' }}>{r.reviewer_role}</strong>
                  <div style={{ marginTop: 4, fontSize: 13 }}>
                    Decision: <strong>{r.decision}</strong>
                  </div>
                  {r.reviewer_name && <div style={{ fontSize: 12, color: '#6b7280' }}>by {r.reviewer_name}</div>}
                  {r.decision_notes && <div style={{ marginTop: 6, fontSize: 12, color: '#4b5563' }}>"{r.decision_notes}"</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claim substantiation table */}
        {claims.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 8 }}>Marketing claims ({claims.length})</h4>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {claims.map(c => (
                <li key={c.id} style={{ marginBottom: 6, fontSize: 13 }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 6, marginRight: 8,
                    background: c.source_doc_id ? '#dcfce7' : '#fef3c7',
                    color: c.source_doc_id ? '#15803d' : '#b45309',
                    fontSize: 11, fontWeight: 600,
                  }}>
                    {c.source_doc_id ? 'Cited' : 'Needs citation'}
                  </span>
                  {c.claim_text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Decision form */}
        <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
          <h4 style={{ marginBottom: 12 }}>Your decision</h4>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {(['approved', 'changes_requested', 'rejected'] as const).map(d => (
              <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mlr-decision"
                  value={d}
                  checked={decision === d}
                  onChange={() => setDecision(d)}
                />
                <span style={{ textTransform: 'capitalize' }}>{d.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
          <textarea
            value={decisionNotes}
            onChange={e => setDecisionNotes(e.target.value)}
            placeholder={decision === 'approved' ? 'Notes (optional)' : 'Notes (required when requesting changes or rejecting)'}
            rows={3}
            className="form-select"
            style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <button
            onClick={submitDecision}
            disabled={submitting}
            className="upload-btn"
            style={{ marginTop: 12 }}
          >
            {submitting ? 'Submitting…' : 'Submit decision'}
          </button>
          {message && (
            <div className={`upload-message ${message.includes('Failed') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName}
        onNavigate={onNavigate} onLogout={onLogout} currentPage="mlr-queue" />

      <main className="knowledge-content">
        <div className="knowledge-page-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="knowledge-header-content">
            <h1 className="knowledge-page-title">MLR Review Queue</h1>
            <p className="knowledge-page-subtitle">Pending content reviews assigned to your role</p>
          </div>
        </div>

        <section className="entries-section">
          <div className="entries-section-header">
            <h3>Awaiting your review</h3>
            <span className="entries-count">{queue.length} item{queue.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div className="knowledge-loading">Loading…</div>
          ) : queue.length === 0 ? (
            <div className="knowledge-empty">Nothing in your queue. New submissions will appear here.</div>
          ) : (
            <div className="entries-list">
              {queue.map(item => (
                <div key={item.review_id} className="entry-card" style={{ cursor: 'pointer' }} onClick={() => openReview(item)}>
                  <div className="entry-info">
                    <div className="entry-filename">{item.asset_title}</div>
                    <div className="entry-meta">
                      <span className="entry-product">{item.asset_type.replace('_', ' ')}</span>
                      <span className="entry-category" style={{ textTransform: 'capitalize' }}>
                        {item.reviewer_role} review
                      </span>
                      <span className="entry-category">v{item.version_number}</span>
                      {item.product_name && <span className="entry-category">{item.product_name}</span>}
                      <span className="entry-date">Submitted {formatDate(item.submitted_at)}</span>
                      {item.ai_pre_review_notes?.finding_count != null && item.ai_pre_review_notes.finding_count > 0 && (
                        <span style={{ color: '#b45309', fontSize: 12, fontWeight: 600 }}>
                          AI flagged {item.ai_pre_review_notes.finding_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="back-button" style={{ width: 'auto', padding: '8px 14px' }}
                    onClick={e => { e.stopPropagation(); openReview(item) }}>
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {renderDetail()}
      </main>
    </div>
  )
}

export default MLRReviewQueue
