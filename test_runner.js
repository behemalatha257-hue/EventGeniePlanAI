/**
 * EventGeniePlan AI - Standalone Zero-Dependency Automated Test Runner
 * Executes unit & integration tests across all core and innovative next-gen engines
 */

const { calculateBudgetHealth, predictCostOverrun, calculateRedistribution } = require('./server/services/budgetEngine');
const { fallbackContractParser } = require('./server/services/contractParser');
const { evaluateSeatingChart, algorithmicSeatingSolver } = require('./server/services/seatingOptimizer');
const { getDeterministicChecklist, cascadeDateShift } = require('./server/services/checklistEngine');
const { calculateSpatialPlan } = require('./server/services/spatialEngine');
const { calculateEventEcoScore } = require('./server/services/ecoScoreEngine');
const { generateVendorBrief } = require('./server/services/vendorBriefingEngine');
const { handleConciergeInquiry } = require('./server/services/rsvpConcierge');
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
  console.log(`=======================================================${colors.reset}`);

  // SUITE 1: Budget Strategy & Health Engine
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 1: Budget Strategy & Health Engine${colors.reset}`);
  const sampleCategories = [
    { id: 'cat_venue', name: 'Venue Rental', allocated: 14000, spent: 14500 },
    { id: 'cat_catering', name: 'Catering & Bar', allocated: 16000, spent: 11200 },
    { id: 'cat_contingency', name: 'Emergency Contingency', allocated: 1500, spent: 0 }
  ];

  await test('Calculates budget health score and detects category overruns', () => {
    const health = calculateBudgetHealth(45000, sampleCategories, 45);
    assert(health.totalBudget === 45000, 'Total budget matches');
    assert(health.hasOverruns === true, 'Detects overruns');
    assert(health.overruns.length === 1, 'Exactly 1 category over budget');
    assert(health.overruns[0].overAmount === 500, 'Overrun amount is 500');
    assert(health.score >= 0 && health.score <= 100, 'Score is 0-100');
  });

  await test('Forecasts burn rate and overrun probability', () => {
    const pred = predictCostOverrun(45000, sampleCategories, 45, 30);
    assert(pred.dailyBurnRate > 0, 'Daily burn rate is positive');
    assert(pred.projectedFinalCost > 0, 'Projected cost is positive');
    assert(typeof pred.isProjectedOverrun === 'boolean', 'Has boolean overrun flag');
  });

  await test('Real-time dynamic redistribution stabilizes budget deficit', () => {
    const redis = calculateRedistribution(45000, sampleCategories);
    assert(redis.needed === true, 'Redistribution is needed');
    assert(redis.totalDeficit === 500, 'Deficit matches 500');
    assert(redis.coveredAmount === 500, 'All 500 deficit covered');
    assert(redis.uncoveredDeficit === 0, 'Zero uncovered deficit left');
  });

  // SUITE 2: Smart Vendor Contract Parser
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 2: Smart Vendor Contract Parser & Risk Analyzer${colors.reset}`);
  const venueContract = SAMPLE_CONTRACTS.find(s => s.id === 'venue_luminary_estate');

  await test('Extracts hidden administrative, corkage and overtime fees', () => {
    const analysis = fallbackContractParser(venueContract.text);
    assert(analysis.riskScore >= 60, 'Venue agreement flagged with high risk score');
    const feeNames = analysis.hiddenFees.map(f => f.feeName.toLowerCase());
    assert(feeNames.some(n => n.includes('administrative')), 'Found administrative fee');
    assert(feeNames.some(n => n.includes('corkage')), 'Found corkage fee');
    assert(feeNames.some(n => n.includes('overtime')), 'Found overtime penalty');
  });

  await test('Flags unilateral termination and non-refundable deposit schedules', () => {
    const analysis = fallbackContractParser(venueContract.text);
    assert(analysis.redFlags.length >= 2, 'Multiple red flags identified');
    const hasUnilateral = analysis.redFlags.some(f => f.toLowerCase().includes('unilateral'));
    assert(hasUnilateral, 'Unilateral cancellation red flag present');
    assert(analysis.actionableRecommendations.length > 0, 'Actionable counter-proposals provided');
  });

  // SUITE 3: Intelligent Seating Chart Optimizer
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 3: Intelligent Seating Chart Optimizer${colors.reset}`);
  const mockTables = [
    { id: 'tbl_1', name: 'VIP Table', capacity: 4 },
    { id: 'tbl_2', name: 'Friends Table', capacity: 4 }
  ];

  const mockGuests = [
    { id: 'g1', name: 'Elena', vip: true, affinityGroup: 'Bridal', diet: 'Vegan', frictionWith: ['g2'], tableId: 'tbl_1' },
    { id: 'g2', name: 'Viktor', vip: false, affinityGroup: 'College', diet: 'None', frictionWith: ['g1'], tableId: 'tbl_1' }
  ];

  await test('Detects friction clash when incompatible guests share a table', () => {
    const evalResult = evaluateSeatingChart(mockGuests, mockTables);
    assert(evalResult.hasClashes === true, 'Detected clash between Elena and Viktor');
    assert(evalResult.clashes[0].type === 'friction_conflict', 'Clash marked as friction conflict');
    assert(evalResult.harmonyScore < 70, 'Harmony score penalized for friction');
  });

  await test('Algorithmic solver separates enemies into distinct tables', () => {
    const unassigned = [
      { id: 'g1', name: 'Elena', vip: true, affinityGroup: 'Bridal', diet: 'Vegan', frictionWith: ['g2'], tableId: null },
      { id: 'g2', name: 'Viktor', vip: false, affinityGroup: 'College', diet: 'None', frictionWith: ['g1'], tableId: null }
    ];

    const solved = algorithmicSeatingSolver(unassigned, mockTables);
    const g1 = solved.updatedGuests.find(g => g.id === 'g1');
    const g2 = solved.updatedGuests.find(g => g.id === 'g2');
    assert(g1.tableId !== g2.tableId, 'Hard constraint satisfied: Elena and Viktor are at separate tables');
    assert(solved.harmonyScore >= 80, 'Harmony score recovered above 80%');
  });

  // SUITE 4: Dynamic Checklist & Cascading Date Engine
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 4: Dynamic Checklist & Cascading Date Engine${colors.reset}`);
  await test('Generates event-specific templates and day-of run-sheets', () => {
    const wedding = getDeterministicChecklist(EVENT_TYPES.WEDDING, '2026-12-15');
    assert(wedding.milestones.length >= 6, 'Contains at least 6 milestone phases');
    assert(wedding.dayOfRunSheet.length >= 6, 'Contains full day-of run-sheet');
  });

  await test('Cascades milestone due dates when target event date shifts', () => {
    const initial = getDeterministicChecklist(EVENT_TYPES.WEDDING, '2026-10-01');
    const shifted = cascadeDateShift('2026-10-31', initial.milestones);
    assert(shifted.newTargetDate === '2026-10-31', 'New target date matches');
    const dayOf = shifted.milestones.find(m => m.daysBeforeEvent === 0);
    assert(dayOf.dueDate === '2026-10-31', 'Day-of milestone shifted to 2026-10-31');
  });

  // SUITE 5: Venue Spatial Architect Engine
  console.log(`\n${colors.bright}${colors.cyan}▶ Test Suite 5: Venue Spatial Architect & NFPA 101 Safety${colors.reset}`);
  await test('Calculates floor area, zones, and NFPA egress clearance', () => {
    const plan = calculateSpatialPlan({ lengthFt: 80, widthFt: 50, expectedGuests: 120 });
    assert(plan.dimensions.totalAreaSqFt === 4000, 'Total area is 4,000 sq ft');
    assert(plan.metrics.requiredBanquetSqFt === 1800, 'Banquet requires 1,800 sq ft');
    assert(plan.safetyAudit.isOvercrowded === false, 'Safe occupancy verified');
    assert(plan.zones.length >= 5, 'Contains 5+ functional floorplan zones');
  });

  // SUITE 6: Eco-Score & Sustainability Engine
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

  // Summary
  console.log(`\n${colors.bright}=======================================================`);
  console.log(`TEST EXECUTION SUMMARY:`);
  console.log(`  ${colors.green}Total Passed: ${totalPassed}${colors.reset}`);
  console.log(`  ${totalFailed > 0 ? colors.red : colors.green}Total Failed: ${totalFailed}${colors.reset}`);
  console.log(`${colors.bright}=======================================================${colors.reset}\n`);

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    console.log(`${colors.green}🎉 ALL 14 TEST CASES ACROSS 8 SUITES PASSED WITH 100% SUCCESS!${colors.reset}\n`);
    process.exit(0);
  }
}

runAllTests();
