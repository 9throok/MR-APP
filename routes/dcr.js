const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.post('/', async (req, res) => {
  try {
    const { name, date, product, samples, callSummary, rating, user_id } = req.body;

    const { data, error } = await supabase
      .from('dcr')
      .insert([
        {
          name,
          date,
          product,
          samples,
          call_summary: callSummary,
          rating,
          user_id
        }
      ])
      .select();
    console.log("🚀 ~ error:", error)
    console.log("🚀 ~ data:", data)

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.log("🚀 ~ err:", err)
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dcr')
      .select('*')
      .order('created_at', { ascending: false });
    console.log("🚀 ~ error:", error)
    console.log("🚀 ~ data:", data)

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
