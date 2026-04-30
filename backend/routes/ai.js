const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getLLMService } = require('../services/llm');
const { buildPreCallBriefingMessages } = require('../prompts/preCallBriefing');
const { buildTerritoryGapMessages, buildTeamTerritoryGapMessages } = require('../prompts/territoryGap');
const { buildManagerQueryMessages } = require('../prompts/managerQuery');
const { buildProductSignalsMessages } = require('../prompts/productSignals');
const { buildPostCallExtractionMessages } = require('../prompts/postCallExtraction');
const { buildNextBestActionMessages } = require('../prompts/nextBestAction');
const { buildCompetitorIntelMessages } = require('../prompts/competitorIntel');
const { buildContentRecommenderMessages } = require('../prompts/contentRecommender');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/precall-briefing
//
// Body: { user_id, doctor_name }
//
// Fetches all DCRs this MR has filed for the specified doctor,
// then asks the LLM to generate a concise pre-call briefing.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/precall-briefing', async (req, res) => {
  try {
    const { user_id, doctor_name } = req.body;

    if (!user_id || !doctor_name) {
      return res.status(400).json({ error: 'user_id and doctor_name are required' });
    }

    // Extract last name for fuzzy matching — DCR stores short names like "Dr. Kapoor"
    // but NBA may generate full names like "Dr. Rajesh Kapoor"
    const nameParts = doctor_name.trim().split(/\s+/);
    const lastName = nameParts[nameParts.length - 1];
    // Try exact match first, then fall back to last-name match
    let { rows: dcrHistory } = await db.query(
      `SELECT date, visit_time, product, samples, call_summary, doctor_feedback, edetailing
       FROM dcr
       WHERE org_id = $1 AND user_id = $2 AND name ILIKE $3
       ORDER BY date DESC
       LIMIT 10`,
      [req.org_id, user_id, doctor_name]
    );
    if (dcrHistory.length === 0 && nameParts.length > 1) {
      ({ rows: dcrHistory } = await db.query(
        `SELECT date, visit_time, product, samples, call_summary, doctor_feedback, edetailing
         FROM dcr
         WHERE org_id = $1 AND user_id = $2 AND name ILIKE $3
         ORDER BY date DESC
         LIMIT 10`,
        [req.org_id, user_id, `%${lastName}%`]
      ));
    }

    const llm = getLLMService();
    const messages = buildPreCallBriefingMessages(doctor_name, dcrHistory);
    const briefing = await llm.chat(messages, { requireJson: true });

    res.status(200).json({
      success: true,
      doctor: doctor_name,
      visitsAnalysed: dcrHistory.length,
      briefing,
    });

  } catch (err) {
    console.error('[AI] precall-briefing error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/pharmacy-briefing
//
// Body: { user_id, pharmacy_name }
//
// Fetches RCPA data for this pharmacy and generates a pre-visit briefing.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/pharmacy-briefing', async (req, res) => {
  try {
    const { user_id, pharmacy_name } = req.body;
    if (!user_id || !pharmacy_name) {
      return res.status(400).json({ error: 'user_id and pharmacy_name are required' });
    }

    // Fuzzy match pharmacy name
    const nameParts = pharmacy_name.trim().split(/\s+/);
    const keyword = nameParts[0]; // e.g. "CVS", "Walgreens", "Rite"

    const { rows: rcpaHistory } = await db.query(
      `SELECT pharmacy, doctor_name, our_brand, our_value, competitor_brand, competitor_company, competitor_value, date
       FROM rcpa
       WHERE org_id = $1 AND user_id = $2 AND pharmacy ILIKE $3
       ORDER BY date DESC
       LIMIT 20`,
      [req.org_id, user_id, `%${keyword}%`]
    );

    // Get pharmacy profile if available (org-scoped)
    let pharmacyProfile = null;
    try {
      const { rows } = await db.query(
        'SELECT * FROM pharmacy_profiles WHERE org_id = $1 AND name ILIKE $2 LIMIT 1',
        [req.org_id, `%${keyword}%`]
      );
      if (rows.length > 0) pharmacyProfile = rows[0];
    } catch { /* table may not exist */ }

    const profileText = pharmacyProfile
      ? `Pharmacy Profile: ${pharmacyProfile.name} | Type: ${pharmacyProfile.type} | Tier: ${pharmacyProfile.tier} | Territory: ${pharmacyProfile.territory} | Contact: ${pharmacyProfile.contact_person || 'N/A'} | Preferred visit day: ${pharmacyProfile.preferred_visit_day || 'Any'}`
      : 'No pharmacy profile available.';

    const rcpaText = rcpaHistory.length === 0
      ? 'No RCPA audit history for this pharmacy.'
      : rcpaHistory.map((r, i) => {
          return `Audit ${i + 1} — Date: ${r.date}\n  Doctor: ${r.doctor_name || 'N/A'}\n  Our Brand: ${r.our_brand} (₹${r.our_value})\n  Competitor: ${r.competitor_brand} by ${r.competitor_company || 'N/A'} (₹${r.competitor_value})`;
        }).join('\n\n');

    const llm = getLLMService();
    const messages = [
      {
        role: 'system',
        content: `You are an expert pharmaceutical sales coach. Your job is to prepare Medical Representatives (MRs) for pharmacy visits.
Analyse the RCPA audit history and pharmacy profile to generate a concise pre-visit briefing.
Always respond with valid JSON only — no markdown, no explanation outside JSON.`
      },
      {
        role: 'user',
        content: `Prepare a pre-visit briefing for an upcoming visit to ${pharmacy_name}.

${profileText}

RCPA AUDIT HISTORY (most recent first):
${rcpaText}

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of relationship and prescription trends at this pharmacy",
  "lastVisit": "One sentence on what the last audit revealed",
  "pendingItems": ["item1", "item2"],
  "talkingPoints": ["point1", "point2", "point3"],
  "watchOut": ["concern1", "concern2"]
}

Rules:
- summary: highlight our brand performance vs competitors at this pharmacy
- lastVisit: mention date, key findings from the most recent RCPA audit
- pendingItems: stock issues, order follow-ups, or prescription gaps to address
- talkingPoints: 2-4 specific discussion items (RCPA trends, competitor shelf presence, order placement, new product introduction)
- watchOut: competitor dominance areas, pricing concerns, or stock-out risks
- Keep each item to 1-2 sentences max`
      }
    ];
    const briefing = await llm.chat(messages, { requireJson: true });

    res.status(200).json({
      success: true,
      pharmacy: pharmacy_name,
      auditsAnalysed: rcpaHistory.length,
      briefing,
    });
  } catch (err) {
    console.error('[AI] pharmacy-briefing error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/territory-gap-team
//
// Query params: threshold_days (optional, default 30), mr_user_id (optional, filter to one MR)
//
// Manager/admin endpoint: aggregates DCR data across all MRs,
// then asks the LLM to identify team-wide coverage gaps.
// NOTE: Must be defined BEFORE /territory-gap/:user_id to avoid param capture.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/territory-gap-team', async (req, res) => {
  try {
    const thresholdDays = parseInt(req.query.threshold_days || '30', 10);
    const mrFilter = req.query.mr_user_id || null;

    // Get all MRs (or a specific one) — scoped to current org
    let mrQuery = `SELECT user_id, name FROM users WHERE role = 'mr' AND org_id = $1`;
    const mrParams = [req.org_id];
    if (mrFilter) {
      mrParams.push(mrFilter);
      mrQuery += ` AND user_id = $${mrParams.length}`;
    }
    const { rows: mrs } = await db.query(mrQuery, mrParams);

    if (mrs.length === 0) {
      return res.status(200).json({ success: true, message: 'No MRs found', analysis: null, mrs: [] });
    }

    const mrUserIds = mrs.map(m => m.user_id);

    // Aggregate DCR data across all MRs (org-scoped)
    const { rows: doctorStats } = await db.query(
      `SELECT
         d.name                                AS "doctorName",
         u.name                                AS "mrName",
         d.user_id                             AS "mrUserId",
         MAX(d.date)::text                     AS "lastVisitDate",
         COUNT(*)::int                         AS "totalVisits",
         (CURRENT_DATE - MAX(d.date))::int     AS "daysSinceLastVisit"
       FROM dcr d
       JOIN users u ON u.user_id = d.user_id AND u.org_id = d.org_id
       WHERE d.org_id = $1 AND d.user_id = ANY($2)
       GROUP BY d.name, u.name, d.user_id
       ORDER BY "daysSinceLastVisit" DESC`,
      [req.org_id, mrUserIds]
    );

    if (doctorStats.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No DCR data found for any MR',
        analysis: null,
        mrs: mrs.map(m => ({ user_id: m.user_id, name: m.name })),
      });
    }

    const llm = getLLMService();
    const messages = buildTeamTerritoryGapMessages(doctorStats, thresholdDays);
    const analysis = await llm.chat(messages, { requireJson: true });

    res.status(200).json({
      success: true,
      thresholdDays,
      totalDoctors: doctorStats.length,
      mrs: mrs.map(m => ({ user_id: m.user_id, name: m.name })),
      analysis,
    });

  } catch (err) {
    console.error('[AI] territory-gap-team error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/territory-gap/:user_id
//
// Query params: threshold_days (optional, default 30)
//
// Fetches all DCRs for this MR, groups by doctor, computes days-since-last-visit,
// then asks the LLM to identify coverage gaps and prioritise follow-ups.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/territory-gap/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const thresholdDays = parseInt(req.query.threshold_days || '30', 10);

    // Aggregate per doctor in SQL — last visit, total visits, days since last visit
    const { rows: doctorStats } = await db.query(
      `SELECT
         name                                                    AS "doctorName",
         MAX(date)::text                                         AS "lastVisitDate",
         COUNT(*)::int                                           AS "totalVisits",
         (CURRENT_DATE - MAX(date))::int                        AS "daysSinceLastVisit"
       FROM dcr
       WHERE org_id = $1 AND user_id = $2
       GROUP BY name
       ORDER BY "daysSinceLastVisit" DESC`,
      [req.org_id, user_id]
    );

    if (doctorStats.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No DCR data found for this MR',
        analysis: null,
      });
    }

    const llm = getLLMService();
    const messages = buildTerritoryGapMessages(user_id, doctorStats, thresholdDays);
    const analysis = await llm.chat(messages, { requireJson: true });

    res.status(200).json({
      success: true,
      user_id,
      thresholdDays,
      totalDoctors: doctorStats.length,
      analysis,
    });

  } catch (err) {
    console.error('[AI] territory-gap error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/manager-query
//
// Body: { query, user_ids (optional array), from_date (optional), to_date (optional) }
//
// Fetches DCRs for the given MR user_ids over the date range,
// then answers the manager's free-text question using that data.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/manager-query', async (req, res) => {
  try {
    const { query, user_ids, from_date, to_date } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'query is required' });
    }

    // Build dynamic SQL with optional filters (always scoped to current org)
    const conditions = ['org_id = $1'];
    const params = [req.org_id];

    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      params.push(user_ids);
      conditions.push(`user_id = ANY($${params.length})`);
    }
    if (from_date) {
      params.push(from_date);
      conditions.push(`date >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`date <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows: teamData } = await db.query(
      `SELECT user_id, name, date, visit_time, product, samples, call_summary, doctor_feedback, edetailing
       FROM dcr
       ${where}
       ORDER BY date DESC
       LIMIT 300`,
      params
    );

    // Build MR list from distinct user_ids in result
    const mrList = [...new Set(teamData.map(d => d.user_id))]
      .map(id => ({ user_id: id, name: id }));

    const llm = getLLMService();
    const messages = buildManagerQueryMessages(query.trim(), teamData, mrList);
    const result = await llm.chat(messages, { requireJson: true });

    res.status(200).json({
      success: true,
      query,
      recordsAnalysed: teamData.length,
      result,
    });

  } catch (err) {
    console.error('[AI] manager-query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/product-signals
//
// Query params: from_date (optional), to_date (optional), user_ids (optional CSV)
//
// Aggregates product-level stats from DCRs and asks the LLM to surface
// performance signals — what's working, what isn't.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/product-signals', async (req, res) => {
  try {
    const { from_date, to_date, user_ids, products } = req.query;

    const conditions = ['org_id = $1'];
    const params = [req.org_id];

    if (from_date) {
      params.push(from_date);
      conditions.push(`date >= $${params.length}`);
    }
    if (to_date) {
      params.push(to_date);
      conditions.push(`date <= $${params.length}`);
    }
    if (user_ids) {
      const ids = user_ids.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        params.push(ids);
        conditions.push(`user_id = ANY($${params.length})`);
      }
    }
    if (products) {
      const prods = products.split(',').map(s => s.trim()).filter(Boolean);
      if (prods.length > 0) {
        params.push(prods);
        conditions.push(`product = ANY($${params.length})`);
      }
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    // Aggregate all product stats in one SQL query
    const { rows: productStats } = await db.query(
      `SELECT
         product,
         COUNT(*)::int                                            AS "totalCalls",
         COUNT(*) FILTER (WHERE samples IS NOT NULL AND jsonb_typeof(samples) = 'array' AND jsonb_array_length(samples) > 0)::int AS "callsWithSamples",
         COUNT(DISTINCT name)::int                              AS "uniqueDoctors",
         COUNT(DISTINCT user_id)::int                           AS "uniqueMRs"
       FROM dcr
       ${where}
       GROUP BY product
       ORDER BY "totalCalls" DESC`,
      params
    );

    if (productStats.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No DCR data found for the specified filters',
        analysis: null,
      });
    }

    const period = from_date && to_date ? `${from_date} to ${to_date}` : 'all available data';

    const llm = getLLMService();
    const messages = buildProductSignalsMessages(productStats, period);
    const analysis = await llm.chat(messages, { requireJson: true });

    res.status(200).json({
      success: true,
      period,
      productsAnalysed: productStats.length,
      rawStats: productStats,
      analysis,
    });

  } catch (err) {
    console.error('[AI] product-signals error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/post-call-extract
//
// Body: { user_id, doctor_name, transcript }
//
// Extracts structured DCR data from a raw transcript or call notes.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/post-call-extract', async (req, res) => {
  try {
    const { doctor_name, transcript } = req.body;

    if (!doctor_name || !transcript) {
      return res.status(400).json({ error: 'doctor_name and transcript are required' });
    }

    // Fetch product list for context (org-scoped)
    const { rows: products } = await db.query(
      'SELECT name FROM products WHERE org_id = $1 ORDER BY id',
      [req.org_id]
    );

    const llm = getLLMService();
    const messages = buildPostCallExtractionMessages(transcript, doctor_name, products);
    const extraction = await llm.chat(messages, { requireJson: true });

    res.json({ success: true, extraction });
  } catch (err) {
    console.error('[AI] post-call-extract error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/nba/:user_id
//
// Generates (or retrieves cached) Next Best Action recommendations for today.
// Query params: refresh=true (force regeneration)
// ─────────────────────────────────────────────────────────────────────────────
// Normalize LLM NBA response to the expected frontend schema
function normalizeNBAResult(result) {
  // If already in correct format
  if (result?.recommendations && Array.isArray(result.recommendations)) {
    return result;
  }

  // If the LLM used a different key for the visit plan array
  const planArray = result?.recommendations || result?.daily_visit_plan || result?.visit_plan || result?.visits;
  if (Array.isArray(planArray)) {
    return {
      recommendations: planArray.map((item, i) => ({
        rank: item.rank || i + 1,
        doctor: item.doctor || item.doctor_name || item.name || 'Unknown',
        type: item.type || 'doctor',
        specialty: item.specialty || '',
        tier: item.tier || '',
        priority: (item.priority || 'medium').toLowerCase(),
        reason: item.reason || item.reasoning || '',
        talking_points: item.talking_points || item.key_topics || [],
        products_to_detail: item.products_to_detail || item.products || [],
        pending_tasks: item.pending_tasks || [],
        best_time: item.best_time || item.time || '',
      })),
      territory_insight: result.territory_insight || result.summary || '',
      total_recommended: planArray.length,
    };
  }

  // Can't normalize — return null so fallback kicks in
  return null;
}

// Static fallback NBA data for reliable demos
function getStaticNBA(userId) {
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const plans = {
    mr_robert_003: {
      recommendations: [
        { rank: 1, doctor: 'Dr. Pooja Singh', type: 'doctor', specialty: 'Endocrinology', tier: 'A', priority: 'high',
          reason: `Pending task due tomorrow: Follow up on Bevaas 20mg combination therapy results. Last visited 7 days ago — needs urgent attention.`,
          talking_points: ['Bevaas 20mg combination therapy outcomes', 'Review syncope case from previous visit', 'Discuss step-down protocol for stabilized patients'],
          products_to_detail: ['Bevaas 20mg', 'Bevaas 10mg'],
          pending_tasks: ['Follow up on Bevaas 20mg combination therapy results'],
          best_time: '9:30 AM' },
        { rank: 2, doctor: 'Dr. Neha Sharma', type: 'doctor', specialty: 'Neurology', tier: 'B', priority: 'high',
          reason: 'Doctor showed strong interest in Derise 10mg non-sedating profile. Pending task: Share clinical trial brochure. Potential to convert 5 patients from cetirizine.',
          talking_points: ['Derise 10mg ARIA trial data — 38% TSS reduction', 'Drowsiness rate: 0.7% vs cetirizine 3.1%', 'Once-daily dosing compliance advantage'],
          products_to_detail: ['Derise 10mg', 'Derise 20mg'],
          pending_tasks: ['Share Derise 10mg clinical trial brochure'],
          best_time: '11:00 AM' },
        { rank: 3, doctor: 'MedPlus Pharmacy', type: 'pharmacy', specialty: 'Chain Pharmacy', tier: 'A', priority: 'medium',
          reason: 'RCPA audit due — last visit 4 days ago. Strong Derise prescription volume from Dr. Neha Sharma. Check competitor shelf presence.',
          talking_points: ['RCPA audit for Derise and Bevaas range', 'Check Zyrtec and Allegra stock levels', 'Order status and stock availability'],
          products_to_detail: ['Derise 10mg', 'Derise 20mg', 'Bevaas 5mg'],
          pending_tasks: [],
          best_time: '12:30 PM' },
        { rank: 4, doctor: 'Dr. Suresh Kumar', type: 'doctor', specialty: 'Cardiology', tier: 'A', priority: 'medium',
          reason: 'Requested Rilast Tablet vs Capsule comparison data. Good opportunity to position sustained-release capsule for overnight asthma control.',
          talking_points: ['Rilast Tablet (immediate-release) vs Capsule (sustained-release) comparison', 'Capsule advantage for early morning wheeze', 'Rescue inhaler reduction data'],
          products_to_detail: ['Rilast Tablet', 'Rilast Capsule'],
          pending_tasks: ['Send Rilast Tablet vs Capsule comparison chart'],
          best_time: '2:00 PM' },
        { rank: 5, doctor: 'Dr. Amit Gupta', type: 'doctor', specialty: 'General Medicine', tier: 'B', priority: 'medium',
          reason: 'Key doctor with 15+ patients on Bevaas. Pending MSL meeting arrangement. AE report for peripheral edema case needs discussion.',
          talking_points: ['Bevaas 10mg BP reduction: mean 22 mmHg systolic', 'ASCOT trial: 24% CV mortality reduction', 'Edema management with ACE-I combination'],
          products_to_detail: ['Bevaas 10mg', 'Bevaas 5mg'],
          pending_tasks: ['Arrange meeting with MSL for Bevaas 20mg data'],
          best_time: '4:00 PM' },
        { rank: 6, doctor: 'Apollo Pharmacy', type: 'pharmacy', specialty: 'Chain Pharmacy', tier: 'A', priority: 'medium',
          reason: 'Key account for Rilast range. RCPA audit shows high Montair competitor prescriptions — opportunity to push Rilast positioning.',
          talking_points: ['RCPA audit: Rilast vs Montair prescription volumes', 'New order placement for Rilast Capsule', 'Check Deslor competitor stock'],
          products_to_detail: ['Rilast Tablet', 'Rilast Capsule', 'Derise 20mg'],
          pending_tasks: [],
          best_time: '5:00 PM' },
        { rank: 7, doctor: 'Dr. Rakesh Mishra', type: 'doctor', specialty: 'Internal Medicine', tier: 'C', priority: 'low',
          reason: `${dayName} visit to maintain regular cadence. Parents reporting improved breathing with Rilast Syrup. Deliver pending samples.`,
          talking_points: ['Rilast Syrup paediatric dosing for 2-5 age group', 'Parent feedback on nighttime breathing improvement', 'Syrup compliance vs nebulizer advantage'],
          products_to_detail: ['Rilast Syrup'],
          pending_tasks: ['Deliver Rilast Syrup samples for paediatric ward trial'],
          best_time: '5:30 PM' },
      ],
      territory_insight: 'Territory coverage is strong with all 5 doctors visited within the last 10 days. Priority today: close pending follow-ups with Dr. Pooja Singh (Bevaas combination results) and Dr. Neha Sharma (Derise trial brochure). Include RCPA audits at MedPlus Pharmacy and Apollo Pharmacy to track competitor shelf presence.',
      total_recommended: 7,
    },
    mr_rahul_001: {
      recommendations: [
        { rank: 1, doctor: 'Dr. Anil Mehta', type: 'doctor', specialty: 'Cardiology', tier: 'A', priority: 'high',
          reason: 'Pending task: Share ARIA trial data. Doctor willing to trial Derise 10mg in 10 patients — high conversion opportunity.',
          talking_points: ['Derise 10mg non-sedating profile', 'ARIA trial: 38% TSS reduction', '0.7% drowsiness rate vs cetirizine 3.1%'],
          products_to_detail: ['Derise 10mg'], pending_tasks: ['Share ARIA trial data for Derise 10mg'], best_time: '10:00 AM' },
        { rank: 2, doctor: 'Dr. Sunita Verma', type: 'doctor', specialty: 'General Medicine', tier: 'B', priority: 'medium',
          reason: 'Pending Rilast Capsule sample delivery for chronic asthma ward. Good time to discuss sustained-release benefits.',
          talking_points: ['Rilast Capsule sustained-release formulation', 'Overnight bronchodilation advantage', 'Chronic asthma add-on therapy data'],
          products_to_detail: ['Rilast Capsule', 'Rilast Tablet'], pending_tasks: ['Deliver Rilast Capsule samples'], best_time: '12:00 PM' },
        { rank: 3, doctor: 'CVS Pharmacy', type: 'pharmacy', specialty: 'Chain Pharmacy', tier: 'A', priority: 'medium',
          reason: 'High footfall location. RCPA shows strong competitor presence (Zyrtec, Allegra). Audit and check Derise stock levels.',
          talking_points: ['RCPA audit for Dr. Anil Mehta prescriptions', 'Check Derise vs Zyrtec shelf availability', 'New order placement'],
          products_to_detail: ['Derise 10mg', 'Derise 20mg'], pending_tasks: [], best_time: '1:00 PM' },
        { rank: 4, doctor: 'Dr. Ramesh Patil', type: 'doctor', specialty: 'Dermatology', tier: 'B', priority: 'medium',
          reason: 'Pending CME session arrangement. Doctor open to switching to Bevaas if pricing competitive.',
          talking_points: ['Bevaas 5mg for newly diagnosed hypertensives', 'ALLHAT trial equivalence data', 'Competitive pricing discussion'],
          products_to_detail: ['Bevaas 5mg', 'Bevaas 10mg'], pending_tasks: ['Arrange CME session on resistant hypertension'], best_time: '3:00 PM' },
        { rank: 5, doctor: 'Rite Aid', type: 'pharmacy', specialty: 'Retail Pharmacy', tier: 'B', priority: 'low',
          reason: 'Strong Bevaas sales territory. Check stock and competitor presence for Dr. Pradeep Joshi prescriptions.',
          talking_points: ['RCPA audit for Bevaas range', 'Check Amlokind and Stamlo competitor stock', 'Order status'],
          products_to_detail: ['Bevaas 5mg', 'Bevaas 10mg'], pending_tasks: [], best_time: '4:30 PM' },
      ],
      territory_insight: 'Focus on converting Dr. Anil Mehta — highest ROI opportunity with 10 potential patient switches. Include RCPA audits at CVS Pharmacy and Rite Aid to track competitor shelf presence.',
      total_recommended: 5,
    },
  };
  // Default fallback for any user
  return plans[userId] || plans['mr_robert_003'];
}

router.get('/nba/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const refresh = req.query.refresh === 'true';

    // Check for valid cached recommendations (unless refresh requested)
    if (!refresh) {
      const { rows: cached } = await db.query(
        'SELECT * FROM nba_recommendations WHERE org_id = $1 AND user_id = $2 AND date = CURRENT_DATE',
        [req.org_id, user_id]
      );
      if (cached.length > 0) {
        const normalized = normalizeNBAResult(cached[0].recommendations);
        if (normalized && normalized.recommendations?.length > 0) {
          return res.json({
            success: true,
            date: cached[0].date,
            recommendations: normalized,
            cached: true,
          });
        }
        // Bad cache — delete it
        await db.query(
          'DELETE FROM nba_recommendations WHERE org_id = $1 AND user_id = $2 AND date = CURRENT_DATE',
          [req.org_id, user_id]
        );
      }
    }

    // Try LLM generation
    let result = null;
    try {
      // Get the MR's territory so we only recommend their doctors/pharmacies (org-scoped)
      const { rows: userRows } = await db.query(
        'SELECT territory FROM users WHERE org_id = $1 AND user_id = $2',
        [req.org_id, user_id]
      );
      const territory = userRows[0]?.territory;

      const { rows: doctorProfiles } = await db.query(
        territory
          ? 'SELECT * FROM doctor_profiles WHERE org_id = $1 AND territory = $2 ORDER BY tier ASC, name ASC'
          : 'SELECT * FROM doctor_profiles WHERE org_id = $1 ORDER BY tier ASC, name ASC',
        territory ? [req.org_id, territory] : [req.org_id]
      );
      const { rows: visitHistory } = await db.query(
        `SELECT
           name AS "doctorName",
           MAX(date)::text AS "lastVisitDate",
           COUNT(*)::int AS "totalVisits",
           (CURRENT_DATE - MAX(date))::int AS "daysSinceLastVisit",
           STRING_AGG(DISTINCT product, ', ') AS products
         FROM dcr
         WHERE org_id = $1 AND user_id = $2
         GROUP BY name
         ORDER BY "daysSinceLastVisit" DESC NULLS LAST`,
        [req.org_id, user_id]
      );
      const { rows: pendingTasks } = await db.query(
        "SELECT * FROM follow_up_tasks WHERE org_id = $1 AND user_id = $2 AND status = 'pending' ORDER BY due_date ASC NULLS LAST",
        [req.org_id, user_id]
      );

      // Fetch pharmacy profiles and visit history (org-scoped)
      let pharmacyProfiles = [];
      let pharmacyVisitHistory = [];
      try {
        const { rows: pharmacies } = await db.query(
          territory
            ? 'SELECT * FROM pharmacy_profiles WHERE org_id = $1 AND territory = $2 ORDER BY tier ASC, name ASC'
            : 'SELECT * FROM pharmacy_profiles WHERE org_id = $1 ORDER BY tier ASC, name ASC',
          territory ? [req.org_id, territory] : [req.org_id]
        );
        pharmacyProfiles = pharmacies;

        const { rows: pharmacyVisits } = await db.query(
          `SELECT
             pharmacy,
             MAX(date)::text AS "lastVisitDate",
             COUNT(*)::int AS "totalVisits",
             (CURRENT_DATE - MAX(date))::int AS "daysSinceLastVisit"
           FROM rcpa
           WHERE org_id = $1 AND user_id = $2
           GROUP BY pharmacy
           ORDER BY "daysSinceLastVisit" DESC NULLS LAST`,
          [req.org_id, user_id]
        );
        pharmacyVisitHistory = pharmacyVisits;
      } catch (pharmErr) {
        console.log('[AI] nba: pharmacy_profiles table may not exist yet, skipping:', pharmErr.message);
      }

      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const llm = getLLMService();
      const messages = buildNextBestActionMessages(user_id, doctorProfiles, visitHistory, pendingTasks, dayOfWeek, pharmacyProfiles, pharmacyVisitHistory);
      const llmResult = await llm.chat(messages, { requireJson: true });
      result = normalizeNBAResult(llmResult);
    } catch (llmErr) {
      console.error('[AI] nba LLM error, using static fallback:', llmErr.message);
    }

    // Fallback to static data if LLM failed or returned bad format
    if (!result || !result.recommendations?.length) {
      console.log('[AI] nba using static fallback for', user_id);
      result = getStaticNBA(user_id);
    }

    // Cache the result (UNIQUE is per-org now: see migration_v7)
    await db.query(
      `INSERT INTO nba_recommendations (org_id, user_id, date, recommendations)
       VALUES ($1, $2, CURRENT_DATE, $3)
       ON CONFLICT (org_id, user_id, date) DO UPDATE SET recommendations = $3, generated_at = NOW()`,
      [req.org_id, user_id, JSON.stringify(result)]
    );

    res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      recommendations: result,
      cached: false,
    });
  } catch (err) {
    console.error('[AI] nba error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/competitor-intel
//
// Query params: from_date (optional), to_date (optional), user_ids (optional CSV)
//
// Combines DCR call reports (competitor mentions in call_summary/doctor_feedback)
// and RCPA prescription audit data to generate competitor intelligence.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/competitor-intel', async (req, res) => {
  try {
    const { from_date, to_date, user_ids } = req.query;

    // ── Build shared filter conditions (always org-scoped) ───────────
    const dcrConditions = ['org_id = $1'];
    const dcrParams = [req.org_id];
    const rcpaConditions = ['org_id = $1'];
    const rcpaParams = [req.org_id];

    if (from_date) {
      dcrParams.push(from_date);
      dcrConditions.push(`date >= $${dcrParams.length}`);
      rcpaParams.push(from_date);
      rcpaConditions.push(`date >= $${rcpaParams.length}`);
    }
    if (to_date) {
      dcrParams.push(to_date);
      dcrConditions.push(`date <= $${dcrParams.length}`);
      rcpaParams.push(to_date);
      rcpaConditions.push(`date <= $${rcpaParams.length}`);
    }
    if (user_ids) {
      const ids = user_ids.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        dcrParams.push(ids);
        dcrConditions.push(`user_id = ANY($${dcrParams.length})`);
        rcpaParams.push(ids);
        rcpaConditions.push(`user_id = ANY($${rcpaParams.length})`);
      }
    }

    const dcrWhere = `AND ${dcrConditions.join(' AND ')}`;
    const rcpaWhere = `WHERE ${rcpaConditions.join(' AND ')}`;

    // ── Fetch DCR records that mention competitors ────────────────────
    const { rows: dcrMentions } = await db.query(
      `SELECT name, product, date::text, call_summary, doctor_feedback
       FROM dcr
       WHERE (
         call_summary ILIKE '%competitor%' OR call_summary ILIKE '%cipla%' OR
         call_summary ILIKE '%sun pharma%' OR call_summary ILIKE '%glenmark%' OR
         call_summary ILIKE '%mankind%' OR call_summary ILIKE '%abbott%' OR
         call_summary ILIKE '%usv%' OR call_summary ILIKE '%sanofi%' OR
         call_summary ILIKE '%montair%' OR call_summary ILIKE '%singulair%' OR
         call_summary ILIKE '%amtas%' OR call_summary ILIKE '%stamlo%' OR
         call_summary ILIKE '%allegra%' OR call_summary ILIKE '%zyrtec%' OR
         call_summary ILIKE '%amlokind%' OR call_summary ILIKE '%bilastine%' OR
         call_summary ILIKE '%telma%' OR call_summary ILIKE '%hydroxyzine%' OR
         doctor_feedback ILIKE '%competitor%' OR doctor_feedback ILIKE '%cipla%' OR
         doctor_feedback ILIKE '%sun pharma%' OR doctor_feedback ILIKE '%glenmark%' OR
         doctor_feedback ILIKE '%mankind%' OR doctor_feedback ILIKE '%abbott%' OR
         doctor_feedback ILIKE '%usv%' OR doctor_feedback ILIKE '%montair%' OR
         doctor_feedback ILIKE '%bilastine%' OR doctor_feedback ILIKE '%amtas%' OR
         doctor_feedback ILIKE '%stamlo%' OR doctor_feedback ILIKE '%amlokind%' OR
         doctor_feedback ILIKE '%allegra%' OR doctor_feedback ILIKE '%telma%'
       ) ${dcrWhere}
       ORDER BY date DESC
       LIMIT 200`,
      dcrParams
    );

    // ── Fetch RCPA aggregated stats ───────────────────────────────────
    const { rows: rcpaStats } = await db.query(
      `SELECT
         competitor_brand,
         competitor_company,
         our_brand,
         SUM(competitor_value)::numeric AS total_competitor_value,
         SUM(our_value)::numeric AS total_our_value,
         COUNT(DISTINCT pharmacy)::int AS pharmacy_count,
         COUNT(DISTINCT doctor_name)::int AS doctor_count
       FROM rcpa
       ${rcpaWhere}
       GROUP BY competitor_brand, competitor_company, our_brand
       ORDER BY total_competitor_value DESC`,
      rcpaParams
    );

    if (dcrMentions.length === 0 && rcpaStats.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No competitor data found for the specified filters',
        analysis: null,
      });
    }

    const period = from_date && to_date ? `${from_date} to ${to_date}` : 'all available data';

    const llm = getLLMService();
    const messages = buildCompetitorIntelMessages(dcrMentions, rcpaStats, period);
    const analysis = await llm.chat(messages, { requireJson: true });

    res.status(200).json({
      success: true,
      period,
      dcrMentionsCount: dcrMentions.length,
      rcpaRecords: rcpaStats.length,
      analysis,
    });

  } catch (err) {
    console.error('[AI] competitor-intel error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/content-recommender/:user_id
//
// Phase B "CLM NBA": for an MR, look at upcoming planned doctors (from tour
// plans / recent visit cadence), the org's published content library, and the
// MR's recent content_views. Recommend the best detail aid for each upcoming
// doctor visit.
//
// Cached daily per (org, user, date) in content_recommendations. Pass
// ?refresh=true to force regeneration. Cache pattern mirrors NBA exactly.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/content-recommender/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const refresh = req.query.refresh === 'true';

    // Authorisation: MR can only request their own; manager/admin can request any.
    if (req.user.role === 'mr' && req.user.user_id !== user_id) {
      return res.status(403).json({ error: 'MRs can only request their own content recommendations' });
    }

    // 1) Cache check — same daily UNIQUE shape as NBA
    if (!refresh) {
      const { rows: cached } = await db.query(
        `SELECT * FROM content_recommendations
         WHERE org_id = $1 AND user_id = $2 AND date = CURRENT_DATE`,
        [req.org_id, user_id]
      );
      if (cached.length > 0 && cached[0].recommendations) {
        return res.json({
          success: true,
          date: cached[0].date,
          recommendations: cached[0].recommendations,
          cached: true,
        });
      }
    }

    // 2) Gather signals — all org-scoped
    const { rows: userRows } = await db.query(
      'SELECT territory FROM users WHERE org_id = $1 AND user_id = $2',
      [req.org_id, user_id]
    );
    const territory = userRows[0]?.territory || null;

    // Doctors the MR is likely to visit next — recently visited or in territory
    // and overdue. Prefer the recency-and-tier shape NBA already uses, but
    // narrowed to the doctors' identifying fields the recommender needs.
    const { rows: upcomingDoctors } = await db.query(
      `WITH recent AS (
         SELECT name AS doctor_name,
                MAX(date)::text AS last_visit_date,
                STRING_AGG(DISTINCT product, ', ' ORDER BY product) AS products_recent
         FROM dcr
         WHERE org_id = $1 AND user_id = $2
           AND date >= CURRENT_DATE - INTERVAL '60 days'
         GROUP BY name
       )
       SELECT d.name      AS "doctorName",
              d.specialty,
              d.tier,
              r.last_visit_date  AS "lastVisitDate",
              r.products_recent  AS "productsRecentlyDiscussed"
       FROM doctor_profiles d
       LEFT JOIN recent r ON r.doctor_name = d.name
       WHERE d.org_id = $1
         AND ($3::text IS NULL OR d.territory = $3)
       ORDER BY
         CASE d.tier WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END,
         r.last_visit_date NULLS FIRST
       LIMIT 30`,
      [req.org_id, user_id, territory]
    );

    // Published assets in the library — only versions in `published` status are
    // promotable. Filter to those distributed to this MR or to 'all'.
    const { rows: publishedAssets } = await db.query(
      `SELECT a.id,
              a.title,
              a.asset_type,
              a.therapeutic_area,
              a.description,
              p.name AS product_name
       FROM content_assets a
       LEFT JOIN products p ON p.id = a.product_id AND p.org_id = a.org_id
       WHERE a.org_id = $1
         AND a.current_version_id IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM content_versions v
           WHERE v.id = a.current_version_id AND v.org_id = a.org_id AND v.status = 'published'
             AND EXISTS (
               SELECT 1 FROM content_distributions dist
               WHERE dist.version_id = v.id AND dist.org_id = v.org_id
                 AND (
                      dist.target_type = 'all'
                   OR (dist.target_type = 'mr'        AND dist.target_id = $2)
                   OR (dist.target_type = 'territory' AND dist.target_id = $3)
                   OR (dist.target_type = 'role'      AND dist.target_id = 'mr')
                 )
             )
         )
       ORDER BY a.updated_at DESC
       LIMIT 50`,
      [req.org_id, user_id, territory || '']
    );

    // Recent views by this MR — context for "doctor already seen this asset"
    const { rows: recentViews } = await db.query(
      `SELECT a.title AS "assetTitle",
              d.name  AS "doctorName",
              ROUND(SUM(cv.duration_seconds)::numeric, 1) AS "totalSeconds",
              COUNT(*)::int AS "slideCount",
              MAX(cv.viewed_at)::text AS "viewedAt"
       FROM content_views cv
       JOIN content_versions v ON v.id = cv.version_id AND v.org_id = cv.org_id
       JOIN content_assets a   ON a.id = v.asset_id   AND a.org_id = v.org_id
       LEFT JOIN doctor_profiles d ON d.id = cv.doctor_id AND d.org_id = cv.org_id
       WHERE cv.org_id = $1 AND cv.user_id = $2
         AND cv.viewed_at >= NOW() - INTERVAL '30 days'
       GROUP BY a.title, d.name
       ORDER BY MAX(cv.viewed_at) DESC
       LIMIT 20`,
      [req.org_id, user_id]
    );

    // 3) Try LLM generation
    let result = null;
    try {
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const llm = getLLMService();
      const messages = buildContentRecommenderMessages({
        userId: user_id,
        dayOfWeek,
        upcomingDoctors,
        publishedAssets,
        recentViews,
      });
      const llmResult = await llm.chat(messages, { requireJson: true });

      // Light shape-validation. The LLM is asked to return asset_ids; trust the
      // ones that are actually in the library, drop any hallucinated ids.
      const validAssetIds = new Set(publishedAssets.map(a => a.id));
      if (llmResult && Array.isArray(llmResult.recommendations)) {
        result = {
          recommendations: llmResult.recommendations.slice(0, 8).map((r, i) => ({
            rank: r.rank || i + 1,
            doctor: r.doctor || '',
            specialty: r.specialty || '',
            tier: r.tier || '',
            priority: (r.priority || 'medium').toLowerCase(),
            recommended_assets: Array.isArray(r.recommended_assets)
              ? r.recommended_assets
                  .filter(a => a && validAssetIds.has(parseInt(a.asset_id, 10)))
                  .slice(0, 3)
                  .map(a => ({
                    asset_id: parseInt(a.asset_id, 10),
                    title: a.title || '',
                    why: (a.why || '').slice(0, 400),
                  }))
              : [],
            talking_points: Array.isArray(r.talking_points) ? r.talking_points.slice(0, 5) : [],
            best_time: r.best_time || '',
          })),
          library_insight: typeof llmResult.library_insight === 'string'
            ? llmResult.library_insight.slice(0, 1000)
            : '',
          total_recommended: 0,
        };
        result.total_recommended = result.recommendations.length;
      }
    } catch (llmErr) {
      console.error('[AI] content-recommender LLM error:', llmErr.message);
    }

    // 4) Fallback: if LLM failed or returned nothing, build a rule-based plan
    // so the endpoint always returns SOMETHING usable. Only fires when the
    // LLM call truly errored. Two-tier match:
    //   - Per doctor: try therapeutic_area / specialty substring match first.
    //   - If no per-doctor match, fall back to top-2 published assets (still
    //     better than an empty recommendation list).
    if (!result || !result.recommendations.length) {
      const topAssets = publishedAssets.slice(0, 2);
      const fallback = upcomingDoctors.slice(0, 5).map((doc, i) => {
        const matched = publishedAssets.filter(a => {
          if (!a.therapeutic_area || !doc.specialty) return false;
          const ta = a.therapeutic_area.toLowerCase();
          const sp = doc.specialty.toLowerCase();
          return ta.includes(sp.slice(0, 6)) || sp.includes(ta.slice(0, 6));
        }).slice(0, 2);
        const chosen = matched.length > 0 ? matched : topAssets;
        const why = matched.length > 0
          ? `Topic match: ${matched[0].therapeutic_area} aligns with ${doc.specialty}.`
          : 'Currently published asset — review for relevance to this doctor.';
        return {
          rank: i + 1,
          doctor: doc.doctorName,
          specialty: doc.specialty || '',
          tier: doc.tier || '',
          priority: doc.tier === 'A' ? 'high' : doc.tier === 'B' ? 'medium' : 'low',
          recommended_assets: chosen.map(a => ({
            asset_id: a.id,
            title: a.title,
            why
          })),
          talking_points: [],
          best_time: '',
        };
      }).filter(r => r.recommended_assets.length > 0);
      result = {
        recommendations: fallback,
        library_insight: 'AI generation unavailable — showing rule-based matches from the published library.',
        total_recommended: fallback.length,
      };
    }

    // 5) Cache the result for the day (UPSERT)
    await db.query(
      `INSERT INTO content_recommendations (org_id, user_id, date, recommendations)
       VALUES ($1, $2, CURRENT_DATE, $3)
       ON CONFLICT (org_id, user_id, date)
       DO UPDATE SET recommendations = $3, generated_at = NOW()`,
      [req.org_id, user_id, JSON.stringify(result)]
    );

    res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      recommendations: result,
      cached: false,
    });
  } catch (err) {
    console.error('[AI] content-recommender error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
