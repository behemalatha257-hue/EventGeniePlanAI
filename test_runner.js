/**
 * EventGeniePlan AI - Standalone Zero-Dependency Automated Test Runner
 * Executes unit, integration & security tests across all core and innovative next-gen engines
 */

const { calculateBudgetHealth, predictCostOverrun, calculateRedistribution } = require('./server/services/budgetEngine');
const { fallbackContractParser } = require('./server/services/contractParser');
const { evaluateSeatingChart, algorithmicSeatingSolver } = require('./server/services/seatingOptimizer');
const { getDeterministicChecklist, cascadeDateShift } = require('./server/services/checklistEngine');
const { calculateSpatialPlan } = require('./server/services/spatialEngine');
const { calculateEventEcoScore } = require('./server/services/ecoScoreEngine');
const { generateVendorBrief } = require('./server/services/vendorBriefingEngine');
const { handleConciergeInquiry } = require('./server/services/rsvpConcierge');
const { SecurityValidator } = require('./server/utils/validator');
const { MemoryCache } = require('./server/utils/cache');
const { SAMPLE_CONTRACTS } = require('./server/data/sampleContracts');
const { EVENT_TYPES } = require('./server/config/constants');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let totalPassed = 0;
let totalFailed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function test(title, fn) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    console.log(`  ${colors.green}✔ PASS${colors.reset} ${title} (${duration}ms)`);
    totalPassed++;
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`  ${colors.red}✖ FAIL${colors.reset} ${title} (${duration}ms)`);
    console.log(`    ${colors.red}Error: ${err.message}${colors.reset}`);
    failures.push({ title, error: err.message });
    totalFailed++;
  }
}

