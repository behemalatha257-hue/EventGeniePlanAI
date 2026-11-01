/**
 * EventGeniePlan AI - Dynamic Checklist & Automated Run-Sheet Engine
 * Milestone Generation, Critical Path Dependencies & Cascading Date Shift Logic
 */

const { EVENT_TYPES } = require('../config/constants');

/**
 * Calculates date string offset by days from a target anchor date
 */
function offsetDate(anchorDateStr, daysOffset) {
  const date = new Date(anchorDateStr);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

/**
 * Generates event-type-specific milestone checklists
 */
function getDeterministicChecklist(eventType = EVENT_TYPES.WEDDING, targetDateStr) {
  const baseTarget = targetDateStr || new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0];

  const templates = {
    [EVENT_TYPES.WEDDING]: [
      { id: 'ms_w1', title: 'Lock Venue & Glasshouse Licensing Agreement', phase: '60 Days Out', daysBeforeEvent: 60, category: 'Venue', priority: 'Critical', owner: 'Planner', dependentOn: [] },
      { id: 'ms_w2', title: 'Deposit 1 & Catering Menu Tasting Session', phase: '45 Days Out', daysBeforeEvent: 45, category: 'Catering', priority: 'High', owner: 'Couple', dependentOn: ['ms_w1'] },
      { id: 'ms_w3', title: 'Finalize Floorplan, Seating Chart & Friction Check', phase: '30 Days Out', daysBeforeEvent: 30, category: 'Logistics', priority: 'High', owner: 'Planner', dependentOn: ['ms_w2'] },
      { id: 'ms_w4', title: 'Submit Allergen & Dietary Roster to Banquet Chef', phase: '14 Days Out', daysBeforeEvent: 14, category: 'Catering', priority: 'Urgent', owner: 'Planner', dependentOn: ['ms_w3'] },
      { id: 'ms_w5', title: 'AV Frequency & Band Acoustic Rigging Check', phase: '7 Days Out', daysBeforeEvent: 7, category: 'Production', priority: 'Medium', owner: 'AV Lead', dependentOn: ['ms_w3'] },
      { id: 'ms_w6', title: 'Rehearsal Run-Sheet Walkthrough with Officiant', phase: '2 Days Out', daysBeforeEvent: 2, category: 'Coordination', priority: 'Urgent', owner: 'Lead Coordinator', dependentOn: ['ms_w4', 'ms_w5'] },
      { id: 'ms_w7', title: 'Day-of Load-In & Scenography Sign-Off', phase: 'Event Day', daysBeforeEvent: 0, category: 'Operations', priority: 'Critical', owner: 'Logistics Team', dependentOn: ['ms_w6'] }
    ],
    [EVENT_TYPES.COMMUNITY_GALA]: [
      { id: 'ms_g1', title: 'Secure Corporate Sponsors & Keynote Speakers', phase: '60 Days Out', daysBeforeEvent: 60, category: 'Finance', priority: 'Critical', owner: 'Gala Chair', dependentOn: [] },
      { id: 'ms_g2', title: 'Launch Early-Bird Ticket Sales & VIP Tables', phase: '45 Days Out', daysBeforeEvent: 45, category: 'Marketing', priority: 'High', owner: 'PR Lead', dependentOn: ['ms_g1'] },
      { id: 'ms_g3', title: 'Finalize Stage Rigging & Live Auction Software', phase: '21 Days Out', daysBeforeEvent: 21, category: 'Production', priority: 'High', owner: 'Tech Lead', dependentOn: ['ms_g2'] },
      { id: 'ms_g4', title: 'VIP Seating Arrangement & Security Briefing', phase: '10 Days Out', daysBeforeEvent: 10, category: 'Logistics', priority: 'Urgent', owner: 'Logistics Lead', dependentOn: ['ms_g3'] },
      { id: 'ms_g5', title: 'Final Headcount & Green Room Hospitality Setup', phase: '3 Days Out', daysBeforeEvent: 3, category: 'Hospitality', priority: 'High', owner: 'Banquet Lead', dependentOn: ['ms_g4'] },
      { id: 'ms_g6', title: 'Gala Night Execution & Live Auctioneer Opening', phase: 'Event Day', daysBeforeEvent: 0, category: 'Operations', priority: 'Critical', owner: 'Event Director', dependentOn: ['ms_g5'] }
    ],
    [EVENT_TYPES.BIRTHDAY]: [
      { id: 'ms_b1', title: 'Book Private Lounge & Live DJ Ensemble', phase: '30 Days Out', daysBeforeEvent: 30, category: 'Venue', priority: 'High', owner: 'Host', dependentOn: [] },
      { id: 'ms_b2', title: 'Design Bespoke Invitation Suite & RSVP Portal', phase: '21 Days Out', daysBeforeEvent: 21, category: 'Design', priority: 'Medium', owner: 'Host', dependentOn: ['ms_b1'] },
      { id: 'ms_b3', title: 'Order Signature 3-Tier Kinetic Cake & Decor', phase: '14 Days Out', daysBeforeEvent: 14, category: 'Decor', priority: 'High', owner: 'Co-Host', dependentOn: ['ms_b2'] },
      { id: 'ms_b4', title: 'Confirm Cocktail Bar Mixology Menu', phase: '7 Days Out', daysBeforeEvent: 7, category: 'Catering', priority: 'Medium', owner: 'Host', dependentOn: ['ms_b3'] },
      { id: 'ms_b5', title: 'Party Night: Sound Check, Surprise Reveal & Toast', phase: 'Event Day', daysBeforeEvent: 0, category: 'Operations', priority: 'Critical', owner: 'Emcee', dependentOn: ['ms_b4'] }
    ]
  };

  const selectedTemplate = templates[eventType] || templates[EVENT_TYPES.WEDDING];

  const milestones = selectedTemplate.map(m => ({
    ...m,
    dueDate: offsetDate(baseTarget, -m.daysBeforeEvent),
    completed: m.daysBeforeEvent > 35 // mark earlier tasks completed
  }));

  const dayOfRunSheet = [
    { time: '08:00 AM', duration: 120, title: 'Vendor Load-In & Staging', lead: 'Operations Lead', status: 'Upcoming' },
    { time: '10:30 AM', duration: 60, title: 'Acoustic & Lighting Rigging Test', lead: 'Production Lead', status: 'Upcoming' },
    { time: '12:00 PM', duration: 90, title: 'Decor & Floristry Installation', lead: 'Design Team', status: 'Upcoming' },
    { time: '03:00 PM', duration: 60, title: 'Final Run-Sheet Walkthrough', lead: 'Coordinator', status: 'Upcoming' },
    { time: '04:30 PM', duration: 60, title: 'Guest Registration & Welcome Reception', lead: 'Hospitality', status: 'Upcoming' },
    { time: '06:00 PM', duration: 120, title: 'Main Banquet & Keynote / Ceremony', lead: 'Master of Ceremonies', status: 'Upcoming' },
    { time: '08:30 PM', duration: 150, title: 'Live Entertainment & Celebration', lead: 'DJ & Performer', status: 'Upcoming' },
    { time: '11:00 PM', duration: 60, title: 'Event Conclusion & Tear-Down', lead: 'Logistics Crew', status: 'Upcoming' }
  ];

  return {
    eventType,
    targetDate: baseTarget,
    milestones,
    dayOfRunSheet
  };
}

/**
 * Cascading Date Shifter
 * When target event date shifts by +/- N days, or when a milestone changes,
 * automatically recalculates all milestone deadlines and checks downstream dependencies.
 */
function cascadeDateShift(newTargetDateStr, milestones = []) {
  const newTarget = new Date(newTargetDateStr);
  const updatedMilestones = milestones.map(m => {
    const daysBefore = typeof m.daysBeforeEvent === 'number' ? m.daysBeforeEvent : 0;
    const targetCopy = new Date(newTarget);
    targetCopy.setDate(targetCopy.getDate() - daysBefore);

    return {
      ...m,
      dueDate: targetCopy.toISOString().split('T')[0]
    };
  });

  // Verify Critical Path Order & Cascading Conflicts
  const milestoneMap = new Map(updatedMilestones.map(m => [m.id, m]));
  const cascadingAlerts = [];

  updatedMilestones.forEach(m => {
    if (m.dependentOn && m.dependentOn.length > 0) {
      m.dependentOn.forEach(depId => {
        const parent = milestoneMap.get(depId);
        if (parent) {
          const parentDate = new Date(parent.dueDate);
          const childDate = new Date(m.dueDate);
          if (childDate < parentDate) {
            cascadingAlerts.push({
              childMilestone: m.title,
              parentMilestone: parent.title,
              issue: `Dependency conflict: "${m.title}" is scheduled BEFORE required prerequisite "${parent.title}".`
            });
          }
        }
      });
    }
  });

  // Calculate stats
  const completedCount = updatedMilestones.filter(m => m.completed).length;
  const progressPercent = updatedMilestones.length > 0
    ? Math.round((completedCount / updatedMilestones.length) * 100)
    : 0;

  return {
    newTargetDate: newTargetDateStr,
    milestones: updatedMilestones,
    completedCount,
    totalCount: updatedMilestones.length,
    progressPercent,
    cascadingAlerts,
    hasDependencyConflicts: cascadingAlerts.length > 0
  };
}

module.exports = {
  getDeterministicChecklist,
  cascadeDateShift,
  offsetDate
};
