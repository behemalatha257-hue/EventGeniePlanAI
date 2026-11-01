/**
 * EventGeniePlan AI - Core Gemini AI Service Layer
 * Multi-Agent Copilot, Contract Parsing & GenAI Event Intelligence
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AGENT_PERSONAS } = require('../config/constants');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

// Candidate models in priority order for automatic failover
const CANDIDATE_MODELS = [
  preferredModel,
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-pro'
].filter((m, i, arr) => m && arr.indexOf(m) === i); // Deduplicate

let genAI = null;
if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn('[GeminiService] Warning: Could not initialize GoogleGenerativeAI:', err.message);
  }
}

/**
 * Helper with timeout to call Gemini with JSON schema or standard text
 */
function withTimeout(promise, ms = 7000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`AI_TIMEOUT_${ms}MS`)), ms))
  ]);
}

/**
 * Robust multi-model failover Gemini caller
 */
async function callGeminiRaw(prompt, systemInstruction = '', jsonMode = false) {
  if (process.env.NODE_ENV === 'test') {
    throw new Error('TEST_ENV_BYPASS');
  }

  if (!genAI) {
    throw new Error('NO_API_KEY');
  }

  let lastError = null;

  for (const modelToTry of CANDIDATE_MODELS) {
    try {
      const modelOptions = {
        model: modelToTry,
        generationConfig: {
          temperature: 0.3,
          topP: 0.95,
          maxOutputTokens: 2048,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {})
        }
      };

      if (systemInstruction) {
        modelOptions.systemInstruction = systemInstruction;
      }

      const model = genAI.getGenerativeModel(modelOptions);
      const result = await withTimeout(model.generateContent(prompt), 7000);
      const response = await result.response;
      const text = response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      lastError = err;
      // If model is busy (503) or not found (404), continue to next candidate
      console.warn(`[GeminiService] Model ${modelToTry} attempt failed: ${err.message}. Trying next candidate...`);
    }
  }

  throw lastError || new Error('ALL_MODELS_UNAVAILABLE');
}

/**
 * 1. Multi-Agent Copilot ("The Planning Committee")
 */
async function runCommitteeAgent(agentId, userMessage, eventContext = {}) {
  const persona = Object.values(AGENT_PERSONAS).find(p => p.id === agentId) || AGENT_PERSONAS.BUDGET;

  const contextSnippet = `
CURRENT EVENT CONTEXT:
- Event: ${eventContext.title || "Aria & Julian's Grand Solstice Gala Wedding"}
- Type: ${eventContext.eventType || 'Wedding'}
- Target Date: ${eventContext.targetDate || 'In 45 Days'}
- Total Budget: $${eventContext.totalBudget || 45000} | Spent: $${eventContext.spentBudget || 32600}
- Guest Count: ${eventContext.expectedGuests || 120} (Confirmed: ${eventContext.confirmedRsvps || 98})
- Current Overrun Risks: ${eventContext.risks || 'Venue 3.5% over budget, Catering pending headcount'}
`;

  const prompt = `${contextSnippet}

USER REQUEST TO ${persona.name}:
"${userMessage}"

Respond in your specific persona with high analytical precision. Format with clear headings, bullet points, numbers/percentages, and actionable next steps. Directly address the user's question.`;

  try {
    const aiText = await callGeminiRaw(prompt, persona.systemPrompt, false);
    return {
      success: true,
      agent: {
        id: persona.id,
        name: persona.name,
        title: persona.title,
        avatar: persona.avatar,
        color: persona.color
      },
      reply: aiText,
      timestamp: new Date().toISOString(),
      source: 'gemini-live'
    };
  } catch (err) {
    console.warn(`[GeminiService] Live call failed for ${agentId}: ${err.message}. Using intelligent persona fallback.`);
    return getFallbackAgentResponse(agentId, userMessage, eventContext);
  }
}

/**
 * 2. Smart Vendor Contract Analyzer
 */
