/**
 * EventGeniePlan AI - Input Validation & Sanitization Middleware
 */

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // strip dangerous tags
    .trim();
}

function validateChatRequest(req, res, next) {
  const { agentId, message } = req.body || {};

  const allowedAgents = ['budget_bot', 'design_bot', 'chaos_bot', 'spatial_bot'];
  if (!agentId || !allowedAgents.includes(agentId)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_AGENT_ID',
        message: `agentId must be one of: ${allowedAgents.join(', ')}`
      }
    });
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      error: {
        code: 'EMPTY_MESSAGE',
        message: 'Message cannot be empty.'
      }
    });
  }

  if (message.length > 5000) {
    return res.status(400).json({
      error: {
        code: 'MESSAGE_TOO_LONG',
        message: 'Message exceeds maximum allowed length of 5,000 characters.'
      }
    });
  }

  req.body.message = sanitizeString(message);
  next();
}

function validateContractRequest(req, res, next) {
  const { contractText, sampleId } = req.body || {};

  if (!sampleId && (!contractText || typeof contractText !== 'string' || contractText.trim().length < 20)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_CONTRACT_TEXT',
        message: 'Please provide valid contract text (minimum 20 characters) or specify a sampleId.'
      }
    });
  }

  if (contractText && contractText.length > 50000) {
    return res.status(400).json({
      error: {
        code: 'CONTRACT_TOO_LARGE',
        message: 'Contract text exceeds maximum limit of 50,000 characters.'
      }
    });
  }

  next();
}

function validateDateShiftRequest(req, res, next) {
  const { newTargetDate } = req.body || {};

  if (!newTargetDate || !/^\d{4}-\d{2}-\d{2}$/.test(newTargetDate)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_DATE_FORMAT',
        message: 'newTargetDate must be a valid YYYY-MM-DD date string.'
      }
    });
  }

  const parsed = new Date(newTargetDate);
  if (isNaN(parsed.getTime())) {
    return res.status(400).json({
      error: {
        code: 'INVALID_CALENDAR_DATE',
        message: 'Provided date is not a valid calendar date.'
      }
    });
  }

  next();
}

module.exports = {
  sanitizeString,
  validateChatRequest,
  validateContractRequest,
  validateDateShiftRequest
};
