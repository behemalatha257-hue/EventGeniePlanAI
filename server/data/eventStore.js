/**
 * EventGeniePlan AI - Unified Event State Store
 * Single Source of Truth shared across Event, Budget, Checklist, and Seating controllers.
 */

const { DEFAULT_EVENT, getFutureDate } = require('./defaultEventData');
const { calculateBudgetHealth } = require('../services/budgetEngine');

class EventStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.event = JSON.parse(JSON.stringify(DEFAULT_EVENT));
    // Ensure target date starts 45 days from today dynamically
    this.event.targetDate = getFutureDate(45);
    // Sync initial milestone due dates with target date
    const targetObj = new Date(this.event.targetDate);
    this.event.milestones.forEach(m => {
      const d = new Date(targetObj);
      d.setDate(d.getDate() - (m.daysBeforeEvent || 0));
      m.dueDate = d.toISOString().split('T')[0];
    });
  }

  getEvent() {
    return this.event;
  }

  getTargetDate() {
    return this.event.targetDate;
  }

  setTargetDate(newDate) {
    this.event.targetDate = newDate;
  }

  getBudgetCategories() {
    return this.event.budgetCategories;
  }

  setBudgetCategories(categories) {
    this.event.budgetCategories = categories;
    // Update spent total based on categories
    this.event.spentBudget = categories.reduce((sum, c) => sum + (c.spent || 0), 0);
  }

  getTotalBudget() {
    return this.event.totalBudget;
  }

  setTotalBudget(amount) {
    this.event.totalBudget = amount;
  }

  getMilestones() {
    return this.event.milestones;
  }

  setMilestones(milestones) {
    this.event.milestones = milestones;
  }

  getRunSheet() {
    return this.event.runSheet;
  }

  setRunSheet(runSheet) {
    this.event.runSheet = runSheet;
  }

  getTables() {
    return this.event.tables;
  }

  setTables(tables) {
    this.event.tables = tables;
  }

  getGuests() {
    return this.event.guests;
  }

  setGuests(guests) {
    this.event.guests = guests;
  }

  /**
   * Switches the active master event type across the entire platform
   * (e.g. Birthday Bash, Community Gala, Wedding) and recalculates all metrics.
   */
  switchEventType(eventType, customTargetDate = null) {
    if (customTargetDate) {
      this.event.targetDate = customTargetDate;
    }
    const isBirthday = /birthday/i.test(eventType);
    const isGala = /gala|community/i.test(eventType);

    if (isBirthday) {
      this.event.eventType = 'Birthday Bash';
      this.event.title = "Leo's 30th Neon Horizon Birthday Bash";
      this.event.venue = "The Penthouse Loft & Skyline Lounge";
      this.event.expectedGuests = 60;
      this.event.confirmedRsvps = 48;
      this.event.totalBudget = 18000;
      this.event.spentBudget = 12400;
      this.event.budgetCategories = [
        { id: 'cat_venue', name: 'Penthouse Loft Rental', allocated: 5500, spent: 5500, status: 'safe', note: 'Deposit & sound permit paid' },
        { id: 'cat_catering', name: 'Artisan Tapas & Craft Bar', allocated: 6000, spent: 4200, status: 'safe', note: 'Cocktail style with mixologist' },
        { id: 'cat_cake', name: '3-Tier Kinetic Birthday Cake', allocated: 1200, spent: 1200, status: 'safe', note: 'Custom design with sparklers' },
        { id: 'cat_dj', name: 'Live DJ & Club Lighting Rig', allocated: 2500, spent: 1500, status: 'safe', note: 'Soundcheck confirmed' },
        { id: 'cat_photo', name: 'Interactive 360 Photo Booth', allocated: 1800, spent: 0, status: 'safe', note: 'Contract signed' },
        { id: 'cat_contingency', name: 'Emergency Contingency', allocated: 1000, spent: 0, status: 'safe', note: 'Buffer for late-night bar extension' }
      ];
      this.event.milestones = [
        { id: 'ms_b1', title: 'Book Private Lounge & Live DJ Ensemble', phase: '30 Days Out', daysBeforeEvent: 30, category: 'Venue', priority: 'High', owner: 'Host', completed: true, dependentOn: [] },
        { id: 'ms_b2', title: 'Design Bespoke Invitation Suite & RSVP Portal', phase: '21 Days Out', daysBeforeEvent: 21, category: 'Design', priority: 'Medium', owner: 'Host', completed: true, dependentOn: ['ms_b1'] },
        { id: 'ms_b3', title: 'Order Signature 3-Tier Kinetic Cake & Decor', phase: '14 Days Out', daysBeforeEvent: 14, category: 'Decor', priority: 'High', owner: 'Co-Host', completed: false, dependentOn: ['ms_b2'] },
        { id: 'ms_b4', title: 'Confirm Cocktail Bar Mixology Menu', phase: '7 Days Out', daysBeforeEvent: 7, category: 'Catering', priority: 'Medium', owner: 'Host', completed: false, dependentOn: ['ms_b3'] },
        { id: 'ms_b5', title: 'Party Night: Sound Check, Surprise Reveal & Toast', phase: 'Event Day', daysBeforeEvent: 0, category: 'Operations', priority: 'Critical', owner: 'Emcee', completed: false, dependentOn: ['ms_b4'] }
      ];
      this.event.runSheet = [
        { time: '04:00 PM', duration: 90, title: 'Loft Access, Sound & DJ Setup', lead: 'Host & DJ', status: 'Upcoming' },
        { time: '05:30 PM', duration: 60, title: 'Mixologist Bar Prep & Tapas Arrival', lead: 'Catering Team', status: 'Upcoming' },
        { time: '06:30 PM', duration: 60, title: 'Doors Open & Welcome Signature Cocktails', lead: 'Host', status: 'Upcoming' },
        { time: '07:30 PM', duration: 30, title: 'Guest Arrival Peak & 360 Photo Booth Live', lead: 'Event Staff', status: 'Upcoming' },
        { time: '08:00 PM', duration: 45, title: 'Surprise Reveal & Birthday Toast', lead: 'VIP Friends', status: 'Upcoming' },
        { time: '08:45 PM', duration: 30, title: 'Kinetic Sparkler Cake Cutting Ceremony', lead: 'Host & Family', status: 'Upcoming' },
        { time: '09:15 PM', duration: 180, title: 'Club DJ Set & Skyline Dance Floor', lead: 'DJ & Sound Tech', status: 'Upcoming' },
        { time: '12:15 AM', duration: 45, title: 'Late Night Tacos & Event Tear-Down', lead: 'Crew', status: 'Upcoming' }
      ];
    } else if (isGala) {
      this.event.eventType = 'Community Gala';
      this.event.title = "City Arts & Heritage Annual Benefit Gala";
      this.event.venue = "Metropolitan Civic Atrium & Sculpture Hall";
      this.event.expectedGuests = 250;
      this.event.confirmedRsvps = 215;
      this.event.totalBudget = 85000;
      this.event.spentBudget = 62000;
      this.event.budgetCategories = [
        { id: 'cat_venue', name: 'Civic Atrium Lease', allocated: 25000, spent: 25000, status: 'safe', note: 'Security & cleanup bond included' },
        { id: 'cat_catering', name: 'Four-Course Banquet Dinner', allocated: 32000, spent: 24000, status: 'safe', note: 'Passed hors d\'oeuvres & wine service' },
        { id: 'cat_av', name: 'Stage Rigging, Projection & Sound', allocated: 14000, spent: 9000, status: 'safe', note: 'Dual 4K LED screens' },
        { id: 'cat_auction', name: 'Live Auction Software & Licenses', allocated: 5000, spent: 4000, status: 'safe', note: 'Mobile bidding terminals' },
        { id: 'cat_contingency', name: 'Emergency Contingency', allocated: 9000, spent: 0, status: 'safe', note: 'Speaker travel & weather contingency' }
      ];
      this.event.milestones = [
        { id: 'ms_g1', title: 'Secure Keynote Speaker & Celebrity Auctioneer', phase: '60 Days Out', daysBeforeEvent: 60, category: 'Talent', priority: 'Critical', owner: 'Executive Committee', completed: true, dependentOn: [] },
        { id: 'ms_g2', title: 'Launch Early-Bird Ticket Sales & VIP Tables', phase: '45 Days Out', daysBeforeEvent: 45, category: 'Marketing', priority: 'High', owner: 'PR Lead', completed: true, dependentOn: ['ms_g1'] },
        { id: 'ms_g3', title: 'Finalize Stage Rigging & Live Auction Software', phase: '21 Days Out', daysBeforeEvent: 21, category: 'Production', priority: 'High', owner: 'Tech Lead', completed: false, dependentOn: ['ms_g2'] },
        { id: 'ms_g4', title: 'VIP Seating Arrangement & Security Briefing', phase: '10 Days Out', daysBeforeEvent: 10, category: 'Logistics', priority: 'Urgent', owner: 'Logistics Lead', completed: false, dependentOn: ['ms_g3'] },
        { id: 'ms_g5', title: 'Final Headcount & Green Room Hospitality Setup', phase: '3 Days Out', daysBeforeEvent: 3, category: 'Hospitality', priority: 'High', owner: 'Banquet Lead', completed: false, dependentOn: ['ms_g4'] },
        { id: 'ms_g6', title: 'Gala Night Execution & Live Auctioneer Opening', phase: 'Event Day', daysBeforeEvent: 0, category: 'Operations', priority: 'Critical', owner: 'Event Director', completed: false, dependentOn: ['ms_g5'] }
      ];
      this.event.runSheet = [
        { time: '09:00 AM', duration: 180, title: 'Civic Atrium Rigging & LED Wall Setup', lead: 'AV Lead', status: 'Upcoming' },
        { time: '01:00 PM', duration: 120, title: 'Banquet Tablescape & Floral Positioning', lead: 'Design Crew', status: 'Upcoming' },
        { time: '04:00 PM', duration: 60, title: 'Auctioneer Soundcheck & Teleprompter Rehearsal', lead: 'Stage Manager', status: 'Upcoming' },
        { time: '05:30 PM', duration: 60, title: 'VIP Red Carpet & Champagne Reception', lead: 'PR & Hosts', status: 'Upcoming' },
        { time: '07:00 PM', duration: 90, title: 'Four-Course Dinner & Civic Keynote Speech', lead: 'Banquet Lead', status: 'Upcoming' },
        { time: '08:30 PM', duration: 75, title: 'Live Benefit Auction & Pledge Drive', lead: 'Auctioneer', status: 'Upcoming' },
        { time: '10:00 PM', duration: 120, title: 'Orchestral Performance & Dessert Lounge', lead: 'Conductor', status: 'Upcoming' },
        { time: '12:00 AM', duration: 60, title: 'Event Conclusion & Venue Handback', lead: 'Logistics Lead', status: 'Upcoming' }
      ];
    } else {
      // Default Wedding
      const currentTarget = this.event.targetDate;
      this.reset();
      this.event.targetDate = customTargetDate || currentTarget;
    }

    // Cascade milestone dates from targetDate
    const targetObj = new Date(this.event.targetDate);
    this.event.milestones.forEach(m => {
      const d = new Date(targetObj);
      d.setDate(d.getDate() - (m.daysBeforeEvent || 0));
      m.dueDate = d.toISOString().split('T')[0];
    });

    return this.getOverview();
  }

  getOverview() {
    const targetDateObj = new Date(this.event.targetDate);
    const now = new Date();
    const diffMs = targetDateObj.getTime() - now.getTime();
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const budgetHealth = calculateBudgetHealth(this.event.totalBudget, this.event.budgetCategories, diffDays);

    const completedTasks = this.event.milestones.filter(m => m.completed).length;
    const totalTasks = this.event.milestones.length;
    const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: this.event.id,
      title: this.event.title,
      eventType: this.event.eventType,
      venue: this.event.venue,
      targetDate: this.event.targetDate,
      daysRemaining: diffDays,
      expectedGuests: this.event.expectedGuests,
      confirmedRsvps: this.event.confirmedRsvps,
      rsvpPercent: Math.round((this.event.confirmedRsvps / this.event.expectedGuests) * 100),
      currency: this.event.currency,
      totalBudget: this.event.totalBudget,
      spentBudget: this.event.spentBudget,
      budgetHealth: {
        ...budgetHealth,
        categories: this.event.budgetCategories
      },
      taskProgress: {
        completed: completedTasks,
        total: totalTasks,
        percent: taskProgress
      }
    };
  }
}

// Export singleton instance
const eventStore = new EventStore();
module.exports = {
  eventStore
};

