/**
 * Post-Call Extraction Prompt Builder
 *
 * Takes a raw transcript or call summary from an MR and extracts
 * structured data for the DCR form.
 */

function buildPostCallExtractionMessages(transcript, doctorName, productList) {
  const productContext = productList && productList.length > 0
    ? `Available products in our portfolio: ${productList.map(p => p.name).join(', ')}`
    : '';

  return [
    {
      role: 'system',
      content: `You are a pharmaceutical call report extraction assistant. Your job is to extract structured data from a medical representative's call notes or voice transcript.

Extract all relevant information and return it as JSON with the following structure:
{
  "products_detailed": ["Product Name 1", "Product Name 2"],
  "primary_product": "The main product discussed",
  "samples_dropped": [{"name": "Product Name", "quantity": 2}],
  "doctor_feedback": "Summary of what the doctor said or felt",
  "sentiment": "positive|neutral|negative",
  "call_summary": "A clean, structured 2-3 sentence summary of the visit",
  "follow_up_tasks": [{"task": "Description of follow-up", "due_days": 7}],
  "competitor_mentions": [{"company": "Company", "drug": "Drug name", "context": "What was said"}],
  "key_objections": ["Any objections or concerns raised by the doctor"],
  "edetailing": {"presented": true/false, "topics": ["topic1"]}
}

Rules:
1. Extract only what is explicitly mentioned — do not invent information.
2. If a field has no relevant data, use null or empty array.
3. For samples, try to match product names to the known portfolio.
4. For follow-up tasks, estimate reasonable due dates (due_days from today).
5. Sentiment should reflect the doctor's overall receptiveness.
${productContext}`
    },
    {
      role: 'user',
      content: `Doctor: ${doctorName}\n\nCall Transcript/Notes:\n${transcript}`
    }
  ];
}

module.exports = { buildPostCallExtractionMessages };
