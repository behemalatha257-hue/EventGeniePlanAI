/**
 * Unit Tests - Budget Health Scoring, Overrun Prediction & Dynamic Redistribution
 */

const { calculateBudgetHealth, predictCostOverrun, calculateRedistribution } = require('../server/services/budgetEngine');

describe('Budget Strategy & Health Engine', () => {
  const sampleCategories = [
    { id: 'cat_venue', name: 'Venue Rental', allocated: 14000, spent: 14500 }, // $500 overrun
    { id: 'cat_catering', name: 'Catering & Bar', allocated: 16000, spent: 11200 }, // $4800 surplus
    { id: 'cat_photo', name: 'Photography', allocated: 5500, spent: 3000 },
    { id: 'cat_contingency', name: 'Emergency Contingency', allocated: 1500, spent: 0 }
  ];

  test('calculateBudgetHealth detects category overrun and scores accordingly', () => {
    const health = calculateBudgetHealth(45000, sampleCategories, 45);

    expect(health).toBeDefined();
    expect(health.totalBudget).toBe(45000);
    expect(health.hasOverruns).toBe(true);
    expect(health.overruns.length).toBe(1);
    expect(health.overruns[0].name).toBe('Venue Rental');
    expect(health.overruns[0].overAmount).toBe(500);
    expect(health.score).toBeGreaterThan(0);
    expect(health.score).toBeLessThanOrEqual(100);
  });

  test('calculateBudgetHealth marks healthy budget as optimal', () => {
    const perfectCategories = [
      { id: 'cat_venue', name: 'Venue Rental', allocated: 10000, spent: 8000 },
      { id: 'cat_catering', name: 'Catering', allocated: 15000, spent: 10000 },
      { id: 'cat_contingency', name: 'Contingency', allocated: 5000, spent: 0 }
    ];

    const health = calculateBudgetHealth(30000, perfectCategories, 60);
    expect(health.hasOverruns).toBe(false);
    expect(health.status).toBe('healthy');
    expect(health.score).toBeGreaterThanOrEqual(80);
  });

  test('predictCostOverrun projects realistic burn rate and overrun probability', () => {
    const prediction = predictCostOverrun(45000, sampleCategories, 45, 30);

    expect(prediction).toBeDefined();
    expect(prediction.dailyBurnRate).toBeGreaterThan(0);
    expect(prediction.projectedFinalCost).toBeGreaterThan(0);
    expect(typeof prediction.isProjectedOverrun).toBe('boolean');
    expect(prediction.overrunProbabilityPercent).toBeGreaterThanOrEqual(0);
  });

  test('calculateRedistribution automatically rebalances overruns using contingency and surplus', () => {
    const result = calculateRedistribution(45000, sampleCategories);

    expect(result.needed).toBe(true);
    expect(result.totalDeficit).toBe(500);
    expect(result.coveredAmount).toBe(500);
    expect(result.uncoveredDeficit).toBe(0);
    expect(result.transfers.length).toBeGreaterThan(0);

    // Verify Venue is now covered
    const venueCat = result.updatedCategories.find(c => c.id === 'cat_venue');
    expect(venueCat.allocated).toBe(14500);
    expect(venueCat.status).toBe('rebalanced');
  });
});
