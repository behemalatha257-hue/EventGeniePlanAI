/**
 * EventGeniePlan AI - Frontend API Client
 */

const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: Request failed`);
      }
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  // Event Overview
  async getEventOverview() {
    return this.request('/api/event/overview');
  },

  async switchEventType(eventType, targetDate = null) {
    return this.request('/api/event/switch-type', {
      method: 'POST',
      body: JSON.stringify({ eventType, targetDate })
    });
  },

  // Copilot Agents
  async getAgents() {
    return this.request('/api/chat/agents');
  },

  async sendCommitteeMessage(agentId, message, context = {}) {
    return this.request('/api/chat/committee', {
      method: 'POST',
      body: JSON.stringify({ agentId, message, context })
    });
  },

  // Budget
  async getBudgetHealth() {
    return this.request('/api/budget/health');
  },

  async predictBudgetOverrun(daysRemaining, daysElapsed) {
    return this.request('/api/budget/predict', {
      method: 'POST',
      body: JSON.stringify({ daysRemaining, daysElapsed })
    });
  },

  async redistributeBudget() {
    return this.request('/api/budget/redistribute', {
      method: 'POST',
      body: JSON.stringify({})
    });
  },

  async resetBudget() {
    return this.request('/api/budget/reset', {
      method: 'POST',
      body: JSON.stringify({})
    });
  },

  // Contracts
  async getContractSamples() {
    return this.request('/api/contracts/samples');
  },

  async analyzeContract(contractText, sampleId = null) {
    return this.request('/api/contracts/analyze', {
      method: 'POST',
      body: JSON.stringify({ contractText, sampleId })
    });
  },

  // Seating
  async getSeatingChart() {
    return this.request('/api/seating/chart');
  },

  async assignGuest(guestId, tableId) {
    return this.request('/api/seating/assign', {
      method: 'POST',
      body: JSON.stringify({ guestId, tableId })
    });
  },

  async optimizeSeating(useAi = true) {
    return this.request('/api/seating/optimize', {
      method: 'POST',
      body: JSON.stringify({ useAi })
    });
  },

  async resetSeating() {
    return this.request('/api/seating/reset', {
      method: 'POST',
      body: JSON.stringify({})
    });
  },

  // Checklist
  async getChecklist() {
    return this.request('/api/checklist');
  },

  async shiftTargetDate(newTargetDate) {
    return this.request('/api/checklist/shift', {
      method: 'POST',
      body: JSON.stringify({ newTargetDate })
    });
  },

  async toggleMilestone(milestoneId) {
    return this.request('/api/checklist/toggle', {
      method: 'POST',
      body: JSON.stringify({ milestoneId })
    });
  },

  async generateChecklist(eventType, targetDate, budget) {
    return this.request('/api/checklist/generate', {
      method: 'POST',
      body: JSON.stringify({ eventType, targetDate, budget })
    });
  },

  // Eco-Score & Green Swaps
  async getEcoScore() {
    return this.request('/api/eco/score');
  },

  async toggleEcoSwap(swapId) {
    return this.request('/api/eco/toggle-swap', {
      method: 'POST',
      body: JSON.stringify({ swapId })
    });
  },

  // Vendor Briefing Generator
  async getVendorBrief(vendorType) {
    return this.request(`/api/vendors/brief/${vendorType}`);
  },

  // Venue Spatial Architect
  async getSpatialPlan() {
    return this.request('/api/spatial/plan');
  },

  async simulateSpatial(lengthFt, widthFt, expectedGuests) {
    return this.request('/api/spatial/simulate', {
      method: 'POST',
      body: JSON.stringify({ lengthFt, widthFt, expectedGuests })
    });
  },

  // Hyper-Personalized RSVP Concierge
  async askRsvpConcierge(query) {
    return this.request('/api/rsvp/chat', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }
};

window.API = API;
