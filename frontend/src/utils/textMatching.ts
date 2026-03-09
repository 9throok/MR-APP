/**
 * Text matching utilities for fuzzy matching products and samples
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2
  if (len2 === 0) return len1

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        )
      }
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity score between two strings (0-1, where 1 is identical)
 */
function similarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  return 1 - distance / maxLen
}

/**
 * Find the best matching product from a list
 */
export function findBestProductMatch(
  searchText: string,
  products: string[],
  threshold: number = 0.6
): string | null {
  if (!searchText || !products.length) return null

  const normalizedSearch = searchText.toLowerCase().trim()
  let bestMatch: { product: string; score: number } | null = null

  for (const product of products) {
    const normalizedProduct = product.toLowerCase()
    
    // Exact match
    if (normalizedProduct === normalizedSearch) {
      return product
    }

    // Check if search text contains product or vice versa
    if (normalizedProduct.includes(normalizedSearch) || normalizedSearch.includes(normalizedProduct)) {
      const score = similarity(normalizedSearch, normalizedProduct)
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { product, score }
      }
    } else {
      // Fuzzy match
      const score = similarity(normalizedSearch, normalizedProduct)
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { product, score }
      }
    }
  }

  return bestMatch && bestMatch.score >= threshold ? bestMatch.product : null
}

/**
 * Find the best matching sample from a list
 */
export function findBestSampleMatch(
  searchText: string,
  samples: Array<{ id: number; name: string }>,
  threshold: number = 0.6
): { id: number; name: string } | null {
  if (!searchText || !samples.length) return null

  const normalizedSearch = searchText.toLowerCase().trim()
  let bestMatch: { sample: { id: number; name: string }; score: number } | null = null

  for (const sample of samples) {
    const normalizedSample = sample.name.toLowerCase()
    
    // Exact match
    if (normalizedSample === normalizedSearch) {
      return sample
    }

    // Check if search text contains sample name or vice versa
    if (normalizedSample.includes(normalizedSearch) || normalizedSearch.includes(normalizedSample)) {
      const score = similarity(normalizedSearch, normalizedSample)
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { sample, score }
      }
    } else {
      // Fuzzy match
      const score = similarity(normalizedSearch, normalizedSample)
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { sample, score }
      }
    }
  }

  return bestMatch && bestMatch.score >= threshold ? bestMatch.sample : null
}

/**
 * Extract rating from text (1-5)
 */
export function extractRating(text: string): number | null {
  if (!text) return null

  const normalized = text.toLowerCase()
  
  // Look for explicit rating patterns
  const ratingPatterns = [
    /rating[:\s]+(\d)/i,
    /rated[:\s]+(\d)/i,
    /(\d)[\s]*out[\s]*of[\s]*5/i,
    /(\d)[\s]*star/i,
    /(\d)[\s]*\/[\s]*5/i,
    /\b(\d)\b/,
  ]

  for (const pattern of ratingPatterns) {
    const match = normalized.match(pattern)
    if (match) {
      const rating = parseInt(match[1], 10)
      if (rating >= 1 && rating <= 5) {
        return rating
      }
    }
  }

  // Look for word-based ratings
  const wordRatings: { [key: string]: number } = {
    'excellent': 5,
    'outstanding': 5,
    'great': 4,
    'good': 4,
    'satisfactory': 3,
    'average': 3,
    'fair': 2,
    'poor': 1,
    'bad': 1,
  }

  for (const [word, rating] of Object.entries(wordRatings)) {
    if (normalized.includes(word)) {
      return rating
    }
  }

  return null
}
