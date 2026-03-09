import { useState } from 'react'
import {
  MODAL_OVERLAY,
  MODAL_CARD,
  MODAL_HEADER,
  MODAL_FOOTER,
  INPUT,
  TEXTAREA,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BADGE_WARNING,
} from '../styles/designSystem'

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
    <div className={MODAL_OVERLAY}>
      <div className={`${MODAL_CARD} max-w-2xl`}>
        <div className={MODAL_HEADER}>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI Extraction Review</h3>
            <span className="text-sm text-slate-500">{doctorName}</span>
          </div>
        </div>

        {extraction.sentiment && (
          <div
            className="mx-6 mt-4 px-4 py-2 rounded-lg border-l-4 text-sm text-slate-700 bg-slate-50"
            style={{ borderColor: sentimentColor[extraction.sentiment] || '#94a3b8' }}
          >
            Sentiment: <strong style={{ color: sentimentColor[extraction.sentiment] }}>{extraction.sentiment}</strong>
          </div>
        )}

        <div className="px-6 py-4 border-b border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Product</label>
          <input className={INPUT} value={product} onChange={e => setProduct(e.target.value)} />
          {extraction.products_detailed && extraction.products_detailed.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {extraction.products_detailed.map((p, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => setProduct(p)}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-b border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Samples Dropped</label>
          {samples.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No samples detected</p>
          ) : (
            <div className="space-y-2">
              {samples.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    className={`flex-1 ${INPUT}`}
                    value={s.name}
                    onChange={e => {
                      const updated = [...samples]
                      updated[i] = { ...updated[i], name: e.target.value }
                      setSamples(updated)
                    }}
                  />
                  <input
                    className={`w-20 ${INPUT}`}
                    type="number"
                    value={s.quantity}
                    onChange={e => {
                      const updated = [...samples]
                      updated[i] = { ...updated[i], quantity: parseInt(e.target.value) || 0 }
                      setSamples(updated)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-b border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Call Summary</label>
          <textarea className={TEXTAREA} value={callSummary} onChange={e => setCallSummary(e.target.value)} rows={3} />
        </div>

        <div className="px-6 py-4 border-b border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor Feedback</label>
          <textarea className={TEXTAREA} value={doctorFeedback} onChange={e => setDoctorFeedback(e.target.value)} rows={2} />
        </div>

        {followUpTasks.length > 0 && (
          <div className="px-6 py-4 border-b border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Follow-up Tasks</label>
            <div className="space-y-2">
              {followUpTasks.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                  <span>{t.task}</span>
                  {t.due_days && <span className={BADGE_WARNING}>in {t.due_days} days</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {extraction.competitor_mentions && extraction.competitor_mentions.length > 0 && (
          <div className="px-6 py-4 border-b border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Competitor Mentions</label>
            {extraction.competitor_mentions.map((c, i) => (
              <div key={i} className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mb-2">
                <strong>{c.drug || c.company}</strong>: {c.context}
              </div>
            ))}
          </div>
        )}

        {extraction.key_objections && extraction.key_objections.length > 0 && (
          <div className="px-6 py-4 border-b border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Key Objections</label>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
              {extraction.key_objections.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={MODAL_FOOTER}>
          <button className={BTN_SECONDARY} onClick={onCancel}>Cancel</button>
          <button className={BTN_PRIMARY} onClick={() => onConfirm({ product, samples, callSummary, doctorFeedback, followUpTasks })}>
            Confirm & Save DCR
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostCallReview
