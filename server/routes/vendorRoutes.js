/**
 * EventGeniePlan AI - Automated Vendor Briefing Routes
 */

const express = require('express');
const router = express.Router();
const { generateVendorBrief } = require('../services/vendorBriefingEngine');
const { DEFAULT_EVENT } = require('../data/defaultEventData');

/**
 * GET /api/vendors/brief/:type
 * Returns tailored run-sheet and technical SLA rider for vendor
 */
router.get('/brief/:type', (req, res) => {
  const vendorType = req.params.type || 'dj';
  const brief = generateVendorBrief(vendorType, DEFAULT_EVENT);
  res.json(brief);
});

module.exports = router;
