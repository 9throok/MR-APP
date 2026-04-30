/**
 * Medical Query Auto-Answer Prompt Builder — Phase C.2
 *
 * Given a doctor's scientific question + RAG-retrieved knowledge chunks,
 * drafts a structured answer with inline citations. The output is a *draft*:
 * a medical reviewer must approve before it's sent to the doctor.
 *
 * The reviewer is the gate. The model is told to be conservative — refuse
 * to answer if the retrieved evidence doesn't cover the question, rather
 * than confabulating.
 */

function buildMedicalQueryAnswerMessages(query, ragChunks) {
  // ragChunks shape: [{ id, source_doc_id, document_title, snippet, score }]
  const evidence = (ragChunks || []).map((c, i) =>
    `[${i + 1}] (doc#${c.source_doc_id} — ${c.document_title || 'Untitled'}, score ${c.score?.toFixed?.(3) || '?'})\n${c.snippet}`
  ).join('\n\n');

  return [
    {
      role: 'system',
      content: `You are a medical affairs assistant drafting a response to a clinician's scientific question. A medical reviewer (pharmacist or physician) will review your draft before sending — you are NOT the final voice. Your job is to produce a faithful, citation-backed first draft that saves the reviewer time.

Strict rules:
1. Use ONLY the evidence provided below. Do not draw on outside knowledge.
2. Every factual claim must be tagged with an inline citation marker like [1], [2], etc. matching the evidence numbering.
3. If the evidence does not cover the question (or covers it only partially), say so explicitly. The reviewer can then decide whether to escalate or send a "not-currently-known" reply.
4. Do NOT invent dosing, contraindications, efficacy figures, or trial citations beyond what the evidence states.
5. Keep it concise: 3-6 sentences, plain English. The doctor wants a useful answer, not a re-derivation of the literature.

Return strict JSON:
{
  "answer": "Drafted answer with inline [1] [2] citation markers.",
  "confidence": "high" | "medium" | "low",
  "evidence_sufficient": true | false,
  "citations": [
    {"marker": 1, "source_doc_id": <int>, "snippet": "verbatim phrase from the evidence used"},
    ...
  ],
  "caveats": "Brief note for the reviewer about what's uncertain or missing — e.g. 'Evidence is from preclinical study; no human dosing data found.'"
}

If no evidence at all is provided, return:
{ "answer": "Insufficient evidence in our knowledge base to draft a response.", "confidence": "low", "evidence_sufficient": false, "citations": [], "caveats": "No matching documents in RAG retrieval." }`
    },
    {
      role: 'user',
      content: `Doctor: ${query.doctor_name}
Product: ${query.product || '(not specified)'}
Category: ${query.category || '(uncategorised)'}
Urgency: ${query.urgency}

Question:
${query.question}

Evidence retrieved from the medical knowledge base:
${evidence || '(no evidence retrieved)'}`
    }
  ];
}

module.exports = { buildMedicalQueryAnswerMessages };
