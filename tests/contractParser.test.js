/**
 * Unit Tests - Smart Vendor Contract Parser & Risk Analyzer
 */

const { fallbackContractParser } = require('../server/services/contractParser');
const { SAMPLE_CONTRACTS } = require('../server/data/sampleContracts');

describe('Smart Vendor Contract Parser', () => {
  test('parses venue agreement with administrative fee, corkage and overtime penalties', () => {
    const venueContract = SAMPLE_CONTRACTS.find(s => s.id === 'venue_luminary_estate');
    expect(venueContract).toBeDefined();

    const result = fallbackContractParser(venueContract.text);
    expect(result).toBeDefined();
    expect(result.riskScore).toBeGreaterThanOrEqual(60);
    expect(['High', 'Critical']).toContain(result.riskLevel);

    // Check hidden fees
    const feeNames = result.hiddenFees.map(f => f.feeName.toLowerCase());
    expect(feeNames.some(n => n.includes('administrative'))).toBe(true);
    expect(feeNames.some(n => n.includes('corkage'))).toBe(true);
    expect(feeNames.some(n => n.includes('overtime'))).toBe(true);

    // Check red flags
    expect(result.redFlags.length).toBeGreaterThan(0);
    const hasUnilateralFlag = result.redFlags.some(f => f.toLowerCase().includes('unilateral'));
    expect(hasUnilateralFlag).toBe(true);

    // Check actionable counter-proposals
    expect(result.actionableRecommendations.length).toBeGreaterThan(0);
  });

  test('parses catering contract and identifies price escalation and gratuity', () => {
    const cateringContract = SAMPLE_CONTRACTS.find(s => s.id === 'catering_artisan_culinary');
    expect(cateringContract).toBeDefined();

    const result = fallbackContractParser(cateringContract.text);
    expect(result.riskScore).toBeGreaterThan(0);

    const hasEscalation = result.redFlags.some(f => f.toLowerCase().includes('escalation'));
    expect(hasEscalation).toBe(true);
  });

  test('safely handles empty or minimal input without crashing', () => {
    const result = fallbackContractParser('');
    expect(result).toBeDefined();
    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.riskLevel).toBeDefined();
  });
});
