import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiUpload } from '../services/apiService'
import './KnowledgeUpload.css'

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
      // reset form
      setTitle(''); setJurisdiction(''); setDescription(''); setEffectiveDate(''); setExpiryDate(''); setFile(null)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="regulatory-docs" />

      <div className="knowledge-content">
        <div className="entries-section">
          <h2 style={{ marginTop: 0 }}>Regulatory Document Repository</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Drug labels, IFUs, MoH approvals, SOPs, safety communications. Versioned with effective and expiry dates.</p>

          {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

          {expiring.length > 0 && (
            <div style={{ background: '#fef3c7', padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <strong>⚠️ Expiring within 60 days ({expiring.length}):</strong>
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                {expiring.map(e => (
                  <li key={e.document_id} style={{ fontSize: 13 }}>
                    <strong>{e.title}</strong> v{e.version_number} — {e.days_until_expiry} day(s) until {new Date(e.expiry_date).toLocaleDateString('en-IN')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={() => setShowForm(v => !v)} className="upload-btn" style={{ marginBottom: 16 }}>
            {showForm ? 'Cancel' : '+ Upload new document'}
          </button>

          {showForm && (
            <form onSubmit={submit} style={{ background: '#f9fafb', padding: 16, borderRadius: 6, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>
                  Title*
                  <input value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} />
                </label>
                <label>
                  Document type*
                  <select value={docType} onChange={e => setDocType(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
                <label>
                  Jurisdiction
                  <input value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} placeholder="e.g. IN, EU, US-FDA" style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} />
                </label>
                <label>
                  Effective date
                  <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} />
                </label>
                <label>
                  Expiry date
                  <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} />
                </label>
                <label>
                  File*
                  <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required style={{ width: '100%', padding: 6, marginTop: 4 }} />
                </label>
              </div>
              <label style={{ display: 'block', marginTop: 12 }}>
                Description
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} />
              </label>
              <button type="submit" disabled={submitting} className="upload-btn" style={{ marginTop: 12 }}>
                {submitting ? 'Uploading…' : 'Upload'}
              </button>
            </form>
          )}

          {loading ? (
            <div>Loading…</div>
          ) : docs.length === 0 ? (
            <div style={{ color: '#6b7280', padding: 24, textAlign: 'center' }}>No regulatory documents uploaded yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>Title</th>
                  <th style={{ padding: 8 }}>Type</th>
                  <th style={{ padding: 8 }}>Jurisdiction</th>
                  <th style={{ padding: 8 }}>Product</th>
                  <th style={{ padding: 8 }}>Current ver</th>
                  <th style={{ padding: 8 }}>Expiry</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 8, fontSize: 13, fontWeight: 600 }}>{d.title}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{d.doc_type.replace(/_/g, ' ')}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{d.jurisdiction || '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{d.product_name || '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{d.current_version_number ? `v${d.current_version_number}` : '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{d.current_expiry_date ? new Date(d.current_expiry_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ padding: 8 }}>
                      {d.current_file_url ? (
                        <a href={d.current_file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'underline' }}>Open</a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegulatoryDocs
