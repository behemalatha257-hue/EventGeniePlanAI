/**
 * EventGeniePlan AI - Advanced Next-Gen Features Controller
 * 1. Venue Spatial Architect (2D Floorplan Visualizer & NFPA Fire Egress Check)
 * 2. Eco-Score & Sustainable Local Swaps Engine
 * 3. Automated Vendor Briefing Generator (DJ, Caterer, Photographer, Florist)
 * 4. Hyper-Personalized RSVP Concierge Chatbot
 */

const AdvancedFeatures = {
  spatialData: null,
  ecoData: null,
  activeVendorType: 'dj',
  _initialized: false,
  _eventsBound: false,
  isSubmittingRsvp: false,

  async init() {
    this.setupEventListeners();
    if (this._initialized) return;
    this._initialized = true;

    await Promise.all([
      this.loadSpatialPlan(),
      this.loadEcoScore(),
      this.loadVendorBrief('dj')
    ]);
  },

  // ==========================================
  // 1. VENUE SPATIAL ARCHITECT
  // ==========================================
  async loadSpatialPlan() {
    try {
      const res = await API.getSpatialPlan();
      if (res.success && res.data) {
        this.spatialData = res.data;
        this.renderSpatialPlan();
      }
    } catch (err) {
      console.warn('Could not load spatial plan:', err);
    }
  },

  renderSpatialPlan() {
    if (!this.spatialData) return;
    const { dimensions, metrics, safetyAudit, zones, flowOptimizationTip } = this.spatialData;

    // Update metrics
    const dimEl = document.getElementById('spatial-dim-display');
    const areaEl = document.getElementById('spatial-area-display');
    const utilEl = document.getElementById('spatial-util-display');
    const safetyBadgeEl = document.getElementById('spatial-safety-badge');
    const tipEl = document.getElementById('spatial-flow-tip');

    if (dimEl) dimEl.textContent = `${dimensions.lengthFt} ft × ${dimensions.widthFt} ft`;
    if (areaEl) areaEl.textContent = `${dimensions.totalAreaSqFt.toLocaleString()} sq ft`;
    if (utilEl) utilEl.textContent = `${metrics.spatialUtilizationPercent}%`;

    if (safetyBadgeEl) {
      safetyBadgeEl.textContent = safetyAudit.fireMarshalVerdict;
      safetyBadgeEl.style.color = safetyAudit.isOvercrowded ? 'var(--accent-rose)' : 'var(--accent-emerald)';
      safetyBadgeEl.style.borderColor = safetyAudit.isOvercrowded ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)';
    }

    if (tipEl && flowOptimizationTip) {
      tipEl.textContent = flowOptimizationTip;
    }

    // Render 2D SVG Floorplan
    const svgContainer = document.getElementById('spatial-floorplan-svg');
    if (!svgContainer) return;

    svgContainer.innerHTML = `
      <svg viewBox="0 0 100 100" width="100%" height="380" style="background: rgba(15, 23, 42, 0.95); border: 2px solid var(--border-subtle); border-radius: var(--radius-md);">
        <!-- Architectural Grid lines -->
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        <!-- Egress Pathways & Clearances -->
        <path d="M 45 92 L 45 22 M 55 92 L 55 22" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1.5" stroke-dasharray="2,2" />
        <text x="50" y="58" fill="rgba(16, 185, 129, 0.6)" font-size="2.5" font-weight="bold" text-anchor="middle">6.0 FT EGRESS AISLE</text>

        <!-- Dynamic Zones -->
        ${zones.map(z => `
          <g>
            <rect x="${z.x}" y="${z.y}" width="${z.width}" height="${z.height}"
              fill="${z.color}" stroke="${z.borderColor}" stroke-width="0.8" rx="2" />
            <text x="${z.x + z.width / 2}" y="${z.y + z.height / 2 - 1}"
              fill="#ffffff" font-size="3" font-weight="bold" text-anchor="middle" font-family="'Inter', sans-serif">
              ${z.icon} ${z.name}
            </text>
            <text x="${z.x + z.width / 2}" y="${z.y + z.height / 2 + 3.5}"
              fill="rgba(255,255,255,0.7)" font-size="2.2" text-anchor="middle">
              ${Math.round((z.width * dimensions.lengthFt / 100) * (z.height * dimensions.widthFt / 100))} sq ft
            </text>
          </g>
        `).join('')}

        <!-- Dimension Labels -->
        <text x="50" y="3" fill="var(--text-muted)" font-size="2.8" text-anchor="middle">← North Stage Wall: ${dimensions.lengthFt} FT →</text>
        <text x="98" y="50" fill="var(--text-muted)" font-size="2.8" text-anchor="middle" transform="rotate(90 98 50)">← East: ${dimensions.widthFt} FT →</text>
      </svg>
    `;
  },

  async handleSimulateSpatial() {
    const lengthInput = document.getElementById('spatial-input-length');
    const widthInput = document.getElementById('spatial-input-width');
    const guestsInput = document.getElementById('spatial-input-guests');

    const lengthFt = Number(lengthInput?.value) || 80;
    const widthFt = Number(widthInput?.value) || 50;
    const expectedGuests = Number(guestsInput?.value) || 120;

    Utils.showToast('Re-modeling room clearance and NFPA life safety metrics...', 'info');

    try {
      const res = await API.simulateSpatial(lengthFt, widthFt, expectedGuests);
      if (res.success && res.data) {
        this.spatialData = res.data;
        this.renderSpatialPlan();
        Utils.showToast('Spatial floorplan updated!', 'success');
      }
    } catch (err) {
      Utils.showToast('Simulation failed: ' + err.message, 'error');
    }
  },

  // ==========================================
  // 2. ECO-SCORE & SUSTAINABILITY
  // ==========================================
  async loadEcoScore() {
    try {
      const res = await API.getEcoScore();
      if (res.success && res.data) {
        this.ecoData = res.data;
        this.renderEcoScore();
      }
    } catch (err) {
      console.warn('Could not load eco score:', err);
    }
  },

  renderEcoScore() {
    if (!this.ecoData) return;

    const scoreEl = document.getElementById('eco-score-badge');
    const ratingEl = document.getElementById('eco-rating-label');
    const treesEl = document.getElementById('eco-trees-count');
    const baselineCO2El = document.getElementById('eco-co2-baseline');
    const swapsContainer = document.getElementById('eco-swaps-list');

    if (scoreEl) scoreEl.textContent = `${this.ecoData.currentScore}/100`;
    if (ratingEl) ratingEl.textContent = this.ecoData.rating;
    if (treesEl) treesEl.textContent = `🌳 ${this.ecoData.carbonOffsetEquivalentTrees} Trees Equivalent Offset`;
    if (baselineCO2El) baselineCO2El.textContent = `${this.ecoData.totalBaselineCO2Kg.toLocaleString()} kg CO2e`;

    if (swapsContainer) {
      swapsContainer.innerHTML = this.ecoData.sustainableSwaps.map(swap => `
        <div style="background: var(--bg-secondary); border: 1px solid ${swap.adopted ? 'var(--accent-emerald)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span class="badge-diet">${swap.category}</span>
              <strong style="color: var(--text-main); font-size: 0.95rem;">${swap.title}</strong>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${swap.description}</p>
            <div style="display: flex; gap: 1rem; margin-top: 0.4rem; font-size: 0.75rem;">
              <span style="color: var(--accent-emerald); font-weight: 700;">🌱 -${swap.co2SavingsKg} kg CO2e</span>
              <span style="color: var(--accent-gold); font-weight: 600;">💰 ${swap.costImpact}</span>
            </div>
          </div>
          <div>
            <button class="chip-btn btn-toggle-swap" data-swap-id="${swap.id}" style="${swap.adopted ? 'background: var(--accent-emerald); color: #fff;' : ''}">
              ${swap.adopted ? '✔ Adopted' : '+ Adopt Swap'}
            </button>
          </div>
        </div>
      `).join('');

      swapsContainer.querySelectorAll('.btn-toggle-swap').forEach(btn => {
        btn.addEventListener('click', async () => {
          const swapId = btn.getAttribute('data-swap-id');
          await this.handleToggleSwap(swapId);
        });
      });
    }
  },

  async handleToggleSwap(swapId) {
    try {
      const res = await API.toggleEcoSwap(swapId);
      if (res.success) {
        await this.loadEcoScore();
        Utils.showToast(`Updated green swap: ${res.swap.title}`, 'success');
      }
    } catch (err) {
      Utils.showToast('Failed to toggle swap: ' + err.message, 'error');
    }
  },

  // ==========================================
  // 3. AUTOMATED VENDOR BRIEFING GENERATOR
  // ==========================================
  async loadVendorBrief(vendorType = 'dj') {
    this.activeVendorType = vendorType;
    try {
      const res = await API.getVendorBrief(vendorType);
      if (res.success && res.brief) {
        this.renderVendorBrief(res.brief, res.event);
      }
    } catch (err) {
      console.warn('Failed to load vendor brief:', err);
    }
  },

  renderVendorBrief(brief, eventMeta) {
    const container = document.getElementById('vendor-brief-display');
    if (!container) return;

    container.innerHTML = `
      <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="color: var(--text-main); font-size: 1.15rem;">${brief.role}</h3>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">
            Ref: <strong>${brief.contractReference}</strong> • ${brief.vendorCategory}
          </div>
        </div>
        <button id="btn-copy-vendor-brief" class="chip-btn" style="color: var(--accent-gold);">
          📋 Copy Brief Text
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; font-size: 0.85rem;">
        <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius-sm);">
          <strong style="color: var(--accent-gold);">⏰ Load-In & Call Time:</strong>
          <div style="color: var(--text-main); margin-top: 0.2rem;">${brief.loadInTime || brief.callTime}</div>
        </div>
        <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius-sm);">
          <strong style="color: var(--accent-purple);">⚡ Technical / Curfew Specs:</strong>
          <div style="color: var(--text-main); margin-top: 0.2rem;">${brief.powerRequirements || brief.breakdownCurfew || brief.soundCheckTime || brief.coverageDuration}</div>
        </div>
      </div>

      ${brief.keyCues ? `
        <h4 style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 0.5rem;">🎵 Key Operational Cues</h4>
        <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem;">
          ${brief.keyCues.map(cue => `
            <div style="background: var(--bg-secondary); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.8rem;">
              <strong style="color: var(--accent-gold);">${cue.time}</strong> - <strong>${cue.cue}:</strong>
              <span style="color: var(--text-secondary); margin-left: 0.3rem;">${cue.description}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${brief.dietaryRoster ? `
        <h4 style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 0.5rem;">🥗 Verified Banquet Dietary Breakdown</h4>
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.85rem; border-radius: var(--radius-sm); font-size: 0.85rem; margin-bottom: 1rem;">
          <div>Guaranteed Headcount: <strong>${brief.dietaryRoster.totalGuaranteedGuests}</strong></div>
          <div style="display: flex; gap: 1rem; margin-top: 0.3rem; flex-wrap: wrap;">
            <span>🌱 Vegan: <strong>${brief.dietaryRoster.vegan}</strong></span>
            <span>🥜 Nut Allergy: <strong>${brief.dietaryRoster.nutAllergy}</strong></span>
            <span>🥩 Halal: <strong>${brief.dietaryRoster.halal}</strong></span>
            <span>🌾 Gluten-Free: <strong>${brief.dietaryRoster.glutenFree}</strong></span>
          </div>
          <div style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.4rem;">${brief.dietaryRoster.actionRequired}</div>
        </div>
      ` : ''}

      ${brief.mustHaveShotList ? `
        <h4 style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 0.5rem;">📸 High-Priority Shot List</h4>
        <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
          ${brief.mustHaveShotList.map(s => `<li>${s}</li>`).join('')}
        </ul>
      ` : ''}

      ${brief.deliverables ? `
        <h4 style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 0.5rem;">📦 Contract Deliverables</h4>
        <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: var(--text-secondary);">
          ${brief.deliverables.map(d => `<li>${d}</li>`).join('')}
        </ul>
      ` : ''}
    `;

    const copyBtn = document.getElementById('btn-copy-vendor-brief');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(JSON.stringify(brief, null, 2));
        Utils.showToast('Copied Vendor Brief to clipboard!', 'success');
      });
    }
  },

  // ==========================================
  // 4. RSVP CONCIERGE CHATBOT
  // ==========================================
  async handleConciergeSubmit() {
    if (this.isSubmittingRsvp) return;
    const input = document.getElementById('rsvp-chat-input');
    const sendBtn = document.getElementById('btn-send-rsvp-query');
    const history = document.getElementById('rsvp-chat-history');
    if (!input || !history) return;

    const query = input.value.trim();
    if (!query) return;

    this.isSubmittingRsvp = true;
    input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // Append guest bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.textContent = query;
    history.appendChild(userBubble);
    input.value = '';

    // Append loading placeholder
    const botBubble = document.createElement('div');
    botBubble.className = 'chat-bubble agent';
    botBubble.innerHTML = '<em>Consulting guest itinerary & policies...</em>';
    history.appendChild(botBubble);
    history.scrollTop = history.scrollHeight;

    try {
      const res = await API.askRsvpConcierge(query);
      botBubble.innerHTML = Utils.renderMarkdown(res.reply);
    } catch (err) {
      botBubble.innerHTML = `⚠️ Sorry, I could not retrieve that information: ${err.message}`;
    } finally {
      this.isSubmittingRsvp = false;
      input.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }
    history.scrollTop = history.scrollHeight;
  },

  setupEventListeners() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    // Spatial simulator button
    const simBtn = document.getElementById('btn-simulate-spatial');
    if (simBtn) {
      simBtn.addEventListener('click', () => this.handleSimulateSpatial());
    }

    // Vendor Brief selector tabs
    document.querySelectorAll('.vendor-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.vendor-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const vendorType = btn.getAttribute('data-vendor-type');
        this.loadVendorBrief(vendorType);
      });
    });

    // RSVP Concierge send button & Enter key
    const rsvpSendBtn = document.getElementById('btn-send-rsvp-query');
    const rsvpInput = document.getElementById('rsvp-chat-input');

    if (rsvpSendBtn) {
      rsvpSendBtn.addEventListener('click', () => this.handleConciergeSubmit());
    }

    if (rsvpInput) {
      rsvpInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleConciergeSubmit();
        }
      });
    }

    // Quick chips for RSVP Concierge
    document.querySelectorAll('.rsvp-chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (rsvpInput) {
          rsvpInput.value = query;
          this.handleConciergeSubmit();
        }
      });
    });
  }
};

window.AdvancedFeatures = AdvancedFeatures;
