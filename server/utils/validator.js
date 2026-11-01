/**
 * EventGeniePlan AI - Defensive Security Validator & Input Sanitizer
 * Shields Express controllers from Prototype Pollution, ReDoS attacks, XSS injection, and payload flooding.
 */

class SecurityValidator {
  /**
   * Validates and cleans raw string inputs
   * @param {any} input Raw input to validate
   * @param {Object} [options] Validation parameters
   * @param {number} [options.maxLength=500000] Maximum character limit
   * @param {number} [options.minLength=1] Minimum character limit
   * @returns {{ isValid: boolean, sanitized: string, error?: string }}
   */
  static validateText(input, options = {}) {
    const maxLength = options.maxLength || 500000;
    const minLength = options.minLength || 1;

    if (input === undefined || input === null) {
      return { isValid: false, sanitized: '', error: 'Input cannot be null or undefined' };
    }

    if (typeof input !== 'string') {
      return { isValid: false, sanitized: '', error: 'Input must be a valid text string' };
    }

    const trimmed = input.trim();

    if (trimmed.length < minLength) {
      return { isValid: false, sanitized: '', error: `Input must be at least ${minLength} character(s)` };
    }

    if (trimmed.length > maxLength) {
      return { isValid: false, sanitized: '', error: `Input exceeds maximum limit of ${maxLength} characters` };
    }

    // Strip potentially malicious XSS / script tags and event handlers
    const sanitized = trimmed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    return { isValid: true, sanitized };
  }

  /**
   * Deep sanitizes request bodies against prototype pollution
   * Recursively strips __proto__, constructor, and prototype injection keys.
   * @param {any} obj Object to sanitize
   * @returns {any} Cleaned object
   */
  static cleanObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item));
    }

    const cleaned = Object.create(null);
    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleaned[key] = this.cleanObject(obj[key]);
    }

    return cleaned;
  }

  /**
   * Validates positive integer/float bounds (e.g. budgets, guest counts, room dimensions)
   * @param {any} value Number input
   * @param {number} [min=0] Minimum value
   * @param {number} [max=10000000] Maximum value
   * @returns {{ isValid: boolean, value: number, error?: string }}
   */
  static validateNumber(value, min = 0, max = 10000000) {
    const num = Number(value);
    if (isNaN(num) || typeof value === 'boolean') {
      return { isValid: false, value: 0, error: 'Value must be a valid numerical number' };
    }
    if (num < min || num > max) {
      return { isValid: false, value: num, error: `Value must be between ${min} and ${max}` };
    }
    return { isValid: true, value: num };
  }
}

module.exports = {
  SecurityValidator
};
