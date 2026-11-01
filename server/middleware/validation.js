/**
 * EventGeniePlan AI - Input Validation & Sanitization Middleware
 * Defense-in-depth protection against Prototype Pollution, XSS, ReDoS, and malformed payloads.
 */

const { SecurityValidator } = require('../utils/validator');

/**
 * Global middleware guarding against Prototype Pollution attacks.
 * Strips __proto__, constructor, and prototype from all incoming request payloads.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function prototypePollutionGuard(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = SecurityValidator.cleanObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = SecurityValidator.cleanObject(req.query);
  }
  next();
}

/**
 * Sanitizes raw string against dangerous HTML/script injection
 * @param {string} str Raw string
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  const result = SecurityValidator.validateText(str, { minLength: 0, maxLength: 500000 });
  return result.sanitized;
}

/**
 * Validates Planning Committee Copilot requests
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
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

  const textCheck = SecurityValidator.validateText(message, { minLength: 1, maxLength: 5000 });
  if (!textCheck.isValid) {
    const isTooLong = typeof message === 'string' && message.length > 5000;
    return res.status(400).json({
      error: {
        code: isTooLong ? 'MESSAGE_TOO_LONG' : 'EMPTY_MESSAGE',
        message: textCheck.error || 'Invalid message'
      }
    });
  }

  req.body.message = textCheck.sanitized;
  next();
}

/**
 * Validates vendor contract analysis payloads
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
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

  if (contractText) {
    const check = SecurityValidator.validateText(contractText, { minLength: 20, maxLength: 100000 });
    if (!check.isValid) {
      return res.status(400).json({
        error: {
          code: 'CONTRACT_TEXT_INVALID',
          message: check.error || 'Contract text validation failed'
        }
      });
    }
    req.body.contractText = check.sanitized;
  }

  next();
}

/**
 * Validates date shift requests
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateDateShiftRequest(req, res, next) {
  const { newTargetDate } = req.body || {};

  if (!newTargetDate || typeof newTargetDate !== 'string') {
    return res.status(400).json({
      error: {
        code: 'MISSING_TARGET_DATE',
        message: 'newTargetDate (YYYY-MM-DD) is required.'
      }
    });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(newTargetDate) || isNaN(Date.parse(newTargetDate))) {
    return res.status(400).json({
      error: {
        code: 'INVALID_DATE_FORMAT',
        message: 'newTargetDate must be a valid date in YYYY-MM-DD format.'
      }
    });
  }

  next();
}

/**
 * Validates seating guest assignment requests
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateSeatingAssignment(req, res, next) {
  const { guestId, tableId } = req.body || {};

  if (!guestId || typeof guestId !== 'string') {
    return res.status(400).json({
      error: {
        code: 'INVALID_GUEST_ID',
        message: 'guestId must be a non-empty string.'
      }
    });
  }

  if (tableId !== null && typeof tableId !== 'string') {
    return res.status(400).json({
      error: {
        code: 'INVALID_TABLE_ID',
        message: 'tableId must be a string or null (unassigned).'
      }
    });
  }

  req.body.guestId = sanitizeString(guestId);
  if (req.body.tableId) req.body.tableId = sanitizeString(tableId);

  next();
}

module.exports = {
  prototypePollutionGuard,
  sanitizeString,
  validateChatRequest,
  validateContractRequest,
  validateDateShiftRequest,
  validateSeatingAssignment
};
