/**
 * Adverse Event Detection Prompt Builder
 *
 * Analyzes DCR call notes and doctor feedback for potential adverse events.
 * This is a critical safety feature — errs on the side of flagging.
 */

function buildAEDetectionMessages(dcrRow) {
  const callText = [
    dcrRow.call_summary && `Call Summary: ${dcrRow.call_summary}`,
    dcrRow.doctor_feedback && `Doctor Feedback: ${dcrRow.doctor_feedback}`,
  ].filter(Boolean).join('\n');

  return [
    {
      role: 'system',
      content: `You are a pharmacovigilance screening assistant. Your job is to analyze pharmaceutical field call notes for potential Adverse Events (AEs).

An Adverse Event is any undesirable medical occurrence in a patient taking a pharmaceutical product, whether or not it is related to the treatment. This includes:
- Side effects or unexpected reactions
- Lack of efficacy when specifically described with patient details
- Medication errors
- Product quality complaints affecting patients
- Overdose situations
- Off-label use with negative outcomes

IMPORTANT: Err on the side of caution. If there is ANY mention of a patient experiencing negative health effects while on one of our products, flag it.

Analyze the following call notes and return JSON:
{
  "ae_detected": true/false,
  "events": [
    {
      "drug": "Product name involved",
      "symptoms": ["symptom1", "symptom2"],
      "severity": "mild|moderate|severe|critical",
      "patient_info": {
        "age_range": "estimated age range if mentioned",
        "gender": "if mentioned",
        "duration_on_drug": "if mentioned"
      },
      "timeline": "When symptoms occurred relative to drug use",
      "verbatim_quote": "The exact phrase from the notes that triggered this flag"
    }
  ],
  "reasoning": "Brief explanation of why this was/wasn't flagged"
}

If no adverse event is detected, return: {"ae_detected": false, "events": [], "reasoning": "explanation"}
Use simple, everyday English in all output text — the reader is a field rep, not a pharmacovigilance specialist.`
    },
    {
      role: 'user',
      content: `Product discussed: ${dcrRow.product}\nDoctor: ${dcrRow.name}\nDate: ${dcrRow.date}\n\n${callText}`
    }
  ];
}

module.exports = { buildAEDetectionMessages };
