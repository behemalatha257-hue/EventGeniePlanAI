/**
 * EventGeniePlan AI - Multi-Agent Copilot ("The Planning Committee")
 * Specialized Agents: Budget Bot, Design Bot, Timeline/Chaos Predictor
 */

const Copilot = {
  currentAgentId: 'budget_bot',
  agents: [],
  _initialized: false,
  _eventsBound: false,
  isSending: false,

  quickPrompts: {
    budget_bot: [
      "Audit our venue $500 overrun and suggest cost savings",
      "What percentage should we keep in reserve for 120 guests?",
      "How can we cut 10% from catering without hurting quality?"
    ],
    design_bot: [
      "Generate 5-color palette for a Celestial Emerald Gala",
      "Suggest tablescape & floral styling for a modern glasshouse",
      "What lighting Kelvin temperature works best for sunset photos?"
    ],
    chaos_bot: [
      "Flag schedule bottlenecks between cocktail hour and dinner",
      "What is our chaos vulnerability score for vendor load-in?",
      "Calculate buffer minutes needed for wedding party photos"
    ],
    spatial_bot: [
      "Analyze room clearance for 120 guests in an 80x50 ft ballroom",
      "Where should we position the bar to prevent entrance queues?",
      "Calculate dance floor square footage and stage dimensions"
    ]
  },

  async init() {
    this.setupEventListeners();
    if (!this._initialized) {
      this._initialized = true;
      await this.loadAgents();
      this.renderInitialGreeting();
    }
  },

  async loadAgents() {
    try {
      const response = await API.getAgents();
      if (response.success && response.agents) {
        this.agents = response.agents;
        this.renderAgentButtons();
      }
    } catch (err) {
      console.warn('Could not load agents from API, using defaults:', err);
    }
  },

  renderAgentButtons() {
    const sidebar = document.getElementById('copilot-agent-sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = this.agents.map(agent => {
      const isActive = agent.id === this.currentAgentId;
      return `
        <button class="agent-card-btn ${isActive ? 'active' : ''}" data-agent-id="${agent.id}" id="agent-btn-${agent.id}">
          <div class="agent-avatar-box" style="background: ${agent.color}25; border: 1px solid ${agent.color}50;">
            ${agent.avatar}
          </div>
          <div>
            <div class="agent-meta-name">${agent.name}</div>
            <div class="agent-meta-role">${agent.title}</div>
          </div>
        </button>
      `;
    }).join('');

    // Attach click handlers
    sidebar.querySelectorAll('.agent-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const agentId = btn.getAttribute('data-agent-id');
        this.switchAgent(agentId);
      });
    });

    this.renderQuickChips();
  },

  switchAgent(agentId) {
    this.currentAgentId = agentId;
    document.querySelectorAll('.agent-card-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-agent-id') === agentId);
    });

    const agent = this.agents.find(a => a.id === agentId);
    const titleEl = document.getElementById('chat-active-agent-title');
    if (titleEl && agent) {
      titleEl.innerHTML = `${agent.avatar} ${agent.name} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-secondary); margin-left: 0.5rem;">(${agent.title})</span>`;
    }

    this.renderQuickChips();
    this.appendSystemNotice(`Switched copilot to **${agent ? agent.name : agentId}**`);
  },

  renderQuickChips() {
    const chipsContainer = document.getElementById('copilot-quick-chips');
    if (!chipsContainer) return;

    const prompts = this.quickPrompts[this.currentAgentId] || [];
    chipsContainer.innerHTML = prompts.map(p => `
      <button class="chip-btn" data-prompt="${p}">💡 ${p}</button>
    `).join('');

    chipsContainer.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        const input = document.getElementById('copilot-chat-input');
        if (input) {
          input.value = prompt;
          this.sendMessage();
        }
      });
    });
  },

  renderInitialGreeting() {
    const history = document.getElementById('copilot-chat-history');
    if (!history) return;

    history.innerHTML = `
      <div class="chat-bubble agent">
        <strong>💰 Vault (Budget Bot):</strong> Welcome to EventGeniePlan AI! I'm monitoring your financial health. Currently, your <strong>Venue Rental is +$500 over allocation</strong>, but we have enough headroom in your catering buffer and emergency reserve to rebalance without increasing your total budget.
        <br/><br/>
        How can the Planning Committee assist your event today?
      </div>
    `;
  },

  appendSystemNotice(text) {
    const history = document.getElementById('copilot-chat-history');
    if (!history) return;

    const notice = document.createElement('div');
    notice.style.textAlign = 'center';
    notice.style.fontSize = '0.75rem';
    notice.style.color = 'var(--text-muted)';
    notice.style.margin = '0.5rem 0';
    notice.innerHTML = Utils.renderMarkdown(text);
    history.appendChild(notice);
    history.scrollTop = history.scrollHeight;
  },

  appendMessage(sender, text, agentMeta = null) {
    const history = document.getElementById('copilot-chat-history');
    if (!history) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;

    if (sender === 'user') {
      bubble.textContent = text;
    } else {
      const header = agentMeta ? `<strong>${agentMeta.avatar} ${agentMeta.name}:</strong><br/>` : '';
      bubble.innerHTML = `${header}${Utils.renderMarkdown(text)}`;
    }

    history.appendChild(bubble);
    history.scrollTop = history.scrollHeight;
  },

  async sendMessage() {
    if (this.isSending) return;
    const input = document.getElementById('copilot-chat-input');
    const sendBtn = document.getElementById('copilot-send-btn');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    this.isSending = true;

    // Append user message
    this.appendMessage('user', message);
    input.value = '';
    input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // Show typing placeholder
    const history = document.getElementById('copilot-chat-history');
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble agent';
    typingBubble.id = 'copilot-typing-indicator';
    typingBubble.innerHTML = `<em>Thinking & analyzing event metrics...</em>`;
    history.appendChild(typingBubble);
    history.scrollTop = history.scrollHeight;

    // Use current live event context dynamically
    const currentEvent = window.Dashboard?.eventData || {
      title: "Active Master Event",
      eventType: "Master Event",
      totalBudget: 45000,
      spentBudget: 32600,
      expectedGuests: 120,
      confirmedRsvps: 98
    };

    try {
      const response = await API.sendCommitteeMessage(this.currentAgentId, message, {
        title: currentEvent.title,
        eventType: currentEvent.eventType,
        totalBudget: currentEvent.totalBudget,
        spentBudget: currentEvent.spentBudget,
        expectedGuests: currentEvent.expectedGuests,
        confirmedRsvps: currentEvent.confirmedRsvps
      });

      typingBubble.remove();

      if (response.success) {
        this.appendMessage('agent', response.reply, response.agent);
      } else {
        this.appendMessage('agent', 'Sorry, I encountered an error responding to your request.');
      }
    } catch (err) {
      typingBubble.remove();
      this.appendMessage('agent', `⚠️ Failed to reach AI service: ${err.message}. Using intelligent fallback response.`);
    } finally {
      this.isSending = false;
      input.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }
  },

  setupEventListeners() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    const sendBtn = document.getElementById('copilot-send-btn');
    const input = document.getElementById('copilot-chat-input');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }
};

window.Copilot = Copilot;
