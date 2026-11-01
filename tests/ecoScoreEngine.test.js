/**
 * Unit Tests - Eco-Score & Sustainability Engine
 */

const { calculateEventEcoScore } = require('../server/services/ecoScoreEngine');

describe('Eco-Score & Sustainability Engine', () => {
  test('calculates realistic carbon footprint for 120 guests', () => {
    const result = calculateEventEcoScore({ expectedGuests: 120 });

    expect(result).toBeDefined();
    expect(result.totalBaselineCO2Kg).toBeGreaterThan(0);
    expect(result.baselineEcoScore).toBeGreaterThanOrEqual(40);
    expect(result.baselineEcoScore).toBeLessThanOrEqual(95);
    expect(result.sustainableSwaps.length).toBeGreaterThanOrEqual(3);

    const hasFloralSwap = result.sustainableSwaps.some(s => s.category.includes('Floral'));
    expect(hasFloralSwap).toBe(true);

    expect(result.carbonOffsetEquivalentTrees).toBeGreaterThan(0);
  });
});
