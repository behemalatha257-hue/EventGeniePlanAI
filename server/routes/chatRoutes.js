/**
 * EventGeniePlan AI - Multi-Agent Copilot ("The Planning Committee") Routes
 */

const express = require('express');
const router = express.Router();
const { runCommitteeAgent } = require('../services/geminiService');
const { AGENT_PERSONAS } = require('../config/constants');
const { validateChatRequest } = require('../middleware/validation');

/**
 * GET /api/chat/agents
 * Returns metadata and personas of The Planning Committee
 */
router.get('/agents', (req, res) => {
  const agents = Object.values(AGENT_PERSONAS).map(agent => ({
    id: agent.id,
    name: agent.name,
    title: agent.title,
    avatar: agent.avatar,
    color: agent.color
  }));

  res.json({
    success: true,
    agents
  });
});

/**
 * POST /api/chat/committee
 * Sends a user query to one of the Planning Committee agents
 */
router.post('/committee', validateChatRequest, async (req, res, next) => {
  try {
    const { agentId, message, context } = req.body;
    const response = await runCommitteeAgent(agentId, message, context);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
