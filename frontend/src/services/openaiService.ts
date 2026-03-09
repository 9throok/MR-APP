/**
 * Gemini API service for extracting structured data from DCR transcriptions
 */

export interface DCRExtractedData {
  product?: string
  samples?: Array<{
    name: string
    quantity: number
  }>
  callSummary?: string
  rating?: number
}

interface GeminiResponse {
  product?: string
  samples?: Array<{
    name: string
    quantity: number
  }>
  callSummary?: string
  rating?: number
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const REQUEST_TIMEOUT = 30000 // 30 seconds

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Extract DCR data from transcribed text using Google Gemini API
 */
export async function extractDCRData(
  transcription: string,
  availableProducts: string[],
  availableSamples: Array<{ id: number; name: string }>
): Promise<DCRExtractedData> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.')
  }

  if (!transcription || transcription.trim().length === 0) {
    throw new Error('Transcription text is empty')
  }

  // Build the prompt with context
  const productsList = availableProducts.map((p, i) => `${i + 1}. ${p}`).join('\n')
  const samplesList = availableSamples.map((s, i) => `${i + 1}. ${s.name}`).join('\n')

  const prompt = `You are a medical data extraction assistant. Extract structured information from a Daily Call Report (DCR) transcription.

Available Products:
${productsList}

Available Samples:
${samplesList}

Extract the following information from the transcription:
1. Product: Match the mentioned product to one of the available products (exact match preferred, or closest match)
2. Samples: Extract any mentioned samples with their quantities (match to available samples)
3. Call Summary: Extract or summarize the call details
4. Rating: Extract a rating from 1 to 5 (if mentioned)

Return ONLY valid JSON in this exact format:
{
  "product": "exact product name from available products or null",
  "samples": [{"name": "exact sample name", "quantity": number}],
  "callSummary": "summary text or null",
  "rating": number between 1-5 or null
}

If information is not found or unclear, use null. Do not make up information.

Transcription: "${transcription}"

Extract the DCR information and return as JSON:`

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429) {
          // Rate limit - wait longer before retry
          const retryAfter = response.headers.get('Retry-After')
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY * attempt
          if (attempt < MAX_RETRIES) {
            await sleep(waitTime)
            continue
          }
          throw new Error('API rate limit exceeded. Please try again in a few moments.')
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API key. Please check your Gemini API key configuration.')
        }

        if (response.status === 500 || response.status >= 502) {
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY * attempt)
            continue
          }
          throw new Error('Gemini service is temporarily unavailable. Please try again later.')
        }

        const errorMessage = errorData.error?.message || response.statusText || 'Unknown error'
        throw new Error(`Failed to extract data: ${errorMessage}`)
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        throw new Error('No content in Gemini response')
      }

      // Parse JSON response
      let extracted: GeminiResponse
      try {
        extracted = JSON.parse(content)
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          extracted = JSON.parse(jsonMatch[1])
        } else {
          throw new Error('Failed to parse JSON from Gemini response')
        }
      }

      // Validate and clean the extracted data
      const result: DCRExtractedData = {}

      if (extracted.product) {
        result.product = extracted.product
      }

      if (extracted.samples && Array.isArray(extracted.samples)) {
        result.samples = extracted.samples
          .filter((s: any) => s.name && typeof s.quantity === 'number' && s.quantity > 0)
          .map((s: any) => ({
            name: s.name,
            quantity: Math.max(1, Math.floor(s.quantity)),
          }))
      }

      if (extracted.callSummary) {
        result.callSummary = extracted.callSummary.trim()
      }

      if (extracted.rating !== undefined && extracted.rating !== null) {
        const rating = typeof extracted.rating === 'number' 
          ? extracted.rating 
          : parseInt(String(extracted.rating), 10)
        if (rating >= 1 && rating <= 5) {
          result.rating = rating
        }
      }

      return result
    } catch (error) {
      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY * attempt)
          continue
        }
        lastError = new Error('Request timeout. Please check your internet connection and try again.')
      } else if (error instanceof Error) {
        lastError = error
        // Don't retry for client errors (4xx) except 429
        if (error.message.includes('Invalid API key') || error.message.includes('rate limit')) {
          break
        }
        if (attempt < MAX_RETRIES && !error.message.includes('Invalid API key')) {
          // Exponential backoff
          await sleep(RETRY_DELAY * attempt)
        }
      } else {
        lastError = new Error(String(error))
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY * attempt)
        }
      }
    }
  }

  throw lastError || new Error('Failed to extract DCR data after retries')
}
