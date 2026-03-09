import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiUpload, apiDelete } from '../services/apiService'
import './KnowledgeUpload.css'

interface KnowledgeUploadProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Product {
  id: number
  name: string
}

interface KnowledgeEntry {
  id: number
  product_id: number
  product_name: string
  filename: string
  category: string
  uploaded_by: string
  uploaded_at: string
}

function KnowledgeUpload({ onLogout, onBack, userName, onNavigate }: KnowledgeUploadProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [category, setCategory] = useState('prescribing_info')
  const [file, setFile] = useState<File | null>(null)
  const [uploadMessage, setUploadMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsData, knowledgeData] = await Promise.all([
        apiGet('/products'),
        apiGet('/knowledge')
      ])
      setProducts(productsData.data || [])
      setEntries(knowledgeData.data || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedProduct) return

    setUploading(true)
    setUploadMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('product_id', selectedProduct)
      formData.append('category', category)

      await apiUpload('/knowledge/upload', formData)
      setUploadMessage('File uploaded successfully!')
      setFile(null)
      setSelectedProduct('')
      // Reset file input
      const fileInput = document.getElementById('knowledge-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      loadData()
    } catch (err) {
      setUploadMessage(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this knowledge base entry?')) return
    try {
      await apiDelete(`/knowledge/${id}`)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const categoryLabels: Record<string, string> = {
    prescribing_info: 'Prescribing Info',
    clinical_trial: 'Clinical Trial',
    faq: 'FAQ',
    safety: 'Safety Data',
    general: 'General',
  }

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="knowledge-upload" />

      <main className="knowledge-content">
        <section className="upload-section">
          <h3>Upload Drug Information</h3>
          <form onSubmit={handleUpload} className="upload-form">
            <div className="form-row">
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                required
                className="form-select"
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="form-select"
              >
                <option value="prescribing_info">Prescribing Info</option>
                <option value="clinical_trial">Clinical Trial</option>
                <option value="faq">FAQ</option>
                <option value="safety">Safety Data</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="file-input-wrapper">
              <input
                type="file"
                id="knowledge-file"
                accept=".txt,.md,.csv"
                onChange={e => setFile(e.target.files?.[0] || null)}
                required
              />
              <p className="file-hint">Accepted: .txt, .md, .csv (max 5MB)</p>
            </div>

            <button type="submit" className="upload-btn" disabled={uploading || !file || !selectedProduct}>
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>

            {uploadMessage && (
              <div className={`upload-message ${uploadMessage.includes('success') ? 'success' : 'error'}`}>
                {uploadMessage}
              </div>
            )}
          </form>
        </section>

        <section className="entries-section">
          <h3>Uploaded Files ({entries.length})</h3>
          {loading ? (
            <div className="knowledge-loading">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="knowledge-empty">No knowledge base files uploaded yet.</div>
          ) : (
            <div className="entries-list">
              {entries.map(entry => (
                <div key={entry.id} className="entry-card">
                  <div className="entry-info">
                    <div className="entry-filename">{entry.filename}</div>
                    <div className="entry-meta">
                      <span className="entry-product">{entry.product_name}</span>
                      <span className="entry-category">{categoryLabels[entry.category] || entry.category}</span>
                      <span className="entry-date">{formatDate(entry.uploaded_at)}</span>
                    </div>
                  </div>
                  <button className="delete-btn" onClick={() => handleDelete(entry.id)} title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default KnowledgeUpload
