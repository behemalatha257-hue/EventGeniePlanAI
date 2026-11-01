# EventGeniePlan AI - System Architecture & Engineering Design

EventGeniePlan AI is an enterprise-grade, full-stack GenAI platform designed to coordinate complex event planning workflows through multi-agent collaboration, constraint-satisfaction algorithms, and predictive analytics.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend["Frontend Client Layer (Browser / SPA)"]
        UI[Glassmorphic UI / Dashboard]
        CD[Live Countdown Engine]
        SG[SVG Budget Health Speedometer]
        SC[Interactive Drag & Drop Seating Canvas]
        CK[Cascading Critical Path Timeline]
        VF[2D Spatial Egress Visualizer]
        RC[24/7 RSVP Concierge]
    end

    subgraph Gateway["Server & Gateway Layer (Node.js / Express)"]
        H[Helmet Security & CSP Headers]
        RL[Rate Limiter - 200 req/15m]
        VAL[Input Validation & XSS Sanitizer]
        API_ROUTER[REST API Router]
    end

    subgraph ServiceLayer["Business Logic & Algorithmic Engines"]
        BE[Budget Engine - Dynamic Reallocation]
        CP[Contract Parser - Forensic Clause Extractor]
        SO[Seating Optimizer - Graph CSP Solver]
        CE[Checklist Engine - PERT/CPM Shifter]
        SE[Spatial Engine - NFPA 101 Egress Check]
        EE[Eco-Score Engine - GHGP Scope 3]
        VB[Vendor Briefing Engine]
    end

    subgraph AILayer["AI Orchestration & LLM Layer"]
        GS[Gemini AI Service Client]
        M1["Vault (Budget Bot)"]
        M2["Aura (Design Bot)"]
        M3["Chronos (Chaos Predictor)"]
        M4["Atlas (Spatial Architect)"]
        FALLBACK[Deterministic Heuristic Fallback Engine]
    end

    UI <--> Gateway
    Gateway --> ServiceLayer
    ServiceLayer <--> AILayer
    GS <--> M1 & M2 & M3 & M4
    GS -.->|Offline / Rate-Limited| FALLBACK
```

---

## 2. Layer-by-Layer Breakdown

### A. Frontend Presentation Layer (`/public`)
- **Modern Vanilla Architecture:** Zero bulky framework overhead (< 150KB total bundle size), providing sub-millisecond DOM render speeds and instant hydration.
- **Glassmorphic Design System (`styles.css`):** Built with CSS variables supporting dynamic switching between Midnight Luxury (dark mode) and Daylight Crisp (light mode) with persistent `localStorage` memory.
- **Dynamic Micro-Interactions:**
  - Real-time SVG Speedometer with smooth needle rotation based on budget health scoring.
  - Interactive HTML5 Drag-and-Drop seating floorplan with real-time friction line indicators.
  - Live 1-second interval countdown clock synchronized to the target event load-in curfew.
  - 2D SVG Spatial Floorplan rendering architectural zones and emergency egress aisles.

### B. Gateway & Middleware Layer (`/server`)
- **`helmet`:** Enforces HTTP security headers, CSP rules, and frame restrictions.
- **`express-rate-limit`:** Defends against API quota exhaustion and DDoS attacks.
- **`validation.js`:** Sanitizes all input strings, validates date formats, and enforces payload length bounds.
- **`errorHandler.js`:** Centralized error interceptor that prevents stack trace leakage in production.

### C. Algorithmic Engines Layer (`/server/services`)
1. **`budgetEngine.js`:**
   - Scores financial health (0-100) based on spend ratios, category variance, and reserve protection.
   - Solves dynamic rebalancing: drains surplus and contingency funds to absorb overdrawn categories.
2. **`contractParser.js`:**
   - Forensic parser scanning vendor agreements for 5 categories of hidden fees, non-refundable deposit traps, and one-sided indemnification clauses.
3. **`seatingOptimizer.js`:**
   - Graph-based constraint satisfaction algorithm grouping guests by affinity and dietary restrictions while strictly enforcing zero-friction separation for incompatible pairs.
4. **`checklistEngine.js`:**
   - DAG-based milestone manager that cascades dependent due dates when the event target date shifts.
5. **`spatialEngine.js`:**
   - Models room clearance, dance floor sizing, and verifies NFPA 101 Life Safety emergency egress compliance.
6. **`ecoScoreEngine.js`:**
   - Estimates event carbon footprint (kg CO2e) and calculates impact of sustainable local vendor swaps.
7. **`vendorBriefingEngine.js`:**
   - Formulates tailored technical riders and run-sheets for DJs, Caterers, and Photographers.

### D. AI Service Layer (`geminiService.js`)
- Interfaces with Google Gemini 2.5 Flash using structured JSON responses (`responseMimeType: "application/json"`).
- Powers "The Planning Committee" multi-agent copilot.
- Integrated fail-safe architecture: if the Gemini API key is missing or offline, the local deterministic engine seamlessly satisfies all requests with 100% test reliability.

