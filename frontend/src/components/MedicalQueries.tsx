import { useState, useEffect } from 'react'
import { Plus, Sparkles, Check, Send, RotateCcw } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost, apiPatch } from '../services/apiService'
import './KnowledgeUpload.css'
import './admin/AdminUI.css'
import {
  Badge,
  Banner,
  DataTable,
  Modal,
  Toolbar,
  queryStatusTone,
  urgencyTone,
  humanise,
  type DataTableColumn,
} from './admin'

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

  const columns: DataTableColumn<Query>[] = [
    {
      key: 'created_at',
      label: 'When',
      width: '110px',
      render: q => <span className="cell-muted">{new Date(q.created_at).toLocaleDateString('en-IN')}</span>,
    },
    {
      key: 'doctor_name',
      label: 'Doctor',
      width: '180px',
      render: q => <span style={{ fontWeight: 600 }}>{q.doctor_name}</span>,
    },
    {
      key: 'question',
      label: 'Question',
      className: 'cell-truncate',
      render: q => q.question,
    },
    {
      key: 'category',
      label: 'Category',
      width: '120px',
      render: q => q.category ? <Badge tone="purple">{humanise(q.category)}</Badge> : <span className="cell-muted">—</span>,
    },
    {
      key: 'urgency',
      label: 'Urgency',
      width: '100px',
      render: q => <Badge tone={urgencyTone[q.urgency] || 'neutral'}>{q.urgency}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: q => <Badge tone={queryStatusTone[q.status] || 'neutral'}>{humanise(q.status)}</Badge>,
    },
    {
      key: 'ai_draft',
      label: 'AI draft',
      width: '90px',
      render: q => q.ai_draft_answer
        ? <Badge tone="info" icon={<Sparkles size={11} />}>Drafted</Badge>
        : q.ai_drafted_at
          ? <Badge tone="muted">Partial</Badge>
          : <Badge tone="muted">Pending</Badge>,
    },
    {
      key: 'action',
      label: '',
      width: '90px',
      align: 'right',
      render: q => q.status === 'open'
        ? <button onClick={e => { e.stopPropagation(); claim(q) }} className="btn btn-primary btn-sm">Claim</button>
        : <button onClick={e => { e.stopPropagation(); setSelected(q); setDraftFinal(q.final_answer || q.ai_draft_answer || '') }} className="btn btn-secondary btn-sm">Open</button>,
    },
  ]

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="medical-queries" />

      <div className="knowledge-content">
        <div className="admin-page-intro">
          <div>
            <h2 className="admin-page-title">Medical Queries</h2>
            <p className="admin-page-lead">
              Doctor scientific questions captured from MRs. AI drafts a citation-backed answer; a medical reviewer approves before sending.
            </p>
          </div>
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
            <Plus size={14} />
            {showForm ? 'Cancel' : 'Capture query'}
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {showForm && (
          <form onSubmit={submitCapture} className="admin-card" style={{ marginBottom: 18 }}>
            <div className="admin-section-title">Capture new query</div>
            <div className="admin-form-grid">
              <div>
                <label className="admin-field-label">Doctor name*</label>
                <input value={doctorName} onChange={e => setDoctorName(e.target.value)} required className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Doctor id</label>
                <input type="number" value={doctorId} onChange={e => setDoctorId(e.target.value)} className="admin-input" placeholder="Optional" />
              </div>
              <div>
                <label className="admin-field-label">Captured via</label>
                <select value={capturedVia} onChange={e => setCapturedVia(e.target.value)} className="admin-select">
                  {CAPTURED_VIA.map(c => <option key={c} value={c}>{humanise(c)}</option>)}
                </select>
              </div>
              <div className="admin-field-wide">
                <label className="admin-field-label">Question*</label>
                <textarea value={question} onChange={e => setQuestion(e.target.value)} required rows={3} className="admin-textarea" />
              </div>
              <div>
                <label className="admin-field-label">Product</label>
                <input value={product} onChange={e => setProduct(e.target.value)} className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="admin-select">
                  <option value="">—</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{humanise(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-field-label">Urgency</label>
                <select value={urgency} onChange={e => setUrgency(e.target.value)} className="admin-select">
                  {URGENCIES.map(u => <option key={u} value={u}>{humanise(u)}</option>)}
                </select>
              </div>
            </div>
            <div className="admin-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                {submitting ? 'Saving…' : 'Capture (AI drafts in background)'}
              </button>
            </div>
          </form>
        )}

        <Toolbar>
          <Toolbar.Field label="Status">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select" style={{ width: 160 }}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_review">In review</option>
              <option value="answered">Answered</option>
              <option value="sent">Sent</option>
              <option value="closed_no_action">Closed</option>
            </select>
          </Toolbar.Field>
          <Toolbar.Field label="Urgency">
            <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)} className="admin-select" style={{ width: 140 }}>
              <option value="">All</option>
              {URGENCIES.map(u => <option key={u} value={u}>{humanise(u)}</option>)}
            </select>
          </Toolbar.Field>
          <button type="button" onClick={load} className="btn btn-secondary btn-sm">Refresh</button>
          <Toolbar.Spacer />
          <Toolbar.Count n={list.length} noun="query" />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={list}
          rowKey={q => q.id}
          loading={loading}
          empty="No queries match the current filters."
        />
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        width="wide"
        title={selected ? `Query #${selected.id} — ${selected.doctor_name}` : ''}
        subtitle={selected ? (
          <span className="admin-row" style={{ gap: 8 }}>
            <Badge tone="purple">{humanise(selected.category) || 'No category'}</Badge>
            <Badge tone={urgencyTone[selected.urgency] || 'neutral'}>{selected.urgency}</Badge>
            <Badge tone={queryStatusTone[selected.status] || 'neutral'}>{humanise(selected.status)}</Badge>
            {selected.product && <span>· {selected.product}</span>}
          </span>
        ) : undefined}
        footer={selected ? (
          <>
            {selected.status === 'in_review' && (
              <button onClick={() => transition('answered')} className="btn btn-primary btn-sm">
                <Check size={14} /> Save as answered
              </button>
            )}
            {selected.status === 'answered' && (
              <>
                <button onClick={() => transition('sent', { send_method: 'email' })} className="btn btn-primary btn-sm">
                  <Send size={14} /> Mark sent (email)
                </button>
                <button onClick={() => transition('in_review')} className="btn btn-secondary btn-sm">
                  Revert to in_review
                </button>
              </>
            )}
            {(selected.status === 'open' || selected.status === 'in_review') && (
              <button onClick={() => transition('closed_no_action')} className="btn btn-ghost btn-sm">
                Close (no action)
              </button>
            )}
            <span className="admin-modal-footer-spacer" />
            <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm">Close</button>
          </>
        ) : null}
      >
        {selected && (
          <div className="admin-stack">
            <div>
              <div className="admin-section-title">Question</div>
              <div className="admin-card-flat" style={{ background: 'var(--bg-secondary)' }}>
                {selected.question}
              </div>
            </div>

            <div>
              <div className="admin-row-spread" style={{ marginBottom: 8 }}>
                <div className="admin-section-title" style={{ margin: 0 }}>
                  AI draft answer
                  {selected.ai_drafted_at && (
                    <span style={{ fontWeight: 500, fontSize: 11, color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0, marginLeft: 8 }}>
                      drafted {new Date(selected.ai_drafted_at).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <button onClick={redraft} className="btn btn-secondary btn-sm">
                  <RotateCcw size={13} /> Re-draft with AI
                </button>
              </div>
              {selected.ai_draft_answer ? (
                <Banner tone="info" icon={<Sparkles size={16} />}>
                  {selected.ai_draft_answer}
                </Banner>
              ) : (
                <div className="admin-helper-text">No draft yet (LLM may have been unreachable when captured).</div>
              )}
              {selected.ai_draft_citations && selected.ai_draft_citations.length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {selected.ai_draft_citations.length} citation{selected.ai_draft_citations.length === 1 ? '' : 's'}
                  </summary>
                  <ol style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                    {selected.ai_draft_citations.map((c, i) => (
                      <li key={i}>[{c.marker}] doc#{c.source_doc_id}: <em>{c.snippet}</em></li>
                    ))}
                  </ol>
                </details>
              )}
            </div>

            <div>
              <div className="admin-section-title">Final answer (reviewer)</div>
              <textarea
                value={draftFinal}
                onChange={e => setDraftFinal(e.target.value)}
                rows={6}
                className="admin-textarea"
                placeholder="Edit the AI draft, or write a fresh answer. This is what gets sent to the doctor."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MedicalQueries
