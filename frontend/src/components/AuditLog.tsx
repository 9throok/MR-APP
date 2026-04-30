import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet } from '../services/apiService'
import './KnowledgeUpload.css'

interface AuditLogProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface AuditEntry {
  id: number
  occurred_at: string
  actor_user_id: string | null
  actor_role: string | null
  table_name: string
  row_id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  before_data: unknown
  after_data: unknown
  route_path: string | null
  http_method: string | null
  ip_address: string | null
  reason: string | null
}

interface StatsRow {
  table_name: string
  total: number
  creates: number
  updates: number
  deletes: number
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: '#15803d',
  UPDATE: '#b45309',
  DELETE: '#b91c1c',
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function AuditLog({ onLogout, onBack, userName, onNavigate }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [stats, setStats] = useState<StatsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableFilter, setTableFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [tables, setTables] = useState<string[]>([])
  const [selected, setSelected] = useState<AuditEntry | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (tableFilter) params.append('table', tableFilter)
      if (actionFilter) params.append('action', actionFilter)
      params.append('limit', '200')

      const [list, statsRes, tablesRes] = await Promise.all([
        apiGet(`/audit?${params.toString()}`),
        apiGet('/audit/stats'),
        apiGet('/audit/regulated-tables'),
      ])
      setEntries(list.data || [])
      setStats(statsRes.data?.byTable || [])
      setTables(tablesRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tableFilter, actionFilter])

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="audit-log" />

      <div className="knowledge-content">
        <div className="entries-section">
          <h2 style={{ marginTop: 0 }}>Compliance Audit Trail</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            Append-only ledger of every CREATE / UPDATE / DELETE on regulated records. Last 30 days summary and a filtered feed below.
          </p>

          {/* Stats */}
          {stats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              {stats.map(s => (
                <div key={s.table_name} style={{ padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>{s.table_name}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{s.total}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    +{s.creates} / ~{s.updates} / -{s.deletes}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={tableFilter} onChange={e => setTableFilter(e.target.value)} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}>
              <option value="">All tables</option>
              {tables.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}>
              <option value="">All actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
            <button onClick={load} className="upload-btn" style={{ padding: '8px 16px' }}>Refresh</button>
          </div>

          {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
          {loading ? (
            <div>Loading audit feed…</div>
          ) : entries.length === 0 ? (
            <div style={{ color: '#6b7280', padding: 24, textAlign: 'center' }}>No audit entries match the current filters.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>When</th>
                  <th style={{ padding: 8 }}>Actor</th>
                  <th style={{ padding: 8 }}>Action</th>
                  <th style={{ padding: 8 }}>Record</th>
                  <th style={{ padding: 8 }}>Route</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 8, fontSize: 13 }}>{formatDate(e.occurred_at)}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{e.actor_user_id || 'system'} <span style={{ color: '#6b7280', fontSize: 11 }}>{e.actor_role || ''}</span></td>
                    <td style={{ padding: 8 }}>
                      <span style={{ color: ACTION_COLOR[e.action] || '#374151', fontWeight: 600, fontSize: 12 }}>{e.action}</span>
                    </td>
                    <td style={{ padding: 8, fontSize: 13 }}>{e.table_name} #{e.row_id}</td>
                    <td style={{ padding: 8, fontSize: 12, color: '#6b7280' }}>{e.http_method} {e.route_path?.slice(0, 50)}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => setSelected(e)} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail modal */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
            <div style={{ background: 'white', maxWidth: 720, width: '100%', maxHeight: '90vh', overflow: 'auto', borderRadius: 8, padding: 24 }} onClick={ev => ev.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>{selected.action} on {selected.table_name} #{selected.row_id}</h3>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                {formatDate(selected.occurred_at)} — by {selected.actor_user_id || 'system'} ({selected.actor_role || '—'}) from {selected.ip_address || 'unknown IP'}
              </div>
              {selected.reason && <div style={{ background: '#fef3c7', padding: 10, borderRadius: 4, marginBottom: 12, fontSize: 13 }}><strong>Reason:</strong> {selected.reason}</div>}
              {selected.before_data ? (
                <>
                  <h4 style={{ marginBottom: 4 }}>Before</h4>
                  <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 4, fontSize: 12, overflow: 'auto', maxHeight: 200 }}>{JSON.stringify(selected.before_data, null, 2)}</pre>
                </>
              ) : null}
              {selected.after_data ? (
                <>
                  <h4 style={{ marginBottom: 4 }}>After</h4>
                  <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 4, fontSize: 12, overflow: 'auto', maxHeight: 200 }}>{JSON.stringify(selected.after_data, null, 2)}</pre>
                </>
              ) : null}
              <button onClick={() => setSelected(null)} style={{ marginTop: 12, padding: '8px 20px', background: '#374151', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLog
