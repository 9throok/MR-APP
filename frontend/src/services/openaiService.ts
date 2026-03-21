/**
 * DCR extraction service — calls backend /api/ai/post-call-extract
 * which uses the configured LLM (gemini-3-flash-preview) with proper
 * system instructions and JSON output handling.
 */

import { apiPost } from './apiService'

export interface DCRExtractedData {
  product?: string
  samples?: Array<{
    name: string
    quantity: number
  }>
  callSummary?: string
  rating?: number
  doctorFeedback?: string
  followUpTasks?: Array<{ task: string; due_days: number }>
}

/**
 * Extract DCR data from transcribed text via the backend LLM service
 */
export async function extractDCRData(
  transcription: string,
  _availableProducts: string[],
  _availableSamples: Array<{ id: number; name: string }>,
  doctorName?: string
): Promise<DCRExtractedData> {
  if (!transcription || transcription.trim().length === 0) {
    throw new Error('Transcription text is empty')
  }

  const res = await apiPost('/ai/post-call-extract', {
    doctor_name: doctorName || 'Unknown',
    transcript: transcription,
  })

  if (!res.success || !res.extraction) {
    throw new Error(res.error || 'Failed to extract data from transcript')
  }

  const ext = res.extraction

  // Map backend extraction format to frontend DCRExtractedData
  const result: DCRExtractedData = {}

  if (ext.primary_product) {
    result.product = ext.primary_product
  }

  if (ext.samples_dropped && Array.isArray(ext.samples_dropped)) {
    result.samples = ext.samples_dropped
      .filter((s: any) => s.name && typeof s.quantity === 'number' && s.quantity > 0)
      .map((s: any) => ({
        name: s.name,
        quantity: Math.max(1, Math.floor(s.quantity)),
      }))
  }

  if (ext.call_summary) {
    result.callSummary = ext.call_summary
  }

  if (ext.doctor_feedback) {
    result.doctorFeedback = ext.doctor_feedback
  }

  if (ext.follow_up_tasks && Array.isArray(ext.follow_up_tasks)) {
    result.followUpTasks = ext.follow_up_tasks
  }

  return result
}
