/**
 * EventGeniePlan AI - Hyper-Personalized RSVP Concierge Routes
 */

const express = require('express');
const router = express.Router();
const { handleConciergeInquiry, EVENT_FAQS } = require('../services/rsvpConcierge');

/**
 * GET /api/rsvp/faqs
 * Returns guest FAQs
 */
router.get('/faqs', (req, res) => {
  res.json({
    success: true,
    faqs: EVENT_FAQS
  });
});

/**
 * POST /api/rsvp/chat
 * Submits query to the RSVP Concierge chatbot
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: { code: 'EMPTY_QUERY', message: 'Inquiry query cannot be empty.' }
      });
    }

    const response = await handleConciergeInquiry(query);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
