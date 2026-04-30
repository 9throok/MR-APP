import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost, apiPatch } from '../services/apiService'
import './KnowledgeUpload.css'

interface MedicalQueriesProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Query {
  id: number
  doctor_id: number | null
  doctor_name: string
  captured_by: string | null
  captured_via: string | null
  product: string | null
  question: string
  category: string | null
  urgency: 'low' | 'standard' | 'high' | 'critical'
  ai_draft_answer: string | null
  ai_draft_citations: { marker: number; source_doc_id: number; snippet: string }[] | null
  ai_drafted_at: string | null
  status: 'open' | 'in_review' | 'answered' | 'sent' | 'closed_no_action'
  reviewer_user_id: string | null
  final_answer: string | null
  final_citations: unknown[] | null
  reviewed_at: string | null
  sent_at: string | null
  send_method: string | null
  created_at: string
}

const URGENCY_COLOR: Record<string, string> = {
  low: '#6b7280',
  standard: '#374151',
  high: '#b45309',
  critical: '#7f1d1d',
}
const STATUS_COLOR: Record<string, string> = {
  open: '#b91c1c',
  in_review: '#b45309',
  answered: '#15803d',
  sent: '#15803d',
  closed_no_action: '#6b7280',
}

const CATEGORIES = ['efficacy', 'safety', 'dosing', 'interaction', 'off_label', 'clinical_data', 'administration', 'other']
const URGENCIES = ['low', 'standard', 'high', 'critical']
const CAPTURED_VIA = ['mr_visit', 'phone', 'email', 'portal', 'event', 'other']

