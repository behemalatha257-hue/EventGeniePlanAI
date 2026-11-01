# Security Policy & Architecture - EventGeniePlan AI

Security is a fundamental consideration in EventGeniePlan AI. This document details the security controls, threat mitigations, and compliance measures implemented across the application.

---

## 1. Security Architecture Overview

| Layer | Security Measure | Implementation Details |
| :--- | :--- | :--- |
| **Transport** | HTTPS & TLS Encryption | Enforced in production environments with strict HSTS headers. |
| **HTTP Headers** | Helmet Middleware | Sets `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Strict-Transport-Security`. |
| **Traffic Shaping** | Rate Limiting | `express-rate-limit` prevents brute-force, DDoS, and API key credit exhaustion (200 reqs/15m window). |
| **Input Validation** | Sanitization Middleware | Strips `<>` script tags and validates data types, date formats, and payload lengths before reaching business logic. |
| **Data Privacy** | Zero PII Storage in Cloud | Guest dietary preferences and contact details are processed ephemerally in memory or on-premises. |
| **Secrets Management** | Environment Variables | API keys loaded via `dotenv` and masked in all diagnostic health check logs (`AIzaSyAe...`). |

---

## 2. Threat Mitigation Matrix (OWASP Top 10)

### A. Injection (SQL / NoSQL / Command)
- **Mitigation:** The application does not pass raw user strings to shell commands or SQL interpreters. All data structures use parameterized objects and strict type checking.

### B. Cross-Site Scripting (XSS)
- **Mitigation:** Input strings are sanitized with `sanitizeString()` removing HTML tags. Frontend DOM insertions use `textContent` for raw strings or controlled regex substitution with escaped tokens for markdown rendering.

### C. Broken Authentication & Sensitive Data Exposure
- **Mitigation:** API keys are never exposed to the client-side JavaScript. All Gemini AI calls are proxied through the backend server. The `/api/health` endpoint masks the key to the first 8 characters only.

### D. Server-Side Request Forgery (SSRF)
- **Mitigation:** The application does not fetch arbitrary user-supplied URLs. Contract inputs accept direct text pastes or local file uploads.

---

## 3. Safe Dependency Management
- All dependencies audited with `npm audit` reporting **0 vulnerabilities**.
- Regular automated vulnerability scanning for transitive dependencies.
