import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiUpload, apiPost } from '../services/apiService'
// Reuse KnowledgeUpload.css — same page chrome (.knowledge-page, .upload-form,
// .entries-list, etc). Saves a CSS file and keeps these admin pages visually
// consistent with the existing knowledge-base admin tool.
import './KnowledgeUpload.css'

interface ContentLibraryProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Product {
  id: number
  name: string
}

interface MlrReview {
  reviewer_role: 'medical' | 'legal' | 'regulatory'
  decision: 'pending' | 'approved' | 'changes_requested' | 'rejected'
  reviewer_user_id: string | null
  reviewed_at: string | null
  decision_notes: string | null
}

interface ContentVersion {
  id: number
  asset_id: number
  version_number: number
  status: 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'published' | 'retired'
  file_url: string
  mime_type: string | null
  file_size_bytes: number | null
  expiry_date: string | null
  submitted_at: string | null
  published_at: string | null
  change_notes: string | null
  ai_pre_review_notes: { findings?: unknown[]; summary?: string; finding_count?: number } | null
  reviews: MlrReview[] | null
  claim_count: number
  needs_citation_count: number
}

interface ContentAsset {
  id: number
  title: string
  asset_type: string
  product_id: number | null
  product_name: string | null
  therapeutic_area: string | null
  description: string | null
  current_version_id: number | null
  current_version_number?: number | null
  owner_user_id: string
  created_at: string
  updated_at: string
}

interface AssetDetail extends ContentAsset {
  versions: ContentVersion[]
}

const ASSET_TYPES = [
  { value: 'detail_aid', label: 'Detail Aid' },
  { value: 'slide_deck', label: 'Slide Deck' },
  { value: 'pdf', label: 'PDF' },
  { value: 'video', label: 'Video' },
  { value: 'brochure', label: 'Brochure' },
]

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
  published: 'Published',
  retired: 'Retired',
}

