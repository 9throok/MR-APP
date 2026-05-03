import { useState, useEffect } from 'react'
import { AlertTriangle, ShieldAlert, Sparkles, ScrollText } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPatch } from '../services/apiService'
import './KnowledgeUpload.css'
import './admin/AdminUI.css'
import {
  Badge,
  Banner,
  DataTable,
  Modal,
  StatCard,
  Toolbar,
  findingStatusTone,
  severityTone,
  detectedByTone,
  humanise,
  type DataTableColumn,
} from './admin'

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

interface SeverityStat { severity: string; total: number }

function ComplianceInbox({ onLogout, onBack, userName, onNavigate }: ComplianceInboxProps) {
  const [findings, setFindings] = useState<Finding[]>([])
  const [stats, setStats] = useState<{ bySeverity?: SeverityStat[] }>({})
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

  // Build the severity stat tiles in a stable order so the row layout is
  // consistent even when only some severities have findings.
  const severityOrder: Array<Finding['severity']> = ['critical', 'high', 'medium', 'low']
  const severityStats = severityOrder.map(sev => {
    const row = stats.bySeverity?.find(s => s.severity === sev)
    return { severity: sev, total: row?.total ?? 0 }
  })

  const columns: DataTableColumn<Finding>[] = [
    {
      key: 'created_at',
      label: 'When',
      width: '120px',
      render: f => <span className="cell-muted">{new Date(f.created_at).toLocaleDateString('en-IN')}</span>,
    },
    {
      key: 'finding_type',
      label: 'Type',
      render: f => humanise(f.finding_type),
    },
    {
      key: 'severity',
      label: 'Severity',
      width: '110px',
      render: f => <Badge tone={severityTone[f.severity] || 'neutral'}>{f.severity}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '130px',
      render: f => <Badge tone={findingStatusTone[f.status] || 'neutral'}>{humanise(f.status)}</Badge>,
    },
    {
      key: 'source',
      label: 'Source',
      width: '160px',
      render: f => <span className="cell-muted">{f.source_table} #{f.source_row_id}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      className: 'cell-truncate',
      render: f => f.description,
    },
    {
      key: 'detected_by',
      label: 'Detected by',
      width: '110px',
      render: f => <Badge tone={detectedByTone[f.detected_by] || 'neutral'}>{f.detected_by}</Badge>,
    },
  ]

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="compliance-inbox" />

      <div className="knowledge-content">
        <div className="admin-page-intro">
          <div>
            <h2 className="admin-page-title">AI Compliance Watchdog</h2>
            <p className="admin-page-lead">
              Findings from the AI scan of DCRs (off-label promotion, missing fair-balance, gift threshold, unconsented contact). Triage each finding to keep the inbox clean.
            </p>
          </div>
        </div>

        <div className="admin-stat-grid">
          {severityStats.map(s => (
            <StatCard
              key={s.severity}
              label={s.severity}
              value={s.total}
              hint={`${s.severity === 'critical' || s.severity === 'high' ? 'needs immediate review' : 'open findings'}`}
              tone={s.severity === 'critical' ? 'danger' : s.severity === 'high' ? 'warning' : 'default'}
              icon={s.severity === 'critical' || s.severity === 'high' ? <AlertTriangle size={12} /> : <ShieldAlert size={12} />}
            />
          ))}
        </div>

        <Toolbar>
          <Toolbar.Field label="Status">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select" style={{ width: 160 }}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="dismissed">Dismissed</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
            </select>
          </Toolbar.Field>
          <Toolbar.Field label="Severity">
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="admin-select" style={{ width: 140 }}>
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Toolbar.Field>
          <button type="button" onClick={load} className="btn btn-secondary btn-sm">Refresh</button>
          <Toolbar.Spacer />
          <Toolbar.Count n={findings.length} noun="finding" />
        </Toolbar>

        {error && <div className="admin-error">{error}</div>}

        <DataTable
          columns={columns}
          rows={findings}
          rowKey={f => f.id}
          loading={loading}
          empty="No findings match the current filters. Try widening the status or severity."
          onRowClick={f => { setSelected(f); setDecisionNotes(f.review_notes || '') }}
        />
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? humanise(selected.finding_type) : ''}
        subtitle={selected ? (
          <span className="admin-row" style={{ gap: 8 }}>
            <Badge tone={severityTone[selected.severity] || 'neutral'}>{selected.severity}</Badge>
            <Badge tone={findingStatusTone[selected.status] || 'neutral'}>{humanise(selected.status)}</Badge>
            <span>· {selected.source_table} #{selected.source_row_id}</span>
            <span>· detected by {selected.detected_by}</span>
            <span>· {new Date(selected.created_at).toLocaleString('en-IN')}</span>
          </span>
        ) : undefined}
        footer={selected ? (
          <>
            <button onClick={() => decide('acknowledged')} disabled={submitting} className="btn btn-warning btn-sm">Acknowledge</button>
            <button onClick={() => decide('escalated')} disabled={submitting} className="btn btn-danger btn-sm">Escalate</button>
            <button onClick={() => decide('resolved')} disabled={submitting} className="btn btn-primary btn-sm">Resolve</button>
            <button onClick={() => decide('dismissed')} disabled={submitting} className="btn btn-ghost btn-sm">Dismiss</button>
            <span className="admin-modal-footer-spacer" />
            <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm">Cancel</button>
          </>
        ) : null}
      >
        {selected && (
          <div className="admin-stack">
            <div>
              <div className="admin-section-title">Description</div>
              <p style={{ margin: 0, lineHeight: 1.55 }}>{selected.description}</p>
            </div>

            {selected.evidence_quote && (
              <Banner tone="warning" icon={<ScrollText size={16} />} title="Evidence quote">
                <em>"{selected.evidence_quote}"</em>
              </Banner>
            )}

            {selected.recommendation && (
              <Banner tone="info" icon={<Sparkles size={16} />} title="Recommendation">
                {selected.recommendation}
              </Banner>
            )}

            <div>
              <div className="admin-section-title">Decision notes</div>
              <textarea
                className="admin-textarea"
                value={decisionNotes}
                onChange={e => setDecisionNotes(e.target.value)}
                placeholder="Notes (recommended for dismiss / escalate / resolve)"
                rows={4}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ComplianceInbox
