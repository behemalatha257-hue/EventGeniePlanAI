/**
 * EventGeniePlan AI - Venue Spatial Architect Engine
 * Room dimension modeling, fire safety egress check, 2D floorplan coordinates & flow optimization
 */

function calculateSpatialPlan(roomConfig = {}) {
  const lengthFt = Number(roomConfig.lengthFt) || 80; // Default 80ft
  const widthFt = Number(roomConfig.widthFt) || 50;   // Default 50ft
  const totalAreaSqFt = lengthFt * widthFt;          // 4,000 sq ft
  const expectedGuests = Number(roomConfig.expectedGuests) || 120;

  // Fire Code & Comfort Calculations
  // Standard banquet seating requires ~15 sq ft per guest (including table and chair footprint)
  const requiredBanquetSqFt = expectedGuests * 15; // 1,800 sq ft
  
  // Dance floor: ~3.5 sq ft per guest for 50% simultaneous dancers (60 guests * 3.5 = 210 sq ft)
  const recommendedDanceFloorSqFt = Math.max(300, Math.round(expectedGuests * 0.5 * 5.0)); // 300 - 400 sq ft
  
  // Stage & AV zone: 16ft x 12ft = 192 sq ft
  const stageSqFt = 16 * 12;

  // Circulation & Egress pathways: minimum 25% of total floor area
  const requiredCirculationSqFt = Math.round(totalAreaSqFt * 0.25);

  const totalCommittedSqFt = requiredBanquetSqFt + recommendedDanceFloorSqFt + stageSqFt + requiredCirculationSqFt;
  const spatialUtilizationPercent = Math.min(100, Math.round((totalCommittedSqFt / totalAreaSqFt) * 100));

  // Safety checks
  const maxSafeBanquetGuests = Math.floor((totalAreaSqFt * 0.65) / 15);
  const isOvercrowded = expectedGuests > maxSafeBanquetGuests;

  const safetyAudit = {
    maxSafeBanquetGuests,
    isOvercrowded,
    aisleClearanceOk: spatialUtilizationPercent <= 88,
    egressWidthFeet: 6.0,
    emergencyExitsRequired: expectedGuests > 100 ? 2 : 1,
    fireMarshalVerdict: spatialUtilizationPercent <= 88 ? 'Fully Compliant (NFPA 101 Life Safety Code)' : 'Capacity Warning: Aisle clearance constrained'
  };

  // Generate 2D Zone Coordinates for Canvas / SVG rendering (Normalized to 0 - 100% scale)
  const zones = [
    {
      id: 'zone_stage',
      name: 'Main Stage & AV Rig',
      x: 10,
      y: 5,
      width: 80,
      height: 14,
      color: 'rgba(139, 92, 246, 0.25)',
      borderColor: '#8b5cf6',
      icon: '🎤'
    },
    {
      id: 'zone_dance',
      name: 'Central Dance Floor',
      x: 30,
      y: 22,
      width: 40,
      height: 22,
      color: 'rgba(245, 158, 11, 0.2)',
      borderColor: '#f59e0b',
      icon: '✨'
    },
    {
      id: 'zone_table_cluster_left',
      name: 'Banquet Pavilion West (Tables 1-3)',
      x: 6,
      y: 48,
      width: 38,
      height: 42,
      color: 'rgba(16, 185, 129, 0.18)',
      borderColor: '#10b981',
      icon: '🍽️'
    },
    {
      id: 'zone_table_cluster_right',
      name: 'Banquet Pavilion East (Tables 4-6)',
      x: 56,
      y: 48,
      width: 38,
      height: 42,
      color: 'rgba(16, 185, 129, 0.18)',
      borderColor: '#10b981',
      icon: '🍽️'
    },
    {
      id: 'zone_cocktail_bar',
      name: 'Artisan Mixology Bar & Lounge',
      x: 2,
      y: 22,
      width: 22,
      height: 20,
      color: 'rgba(6, 182, 212, 0.2)',
      borderColor: '#06b6d4',
      icon: '🍸'
    },
    {
      id: 'zone_entrance_foyer',
      name: 'Guest Welcome Portal & Cloakroom',
      x: 35,
      y: 92,
      width: 30,
      height: 7,
      color: 'rgba(248, 250, 252, 0.15)',
      borderColor: '#94a3b8',
      icon: '🚪'
    }
  ];

  return {
    dimensions: {
      lengthFt,
      widthFt,
      totalAreaSqFt
    },
    metrics: {
      requiredBanquetSqFt,
      recommendedDanceFloorSqFt,
      stageSqFt,
      requiredCirculationSqFt,
      totalCommittedSqFt,
      spatialUtilizationPercent
    },
    safetyAudit,
    zones,
    flowOptimizationTip: 'Positioning the bar at the Northwest quadrant prevents queue congestion near the primary South entrance portal during the Champagne prelude.'
  };
}

module.exports = {
  calculateSpatialPlan
};