const STATUS_COLOR: Record<string, string> = {
  draft: '#6b7280',
  in_review: '#0a3d62',
  changes_requested: '#b45309',
  approved: '#059669',
  published: '#15803d',
  retired: '#9ca3af',
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ContentLibrary({ onLogout, onBack, userName, onNavigate }: ContentLibraryProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [assets, setAssets] = useState<ContentAsset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<AssetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [busyVersionId, setBusyVersionId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  // Upload form state
  const [title, setTitle] = useState('')
  const [assetType, setAssetType] = useState('detail_aid')
  const [productId, setProductId] = useState('')
  const [therapeuticArea, setTherapeuticArea] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsData, assetsData] = await Promise.all([
        apiGet('/products'),
        apiGet('/content'),
      ])
      setProducts(productsData.data || [])
      setAssets(assetsData.data || [])
    } catch (err) {
      console.error('[ContentLibrary] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAssetDetail = async (id: number) => {
    try {
      const resp = await apiGet(`/content/${id}`)
      setSelectedAsset(resp.data)
    } catch (err) {
      console.error('[ContentLibrary] detail error:', err)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !assetType) return

    setUploading(true)
    setMessage('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title)
      fd.append('asset_type', assetType)
      if (productId) fd.append('product_id', productId)
      if (therapeuticArea) fd.append('therapeutic_area', therapeuticArea)
      if (description) fd.append('description', description)

      await apiUpload('/content', fd)
      setMessage('Asset uploaded successfully — claim substantiation runs in the background.')
      setTitle('')
      setProductId('')
      setTherapeuticArea('')
      setDescription('')
      setFile(null)
      const fileInput = document.getElementById('content-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      loadData()
    } catch (err) {
      setMessage(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  // Submit a draft / changes_requested version for MLR review.
  const handleSubmit = async (assetId: number, versionId: number) => {
    setBusyVersionId(versionId)
    try {
      await apiPost(`/content/${assetId}/versions/${versionId}/submit`, {})
      setMessage('Submitted for MLR review.')
      await loadAssetDetail(assetId)
    } catch (err) {
      setMessage(`Submit failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setBusyVersionId(null)
    }
  }

  // Admin-only: publish an approved version. The route guards on role server-side.
  const handlePublish = async (assetId: number, versionId: number) => {
    setBusyVersionId(versionId)
    try {
      await apiPost(`/content/${assetId}/versions/${versionId}/publish`, {})
      setMessage('Version published.')
      await loadAssetDetail(assetId)
      loadData()
    } catch (err) {
      setMessage(`Publish failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setBusyVersionId(null)
    }
  }

  // Distribute a published version to all MRs in the org.
  const handleDistribute = async (assetId: number, versionId: number) => {
    setBusyVersionId(versionId)
    try {
      await apiPost(`/content/${assetId}/versions/${versionId}/distributions`, { target_type: 'all' })
      setMessage('Distributed to all MRs in the org.')
    } catch (err) {
      setMessage(`Distribute failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setBusyVersionId(null)
    }
  }

  // ── Detail panel (selected asset + version history) ────────────────────────
  const renderDetail = () => {
    if (!selectedAsset) return null
    return (
      <section className="entries-section" style={{ marginTop: 24 }}>
        <div className="entries-section-header">
          <h3>{selectedAsset.title}</h3>
          <button className="back-button" onClick={() => setSelectedAsset(null)} style={{ width: 'auto', padding: '6px 12px' }}>
            Close
          </button>
        </div>
        <div style={{ marginBottom: 16, fontSize: 14, color: '#6b7280' }}>
          {selectedAsset.asset_type.replace('_', ' ')} · {selectedAsset.product_name || 'cross-product'} · {selectedAsset.therapeutic_area || 'general'}
        </div>
        {selectedAsset.description && (
          <p style={{ marginBottom: 16 }}>{selectedAsset.description}</p>
        )}
        <h4 style={{ marginBottom: 8 }}>Version history</h4>
        <div className="entries-list">
          {selectedAsset.versions.map(v => {
            const reviews = v.reviews || []
            const approvalsByRole = (role: string) =>
              reviews.find(r => r.reviewer_role === role)?.decision || '—'
            return (
              <div key={v.id} className="entry-card" style={{ flexDirection: 'column', alignItems: 'stretch', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong>v{v.version_number}</strong>
                    <span style={{
                      marginLeft: 12, padding: '3px 10px', borderRadius: 12,
                      background: STATUS_COLOR[v.status] + '22',
                      color: STATUS_COLOR[v.status],
                      fontSize: 12, fontWeight: 600,
                    }}>
                      {STATUS_LABELS[v.status]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(v.status === 'draft' || v.status === 'changes_requested') && (
                      <button className="upload-btn" disabled={busyVersionId === v.id}
                        onClick={() => handleSubmit(selectedAsset.id, v.id)} style={{ padding: '6px 14px' }}>
                        {busyVersionId === v.id ? 'Submitting…' : 'Submit for MLR'}
                      </button>
                    )}
                    {v.status === 'approved' && (
                      <button className="upload-btn" disabled={busyVersionId === v.id}
                        onClick={() => handlePublish(selectedAsset.id, v.id)} style={{ padding: '6px 14px' }}>
                        {busyVersionId === v.id ? 'Publishing…' : 'Publish'}
                      </button>
                    )}
                    {v.status === 'published' && (
                      <button className="upload-btn" disabled={busyVersionId === v.id}
                        onClick={() => handleDistribute(selectedAsset.id, v.id)} style={{ padding: '6px 14px' }}>
                        {busyVersionId === v.id ? 'Distributing…' : 'Distribute to all'}
                      </button>
                    )}
                    <a href={v.file_url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', textDecoration: 'none', color: '#0a3d62', fontSize: 13 }}>
                      Open file
                    </a>
                  </div>
                </div>
                {v.change_notes && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#4b5563' }}>{v.change_notes}</div>
                )}
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13 }}>
                  <div><strong>Medical:</strong> {approvalsByRole('medical')}</div>
                  <div><strong>Legal:</strong> {approvalsByRole('legal')}</div>
                  <div><strong>Regulatory:</strong> {approvalsByRole('regulatory')}</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                  AI claims extracted: <strong>{v.claim_count}</strong>
                  {v.needs_citation_count > 0 && (
                    <span style={{ marginLeft: 6, color: '#b45309' }}>
                      ({v.needs_citation_count} need citations)
                    </span>
                  )}
                  {v.ai_pre_review_notes?.finding_count != null && (
                    <span style={{ marginLeft: 12 }}>
                      Pre-review findings: <strong>{v.ai_pre_review_notes.finding_count}</strong>
                    </span>
                  )}
                </div>
                {v.ai_pre_review_notes?.summary && (
                  <div style={{ marginTop: 8, padding: 10, background: '#fffbeb', borderLeft: '3px solid #f59e0b', fontSize: 13 }}>
                    <strong>AI pre-review:</strong> {v.ai_pre_review_notes.summary}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName}
        onNavigate={onNavigate} onLogout={onLogout} currentPage="content-library" />

      <main className="knowledge-content">
        <div className="knowledge-page-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="knowledge-header-content">
            <h1 className="knowledge-page-title">Content Library</h1>
            <p className="knowledge-page-subtitle">Upload detail aids, route through MLR review, publish to MRs</p>
          </div>
        </div>

        <section className="upload-section">
          <h3>Upload new asset</h3>
          <form onSubmit={handleUpload} className="upload-form">
            <div className="form-row">
              <input
                type="text"
                className="form-select"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Asset title (required)"
                required
              />
              <select value={assetType} onChange={e => setAssetType(e.target.value)} className="form-select">
                {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <select value={productId} onChange={e => setProductId(e.target.value)} className="form-select">
                <option value="">No product (cross-product)</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input
                type="text"
                className="form-select"
                value={therapeuticArea}
                onChange={e => setTherapeuticArea(e.target.value)}
                placeholder="Therapeutic area (e.g. Cardiology)"
              />
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="form-select"
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div className="file-input-wrapper">
              <input
                type="file"
                id="content-file"
                accept=".pdf,.pptx,.ppt,.mp4,.mov,.webm,.png,.jpg,.jpeg,.txt,.md"
                onChange={e => setFile(e.target.files?.[0] || null)}
                required
              />
              <p className="file-hint">PDF / slide deck / video / image / text — max 50 MB</p>
            </div>
            <button type="submit" className="upload-btn" disabled={uploading || !file || !title}>
              {uploading ? 'Uploading…' : 'Upload asset'}
            </button>
            {message && (
              <div className={`upload-message ${message.includes('success') || message.includes('Submitted') || message.includes('published') || message.includes('Distributed') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
          </form>
        </section>

        <section className="entries-section">
          <div className="entries-section-header">
            <h3>All assets</h3>
            <span className="entries-count">{assets.length} asset{assets.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div className="knowledge-loading">Loading…</div>
          ) : assets.length === 0 ? (
            <div className="knowledge-empty">No assets yet. Upload one above to get started.</div>
          ) : (
            <div className="entries-list">
              {assets.map(a => (
                <div key={a.id} className="entry-card" style={{ cursor: 'pointer' }}
                  onClick={() => loadAssetDetail(a.id)}>
                  <div className="entry-info">
                    <div className="entry-filename">{a.title}</div>
                    <div className="entry-meta">
                      <span className="entry-product">{a.asset_type.replace('_', ' ')}</span>
                      {a.product_name && <span className="entry-category">{a.product_name}</span>}
                      {a.therapeutic_area && <span className="entry-category">{a.therapeutic_area}</span>}
                      <span className="entry-date">Updated {formatDate(a.updated_at)}</span>
                      {a.current_version_id ? (
                        <span style={{ color: '#15803d', fontWeight: 600, fontSize: 12 }}>
                          • Live v{a.current_version_number}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>• No live version</span>
                      )}
                    </div>
                  </div>
                  <button className="back-button" style={{ width: 'auto', padding: '8px 14px' }}
                    onClick={e => { e.stopPropagation(); loadAssetDetail(a.id) }}>
                    Open
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

export default ContentLibrary
