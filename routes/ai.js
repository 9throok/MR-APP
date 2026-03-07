const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getLLMService } = require('../services/llm');
const { buildPreCallBriefingMessages } = require('../prompts/preCallBriefing');
const { buildTerritoryGapMessages } = require('../prompts/territoryGap');
const { buildManagerQueryMessages } = require('../prompts/managerQuery');
const { buildProductSignalsMessages } = require('../prompts/productSignals');

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

    const { rows: dcrHistory } = await db.query(
      `SELECT date, product, samples, call_summary, rating
       FROM dcr
       WHERE user_id = $1
         AND name ILIKE $2
       ORDER BY date DESC
       LIMIT 10`,
      [user_id, doctor_name]
    );

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

    // Aggregate per doctor in SQL — last visit, total visits, avg rating, days since last visit
    const { rows: doctorStats } = await db.query(
      `SELECT
         name                                                    AS "doctorName",
         MAX(date)::text                                         AS "lastVisitDate",
         COUNT(*)::int                                           AS "totalVisits",
         ROUND(AVG(rating)::numeric, 1)                         AS "avgRating",
         (CURRENT_DATE - MAX(date))::int                        AS "daysSinceLastVisit"
       FROM dcr
       WHERE user_id = $1
       GROUP BY name
       ORDER BY "daysSinceLastVisit" DESC`,
      [user_id]
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

    // Build dynamic SQL with optional filters
    const conditions = [];
    const params = [];

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

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: teamData } = await db.query(
      `SELECT user_id, name, date, product, samples, call_summary, rating
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
    const { from_date, to_date, user_ids } = req.query;

    const conditions = [];
    const params = [];

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

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Aggregate all product stats in one SQL query
    const { rows: productStats } = await db.query(
      `SELECT
         product,
         COUNT(*)::int                                            AS "totalCalls",
         COALESCE(SUM(samples), 0)::int                         AS "totalSamples",
         ROUND(AVG(rating)::numeric, 2)                         AS "avgRating",
         COUNT(*) FILTER (WHERE rating >= 4)::int               AS "highRatingCalls",
         COUNT(*) FILTER (WHERE rating <= 2)::int               AS "lowRatingCalls",
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

module.exports = router;