async function analyzeContractWithAI(contractText) {
  const prompt = `You are an elite legal-tech and event contract risk analysis AI.
Analyze the following event/vendor contract text with forensic precision. Extract:
1. "riskScore": An integer from 0 to 100 representing overall risk to the client (0-39: Low, 40-69: Medium, 70-100: Critical).
2. "riskLevel": "Low", "Medium", "High", or "Critical".
3. "summary": A concise executive summary of the agreement terms.
4. "hiddenFees": Array of objects: { "feeName": string, "amount": string, "trigger": string, "risk": "Medium"|"High" }.
5. "depositSchedule": Array of objects: { "milestone": string, "percentage": string, "deadline": string, "refundable": boolean, "notes": string }.
6. "redFlags": Array of strings detailing severe legal traps (e.g. unilateral cancellation, extreme indemnity, vague food escalation).
7. "actionableRecommendations": Array of specific counter-proposal clauses the user should demand.

Return ONLY valid JSON matching this exact structure:
{
  "riskScore": 82,
  "riskLevel": "Critical",
  "summary": "...",
  "hiddenFees": [{"feeName": "...", "amount": "...", "trigger": "...", "risk": "..."}],
  "depositSchedule": [{"milestone": "...", "percentage": "...", "deadline": "...", "refundable": false, "notes": "..."}],
  "redFlags": ["...", "..."],
  "actionableRecommendations": ["...", "..."]
}

CONTRACT TEXT TO ANALYZE:
"""
${contractText.substring(0, 8000)}
"""`;

  try {
    const rawJson = await callGeminiRaw(prompt, 'You are an event contract analyzer that outputs strictly valid JSON.', true);
    const parsed = JSON.parse(rawJson);
    return {
      success: true,
      analysis: parsed,
      source: 'gemini-live'
    };
  } catch (err) {
    console.warn(`[GeminiService] Contract AI analysis fallback: ${err.message}`);
    const { fallbackContractParser } = require('./contractParser');
    return {
      success: true,
      analysis: fallbackContractParser(contractText),
      source: 'heuristic-engine'
    };
  }
}

/**
 * 3. Seating Chart Optimizer
 */
async function optimizeSeatingWithAI(guests, tables, rules = {}) {
  const prompt = `You are an event seating logistics AI.
Arrange guests into tables of specified capacity to maximize happiness and eliminate friction.

RULES:
1. Friction pairs (guests with frictionWith including each other) must NEVER be seated at the same table.
2. Group guests with matching affinityGroup together where possible.
3. Cluster guests with critical dietary restrictions (e.g., Vegan, Nut Allergy, Halal) at tables to streamline banquet catering.
4. Never exceed table capacity.

INPUT GUESTS:
${JSON.stringify(guests.map(g => ({ id: g.id, name: g.name, affinity: g.affinityGroup, diet: g.diet, friction: g.frictionWith })), null, 2)}

INPUT TABLES:
${JSON.stringify(tables.map(t => ({ id: t.id, name: t.name, capacity: t.capacity })), null, 2)}

Return ONLY valid JSON:
{
  "tableAssignments": [
    { "tableId": "tbl_1", "guestIds": ["gst_1", "gst_2"], "rationale": "Bridal party VIP cluster, no conflicts" }
  ],
  "frictionConflictsResolved": 2,
  "dietaryClustersFormed": ["Table 2 (Vegan & Halal)", "Table 3 (Nut Allergy safe)"],
  "harmonyScore": 96
}`;

  try {
    const rawJson = await callGeminiRaw(prompt, 'You are a seating optimization algorithm that returns strictly valid JSON.', true);
    const parsed = JSON.parse(rawJson);
    return {
      success: true,
      result: parsed,
      source: 'gemini-live'
    };
  } catch (err) {
    console.warn(`[GeminiService] Seating AI fallback: ${err.message}`);
    const { algorithmicSeatingSolver } = require('./seatingOptimizer');
    return {
      success: true,
      result: algorithmicSeatingSolver(guests, tables),
      source: 'algorithmic-solver'
    };
  }
}

/**
 * 4. Dynamic Run-Sheet & Checklist Generator
 */
async function generateChecklistWithAI(eventType, targetDate, totalBudget) {
  const prompt = `Generate a dynamic milestone checklist and day-of run-sheet for a "${eventType}" scheduled on "${targetDate}" with a total budget of $${totalBudget}.
Return ONLY valid JSON:
{
  "eventType": "${eventType}",
  "milestones": [
    {
      "id": "ms_1",
      "title": "String",
      "phase": "String",
      "daysBeforeEvent": 60,
      "category": "Venue|Catering|Design|Logistics|Finance",
      "priority": "High|Medium|Urgent|Critical",
      "owner": "String",
      "dependentOn": []
    }
  ],
  "dayOfRunSheet": [
    { "time": "09:00 AM", "duration": 60, "title": "Load-In", "lead": "Logistics Lead", "notes": "Vendor arrival" }
  ]
}`;

  try {
    const rawJson = await callGeminiRaw(prompt, 'You are an event timeline and logistics architect that returns strictly valid JSON.', true);
    const parsed = JSON.parse(rawJson);
    return {
      success: true,
      data: parsed,
      source: 'gemini-live'
    };
  } catch (err) {
    console.warn(`[GeminiService] Checklist AI fallback: ${err.message}`);
    const { getDeterministicChecklist } = require('./checklistEngine');
    return {
      success: true,
      data: getDeterministicChecklist(eventType, targetDate),
      source: 'deterministic-generator'
    };
  }
}

/**
 * Highly Intelligent Contextual Persona Fallback Engine
 * Dynamically analyzes the user's specific text, query, and numbers.
 */
