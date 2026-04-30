/**
 * services/medicalQueryAnswer.js — Phase C.2
 *
 * RAG-backed draft generator for doctor scientific queries. Reuses the
 * existing knowledgeSearch hybrid retriever (FTS + pgvector + RRF) to find
 * relevant chunks, then asks the LLM to draft a citation-tagged answer.
 *
 * Fire-and-forget hook from /api/medical-queries POST: stamps
 * ai_draft_answer + ai_draft_citations + ai_drafted_at on the row. Never
 * throws to caller; failures are logged and the row simply has no draft
 * (the reviewer can re-trigger via PATCH).
 */

const db = require('../config/db');
const { searchKnowledge } = require('./knowledgeSearch');
const { getLLMService } = require('./llm');
const { buildMedicalQueryAnswerMessages } = require('../prompts/medicalQueryAnswer');

async function draftAnswerForQuery(queryRow) {
  try {
    if (!queryRow || !queryRow.question) return null;

    // Retrieve the top-k relevant chunks from the medical knowledge base.
    // We pass productId only when the query is product-scoped — otherwise
    // the RAG pipeline searches across all products in the org.
    const productFilter = queryRow.product ? null : null; // product is a string here, not an id; rely on text match
    const chunks = await searchKnowledge(queryRow.question, queryRow.org_id, productFilter, { limit: 6 });

    // searchKnowledge returns rows; normalise the shape we hand to the LLM.
    const ragChunks = (chunks || []).map(c => ({
      id: c.chunk_id || c.id,
      source_doc_id: c.document_id || c.drug_knowledge_id || c.id,
      document_title: c.document_title || c.title,
      snippet: c.chunk_text || c.snippet || c.text,
      score: c.rrf_score || c.score || c.fts_rank,
    })).filter(c => c.snippet);

    const messages = buildMedicalQueryAnswerMessages(queryRow, ragChunks);
    const llm = getLLMService();
    const result = await llm.chat(messages, { requireJson: true });

    if (!result || typeof result !== 'object' || !result.answer) {
      console.warn(`[MedQuery] LLM returned no usable draft for query ${queryRow.id}`);
      return null;
    }

    await db.query(
      `UPDATE medical_queries
       SET ai_draft_answer = $1, ai_draft_citations = $2, ai_drafted_at = NOW()
       WHERE id = $3 AND org_id = $4`,
      [result.answer, JSON.stringify(result.citations || []), queryRow.id, queryRow.org_id]
    );

    console.log(`[MedQuery] AI draft persisted for query ${queryRow.id} (confidence=${result.confidence})`);
    return result;
  } catch (err) {
    console.error(`[MedQuery] draft error for query ${queryRow?.id}:`, err.message);
    return null;
  }
}

module.exports = { draftAnswerForQuery };
