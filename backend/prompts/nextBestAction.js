/**
 * Next Best Action Prompt Builder
 *
 * Generates a prioritized daily visit plan for an MR based on
 * visit history, doctor profiles, pending tasks, pharmacy profiles, and territory data.
 */

function buildNextBestActionMessages(userId, doctorProfiles, visitHistory, pendingTasks, dayOfWeek, pharmacyProfiles, pharmacyVisitHistory) {
  const doctorContext = doctorProfiles.map(d =>
    `- ${d.name} | Specialty: ${d.specialty || 'N/A'} | Tier: ${d.tier} | Territory: ${d.territory || 'N/A'} | Preferred day: ${d.preferred_visit_day || 'Any'} | Hospital: ${d.hospital || 'N/A'}`
  ).join('\n');

  const visitContext = visitHistory.map(v =>
    `- ${v.doctorName}: Last visit ${v.lastVisitDate || 'never'} (${v.daysSinceLastVisit || '?'} days ago), ${v.totalVisits} total visits, Products: ${v.products || 'N/A'}`
  ).join('\n');

  const taskContext = pendingTasks.length > 0
    ? pendingTasks.map(t =>
        `- [${t.doctor_name}] ${t.task} (due: ${t.due_date || 'no date'})`
      ).join('\n')
    : 'No pending follow-up tasks.';

  const pharmacyContext = (pharmacyProfiles && pharmacyProfiles.length > 0)
    ? pharmacyProfiles.map(p =>
        `- ${p.name} | Type: ${p.type || 'retail'} | Tier: ${p.tier} | Territory: ${p.territory || 'N/A'} | Preferred day: ${p.preferred_visit_day || 'Any'} | Contact: ${p.contact_person || 'N/A'}`
      ).join('\n')
    : 'No pharmacy profiles available.';

  const pharmacyVisitContext = (pharmacyVisitHistory && pharmacyVisitHistory.length > 0)
    ? pharmacyVisitHistory.map(v =>
        `- ${v.pharmacy}: Last RCPA audit ${v.lastVisitDate || 'never'} (${v.daysSinceLastVisit || '?'} days ago), ${v.totalVisits} total audits`
      ).join('\n')
    : 'No pharmacy visit history.';

  return [
    {
      role: 'system',
      content: `You are an AI field sales optimizer for pharmaceutical medical representatives. Generate a prioritized daily visit plan that includes both doctor visits and pharmacy visits.

Consider these factors when ranking:
1. **Urgency**: Doctors/pharmacies not visited recently (higher days since last visit = higher priority)
2. **Tier**: A-tier are highest value, followed by B, then C
3. **Pending tasks**: Doctors with overdue follow-ups should be prioritized
4. **Day preference**: If a doctor/pharmacy prefers a specific day, boost them on that day
5. **Coverage balance**: Ensure territory coverage isn't lopsided
6. **Product rotation**: Recommend different products if the same one was detailed repeatedly
7. **Pharmacy RCPA audits**: Include 1-3 pharmacy visits for prescription auditing, order collection, and relationship building

Return JSON:
{
  "recommendations": [
    {
      "rank": 1,
      "doctor": "Dr. Name or Pharmacy Name",
      "type": "doctor",
      "specialty": "Specialty (for doctors) or pharmacy type (for pharmacies)",
      "tier": "A|B|C",
      "priority": "high|medium|low",
      "reason": "Why this visit should happen today",
      "talking_points": ["Point 1 to discuss", "Point 2"],
      "products_to_detail": ["Product1"],
      "pending_tasks": ["Any relevant pending follow-ups"],
      "best_time": "Suggested time if known"
    }
  ],
  "territory_insight": "1-2 sentence insight about overall territory health",
  "total_recommended": 7
}

IMPORTANT:
- The "type" field MUST be either "doctor" or "pharmacy" for each recommendation.
- Include 5-8 doctor visits and 1-3 pharmacy visits.
- Interleave pharmacy visits between doctor visits at logical times (e.g., midday, end of day).
- For pharmacies, talking_points should focus on: RCPA audit updates, order status, stock availability, competitor shelf presence.
- Write in simple, everyday English — short sentences, no jargon. The reader is a field sales rep planning their day.`
    },
    {
      role: 'user',
      content: `MR: ${userId}\nToday: ${dayOfWeek}\n\nDOCTOR PROFILES:\n${doctorContext}\n\nDOCTOR VISIT HISTORY:\n${visitContext}\n\nPENDING FOLLOW-UP TASKS:\n${taskContext}\n\nPHARMACY PROFILES:\n${pharmacyContext}\n\nPHARMACY VISIT HISTORY:\n${pharmacyVisitContext}`
    }
  ];
}

module.exports = { buildNextBestActionMessages };