function getFallbackAgentResponse(agentId, userMessage, eventContext = {}) {
  const persona = Object.values(AGENT_PERSONAS).find(p => p.id === agentId) || AGENT_PERSONAS.BUDGET;
  const lower = (userMessage || '').toLowerCase();
  const totalBudget = Number(eventContext.totalBudget) || 45000;
  const spentBudget = Number(eventContext.spentBudget) || 32600;
  const remaining = Math.max(0, totalBudget - spentBudget);
  const guests = Number(eventContext.expectedGuests) || 120;

  let reply = '';

  // ----------------------------------------------------
  // 1. VAULT (BUDGET BOT)
  // ----------------------------------------------------
  if (agentId === 'budget_bot') {
    if (lower.includes('cater') || lower.includes('food') || lower.includes('plate') || lower.includes('drink') || lower.includes('bar')) {
      const perGuest = Math.round((totalBudget * 0.35) / guests);
      reply = `### 💰 Vault's Catering & Beverage Financial Breakdown
**Target Headcount:** ${guests} Guests | **Allocated Catering Envelope:** $${Math.round(totalBudget * 0.35).toLocaleString()} (~35% of total budget)

#### 🍽️ Per-Guest Cost Architecture:
1. **Plated Dinner Benchmark:** $${perGuest - 35}/guest for a 3-course seasonal menu.
2. **Standard Open Bar (4 Hours):** ~$35/guest for craft beer, house wine, and 2 signature cocktails.
3. **Mandatory Add-Ons to Audit:**
   - Staffing & Chef Stations: Budget $300 per attendant station.
   - Service Gratuity & Tax: Remember to factor mandatory 20-22% gratuity + local sales tax onto food and beverage subtotals.

**Vault's Negotiation Tip:**
Lock your RSVP deadline 21 days out to avoid paying per-plate penalty buffers. Request that banquet wine corkage fees ($45/bottle) be converted to a flat beverage service credit ($350-$500 cap).`;
    } else if (lower.includes('cut') || lower.includes('save') || lower.includes('reduce') || lower.includes('cost saving')) {
      reply = `### 💰 Vault's Strategic Cost-Reduction Playbook
To reduce expenditures without diminishing guest experience, deploy these 4 high-yield levers:

1. **Repurpose Ceremony Floral Architecture:** Move the ceremonial floral arch and aisle arrangements directly into the dining room to serve as the sweetheart table backdrop and buffet compotes. **Instant Savings: $800 - $1,200**.
2. **Beverage Package Capping:** Switch from full open top-shelf liquor to a curated "Beer, Wine & 2 Signature Cocktails" format. **Instant Savings: $1,400 - $2,200**.
3. **Lighting Over Physical Props:** Allocate $400 for programmable wireless LED uplighting instead of $2,000 in heavy physical drapery; atmospheric color wash transforms the space at 20% of the cost.
4. **Band/DJ Hybrid:** Book a live acoustic duo for ceremony and cocktail hour, then transition to a high-energy DJ for the dance reception rather than a 7-piece band all night. **Instant Savings: $1,800 - $3,000**.`;
    } else if (lower.includes('venue') || lower.includes('overrun') || lower.includes('rebalance')) {
      reply = `### 💰 Vault's Variance & Overrun Audit
**Current Financial State:**
- **Venue Rental:** Currently $14,500 spent vs $14,000 allocated (**+$500 / +3.57% Overrun**).
- **Catering & Bar:** $11,200 committed of $16,000 allocated (70% utilization, healthy buffer remaining).
- **Emergency Reserve:** $1,500 intact.

**Actionable Stabilization Plan:**
1. **Auto-Rebalance from Reserves:** Absorb the $500 venue overrun into the unallocated Contingency buffer, preserving the bottom line ($45,000).
2. **Headcount Lock:** Locking in the 98 confirmed RSVPs rather than the 120 buffer will free up **$1,760.00** instantly in banquet commitments.`;
    } else {
      reply = `### 💰 Vault's Financial Audit & Advisory
Regarding: *"${userMessage}"*

**Current Budget Metrics:**
- **Total Event Budget:** $${totalBudget.toLocaleString()}
- **Committed Expenditures:** $${spentBudget.toLocaleString()} (${Math.round((spentBudget / totalBudget) * 100)}% utilization)
- **Remaining Liquidity:** $${remaining.toLocaleString()}
- **Emergency Reserve:** $1,500 (locked for 72-hour load-in window)

**Vault's 3 Financial Directives:**
1. Maintain vendor line-item payment milestones rather than paying 100% upfront.
2. Require itemized overtime labor rates in writing from AV, DJ, and venue staff ($175+/hr overtime is where 65% of deficits occur).
3. Do not release final security retainers until post-event walkthrough sign-off is completed.`;
    }

  // ----------------------------------------------------
  // 2. AURA (DESIGN BOT)
  // ----------------------------------------------------
  } else if (agentId === 'design_bot') {
    // Extract theme keywords from user message
    let themeTitle = 'Modern Luxury & Living Botanicals';
    let palette = [
      { name: 'Midnight Obsidian', hex: '#0f172a', role: 'Architectural Backdrop' },
      { name: 'Champagne Gold', hex: '#eab308', role: 'Cutlery & Metallics' },
      { name: 'Lush Emerald', hex: '#047857', role: 'Botanical Scenography' },
      { name: 'Soft Alabaster', hex: '#f8fafc', role: 'Textured Linens' },
      { name: 'Electric Violet', hex: '#8b5cf6', role: 'Accent Uplighting' }
    ];

    if (lower.includes('beach') || lower.includes('coastal') || lower.includes('ocean')) {
      themeTitle = 'Coastal Horizon & Seaglass Modern';
      palette = [
        { name: 'Deep Sea Navy', hex: '#0c4a6e', role: 'Primary Drape' },
        { name: 'Sunlit Sand', hex: '#fde68a', role: 'Accent Linens' },
        { name: 'Seaglass Turquoise', hex: '#06b6d4', role: 'Glassware & Menus' },
        { name: 'Driftwood Gray', hex: '#94a3b8', role: 'Rustic Wood Tables' },
        { name: 'Coral Pop', hex: '#fb7185', role: 'Floral Blooms' }
      ];
    } else if (lower.includes('rustic') || lower.includes('barn') || lower.includes('autumn') || lower.includes('wood')) {
      themeTitle = 'Terracotta Hearth & Autumn Rustic';
      palette = [
        { name: 'Burnt Terracotta', hex: '#c2410c', role: 'Ceramics & Runner' },
        { name: 'Amber Glow', hex: '#d97706', role: 'Candlelight Accents' },
        { name: 'Sage Eucalyptus', hex: '#4d7c0f', role: 'Living Foliage' },
        { name: 'Warm Cream', hex: '#fef3c7', role: 'Table Linens' },
        { name: 'Charcoal Oak', hex: '#1c1917', role: 'Furniture Base' }
      ];
    } else if (lower.includes('minimal') || lower.includes('modern') || lower.includes('black') || lower.includes('white')) {
      themeTitle = 'Architectural Noir & Minimalist White';
      palette = [
        { name: 'Matte Jet Black', hex: '#09090b', role: 'Tableware & Chairs' },
        { name: 'Stark White', hex: '#ffffff', role: 'Calla Lily Florals' },
        { name: 'Brushed Slate', hex: '#64748b', role: 'Paper Suite' },
        { name: 'Smoked Quartz', hex: '#a1a1aa', role: 'Glass Tumblers' },
        { name: 'Polished Brass', hex: '#f59e0b', role: 'Subtle Accent Metal' }
      ];
    }

    reply = `### 🎨 Aura's Bespoke Scenography Concept: *${themeTitle}*
In response to: *"${userMessage}"*

#### 🎨 Curated 5-Color Harmony Palette:
${palette.map((p, idx) => `${idx + 1}. **${p.name}** (\`${p.hex}\`) - *${p.role}*`).join('\n')}

#### 🕯️ Atmosphere & Lighting Architecture:
- **Color Temperature:** Program lighting fixtures to **2400K - 2700K (Warm Candlelight)** for dining comfort, avoiding cool whites (4000K+) which wash out photo portraits.
- **Pin-Spotting:** Direct tight pin-spots from ceiling rafters onto centerpieces so florals pop dramatically without flooding guests' eyes.
- **Transition Cue:** At cocktail hour conclusion, dim room chandeliers by 40% and fade up ambient wall wash to signal the transition to dinner.`;

  // ----------------------------------------------------
  // 3. CHRONOS (CHAOS & TIMELINE PREDICTOR)
  // ----------------------------------------------------
  } else if (agentId === 'chaos_bot') {
    reply = `### ⚡ Chronos's Predictive Delay & Chaos Vulnerability Audit
Analyzing scheduling query: *"${userMessage}"*

**Chaos Vulnerability Score: 32/100 (Safe with Standard Buffer)**

#### 🚨 Historical Bottleneck Flags & Countermeasures:
1. **Guest Seating Transition Bottleneck:**
   - *Risk:* Moving 120 guests from cocktail terrace into the dining pavilion historically requires 22-26 minutes (planners frequently allocate only 10 minutes).
   - *Mitigation:* Sound chime and begin gentle pastoral ushering at T-minus 15 minutes.
2. **Toasts & Speech Overrun:**
   - *Risk:* Speeches scheduled for 3 minutes average 7.5 minutes in real-world scenarios, delaying warm entree courses.
   - *Mitigation:* Brief emcee with a discreet 1-minute visual cue; instruct caterer not to fire entrees until the final toast begins.
3. **Audio Interference & Kitchen Noise:**
   - *Risk:* Service galley door banging during emotional speeches.
   - *Mitigation:* Position microphones a minimum of 25 feet away from the service corridor.`;

  // ----------------------------------------------------
  // 4. ATLAS (VENUE SPATIAL ARCHITECT)
  // ----------------------------------------------------
  } else {
    reply = `### 📐 Atlas's Venue Spatial Architecture & Flow Blueprint
Analyzing spatial query: *"${userMessage}"*

**Room Specifications & Life Safety Audit:**
- **Standard Banquet Footprint:** 15 sq ft per seated guest (120 guests = 1,800 sq ft allocated).
- **Perimeter Table Clearance:** Enforce a strict minimum of **5.0 - 5.5 feet between chair backs** to guarantee seamless banquet tray transit and ADA wheelchair clearance.
- **Dance Floor Calculation:** Minimum 3.5 sq ft per simultaneous dancer (300 - 400 sq ft optimal for 120 guests).
- **Acoustic & Stage Placement:** Elevate main stage 18-24 inches at the North elevation; position subwoofers on isolation decoupling pads to prevent acoustic distortion against perimeter glass.
- **Egress Clearance:** Maintain dual 6.0 ft unobstructed primary exit pathways per NFPA 101 Life Safety Code.`;
  }

  return {
    success: true,
    agent: {
      id: persona.id,
      name: persona.name,
      title: persona.title,
      avatar: persona.avatar,
      color: persona.color
    },
    reply,
    timestamp: new Date().toISOString(),
    source: 'intelligent-local-copilot'
  };
}

module.exports = {
  callGeminiRaw,
  runCommitteeAgent,
  analyzeContractWithAI,
  optimizeSeatingWithAI,
  generateChecklistWithAI
};
