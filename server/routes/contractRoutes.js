/**
 * EventGeniePlan AI - Smart Vendor Contract Analyzer Routes
 */

const express = require('express');
const router = express.Router();
const { analyzeContractWithAI } = require('../services/geminiService');
const { fallbackContractParser } = require('../services/contractParser');
const { SAMPLE_CONTRACTS } = require('../data/sampleContracts');
const { validateContractRequest } = require('../middleware/validation');

/**
 * GET /api/contracts/samples
 * Returns list of pre-packaged realistic vendor contracts
 */
router.get('/samples', (req, res) => {
  res.json({
    success: true,
    samples: SAMPLE_CONTRACTS.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      textSnippet: c.text.substring(0, 180) + '...'
    }))
  });
});

/**
 * GET /api/contracts/sample/:id
 * Fetches the full text of a specific sample contract
 */
router.get('/sample/:id', (req, res) => {
  const sample = SAMPLE_CONTRACTS.find(s => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Sample contract not found' } });
  }

  res.json({
    success: true,
    sample
  });
});

/**
 * POST /api/contracts/analyze
 * Analyzes pasted contract text or a selected sample contract
 */
router.post('/analyze', validateContractRequest, async (req, res, next) => {
  try {
    let textToAnalyze = req.body.contractText;

    if (req.body.sampleId) {
      const sample = SAMPLE_CONTRACTS.find(s => s.id === req.body.sampleId);
      if (sample) {
        textToAnalyze = sample.text;
      }
    }

    const result = await analyzeContractWithAI(textToAnalyze);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
