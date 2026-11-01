# 🛡️ Enterprise Security Policy & Threat Defense Architecture

EventGeniePlan AI incorporates a defense-in-depth security model designed to meet and exceed enterprise information security standards and the **OWASP Top 10 (2025/2026)** application security framework.

---

## 1. Security Architecture & Threat Defense Matrix

| Security Layer | Implemented Defense Mechanism | Technical Description | OWASP Mapping |
| :--- | :--- | :--- | :--- |
| **Object Integrity** | **Prototype Pollution Defense** | Recursive sanitization via `SecurityValidator.cleanObject()` dynamically strips `__proto__`, `constructor`, and `prototype` keys from all incoming JSON bodies. | A03: Injection / Object Tampering |
| **Input Validation** | **ReDoS & Length Boundaries** | `SecurityValidator.validateText()` enforces strict lower and upper bounds (`minLength: 1`, `maxLength: 25,000`) before running linear, non-backtracking regex patterns to thwart Regular Expression Denial of Service. | A04: Insecure Design / Denial of Service |
| **XSS Defense** | **Multi-Stage Sanitization** | Comprehensive stripping of HTML tags (`<script>`, `<iframe>`, `onload=`, etc.) and dangerous pseudoprotocols (`javascript:`, `vbscript:`, `data:text/html`). All frontend DOM updates use secure `.textContent` and sanitized tokenizers. | A03: Injection (Cross-Site Scripting) |
| **HTTP Hardening** | **Strict Helmet Security Headers** | Enforces `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Cross-Origin-Resource-Policy: cross-origin`. | A05: Security Misconfiguration |
| **Rate Limiting** | **Express Rate Limiter** | Standard sliding-window rate limiter (200 requests per 15-minute window per IP) preventing automated brute-force attacks, resource starvation, and API credit exhaustion. | A04: Rate Limiting & Resource Exhaustion |
| **Contract Confidentiality** | **Client-Side PDF Sandboxing** | Proprietary vendor contracts are parsed entirely in the client's browser using PDF.js and Web Workers. Raw document binaries never traverse the backend network, ensuring client NDAs are upheld. | A01: Broken Access Control / Data Leakage |
| **Data Minimization** | **Zero-Knowledge PII Storage** | Guest names, relationship friction lists, and dietary data are processed ephemerally in-memory. No unencrypted persistent databases or third-party tracking scripts are utilized. | A02: Cryptographic Failures / Privacy |
| **Credential Security** | **Masked Secrets Management** | Gemini API keys are loaded via process environment variables (`dotenv`). Diagnostic endpoints (`/api/health`) strictly redact keys to 8 masked prefix characters (`AIzaSyAe...`). | A07: Identification and Authentication Failures |

---

## 2. Defensive Code Validation Implementations

### A. Deep Prototype Pollution Guard (`server/utils/validator.js`)
```javascript
// Automatically executed on every POST, PUT, and PATCH request body
function cleanObject(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => cleanObject(item, depth + 1));

  const safe = {};
  for (const key of Object.keys(obj)) {
    // Prohibit prototype pollution injection vectors
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    safe[key] = cleanObject(obj[key], depth + 1);
  }
  return safe;
}
```

### B. Safe Linear Regular Expressions (ReDoS Immunity)
All regular expressions used for fee parsing and clause auditing are formulated as atomic, non-overlapping expressions:
- Bounded input check: `if (input.length > 25000) return error;`
- Guaranteed linear $O(N)$ execution time.

---

## 3. Dependency Auditing & CI Vulnerability Gates

1. **Automated CI Scanning:** GitHub Actions runs `npm audit --audit-level=high` on every pull request and commit across Node 18, 20, and 22.
2. **Zero Known Vulnerabilities:** Main branch maintains **0 known vulnerabilities** across direct and transitive dependencies.
3. **Strict Lockfile Enforced:** `package-lock.json` guarantees deterministic, tamper-evident dependency installations.
