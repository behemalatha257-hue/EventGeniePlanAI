/**
 * Unit Tests - Venue Spatial Architect Engine
 */

const { calculateSpatialPlan } = require('../server/services/spatialEngine');

describe('Venue Spatial Architect Engine', () => {
  test('calculates correct area and NFPA egress safety compliance for 80x50 room', () => {
    const plan = calculateSpatialPlan({ lengthFt: 80, widthFt: 50, expectedGuests: 120 });

    expect(plan).toBeDefined();
    expect(plan.dimensions.totalAreaSqFt).toBe(4000);
    expect(plan.metrics.requiredBanquetSqFt).toBe(1800); // 120 * 15 sq ft
    expect(plan.metrics.recommendedDanceFloorSqFt).toBeGreaterThanOrEqual(300);
    expect(plan.safetyAudit.isOvercrowded).toBe(false);
    expect(plan.safetyAudit.fireMarshalVerdict).toContain('Fully Compliant');
    expect(plan.zones.length).toBeGreaterThanOrEqual(5);

    const hasStage = plan.zones.some(z => z.id === 'zone_stage');
    const hasDance = plan.zones.some(z => z.id === 'zone_dance');
    expect(hasStage).toBe(true);
    expect(hasDance).toBe(true);
  });

  test('flags overcrowding when guest count exceeds safety threshold', () => {
    const overcrowdedPlan = calculateSpatialPlan({ lengthFt: 40, widthFt: 30, expectedGuests: 250 });
    expect(overcrowdedPlan.safetyAudit.isOvercrowded).toBe(true);
  });
});
