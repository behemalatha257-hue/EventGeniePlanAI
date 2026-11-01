/**
 * EventGeniePlan AI - Default Event Seed Data
 */

function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

const DEFAULT_EVENT = {
  id: 'evt_emerald_gala_2026',
  title: "Aria & Julian's Grand Solstice Gala Wedding",
  eventType: 'Wedding',
  targetDate: getFutureDate(45), // 45 days from today
  venue: 'The Grand Luminary Estate, Glasshouse Terrace',
  expectedGuests: 120,
  confirmedRsvps: 98,
  currency: 'USD',
  totalBudget: 45000,
  spentBudget: 32600,
  contingencyBudget: 4500,

  // Financial Category Tracking
  budgetCategories: [
    { id: 'cat_venue', name: 'Venue Rental', allocated: 14000, spent: 14500, status: 'warning', note: 'Deposit paid + extra hour booked' },
    { id: 'cat_catering', name: 'Catering & Bar', allocated: 16000, spent: 11200, status: 'safe', note: 'Final guest headcount pending' },
    { id: 'cat_photo', name: 'Photography & Cinema', allocated: 5500, spent: 3000, status: 'safe', note: 'Half deposit cleared' },
    { id: 'cat_decor', name: 'Floral & Decor Scenography', allocated: 4500, spent: 2400, status: 'safe', note: 'Arch and table centerpieces' },
    { id: 'cat_music', name: 'Live Band & DJ Sound', allocated: 3500, spent: 1500, status: 'safe', note: '5-piece jazz ensemble' },
    { id: 'cat_contingency', name: 'Emergency Contingency', allocated: 1500, spent: 0, status: 'safe', note: 'Buffer for overtime or weather shifts' }
  ],

  // Seating Chart & Guest List
  tables: [
    { id: 'tbl_1', name: 'Table 1 - Head / VIP', shape: 'round', capacity: 8, assignedGuests: ['gst_1', 'gst_2', 'gst_3', 'gst_4'] },
    { id: 'tbl_2', name: 'Table 2 - College Circle', shape: 'round', capacity: 8, assignedGuests: ['gst_5', 'gst_6', 'gst_7'] },
    { id: 'tbl_3', name: 'Table 3 - Family Heritage', shape: 'round', capacity: 8, assignedGuests: ['gst_8', 'gst_9', 'gst_10'] },
    { id: 'tbl_4', name: 'Table 4 - Creative Partners', shape: 'round', capacity: 8, assignedGuests: [] }
  ],

  guests: [
    { id: 'gst_1', name: 'Aria Montgomery', vip: true, tableId: 'tbl_1', diet: 'None', affinityGroup: 'Bridal Party', frictionWith: [] },
    { id: 'gst_2', name: 'Julian Vance', vip: true, tableId: 'tbl_1', diet: 'None', affinityGroup: 'Groom Party', frictionWith: [] },
    { id: 'gst_3', name: 'Elena Rostova', vip: true, tableId: 'tbl_1', diet: 'Vegan', affinityGroup: 'Bridal Party', frictionWith: ['gst_6'] },
    { id: 'gst_4', name: 'Marcus Sterling', vip: true, tableId: 'tbl_1', diet: 'Gluten-Free', affinityGroup: 'VIP Friends', frictionWith: [] },
    
    { id: 'gst_5', name: 'David Kim', vip: false, tableId: 'tbl_2', diet: 'Halal', affinityGroup: 'College Friends', frictionWith: [] },
    { id: 'gst_6', name: 'Viktor Drake', vip: false, tableId: 'tbl_2', diet: 'None', affinityGroup: 'College Friends', frictionWith: ['gst_3'] }, // Friction with Elena
    { id: 'gst_7', name: 'Chloe Chen', vip: false, tableId: 'tbl_2', diet: 'Nut Allergy', affinityGroup: 'College Friends', frictionWith: [] },

    { id: 'gst_8', name: 'Uncle Arthur Vance', vip: false, tableId: 'tbl_3', diet: 'Low Sodium', affinityGroup: 'Family', frictionWith: ['gst_9'] }, // Friction with Aunt Beatrice
    { id: 'gst_9', name: 'Aunt Beatrice Vance', vip: false, tableId: 'tbl_3', diet: 'Vegetarian', affinityGroup: 'Family', frictionWith: ['gst_8'] }, // Conflict!
    { id: 'gst_10', name: 'Cousin Lucas Vance', vip: false, tableId: 'tbl_3', diet: 'None', affinityGroup: 'Family', frictionWith: [] },

    // Unassigned guests ready for optimization
    { id: 'gst_11', name: 'Sophia Lorenzi', vip: false, tableId: null, diet: 'Vegan', affinityGroup: 'Creative Partners', frictionWith: [] },
    { id: 'gst_12', name: 'Mateo Morales', vip: false, tableId: null, diet: 'Vegan', affinityGroup: 'Creative Partners', frictionWith: [] },
    { id: 'gst_13', name: 'Dr. Gregory House', vip: false, tableId: null, diet: 'Gluten-Free', affinityGroup: 'Family', frictionWith: ['gst_8'] },
    { id: 'gst_14', name: 'Seraphina Reed', vip: false, tableId: null, diet: 'Nut Allergy', affinityGroup: 'Bridal Party', frictionWith: [] }
  ],

  // Dynamic Milestones with Days-Before-Event Offsets
  milestones: [
    {
      id: 'ms_1',
      title: 'Finalize Floorplan & Seating Allocations',
      phase: '30 Days Out',
      daysBeforeEvent: 30,
      dueDate: getFutureDate(15),
      completed: true,
      category: 'Logistics',
      owner: 'Event Planner',
      priority: 'High',
      dependentOn: []
    },
    {
      id: 'ms_2',
      title: 'Vendor Contract Final Signatures & Deposit 2',
      phase: '21 Days Out',
      daysBeforeEvent: 21,
      dueDate: getFutureDate(24),
      completed: true,
      category: 'Finance',
      owner: 'Julian Vance',
      priority: 'High',
      dependentOn: ['ms_1']
    },
    {
      id: 'ms_3',
      title: 'Dietary Restrictions Roster Submitted to Catering',
      phase: '14 Days Out',
      daysBeforeEvent: 14,
      dueDate: getFutureDate(31),
      completed: false,
      category: 'Catering',
      owner: 'Aria Montgomery',
      priority: 'Urgent',
      dependentOn: ['ms_1']
    },
    {
      id: 'ms_4',
      title: 'AV & Acoustic Sound Check with 5-Piece Band',
      phase: '7 Days Out',
      daysBeforeEvent: 7,
      dueDate: getFutureDate(38),
      completed: false,
      category: 'Production',
      owner: 'Sound Lead',
      priority: 'Medium',
      dependentOn: ['ms_2']
    },
    {
      id: 'ms_5',
      title: 'Run-Sheet Walkthrough with Wedding Party & Emcee',
      phase: '2 Days Out',
      daysBeforeEvent: 2,
      dueDate: getFutureDate(43),
      completed: false,
      category: 'Coordination',
      owner: 'Event Planner',
      priority: 'Urgent',
      dependentOn: ['ms_3', 'ms_4']
    },
    {
      id: 'ms_6',
      title: 'Event Day Kickoff: Vendor Load-in & Scenography Check',
      phase: 'Event Day',
      daysBeforeEvent: 0,
      dueDate: getFutureDate(45),
      completed: false,
      category: 'Operations',
      owner: 'Logistics Lead',
      priority: 'Critical',
      dependentOn: ['ms_5']
    }
  ],

  // Run-Sheet Timeline for Event Day
  runSheet: [
    { time: '09:00 AM', duration: 120, title: 'Vendor Load-In & AV Rigging', lead: 'Production Team', status: 'Upcoming', notes: 'Loading dock closes at 11:00 AM sharp' },
    { time: '11:30 AM', duration: 90, title: 'Floral Installations & Table Setting', lead: 'Aura Scenography', status: 'Upcoming', notes: 'Ensure temperature control for fresh hydrangeas' },
    { time: '01:30 PM', duration: 60, title: 'Bridal Party & VIP Photo Session', lead: 'Photo Crew', status: 'Upcoming', notes: 'First look at the Glasshouse Conservatory' },
    { time: '03:30 PM', duration: 45, title: 'Guest Arrival & Champagne Prelude', lead: 'Hospitality Staff', status: 'Upcoming', notes: 'Violin quartet plays modern acoustic covers' },
    { time: '04:30 PM', duration: 60, title: 'Solemn Ceremony & Vow Exchange', lead: 'Officiant & Couple', status: 'Upcoming', notes: 'Sound check backup mics active' },
    { time: '05:45 PM', duration: 75, title: 'Cocktail Hour & Passed Canapés', lead: 'Catering Lead', status: 'Upcoming', notes: 'Separate allergen-safe tray circulating' },
    { time: '07:00 PM', duration: 90, title: 'Grand Entrance & 3-Course Plated Dinner', lead: 'Banquet Captain', status: 'Upcoming', notes: 'Speeches interleaved between courses' },
    { time: '08:45 PM', duration: 180, title: 'First Dance & Live Band Dance Floor', lead: 'Band Leader & DJ', status: 'Upcoming', notes: 'Late-night espresso bar opens at 10:15 PM' },
    { time: '11:45 PM', duration: 45, title: 'Sparkler Send-Off & Guest Departure', lead: 'Coordination Staff', status: 'Upcoming', notes: 'Shuttle buses depart at 12:00 midnight' }
  ]
};

module.exports = {
  DEFAULT_EVENT,
  getFutureDate
};
