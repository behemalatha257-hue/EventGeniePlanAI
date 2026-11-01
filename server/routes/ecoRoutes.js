/**
 * EventGeniePlan AI - Eco-Score & Sustainability Routes
 */

const express = require('express');
const router = express.Router();
const { calculateEventEcoScore } = require('../services/ecoScoreEngine');
const { DEFAULT_EVENT } = require('../data/defaultEventData');

let activeEcoState = calculateEventEcoScore(DEFAULT_EVENT);

/**
 * GET /api/eco/score
 * Returns carbon footprint metrics and sustainable local swaps
 */
router.get('/score', (req, res) => {
  res.json({
    success: true,
    data: activeEcoState
  });
});

/**
 * POST /api/eco/toggle-swap
 * Toggles adoption of a specific green swap
 */
router.post('/toggle-swap', (req, res) => {
  const { swapId } = req.body || {};

  const swap = activeEcoState.sustainableSwaps.find(s => s.id === swapId);
  if (!swap) {
    return res.status(404).json({ error: { code: 'SWAP_NOT_FOUND', message: 'Sustainable swap not found' } });
  }

  swap.adopted = !swap.adopted;

  // Recalculate score based on adopted swaps
  const adoptedSavings = activeEcoState.sustainableSwaps
    .filter(s => s.adopted)
    .reduce((sum, s) => sum + s.co2SavingsKg, 0);

  const newCurrentScore = Math.min(98, activeEcoState.baselineEcoScore + Math.round((adoptedSavings / (activeEcoState.totalPotentialSavingsKg || 1)) * 30));

  activeEcoState.currentScore = newCurrentScore;
  activeEcoState.carbonOffsetEquivalentTrees = Math.round(adoptedSavings / 21);

  res.json({
    success: true,
    message: `Updated green swap "${swap.title}"`,
    swap,
    currentScore: newCurrentScore,
    adoptedSavingsKg: adoptedSavings,
    treesOffset: activeEcoState.carbonOffsetEquivalentTrees
  });
});

module.exports = router;
