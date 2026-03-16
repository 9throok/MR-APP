/**
 * Embeddings Service
 *
 * Uses Gemini gemini-embedding-001 (768 dimensions, truncated from 3072) via @google/generative-ai SDK.
 * text-embedding-004 was deprecated — gemini-embedding-001 is the replacement.
 * Free tier available. No additional npm dependencies needed.
 */

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;

let _genAI = null;

function getGenAI() {
  if (!_genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for embeddings');
    }
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

/**
 * Get embedding for a single text string
 * @param {string} text
 * @returns {Promise<number[]>} - 768-dimensional embedding vector
 */
async function getEmbedding(text) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: EMBEDDING_DIMENSIONS,
  });
  return result.embedding.values;
}

/**
 * Get embeddings for multiple texts (batched)
 * @param {string[]} texts
 * @returns {Promise<number[][]>} - Array of 768-dimensional embedding vectors
 */
async function getEmbeddings(texts) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const result = await model.batchEmbedContents({
    requests: texts.map(text => ({
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    })),
  });

  return result.embeddings.map(e => e.values);
}

/**
 * Format embedding array for pgvector insertion
 * @param {number[]} embedding
 * @returns {string} - PostgreSQL vector literal: '[0.1,0.2,...]'
 */
function toPgVector(embedding) {
  return `[${embedding.join(',')}]`;
}

module.exports = { getEmbedding, getEmbeddings, toPgVector, EMBEDDING_DIMENSIONS };