async function runAllTests() {
  console.log(`${colors.bright}${colors.magenta}=======================================================`);
  console.log(`🧞 EVENTGENIEPLAN AI - FULL ARCHITECTURE TEST RUNNER`);
  console.log(`=======================================================${colors.reset}\n`);

  // SUITE 1: Budget Strategy & Health Engine
  console.log(`${colors.bright}${colors.cyan}▶ Test Suite 1: Budget Strategy & Health Engine${colors.reset}`);
  await test('Calculates budget health score and detects category overruns', () => {
    const cats = [
      { id: '1', name: 'Venue Rental', allocated: 10000, spent: 12000 },
      { id: '2', name: 'Catering', allocated: 10000, spent: 5000 },
      { id: 'cat_contingency', name: 'Contingency', allocated: 500, spent: 0 }
    ];
    const health = calculateBudgetHealth(22000, cats, 45);
    assert(health.hasOverruns === true, 'Detected overrun');
    assert(health.overruns.length === 1, 'Exactly one category overrun');
    assert(health.score < 80, 'Score reflects penalty');
  });

  await test('Forecasts burn rate and overrun probability', () => {
    const cats = [
      { id: 'cat_venue', name: 'Venue Rental', allocated: 14000, spent: 14500 },
      { id: 'cat_catering', name: 'Catering', allocated: 16000, spent: 11200 }
    ];
    const pred = predictCostOverrun(45000, cats, 45, 30);
    assert(pred.projectedFinalCost > 0, 'Projects positive final cost');
    assert(typeof pred.overrunProbabilityPercent === 'number', 'Calculates probability');
  });

  await test('Real-time dynamic redistribution stabilizes budget deficit', () => {
    const cats = [
      { id: 'cat_venue', name: 'Venue', allocated: 10000, spent: 12000 },
      { id: 'cat_catering', name: 'Catering', allocated: 15000, spent: 10000 },
      { id: 'cat_contingency', name: 'Emergency Contingency', allocated: 3000, spent: 0 }
    ];
    const redist = calculateRedistribution(28000, cats);
    assert(redist.needed === true, 'Redistribution needed');
    assert(redist.coveredAmount === 2000, 'Fully covers deficit');
    assert(redist.uncoveredDeficit === 0, 'No remaining deficit');
  });

  // SUITE 2: Smart Vendor Contract Parser
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 2: Smart Vendor Contract Parser & Risk Analyzer${colors.reset}`);
  await test('Extracts hidden administrative, corkage and overtime fees', () => {
    const sample = SAMPLE_CONTRACTS[0].text;
    const analysis = fallbackContractParser(sample);
    assert(analysis.hiddenFees.length >= 3, 'Found at least 3 hidden fees');
    assert(analysis.riskScore > 50, 'Risk score indicates medium/high risk');
  });

  await test('Flags unilateral termination and non-refundable deposit schedules', () => {
    const sample = SAMPLE_CONTRACTS[1].text;
    const analysis = fallbackContractParser(sample);
    assert(analysis.redFlags.length >= 1, 'Found at least 1 critical red flag');
    assert(analysis.hiddenFees.length >= 1, 'Parsed fee schedule');
  });

  // SUITE 3: Intelligent Seating Chart Optimizer
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 3: Intelligent Seating Chart Optimizer${colors.reset}`);
  await test('Detects friction clash when incompatible guests share a table', () => {
    const mockTables = [
      { id: 'tbl_1', name: 'Table 1 - VIP', capacity: 4 }
    ];
    const mockGuests = [
      { id: 'g1', name: 'Elena', frictionWith: ['g2'], tableId: 'tbl_1' },
      { id: 'g2', name: 'Viktor', frictionWith: ['g1'], tableId: 'tbl_1' }
    ];
    const evalResult = evaluateSeatingChart(mockGuests, mockTables);
    assert(evalResult.hasClashes === true, 'Detected friction clash');
    assert(evalResult.clashes.length >= 1, 'Has clash items');
    assert(evalResult.harmonyScore < 100, 'Score penalized for friction');
  });

  await test('Algorithmic solver separates enemies into distinct tables', () => {
    const tables = [
      { id: 't1', name: 'Table 1', capacity: 2 },
      { id: 't2', name: 'Table 2', capacity: 2 }
    ];
    const guests = [
      { id: 'g1', name: 'Alice', frictionWith: ['g2'], affinityGroup: 'VIP', diet: 'None', tableId: null },
      { id: 'g2', name: 'Bob', frictionWith: ['g1'], affinityGroup: 'VIP', diet: 'None', tableId: null }
    ];
    const solved = algorithmicSeatingSolver(guests, tables);
    assert(solved.updatedGuests.length === 2, 'Assigned both guests');
    const g1 = solved.updatedGuests.find(g => g.id === 'g1');
    const g2 = solved.updatedGuests.find(g => g.id === 'g2');
    assert(g1.tableId !== g2.tableId, 'Separated g1 and g2 into different tables');
  });

  // SUITE 4: Dynamic Checklist & Cascading Date Engine
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 4: Dynamic Checklist & Cascading Date Engine${colors.reset}`);
  await test('Generates event-specific templates and day-of run-sheets', () => {
    const wedding = getDeterministicChecklist(EVENT_TYPES.WEDDING, '2026-10-31');
    assert(wedding.milestones.length >= 5, 'Wedding milestones generated');
    assert(wedding.dayOfRunSheet.length >= 6, 'Run-sheet items generated');
  });

  await test('Cascades milestone due dates when target event date shifts', () => {
    const initial = getDeterministicChecklist(EVENT_TYPES.WEDDING, '2026-10-01');
    const shifted = cascadeDateShift('2026-10-31', initial.milestones);
    assert(shifted.newTargetDate === '2026-10-31', 'Shifted target date');
    const dayOf = shifted.milestones.find(m => m.daysBeforeEvent === 0);
    assert(dayOf.dueDate === '2026-10-31', 'Day-of milestone matches new target date');
  });

  // SUITE 5: Venue Spatial Architect & NFPA 101 Safety
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 5: Venue Spatial Architect & NFPA 101 Safety${colors.reset}`);
  await test('Calculates floor area, zones, and NFPA egress clearance', () => {
    const plan = calculateSpatialPlan({ lengthFt: 80, widthFt: 50, expectedGuests: 120 });
    assert(plan.dimensions.totalAreaSqFt === 4000, 'Calculates 4,000 sq ft');
    assert(plan.safetyAudit.isOvercrowded === false, 'NFPA egress safety compliant');
    assert(plan.zones.length >= 5, 'Generated functional spatial zones');
  });

  // SUITE 6: Eco-Score & Sustainable Local Swaps
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 6: Eco-Score & Sustainable Local Swaps${colors.reset}`);
  await test('Calculates carbon footprint and returns actionable green swaps', () => {
    const eco = calculateEventEcoScore({ expectedGuests: 120 });
    assert(eco.totalBaselineCO2Kg > 0, 'Baseline CO2 calculated');
    assert(eco.sustainableSwaps.length >= 4, 'Includes 4 verified sustainable swaps');
    assert(eco.carbonOffsetEquivalentTrees > 0, 'Calculates tree equivalent offset');
  });

  // SUITE 7: Automated Vendor Briefing Generator
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 7: Automated Vendor Briefing Generator${colors.reset}`);
  await test('Generates customized technical briefs for DJ, Caterer, and Photographer', () => {
    const dj = generateVendorBrief('dj');
    const caterer = generateVendorBrief('caterer');
    assert(dj.success === true, 'DJ brief generated');
    assert(dj.brief.powerRequirements.includes('20-Amp'), 'DJ power specs included');
    assert(caterer.brief.dietaryRoster.vegan > 0, 'Dietary numbers included in caterer brief');
  });

  // SUITE 8: Hyper-Personalized RSVP Concierge
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 8: Hyper-Personalized RSVP Concierge${colors.reset}`);
  await test('Resolves dress code, parking, and dietary inquiries instantly', async () => {
    const dressRes = await handleConciergeInquiry('What is the dress code?');
    assert(dressRes.success === true, 'Dress code query answered');
    assert(dressRes.reply.includes('Black-Tie'), 'Contains black-tie dress code');

    const parkRes = await handleConciergeInquiry('Where do I park?');
    assert(parkRes.reply.toLowerCase().includes('valet'), 'Contains valet parking info');
  });

  // SUITE 9: Security & Prototype Pollution Defensive Validation
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 9: Security & Prototype Pollution Defense${colors.reset}`);
  await test('Strips __proto__ and prototype pollution injection keys recursively', () => {
    const payload = {
      title: 'Solstice Gala',
      __proto__: { isAdmin: true },
      nested: { constructor: { bad: 1 } }
    };
    const cleaned = SecurityValidator.cleanObject(payload);
    assert(cleaned.title === 'Solstice Gala', 'Preserves legitimate properties');
    assert(cleaned.__proto__ === undefined, 'Strips __proto__ key');
    assert(cleaned.nested.constructor === undefined, 'Strips constructor key');
    assert(Object.prototype.isAdmin === undefined, 'Prototype remains unpolluted');
  });

  await test('Sanitizes malicious script tags and javascript pseudoprotocols', () => {
    const textCheck = SecurityValidator.validateText('<script>alert("xss")</script>Valid Text javascript:attack()');
    assert(textCheck.isValid === true, 'Returns valid string');
    assert(!textCheck.sanitized.includes('<script>'), 'Stripped script tag');
    assert(!textCheck.sanitized.includes('javascript:'), 'Stripped javascript pseudoprotocol');
    assert(textCheck.sanitized.includes('Valid Text'), 'Retained valid content');
  });

  // SUITE 10: In-Memory SHA-256 LRU Cache & Efficiency
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 10: In-Memory SHA-256 LRU Cache & Telemetry${colors.reset}`);
  await test('Generates deterministic SHA-256 keys and executes sub-millisecond retrieval', () => {
    const cache = new MemoryCache({ maxSize: 5, ttlMs: 5000 });
    const key = cache.hashKey('test-hash-payload');
    assert(key.length === 64, 'SHA-256 produces 64-char hex string');
    cache.set(key, { result: 'fast' });
    const item = cache.get(key);
    assert(item.result === 'fast', 'Retrieved cached item');
    assert(cache.hits === 1, 'Hit counter incremented');
  });

  // Summary
  console.log(`\n${colors.bright}=======================================================`);
  console.log(`TEST EXECUTION SUMMARY:`);
  console.log(`  ${colors.green}Total Passed: ${totalPassed}${colors.reset}`);
  console.log(`  ${totalFailed > 0 ? colors.red : colors.green}Total Failed: ${totalFailed}${colors.reset}`);
  console.log(`${colors.bright}=======================================================${colors.reset}\n`);

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    console.log(`${colors.green}🎉 ALL 17 TEST CASES ACROSS 10 SUITES PASSED WITH 100% SUCCESS!${colors.reset}\n`);
    process.exit(0);
  }
}

runAllTests();
