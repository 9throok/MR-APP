/**
 * Next Best Action Prompt Builder
 *
 * Generates a prioritized daily visit plan for an MR based on
 * visit history, doctor profiles, pending tasks, and territory data.
 */

function buildNextBestActionMessages(userId, doctorProfiles, visitHistory, pendingTasks, dayOfWeek) {
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

  return [
    {
      role: 'system',
      content: `You are an AI field sales optimizer for pharmaceutical medical representatives. Generate a prioritized daily visit plan.

Consider these factors when ranking:
1. **Urgency**: Doctors not visited recently (higher days since last visit = higher priority)
2. **Tier**: A-tier doctors are highest value, followed by B, then C
3. **Pending tasks**: Doctors with overdue follow-ups should be prioritized
4. **Day preference**: If a doctor prefers a specific day, boost them on that day
5. **Coverage balance**: Ensure territory coverage isn't lopsided
6. **Product rotation**: Recommend different products if the same one was detailed repeatedly

Return JSON:
{
  "recommendations": [
    {
      "rank": 1,
      "doctor": "Dr. Name",
      "specialty": "Specialty",
      "tier": "A|B|C",
      "priority": "high|medium|low",
      "reason": "Why this doctor should be visited today",
      "talking_points": ["Point 1 to discuss", "Point 2"],
      "products_to_detail": ["Product1"],
      "pending_tasks": ["Any relevant pending follow-ups"],
      "best_time": "Suggested time if known"
    }
  ],
  "territory_insight": "1-2 sentence insight about overall territory health",
  "total_recommended": 5
}

Recommend 5-8 doctors maximum. Quality over quantity.`
    },
    {
      role: 'user',
      content: `MR: ${userId}\nToday: ${dayOfWeek}\n\nDOCTOR PROFILES:\n${doctorContext}\n\nVISIT HISTORY:\n${visitContext}\n\nPENDING FOLLOW-UP TASKS:\n${taskContext}`
    }
  ];
}

module.exports = { buildNextBestActionMessages };
