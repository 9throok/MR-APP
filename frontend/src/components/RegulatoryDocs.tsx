import { useState, useEffect } from 'react'
import { AlertTriangle, Plus, ExternalLink } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiUpload } from '../services/apiService'
import './KnowledgeUpload.css'
import './admin/AdminUI.css'
import {
  Badge,
  Banner,
  DataTable,
  humanise,
  type DataTableColumn,
} from './admin'

interface RegulatoryDocsProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface DocumentRow {
  id: number
  title: string
  doc_type: string
  jurisdiction: string | null
  description: string | null
  product_id: number | null
  product_name: string | null
  current_version_id: number | null
  current_version_number: number | null
  current_expiry_date: string | null
  current_file_url: string | null
  updated_at: string
}

interface ExpiringRow {
  document_id: number
  title: string
  doc_type: string
  version_number: number
  expiry_date: string
  days_until_expiry: number
}

const DOC_TYPES = ['drug_label', 'ifu', 'moh_approval', 'safety_communication', 'sop', 'training_material', 'other']

function RegulatoryDocs({ onLogout, onBack, userName, onNavigate }: RegulatoryDocsProps) {
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [expiring, setExpiring] = useState<ExpiringRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // form state
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('drug_label')
  const [jurisdiction, setJurisdiction] = useState('')
  const [description, setDescription] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, exp] = await Promise.all([
        apiGet('/regulatory-documents'),
        apiGet('/regulatory-documents/expiring?days=60'),
      ])
      setDocs(list.data || [])
      setExpiring(exp.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!file) {
      setError('A file is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('doc_type', docType)
      if (jurisdiction) fd.append('jurisdiction', jurisdiction)
      if (description) fd.append('description', description)
      if (effectiveDate) fd.append('effective_date', effectiveDate)
      if (expiryDate) fd.append('expiry_date', expiryDate)
      fd.append('file', file)
      await apiUpload('/regulatory-documents', fd)
      setTitle(''); setJurisdiction(''); setDescription(''); setEffectiveDate(''); setExpiryDate(''); setFile(null)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: DataTableColumn<DocumentRow>[] = [
    {
      key: 'title',
      label: 'Title',
      render: d => <span style={{ fontWeight: 600 }}>{d.title}</span>,
    },
    {
      key: 'doc_type',
      label: 'Type',
      width: '170px',
      render: d => <Badge tone="info">{humanise(d.doc_type)}</Badge>,
    },
    {
      key: 'jurisdiction',
      label: 'Jurisdiction',
      width: '110px',
      render: d => <span className="cell-muted">{d.jurisdiction || '—'}</span>,
    },
    {
      key: 'product_name',
      label: 'Product',
      width: '140px',
      render: d => <span className="cell-muted">{d.product_name || 'cross-product'}</span>,
    },
    {
      key: 'current_version_number',
      label: 'Current',
      width: '90px',
      render: d => d.current_version_number ? <Badge tone="neutral">v{d.current_version_number}</Badge> : <span className="cell-muted">—</span>,
    },
    {
      key: 'current_expiry_date',
      label: 'Expiry',
      width: '120px',
      render: d => <span className="cell-muted">{d.current_expiry_date ? new Date(d.current_expiry_date).toLocaleDateString('en-IN') : '—'}</span>,
    },
    {
      key: 'open',
      label: '',
      width: '100px',
      align: 'right',
      render: d => d.current_file_url ? (
        <a href={d.current_file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
          Open <ExternalLink size={12} />
        </a>
      ) : <span className="cell-muted">—</span>,
    },
  ]

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="regulatory-docs" />

      <div className="knowledge-content">
        <div className="admin-page-intro">
          <div>
            <h2 className="admin-page-title">Regulatory Document Repository</h2>
            <p className="admin-page-lead">
              Drug labels, IFUs, MoH approvals, SOPs, safety communications. Versioned with effective and expiry dates.
            </p>
          </div>
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
            <Plus size={14} />
            {showForm ? 'Cancel' : 'Upload document'}
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {expiring.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <Banner
              tone="warning"
              icon={<AlertTriangle size={16} />}
              title={`${expiring.length} document${expiring.length === 1 ? '' : 's'} expiring within 60 days`}
            >
              <ul style={{ margin: '6px 0 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {expiring.map(e => (
                  <li key={e.document_id}>
                    <strong>{e.title}</strong> v{e.version_number} — {e.days_until_expiry} day{e.days_until_expiry === 1 ? '' : 's'} until {new Date(e.expiry_date).toLocaleDateString('en-IN')}
                  </li>
                ))}
              </ul>
            </Banner>
          </div>
        )}

        {showForm && (
          <form onSubmit={submit} className="admin-card" style={{ marginBottom: 18 }}>
            <div className="admin-section-title">Upload new document</div>
            <div className="admin-form-grid-2">
              <div>
                <label className="admin-field-label">Title*</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Document type*</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="admin-select">
                  {DOC_TYPES.map(t => <option key={t} value={t}>{humanise(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-field-label">Jurisdiction</label>
                <input value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} placeholder="e.g. IN, EU, US-FDA" className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Effective date</label>
                <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Expiry date</label>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">File*</label>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required className="admin-input" style={{ padding: 7 }} />
              </div>
              <div className="admin-field-wide">
                <label className="admin-field-label">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="admin-textarea" />
              </div>
            </div>
            <div className="admin-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                {submitting ? 'Uploading…' : 'Upload document'}
              </button>
            </div>
          </form>
        )}

        <div className="admin-row-spread" style={{ marginBottom: 12 }}>
          <div className="admin-section-title" style={{ margin: 0 }}>All documents</div>
          <span className="admin-count-pill">{docs.length} document{docs.length === 1 ? '' : 's'}</span>
        </div>

        <DataTable
          columns={columns}
          rows={docs}
          rowKey={d => d.id}
          loading={loading}
          empty="No regulatory documents uploaded yet. Upload the first one above."
        />
      </div>
    </div>
  )
}

export default RegulatoryDocs
