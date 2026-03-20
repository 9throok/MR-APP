import { useState, useRef } from 'react'
import { apiUpload } from '../services/apiService'
import './SalesUpload.css'

interface SalesUploadProps {
  type: 'sales' | 'targets'
  onClose: () => void
  onSuccess: () => void
}

interface UploadError {
  row: number
  message: string
}

interface UploadResult {
  inserted: number
  errors: UploadError[]
  total_rows: number
}

function SalesUpload({ type, onClose, onSuccess }: SalesUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const templateUrl = type === 'sales' ? '/api/sales/template/sales' : '/api/targets/template'
  const uploadUrl = type === 'sales' ? '/sales/upload' : '/targets/upload'
  const title = type === 'sales' ? 'Upload Sales Data' : 'Upload Targets'

  const handleFileSelect = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }
    setFile(f)
    setResult(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const data = await apiUpload(uploadUrl, formData)
      setResult(data)
      if (data.inserted > 0) {
        onSuccess()
      }
    } catch (err: any) {
      setResult({ inserted: 0, errors: [{ row: 0, message: err.message || 'Upload failed' }], total_rows: 0 })
    } finally {
      setUploading(false)
    }
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

  return (
    <div className="sales-upload-overlay" onClick={onClose}>
      <div className="sales-upload-modal" onClick={e => e.stopPropagation()}>
        <div className="sales-upload-header">
          <h2>{title}</h2>
          <button className="sales-upload-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="sales-upload-body">
          <div
            className={`sales-upload-dropzone ${dragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>Drag & drop your file here, or <strong>browse</strong></p>
            <p style={{ fontSize: 12, marginTop: 4 }}>CSV, XLSX (max 5000 rows)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.length) handleFileSelect(e.target.files[0]) }}
            />
          </div>

          {file && (
            <div className="sales-upload-file-info">
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              <button className="sales-upload-file-remove" onClick={() => { setFile(null); setResult(null) }}>Remove</button>
            </div>
          )}

          <div className="sales-upload-template">
            <a href={`${baseUrl}${templateUrl.startsWith('/') ? templateUrl : '/' + templateUrl}`}
               target="_blank"
               rel="noopener noreferrer"
               onClick={e => {
                 e.preventDefault()
                 const token = localStorage.getItem('zenapp_token')
                 fetch(`${baseUrl}${templateUrl.startsWith('/') ? templateUrl : '/' + templateUrl}`, {
                   headers: { Authorization: `Bearer ${token}` }
                 })
                 .then(r => r.blob())
                 .then(blob => {
                   const url = URL.createObjectURL(blob)
                   const a = document.createElement('a')
                   a.href = url
                   a.download = type === 'sales' ? 'sales_upload_template.csv' : 'targets_upload_template.csv'
                   a.click()
                   URL.revokeObjectURL(url)
                 })
               }}>
              Download template
            </a>
          </div>

          {result && (
            <div className={`sales-upload-result ${result.errors.length ? 'has-errors' : 'success'}`}>
              <p>{result.inserted} of {result.total_rows} rows imported successfully</p>
              {result.errors.length > 0 && (
                <ul>
                  {result.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>Row {e.row}: {e.message}</li>
                  ))}
                  {result.errors.length > 10 && <li>... and {result.errors.length - 10} more errors</li>}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="sales-upload-footer">
          <button className="sales-upload-btn sales-upload-btn-cancel" onClick={onClose}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              className="sales-upload-btn sales-upload-btn-submit"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SalesUpload
