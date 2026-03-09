import { useState, useEffect } from 'react'
import { apiGet, apiUpload, apiDelete } from '../services/apiService'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  CARD,
  CARD_PADDING,
  CARD_SM_PADDING,
  BTN_PRIMARY,
  BTN_ICON,
  SELECT,
  BADGE_PRIMARY,
  BADGE_DEFAULT,
  SECTION_TITLE,
  EMPTY_STATE,
  EMPTY_TITLE,
} from '../styles/designSystem'

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

function KnowledgeUpload({ onLogout: _onLogout, onBack: _onBack, userName: _userName, onNavigate: _onNavigate }: KnowledgeUploadProps) {
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
    <div className={PAGE_CONTENT}>
      <h2 className={`${PAGE_TITLE} mb-6`}>Knowledge Base</h2>

      <section className={`${CARD} ${CARD_PADDING} mb-6`}>
        <h3 className="text-base font-semibold text-slate-900 mb-4">Upload Drug Information</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              required
              className={SELECT}
            >
              <option value="">Select Product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={SELECT}
            >
              <option value="prescribing_info">Prescribing Info</option>
              <option value="clinical_trial">Clinical Trial</option>
              <option value="faq">FAQ</option>
              <option value="safety">Safety Data</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <input
              type="file"
              id="knowledge-file"
              accept=".txt,.md,.csv"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            <p className="text-xs text-slate-400">Accepted: .txt, .md, .csv (max 5MB)</p>
          </div>

          <button type="submit" className={BTN_PRIMARY} disabled={uploading || !file || !selectedProduct}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>

          {uploadMessage && (
            <div className={`text-sm rounded-lg px-4 py-3 mt-3 ${uploadMessage.includes('success') ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
              {uploadMessage}
            </div>
          )}
        </form>
      </section>

      <section>
        <h3 className={SECTION_TITLE}>Uploaded Files ({entries.length})</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className={EMPTY_STATE}>
            <p className={EMPTY_TITLE}>No knowledge base files uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className={`${CARD} ${CARD_SM_PADDING} flex items-center justify-between`}>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">{entry.filename}</div>
                  <div className="flex gap-3 items-center mt-1">
                    <span className={BADGE_PRIMARY}>{entry.product_name}</span>
                    <span className={BADGE_DEFAULT}>{categoryLabels[entry.category] || entry.category}</span>
                    <span className="text-xs text-slate-400">{formatDate(entry.uploaded_at)}</span>
                  </div>
                </div>
                <button
                  className={`${BTN_ICON} text-red-400 hover:text-red-600 hover:bg-red-50`}
                  onClick={() => handleDelete(entry.id)}
                  title="Delete"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default KnowledgeUpload