function MedicalQueries({ onLogout, onBack, userName, onNavigate }: MedicalQueriesProps) {
  const [list, setList] = useState<Query[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('open')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<Query | null>(null)
  const [draftFinal, setDraftFinal] = useState('')

  // capture-form state
  const [doctorName, setDoctorName] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [question, setQuestion] = useState('')
  const [product, setProduct] = useState('')
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState('standard')
  const [capturedVia, setCapturedVia] = useState('mr_visit')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (urgencyFilter) params.append('urgency', urgencyFilter)
      const res = await apiGet(`/medical-queries${params.toString() ? '?' + params.toString() : ''}`)
      setList(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter, urgencyFilter])

  const submitCapture = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await apiPost('/medical-queries', {
        doctor_id: doctorId ? Number(doctorId) : undefined,
        doctor_name: doctorName,
        question,
        product: product || undefined,
        category: category || undefined,
        urgency,
        captured_via: capturedVia,
      })
      setDoctorName(''); setDoctorId(''); setQuestion(''); setProduct(''); setCategory(''); setUrgency('standard')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture')
    } finally {
      setSubmitting(false)
    }
  }

  const claim = async (q: Query) => {
    try {
      const res = await apiPatch(`/medical-queries/${q.id}`, { claim: true })
      setSelected(res.data)
      setDraftFinal(res.data.final_answer || res.data.ai_draft_answer || '')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim')
    }
  }

  const transition = async (status: string, extra: Record<string, unknown> = {}) => {
    if (!selected) return
    try {
      const res = await apiPatch(`/medical-queries/${selected.id}`, { status, final_answer: draftFinal || undefined, ...extra })
      setSelected(res.data)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  const redraft = async () => {
    if (!selected) return
    try {
      await apiPost(`/medical-queries/${selected.id}/redraft`, {})
      const refreshed = await apiGet(`/medical-queries/${selected.id}`)
      setSelected(refreshed.data)
      setDraftFinal(refreshed.data.ai_draft_answer || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redraft failed')
    }
  }

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="medical-queries" />

      <div className="knowledge-content">
        <div className="entries-section">
          <h2 style={{ marginTop: 0 }}>Medical Queries</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Doctor scientific questions captured from MRs. AI drafts a citation-backed answer; a medical reviewer approves before sending.</p>

          {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}>
              <option value="">All statuses</option>
              <option value="open">open</option>
              <option value="in_review">in_review</option>
              <option value="answered">answered</option>
              <option value="sent">sent</option>
              <option value="closed_no_action">closed</option>
            </select>
            <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}>
              <option value="">All urgencies</option>
              {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button onClick={load} className="upload-btn" style={{ padding: '8px 16px' }}>Refresh</button>
            <button onClick={() => setShowForm(v => !v)} className="upload-btn" style={{ padding: '8px 16px', marginLeft: 'auto' }}>{showForm ? 'Cancel' : '+ Capture query'}</button>
          </div>

          {showForm && (
            <form onSubmit={submitCapture} style={{ background: '#f9fafb', padding: 16, borderRadius: 6, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                <label>Doctor name*<input value={doctorName} onChange={e => setDoctorName(e.target.value)} required style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
                <label>Doctor id (optional)<input type="number" value={doctorId} onChange={e => setDoctorId(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
                <label>Captured via<select value={capturedVia} onChange={e => setCapturedVia(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }}>{CAPTURED_VIA.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></label>
              </div>
              <label style={{ display: 'block', marginTop: 12 }}>Question*<textarea value={question} onChange={e => setQuestion(e.target.value)} required rows={3} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
                <label>Product<input value={product} onChange={e => setProduct(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
                <label>Category<select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }}><option value="">—</option>{CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></label>
                <label>Urgency<select value={urgency} onChange={e => setUrgency(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }}>{URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}</select></label>
              </div>
              <button type="submit" disabled={submitting} className="upload-btn" style={{ marginTop: 12 }}>{submitting ? 'Saving…' : 'Capture (AI drafts in background)'}</button>
            </form>
          )}

          {loading ? <div>Loading…</div> : list.length === 0 ? (
            <div style={{ color: '#6b7280', padding: 24, textAlign: 'center' }}>No queries match the filter.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>When</th>
                  <th style={{ padding: 8 }}>Doctor</th>
                  <th style={{ padding: 8 }}>Question</th>
                  <th style={{ padding: 8 }}>Cat</th>
                  <th style={{ padding: 8 }}>Urgency</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>AI draft</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {list.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 8, fontSize: 12 }}>{new Date(q.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{q.doctor_name}</td>
                    <td style={{ padding: 8, fontSize: 13, maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</td>
                    <td style={{ padding: 8, fontSize: 12 }}>{q.category || '—'}</td>
                    <td style={{ padding: 8, fontSize: 12, color: URGENCY_COLOR[q.urgency], fontWeight: 600 }}>{q.urgency}</td>
                    <td style={{ padding: 8, fontSize: 12, color: STATUS_COLOR[q.status], fontWeight: 600 }}>{q.status}</td>
                    <td style={{ padding: 8, fontSize: 12 }}>{q.ai_draft_answer ? '✓' : (q.ai_drafted_at ? 'partial' : '…')}</td>
                    <td style={{ padding: 8 }}>
                      {q.status === 'open' ? (
                        <button onClick={() => claim(q)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Claim</button>
                      ) : (
                        <button onClick={() => { setSelected(q); setDraftFinal(q.final_answer || q.ai_draft_answer || '') }} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Open</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
            <div style={{ background: 'white', maxWidth: 760, width: '100%', maxHeight: '92vh', overflow: 'auto', borderRadius: 8, padding: 24 }} onClick={ev => ev.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Query #{selected.id} — {selected.doctor_name}</h3>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                {selected.product || 'no product'} · {selected.category || 'no category'} · <span style={{ color: URGENCY_COLOR[selected.urgency], fontWeight: 600 }}>{selected.urgency}</span> · status <span style={{ color: STATUS_COLOR[selected.status], fontWeight: 600 }}>{selected.status}</span>
              </div>
              <h4>Question</h4>
              <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 4, marginBottom: 16, fontSize: 14 }}>{selected.question}</div>

              <h4>AI draft answer {selected.ai_drafted_at ? <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 400 }}>· drafted {new Date(selected.ai_drafted_at).toLocaleString('en-IN')}</span> : null}</h4>
              {selected.ai_draft_answer ? (
                <div style={{ background: '#eff6ff', padding: 12, borderRadius: 4, fontSize: 13, marginBottom: 8 }}>{selected.ai_draft_answer}</div>
              ) : (
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>No draft yet (LLM may have been unreachable when captured).</div>
              )}
              {selected.ai_draft_citations && selected.ai_draft_citations.length > 0 && (
                <details style={{ marginBottom: 12 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 13 }}>{selected.ai_draft_citations.length} citation(s)</summary>
                  <ol style={{ fontSize: 12, color: '#374151' }}>
                    {selected.ai_draft_citations.map((c, i) => <li key={i}>[{c.marker}] doc#{c.source_doc_id}: <em>{c.snippet}</em></li>)}
                  </ol>
                </details>
              )}
              <button onClick={redraft} style={{ marginBottom: 16, padding: '6px 12px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Re-draft with AI</button>

              <h4>Final answer (reviewer)</h4>
              <textarea value={draftFinal} onChange={e => setDraftFinal(e.target.value)} rows={6} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }} />

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {selected.status === 'in_review' && (
                  <button onClick={() => transition('answered')} style={{ padding: '8px 14px', background: '#15803d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save as answered</button>
                )}
                {selected.status === 'answered' && (
                  <>
                    <button onClick={() => transition('sent', { send_method: 'email' })} style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Mark sent (email)</button>
                    <button onClick={() => transition('in_review')} style={{ padding: '8px 14px', background: 'white', color: '#b45309', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}>Revert to in_review</button>
                  </>
                )}
                {(selected.status === 'open' || selected.status === 'in_review') && (
                  <button onClick={() => transition('closed_no_action')} style={{ padding: '8px 14px', background: '#6b7280', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Close (no action)</button>
                )}
                <button onClick={() => setSelected(null)} style={{ padding: '8px 14px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', marginLeft: 'auto' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicalQueries
