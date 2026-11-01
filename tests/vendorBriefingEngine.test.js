/**
 * Unit Tests - Automated Vendor Briefing Engine
 */

const { generateVendorBrief } = require('../server/services/vendorBriefingEngine');

describe('Automated Vendor Briefing Generator', () => {
  test('generates tailored SLA briefs for DJ, Caterer, and Photographer', () => {
    const djBrief = generateVendorBrief('dj');
    expect(djBrief.success).toBe(true);
    expect(djBrief.brief.role).toContain('Entertainment');
    expect(djBrief.brief.loadInTime).toBeDefined();
    expect(djBrief.brief.powerRequirements).toBeDefined();

    const catererBrief = generateVendorBrief('caterer');
    expect(catererBrief.brief.role).toContain('Banquet');
    expect(catererBrief.brief.dietaryRoster).toBeDefined();
    expect(catererBrief.brief.dietaryRoster.vegan).toBeGreaterThan(0);

    const photoBrief = generateVendorBrief('photographer');
    expect(photoBrief.brief.mustHaveShotList.length).toBeGreaterThan(0);
  });
});
