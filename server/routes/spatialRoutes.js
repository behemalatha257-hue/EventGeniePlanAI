/**
 * EventGeniePlan AI - Venue Spatial Architect Routes
 */

const express = require('express');
const router = express.Router();
const { calculateSpatialPlan } = require('../services/spatialEngine');
const { DEFAULT_EVENT } = require('../data/defaultEventData');

let currentSpatialPlan = calculateSpatialPlan({
  lengthFt: 80,
  widthFt: 50,
  expectedGuests: DEFAULT_EVENT.expectedGuests
});

/**
 * GET /api/spatial/plan
 * Returns active 2D layout, clearance measurements, and safety audit
 */
router.get('/plan', (req, res) => {
  res.json({
    success: true,
    data: currentSpatialPlan
  });
});

/**
 * POST /api/spatial/simulate
 * Re-models spatial clearance given custom dimensions
 */
router.post('/simulate', (req, res) => {
  const { lengthFt, widthFt, expectedGuests } = req.body || {};

  currentSpatialPlan = calculateSpatialPlan({
    lengthFt,
    widthFt,
    expectedGuests
  });

  res.json({
    success: true,
    message: 'Spatial floorplan re-modeled successfully',
    data: currentSpatialPlan
  });
});

module.exports = router;
