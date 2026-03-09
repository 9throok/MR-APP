import { useState } from 'react'
import './PostCallReview.css'

interface PostCallReviewProps {
  extraction: {
    products_detailed?: string[]
    primary_product?: string
    samples_dropped?: { name: string; quantity: number }[]
    doctor_feedback?: string
    sentiment?: string
    call_summary?: string
    follow_up_tasks?: { task: string; due_days?: number }[]
    competitor_mentions?: { company?: string; drug?: string; context?: string }[]
    key_objections?: string[]
    edetailing?: { presented?: boolean; topics?: string[] }
  }
  doctorName: string
  onConfirm: (data: {
    product: string
    samples: { name: string; quantity: number }[]
    callSummary: string
    doctorFeedback: string
    followUpTasks: { task: string; due_days?: number }[]
  }) => void
  onCancel: () => void
}

function PostCallReview({ extraction, doctorName, onConfirm, onCancel }: PostCallReviewProps) {
  const [product, setProduct] = useState(extraction.primary_product || extraction.products_detailed?.[0] || '')
  const [samples, setSamples] = useState(extraction.samples_dropped || [])
  const [callSummary, setCallSummary] = useState(extraction.call_summary || '')
  const [doctorFeedback, setDoctorFeedback] = useState(extraction.doctor_feedback || '')
  const [followUpTasks] = useState(extraction.follow_up_tasks || [])

  const sentimentColor: Record<string, string> = {
    positive: '#22c55e',
    neutral: '#f59e0b',
    negative: '#ef4444',
  }

  return (
    <div className="pcr-overlay">
      <div className="pcr-modal">
        <div className="pcr-header">
          <h3>AI Extraction Review</h3>
          <span className="pcr-doctor">{doctorName}</span>
        </div>

        {extraction.sentiment && (
          <div className="pcr-sentiment" style={{ borderColor: sentimentColor[extraction.sentiment] || '#94a3b8' }}>
            Sentiment: <strong style={{ color: sentimentColor[extraction.sentiment] }}>{extraction.sentiment}</strong>
          </div>
        )}

        <div className="pcr-section">
          <label>Primary Product</label>
          <input value={product} onChange={e => setProduct(e.target.value)} />
          {extraction.products_detailed && extraction.products_detailed.length > 1 && (
            <div className="pcr-chips">
              {extraction.products_detailed.map((p, i) => (
                <span key={i} className="pcr-chip" onClick={() => setProduct(p)}>{p}</span>
              ))}
            </div>
          )}
        </div>

        <div className="pcr-section">
          <label>Samples Dropped</label>
          {samples.length === 0 ? (
            <p className="pcr-empty">No samples detected</p>
          ) : (
            <div className="pcr-samples">
              {samples.map((s, i) => (
                <div key={i} className="pcr-sample-row">
                  <input
                    value={s.name}
                    onChange={e => {
                      const updated = [...samples]
                      updated[i] = { ...updated[i], name: e.target.value }
                      setSamples(updated)
                    }}
                  />
                  <input
                    type="number"
                    value={s.quantity}
                    onChange={e => {
                      const updated = [...samples]
                      updated[i] = { ...updated[i], quantity: parseInt(e.target.value) || 0 }
                      setSamples(updated)
                    }}
                    style={{ width: '60px' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pcr-section">
          <label>Call Summary</label>
          <textarea value={callSummary} onChange={e => setCallSummary(e.target.value)} rows={3} />
        </div>

        <div className="pcr-section">
          <label>Doctor Feedback</label>
          <textarea value={doctorFeedback} onChange={e => setDoctorFeedback(e.target.value)} rows={2} />
        </div>

        {followUpTasks.length > 0 && (
          <div className="pcr-section">
            <label>Follow-up Tasks</label>
            <div className="pcr-tasks">
              {followUpTasks.map((t, i) => (
                <div key={i} className="pcr-task">
                  <span>{t.task}</span>
                  {t.due_days && <span className="pcr-due">in {t.due_days} days</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {extraction.competitor_mentions && extraction.competitor_mentions.length > 0 && (
          <div className="pcr-section">
            <label>Competitor Mentions</label>
            {extraction.competitor_mentions.map((c, i) => (
              <div key={i} className="pcr-competitor">
                <strong>{c.drug || c.company}</strong>: {c.context}
              </div>
            ))}
          </div>
        )}

        {extraction.key_objections && extraction.key_objections.length > 0 && (
          <div className="pcr-section">
            <label>Key Objections</label>
            <ul className="pcr-objections">
              {extraction.key_objections.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pcr-actions">
          <button className="pcr-cancel" onClick={onCancel}>Cancel</button>
          <button className="pcr-confirm" onClick={() => onConfirm({ product, samples, callSummary, doctorFeedback, followUpTasks })}>
            Confirm & Save DCR
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostCallReview
