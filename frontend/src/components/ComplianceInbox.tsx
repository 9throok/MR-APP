import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPatch } from '../services/apiService'
import './KnowledgeUpload.css'

interface ComplianceInboxProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Finding {
  id: number
  finding_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  source_table: string
  source_row_id: string
  user_id: string | null
  description: string
  evidence_quote: string | null
  recommendation: string | null
  status: 'open' | 'acknowledged' | 'dismissed' | 'escalated' | 'resolved'
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  detected_by: 'ai' | 'human' | 'rule'
  created_at: string
}

const SEVERITY_COLOR: Record<string, string> = {
  low: '#6b7280',
  medium: '#b45309',
  high: '#b91c1c',
  critical: '#7f1d1d',
}

const STATUS_COLOR: Record<string, string> = {
  open: '#b91c1c',
  acknowledged: '#b45309',
  dismissed: '#6b7280',
  escalated: '#7f1d1d',
  resolved: '#15803d',
}

function ComplianceInbox({ onLogout, onBack, userName, onNavigate }: ComplianceInboxProps) {
  const [findings, setFindings] = useState<Finding[]>([])
  const [stats, setStats] = useState<{ byStatus?: { status: string; total: number }[]; bySeverity?: { severity: string; total: number }[]; byType?: { finding_type: string; total: number }[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('open')
  const [severityFilter, setSeverityFilter] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selected, setSelected] = useState<Finding | null>(null)
  const [decisionNotes, setDecisionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (severityFilter) params.append('severity', severityFilter)
      params.append('limit', '200')
      const [list, statsRes] = await Promise.all([
        apiGet(`/compliance/findings?${params.toString()}`),
        apiGet('/compliance/stats'),
      ])
      setFindings(list.data || [])
      setStats(statsRes.data || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter, severityFilter])

  const decide = async (status: string) => {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      await apiPatch(`/compliance/findings/${selected.id}`, { status, review_notes: decisionNotes })
      setSelected(null)
      setDecisionNotes('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="compliance-inbox" />

      <div className="knowledge-content">
        <div className="entries-section">
          <h2 style={{ marginTop: 0 }}>AI Compliance Watchdog</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Findings detected by the AI Watchdog scan of DCRs (off-label promotion, missing fair-balance, gift threshold, unconsented contact). Triage each finding.</p>

          {/* Top stats */}
          {stats.bySeverity && stats.bySeverity.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              {stats.bySeverity.map(s => (
                <div key={s.severity} style={{ padding: 12, border: `2px solid ${SEVERITY_COLOR[s.severity]}`, borderRadius: 6, minWidth: 120 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>{s.severity}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: SEVERITY_COLOR[s.severity] }}>{s.total}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>open findings</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}>
              <option value="">All statuses</option>
              <option value="open">open</option>
              <option value="acknowledged">acknowledged</option>
              <option value="dismissed">dismissed</option>
              <option value="escalated">escalated</option>
              <option value="resolved">resolved</option>
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}>
              <option value="">All severities</option>
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
            <button onClick={load} className="upload-btn" style={{ padding: '8px 16px' }}>Refresh</button>
          </div>

          {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
          {loading ? (
            <div>Loading findings…</div>
          ) : findings.length === 0 ? (
            <div style={{ color: '#6b7280', padding: 24, textAlign: 'center' }}>No findings match the current filters.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>When</th>
                  <th style={{ padding: 8 }}>Type</th>
                  <th style={{ padding: 8 }}>Severity</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Source</th>
                  <th style={{ padding: 8 }}>Description</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {findings.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 8, fontSize: 13 }}>{new Date(f.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{f.finding_type.replace(/_/g, ' ')}</td>
                    <td style={{ padding: 8, fontSize: 12, color: SEVERITY_COLOR[f.severity], fontWeight: 700 }}>{f.severity}</td>
                    <td style={{ padding: 8, fontSize: 12, color: STATUS_COLOR[f.status], fontWeight: 600 }}>{f.status}</td>
                    <td style={{ padding: 8, fontSize: 12, color: '#6b7280' }}>{f.source_table} #{f.source_row_id}</td>
                    <td style={{ padding: 8, fontSize: 13, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => { setSelected(f); setDecisionNotes(f.review_notes || '') }} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail / decision modal */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
            <div style={{ background: 'white', maxWidth: 720, width: '100%', maxHeight: '90vh', overflow: 'auto', borderRadius: 8, padding: 24 }} onClick={ev => ev.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>
                <span style={{ color: SEVERITY_COLOR[selected.severity] }}>[{selected.severity.toUpperCase()}]</span> {selected.finding_type.replace(/_/g, ' ')}
              </h3>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                Detected by {selected.detected_by} on {selected.source_table} #{selected.source_row_id} — {new Date(selected.created_at).toLocaleString('en-IN')}
              </div>

              <h4>Description</h4>
              <p style={{ marginTop: 0 }}>{selected.description}</p>

              {selected.evidence_quote && (
                <>
                  <h4>Evidence</h4>
                  <blockquote style={{ background: '#fef3c7', padding: 12, borderLeft: '4px solid #d97706', margin: 0, fontStyle: 'italic' }}>{selected.evidence_quote}</blockquote>
                </>
              )}

              {selected.recommendation && (
                <>
                  <h4 style={{ marginTop: 12 }}>Recommendation</h4>
                  <p style={{ marginTop: 0 }}>{selected.recommendation}</p>
                </>
              )}

              <h4 style={{ marginTop: 16 }}>Decision</h4>
              <textarea
                value={decisionNotes}
                onChange={e => setDecisionNotes(e.target.value)}
                placeholder="Notes (recommended for dismiss / escalate / resolve)"
                rows={3}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button onClick={() => decide('acknowledged')} disabled={submitting} style={{ padding: '8px 14px', background: '#b45309', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Acknowledge</button>
                <button onClick={() => decide('escalated')} disabled={submitting} style={{ padding: '8px 14px', background: '#7f1d1d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Escalate</button>
                <button onClick={() => decide('resolved')} disabled={submitting} style={{ padding: '8px 14px', background: '#15803d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Resolve</button>
                <button onClick={() => decide('dismissed')} disabled={submitting} style={{ padding: '8px 14px', background: '#6b7280', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Dismiss</button>
                <button onClick={() => setSelected(null)} style={{ padding: '8px 14px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', marginLeft: 'auto' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComplianceInbox
