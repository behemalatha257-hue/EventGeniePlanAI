/**
 * Security & Input Validator Tests - EventGeniePlan AI
 */

const { SecurityValidator } = require('../server/utils/validator');

describe('SecurityValidator Defensive Suite', () => {
  describe('validateText()', () => {
    test('sanitizes dangerous XSS script tags and javascript pseudoprotocols', () => {
      const malicious = '<script>alert("pwned")</script>Hello World javascript:void(0) <img src="x" onerror="alert(1)">';
      const result = SecurityValidator.validateText(malicious);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).not.toContain('javascript:');
      expect(result.sanitized).not.toContain('onerror=');
      expect(result.sanitized).toContain('Hello World');
    });

    test('rejects null, undefined, and non-string inputs', () => {
      expect(SecurityValidator.validateText(null).isValid).toBe(false);
      expect(SecurityValidator.validateText(undefined).isValid).toBe(false);
      expect(SecurityValidator.validateText(12345).isValid).toBe(false);
      expect(SecurityValidator.validateText({}).isValid).toBe(false);
    });

    test('enforces strict minLength and maxLength boundaries to prevent ReDoS', () => {
      expect(SecurityValidator.validateText('', { minLength: 5 }).isValid).toBe(false);
      expect(SecurityValidator.validateText('short', { minLength: 10 }).isValid).toBe(false);
      expect(SecurityValidator.validateText('a'.repeat(501), { maxLength: 500 }).isValid).toBe(false);
      expect(SecurityValidator.validateText('Valid content', { minLength: 3, maxLength: 50 }).isValid).toBe(true);
    });
  });

  describe('cleanObject() Prototype Pollution Defense', () => {
    test('recursively strips __proto__, constructor, and prototype injection keys', () => {
      const payload = JSON.parse('{"title":"Wedding","__proto__":{"isAdmin":true},"nested":{"constructor":{"polluted":true},"safe":123}}');
      const cleaned = SecurityValidator.cleanObject(payload);

      expect(cleaned.title).toBe('Wedding');
      expect(cleaned.nested.safe).toBe(123);
      expect(cleaned.__proto__).toBeUndefined();
      expect(cleaned.nested.constructor).toBeUndefined();
      expect(Object.prototype.isAdmin).toBeUndefined();
      expect(Object.prototype.polluted).toBeUndefined();
    });

    test('handles arrays and primitive values cleanly without mutation', () => {
      expect(SecurityValidator.cleanObject(null)).toBeNull();
      expect(SecurityValidator.cleanObject('simple text')).toBe('simple text');
      expect(SecurityValidator.cleanObject([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('validateNumber()', () => {
    test('validates positive numeric bounds for budgets and headcounts', () => {
      expect(SecurityValidator.validateNumber(45000, 0, 1000000).isValid).toBe(true);
      expect(SecurityValidator.validateNumber('5000', 0, 10000).isValid).toBe(true);
      expect(SecurityValidator.validateNumber(-10, 0, 100).isValid).toBe(false);
      expect(SecurityValidator.validateNumber('not-a-number').isValid).toBe(false);
      expect(SecurityValidator.validateNumber(true).isValid).toBe(false);
    });
  });
});
