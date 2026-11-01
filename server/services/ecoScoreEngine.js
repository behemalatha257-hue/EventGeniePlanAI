/**
 * EventGeniePlan AI - Eco-Score & Sustainability Engine
 * Calculates event carbon footprint (kg CO2e), waste index, and sustainable local swaps
 */

function calculateEventEcoScore(eventData = {}) {
  const guestCount = eventData.expectedGuests || 120;
  const venueType = eventData.venueType || 'Glasshouse Estate'; // Glasshouse, Hotel, Outdoor, Convention
  
  // Baseline benchmarks (kg CO2e per guest)
  // Industry average for standard gala/wedding is ~55-80 kg CO2e per attendee (catering, transport, energy, decor)
  let transportCO2 = guestCount * 28; // Average regional travel
  let cateringCO2 = guestCount * 18;  // Standard meat-inclusive banquet
  let energyCO2 = guestCount * 12;    // Lighting, HVAC, sound rigging
  let decorWasteCO2 = guestCount * 9; // Cut flowers, single-use printed items

  // Potential reductions with green swaps
  const sustainableSwaps = [
    {
      id: 'swap_floral',
      category: 'Floral & Decor',
      title: 'Local Seasonal Wildflowers vs. Air-Freighted Dutch Blooms',
      description: 'Source 100% locally farmed seasonal blooms and potted living plants that guests can take home.',
      co2SavingsKg: Math.round(guestCount * 5.2),
      costImpact: '-$650 (Cost Saving)',
      adopted: false
    },
    {
      id: 'swap_catering',
      category: 'Catering & Dining',
      title: 'Plant-Forward 50/50 Menu & Local Farm Sourcing',
      description: 'Transition 50% of banquet courses to regenerative organic plant-forward gourmet cuisine.',
      co2SavingsKg: Math.round(guestCount * 7.8),
      costImpact: '-$800 (Cost Saving)',
      adopted: false
    },
    {
      id: 'swap_signage',
      category: 'Logistics & Paper',
      title: 'Digital E-Ink Displays & Recycled Seed-Paper Menus',
      description: 'Eliminate 100% of single-use foam boards and lamination with NFC tap signage and plantable menus.',
      co2SavingsKg: Math.round(guestCount * 2.1),
      costImpact: '-$220 (Cost Saving)',
      adopted: false
    },
    {
      id: 'swap_transport',
      category: 'Transportation',
      title: 'Chartered Electric Hybrid Shuttle from Downtown Hub',
      description: 'Provide two 30-passenger chartered hybrid shuttles from the primary hotel block to cut 45 individual car trips.',
      co2SavingsKg: Math.round(guestCount * 11.4),
      costImpact: '+$400 (Modest Investment)',
      adopted: false
    }
  ];

  const totalBaselineCO2 = transportCO2 + cateringCO2 + energyCO2 + decorWasteCO2;
  const potentialSavings = sustainableSwaps.reduce((sum, s) => sum + s.co2SavingsKg, 0);
  const optimizedCO2 = totalBaselineCO2 - potentialSavings;

  // Eco-Score: 0 to 100 (100 = Carbon Neutral / Zero Waste)
  const baselineScore = Math.max(35, Math.min(85, Math.round(100 - (totalBaselineCO2 / (guestCount * 90)) * 50)));
  const optimizedScore = Math.min(96, baselineScore + 32);

  return {
    baselineEcoScore: baselineScore,
    optimizedEcoScore: optimizedScore,
    currentScore: baselineScore,
    rating: baselineScore > 75 ? 'Certified Green' : (baselineScore > 50 ? 'Moderate Footprint' : 'High Environmental Impact'),
    totalBaselineCO2Kg: totalBaselineCO2,
    optimizedCO2Kg: optimizedCO2,
    totalPotentialSavingsKg: potentialSavings,
    carbonOffsetEquivalentTrees: Math.round(potentialSavings / 21), // ~21 kg CO2 absorbed per tree per year
    breakdown: {
      transportCO2,
      cateringCO2,
      energyCO2,
      decorWasteCO2
    },
    sustainableSwaps
  };
}

module.exports = {
  calculateEventEcoScore
};
