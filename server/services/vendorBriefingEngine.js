/**
 * EventGeniePlan AI - Automated Vendor Briefing Generator
 * Generates tailored operational run-sheets, technical riders & SLA requirement briefs for vendors
 */

function generateVendorBrief(vendorType = 'dj', eventData = {}) {
  const eventTitle = eventData.title || "Aria & Julian's Grand Solstice Gala Wedding";
  const eventDate = eventData.targetDate || '2026-12-15';
  const venue = eventData.venue || 'The Grand Luminary Estate, Glasshouse Terrace';
  const guestCount = eventData.expectedGuests || 120;

  const briefs = {
    dj: {
      role: 'Audio/Visual & Live Entertainment Lead',
      vendorCategory: 'Sound & Music Production',
      contractReference: 'SLA-2026-AV-092',
      loadInTime: '09:00 AM sharp (Loading Dock Bay 3)',
      soundCheckTime: '10:30 AM - 11:30 AM (Strict Curfew)',
      performanceWindow: '03:30 PM - 11:30 PM',
      powerRequirements: 'Two dedicated 20-Amp circuits within 25ft of DJ Booth. No daisy-chaining.',
      noiseDecibelLimit: '88 dB max after 10:00 PM per local municipal noise ordinance',
      keyCues: [
        { time: '03:30 PM', cue: 'Guest Prelude', description: 'Modern instrumental jazz & acoustic chill' },
        { time: '04:30 PM', cue: 'Ceremonial Processional', description: 'Fade in "Canon in D Modern Acoustic" on cue from Lead Coordinator' },
        { time: '07:00 PM', cue: 'Grand Entrance & Toasts', description: 'Wireless mic handoff to Best Man & Maid of Honor; duck background track by -18dB' },
        { time: '08:45 PM', cue: 'First Dance & High-Energy Floor', description: 'Kickoff spotlight track followed by upbeat motown/funk progression' }
      ],
      deliverables: [
        '2x Wireless handheld cardioid microphones with fresh lithium batteries',
        'Subwoofer isolation pad to prevent glasshouse resonance',
        'DJ booth scrim & cable cable-ramps over main foot-traffic paths'
      ]
    },

    caterer: {
      role: 'Executive Banquet & Hospitality Captain',
      vendorCategory: 'Catering & Beverage Operations',
      contractReference: 'CAT-2026-LUM-114',
      loadInTime: '11:00 AM (Kitchen Galley Access)',
      kitchenInspection: '02:00 PM with Health & Safety Officer',
      serviceWindows: [
        { time: '05:45 PM - 07:00 PM', service: 'Passed Canapés & Signature Cocktails', notes: 'Maintain 1 server per 20 guests' },
        { time: '07:15 PM - 08:30 PM', service: '3-Course Plated Dinner Service', notes: 'Synchronized table drop; ensure dietary cards match seating chart' },
        { time: '10:15 PM', service: 'Late-Night Espresso & Savory Sliders Bar', notes: 'Station located near lounge exit' }
      ],
      dietaryRoster: {
        totalGuaranteedGuests: guestCount,
        vegan: 4,
        nutAllergy: 3,
        halal: 2,
        glutenFree: 3,
        actionRequired: 'Allergen meals must be pre-plated with labeled cloches to prevent cross-contamination.'
      },
      headcountLockDate: 'Final headcount strictly locked 21 calendar days prior.'
    },

    photographer: {
      role: 'Principal Cinematographer & Visual Director',
      vendorCategory: 'Photography & Media',
      contractReference: 'PHOTO-2026-SOL-04',
      callTime: '01:00 PM at Bridal Suite',
      coverageDuration: '8 Hours continuous coverage (01:00 PM - 09:00 PM)',
      goldenHourWindow: '05:45 PM - 06:15 PM (Sunset Conservatory Portraits)',
      mustHaveShotList: [
        'First look at the Glasshouse Conservatory Reflection Pool',
        'Candid guest reactions during heartfelt toasts',
        'Architectural wide shot of banquet tablescape before guest entry',
        'Couple send-off under twilight terrace string lights'
      ],
      crewHospitality: '2x Hot vendor meals and non-alcoholic beverage access during banquet service (07:15 PM).'
    },

    florist: {
      role: 'Floral Architect & Botanical Scenography Lead',
      vendorCategory: 'Decor & Floristry',
      contractReference: 'FLOR-2026-AUR-88',
      loadInTime: '10:00 AM - 01:00 PM (Climate-controlled ballroom setup)',
      breakdownCurfew: '11:45 PM - 01:00 AM sharp',
      installations: [
        'Ceremonial arch with living Italian ruscus, white delphinium & eucalyptus',
        '12x Elevated floral compotes for banquet round tables with hurricane candles',
        'Welcome foyer architectural urn statement arrangement'
      ],
      sustainabilityNote: '100% foam-free mechanics; floral stems pre-soaked in water tubes.'
    }
  };

  const selectedBrief = briefs[vendorType.toLowerCase()] || briefs.dj;

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    event: {
      title: eventTitle,
      date: eventDate,
      venue: venue,
      expectedGuests: guestCount
    },
    brief: selectedBrief
  };
}

module.exports = {
  generateVendorBrief
};
