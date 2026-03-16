/**
 * Rechunk Script
 *
 * One-time migration script that reads all existing drug_knowledge rows,
 * chunks them, computes embeddings, and populates knowledge_chunks.
 *
 * Usage: node backend/scripts/rechunk.js
 *
 * Safe to run multiple times — clears existing chunks first.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const db = require('../config/db');
const { chunkDocument } = require('../services/chunker');
const { getEmbeddings, toPgVector } = require('../services/embeddings');

const BATCH_SIZE = 10; // Embeddings per batch (Gemini free tier rate limits)

async function rechunk() {
  console.log('=== Rechunk Migration Script ===\n');

  // Ensure knowledge_chunks table exists
  try {
    await db.query('SELECT 1 FROM knowledge_chunks LIMIT 0');
  } catch {
    console.error('knowledge_chunks table does not exist. Run migration_v3_rag.sql first.');
    process.exit(1);
  }

  // Clear existing chunks
  const { rowCount: deleted } = await db.query('DELETE FROM knowledge_chunks');
  console.log(`Cleared ${deleted} existing chunks.\n`);

  // Get all knowledge entries with product names
  const { rows: documents } = await db.query(
    `SELECT dk.id, dk.product_id, dk.filename, dk.content, dk.category,
            p.name AS product_name
     FROM drug_knowledge dk
     LEFT JOIN products p ON dk.product_id = p.id
     ORDER BY dk.id`
  );

  console.log(`Found ${documents.length} documents to process.\n`);

  let totalChunks = 0;
  let totalEmbedded = 0;

  for (const doc of documents) {
    console.log(`Processing: ${doc.filename} (product: ${doc.product_name || 'N/A'})...`);

    // Chunk the document
    const chunks = chunkDocument(doc.content, { productName: doc.product_name });
    console.log(`  → ${chunks.length} chunks created`);

    // Compute embeddings in batches
    const chunkTexts = chunks.map(c => c.content);
    let allEmbeddings = [];

    try {
      for (let i = 0; i < chunkTexts.length; i += BATCH_SIZE) {
        const batch = chunkTexts.slice(i, i + BATCH_SIZE);
        const embeddings = await getEmbeddings(batch);
        allEmbeddings.push(...embeddings);

        // Small delay between batches to respect rate limits
        if (i + BATCH_SIZE < chunkTexts.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      console.log(`  → ${allEmbeddings.length} embeddings computed`);
      totalEmbedded += allEmbeddings.length;
    } catch (err) {
      console.warn(`  ⚠ Embedding failed: ${err.message}. Storing chunks without embeddings.`);
      allEmbeddings = [];
    }

    // Insert chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = allEmbeddings[i] ? toPgVector(allEmbeddings[i]) : null;

      await db.query(
        `INSERT INTO knowledge_chunks (knowledge_id, product_id, chunk_index, content, token_count, metadata, tags, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)`,
        [
          doc.id, doc.product_id, chunk.chunkIndex, chunk.content,
          chunk.tokenCount, JSON.stringify(chunk.metadata), chunk.tags,
          embedding
        ]
      );
    }

    totalChunks += chunks.length;
    console.log(`  ✓ Inserted ${chunks.length} chunks\n`);
  }

  console.log('=== Summary ===');
  console.log(`Documents processed: ${documents.length}`);
  console.log(`Total chunks created: ${totalChunks}`);
  console.log(`Total embeddings computed: ${totalEmbedded}`);
  console.log('\nDone!');

  process.exit(0);
}

rechunk().catch(err => {
  console.error('Rechunk failed:', err);
  process.exit(1);
});
