/**
 * Unit Tests - Seating Chart Optimizer & Constraint Satisfaction Solver
 */

const { evaluateSeatingChart, algorithmicSeatingSolver } = require('../server/services/seatingOptimizer');

describe('Intelligent Seating Chart Optimizer', () => {
  const mockTables = [
    { id: 'tbl_1', name: 'Table 1 - VIP', capacity: 4 },
    { id: 'tbl_2', name: 'Table 2 - Friends', capacity: 4 }
  ];

  const mockGuests = [
    { id: 'g1', name: 'Elena', vip: true, affinityGroup: 'Bridal', diet: 'Vegan', frictionWith: ['g2'], tableId: 'tbl_1' },
    { id: 'g2', name: 'Viktor', vip: false, affinityGroup: 'College', diet: 'None', frictionWith: ['g1'], tableId: 'tbl_1' }, // Clash!
    { id: 'g3', name: 'Julian', vip: true, affinityGroup: 'Bridal', diet: 'None', frictionWith: [], tableId: 'tbl_1' }
  ];

  test('evaluateSeatingChart detects friction pair placed at same table', () => {
    const evaluation = evaluateSeatingChart(mockGuests, mockTables);

    expect(evaluation.hasClashes).toBe(true);
    expect(evaluation.clashes.length).toBeGreaterThan(0);
    const frictionClash = evaluation.clashes.find(c => c.type === 'friction_conflict');
    expect(frictionClash).toBeDefined();
    expect(frictionClash.message).toContain('Elena');
    expect(frictionClash.message).toContain('Viktor');
    expect(evaluation.harmonyScore).toBeLessThan(80);
  });

  test('algorithmicSeatingSolver automatically separates friction enemies', () => {
    // Reset table assignments
    const unassignedGuests = [
      { id: 'g1', name: 'Elena', vip: true, affinityGroup: 'Bridal', diet: 'Vegan', frictionWith: ['g2'], tableId: null },
      { id: 'g2', name: 'Viktor', vip: false, affinityGroup: 'College', diet: 'None', frictionWith: ['g1'], tableId: null },
      { id: 'g3', name: 'Julian', vip: true, affinityGroup: 'Bridal', diet: 'None', frictionWith: [], tableId: null },
      { id: 'g4', name: 'Chloe', vip: false, affinityGroup: 'College', diet: 'Vegan', frictionWith: [], tableId: null }
    ];

    const result = algorithmicSeatingSolver(unassignedGuests, mockTables);

    expect(result.updatedGuests).toBeDefined();
    expect(result.harmonyScore).toBeGreaterThanOrEqual(80);

    const elena = result.updatedGuests.find(g => g.id === 'g1');
    const viktor = result.updatedGuests.find(g => g.id === 'g2');

    expect(elena.tableId).toBeDefined();
    expect(viktor.tableId).toBeDefined();
    // HARD CONSTRAINT: Elena and Viktor MUST NOT be at the same table!
    expect(elena.tableId).not.toBe(viktor.tableId);
  });

  test('algorithmicSeatingSolver respects table capacity limits', () => {
    const smallTable = [{ id: 'tbl_small', name: 'Small Table', capacity: 2 }];
    const manyGuests = [
      { id: 'g1', name: 'G1', affinityGroup: 'A', frictionWith: [], tableId: null },
      { id: 'g2', name: 'G2', affinityGroup: 'A', frictionWith: [], tableId: null },
      { id: 'g3', name: 'G3', affinityGroup: 'A', frictionWith: [], tableId: null }
    ];

    const result = algorithmicSeatingSolver(manyGuests, smallTable);
    const seatedCount = result.updatedGuests.filter(g => g.tableId === 'tbl_small').length;
    expect(seatedCount).toBeLessThanOrEqual(2);
  });
});
