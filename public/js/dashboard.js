/**
 * EventGeniePlan AI - Live Dashboard Module
 * Real-time Countdown, SVG Speedometer Budget Health Gauge, Task Progress
 */

const Dashboard = {
  countdownInterval: null,
  eventData: null,

  async init() {
    await this.loadOverview();
    this.startCountdown();
    this.setupEventListeners();
  },

  async loadOverview() {
    try {
      const response = await API.getEventOverview();
      if (response.success && response.data) {
        this.eventData = response.data;
        this.renderEventCard(this.eventData);
        this.renderBudgetGauge(this.eventData.budgetHealth);
        this.renderTaskProgress(this.eventData.taskProgress);
        this.renderCategoryBreakdown(this.eventData.budgetHealth.categories || []);
        // Re-sync live countdown to latest target date
        this.startCountdown();
      }
    } catch (err) {
      console.error('Failed to load overview:', err);
      Utils.showToast('Could not load dashboard data', 'error');
    }
  },

  renderEventCard(data) {
    const titleEl = document.getElementById('dash-event-title');
    const venueEl = document.getElementById('dash-event-venue');
    const rsvpEl = document.getElementById('dash-rsvp-stat');
    const budgetEl = document.getElementById('dash-budget-stat');
    const daysEl = document.getElementById('dash-days-stat');
    const selectEl = document.getElementById('dash-event-type-select');

    if (titleEl) titleEl.textContent = data.title;
    if (venueEl) venueEl.textContent = `${data.eventType} • ${data.venue}`;
    if (rsvpEl) rsvpEl.textContent = `${data.confirmedRsvps} / ${data.expectedGuests} (${data.rsvpPercent}%)`;
    if (budgetEl) budgetEl.textContent = Utils.formatCurrency(data.totalBudget);
    if (daysEl) daysEl.textContent = `${data.daysRemaining} Days`;
    if (selectEl && data.eventType) {
      selectEl.value = data.eventType;
    }
  },

  startCountdown() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const updateTimer = () => {
      if (!this.eventData || !this.eventData.targetDate) return;

      const { days, hours, minutes, seconds } = Utils.calculateCountdown(this.eventData.targetDate);

      const daysEl = document.getElementById('cd-days');
      const hoursEl = document.getElementById('cd-hours');
      const minsEl = document.getElementById('cd-mins');
      const secsEl = document.getElementById('cd-secs');

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
    };

    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 1000);
  },

  renderBudgetGauge(health) {
    if (!health) return;

    const score = health.score || 0;
    const scoreEl = document.getElementById('gauge-score-value');
    const labelEl = document.getElementById('gauge-status-label');
    const needleEl = document.getElementById('gauge-needle-path');
    const spendRatioEl = document.getElementById('gauge-spent-ratio');

    if (scoreEl) scoreEl.textContent = score;

    if (labelEl) {
      labelEl.textContent = health.label || 'Budget Health';
      labelEl.style.backgroundColor = `${health.badgeColor}25`;
      labelEl.style.color = health.badgeColor;
      labelEl.style.border = `1px solid ${health.badgeColor}60`;
    }

    if (needleEl) {
      const angle = Utils.scoreToNeedleAngle(score);
      needleEl.setAttribute('transform', `rotate(${angle} 100 95)`);
    }

    if (spendRatioEl) {
      spendRatioEl.textContent = `${Utils.formatCurrency(health.totalSpent)} spent of ${Utils.formatCurrency(health.totalBudget)} (${health.spentPercent}%)`;
    }

    // Overrun alert pill
    const alertBox = document.getElementById('dash-overrun-alert-box');
    if (alertBox) {
      if (health.hasOverruns) {
        alertBox.style.display = 'block';
        alertBox.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.75rem 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div>
              <strong style="color: var(--accent-rose);">⚠️ Overrun Detected:</strong>
              <span style="color: var(--text-secondary); font-size: 0.85rem; margin-left: 0.4rem;">
                ${health.overruns.map(o => `${o.name} is +${Utils.formatCurrency(o.overAmount)} over allocation`).join(', ')}
              </span>
            </div>
            <button id="btn-quick-redistribute" class="btn-gold" style="font-size: 0.8rem; padding: 0.4rem 0.85rem;">
              ⚡ Auto-Rebalance
            </button>
          </div>
        `;
        const rebalanceBtn = document.getElementById('btn-quick-redistribute');
        if (rebalanceBtn) {
          rebalanceBtn.addEventListener('click', () => this.handleRedistribute());
        }
      } else {
        alertBox.style.display = 'none';
      }
    }
  },

  renderCategoryBreakdown(categories) {
    const listEl = document.getElementById('budget-category-list');
    if (!listEl) return;

    listEl.innerHTML = categories.map(cat => {
      const isOver = cat.spent > cat.allocated;
      const percent = Math.min(100, Math.round((cat.spent / (cat.allocated || 1)) * 100));
      const barColor = isOver ? 'var(--accent-rose)' : 'var(--accent-purple)';

      return `
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <div>
              <strong style="font-size: 0.9rem; color: var(--text-main);">${cat.name}</strong>
              ${isOver ? '<span class="badge-friction" style="margin-left: 0.4rem;">+Overrun</span>' : ''}
              ${cat.status === 'rebalanced' ? '<span class="badge-diet" style="margin-left: 0.4rem;">Stabilized</span>' : ''}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
              <strong>${Utils.formatCurrency(cat.spent)}</strong> / ${Utils.formatCurrency(cat.allocated)}
            </div>
          </div>
          <div style="background: var(--bg-secondary); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-subtle);">
            <div style="background: ${barColor}; width: ${percent}%; height: 100%; border-radius: 4px; transition: width 0.5s ease;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
            <span>${cat.note || ''}</span>
            <span>${percent}%</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTaskProgress(progress) {
    if (!progress) return;

    const percentEl = document.getElementById('task-percent-value');
    const fractionEl = document.getElementById('task-fraction-value');
    const ringCircle = document.getElementById('task-ring-circle');

    if (percentEl) percentEl.textContent = `${progress.percent}%`;
    if (fractionEl) fractionEl.textContent = `${progress.completed} of ${progress.total} milestones completed`;

    if (ringCircle) {
      // Circumference of radius 45 is 2 * PI * 45 ≈ 283
      const circumference = 283;
      const offset = circumference - (progress.percent / 100) * circumference;
      ringCircle.style.strokeDashoffset = offset;
    }
  },

  async handleRedistribute() {
    try {
      Utils.showToast('Calculating optimal budget rebalancing...', 'info');
      const response = await API.redistributeBudget();
      if (response.success) {
        Utils.showToast('✅ Budget rebalanced! Deficits covered from reserves.', 'success');
        await this.loadOverview();
      }
    } catch (err) {
      Utils.showToast('Redistribution failed: ' + err.message, 'error');
    }
  },

  _eventsBound: false,
  setupEventListeners() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    const eventTypeSelect = document.getElementById('dash-event-type-select');
    if (eventTypeSelect) {
      eventTypeSelect.addEventListener('change', async (e) => {
        const selectedType = e.target.value;
        Utils.showToast(`Scheduling master event for ${selectedType}...`, 'info');
        try {
          const res = await API.switchEventType(selectedType);
          if (res.success) {
            await this.loadOverview();
            // Sync with checklist template selector if present
            const checklistSelect = document.getElementById('event-template-select');
            if (checklistSelect) checklistSelect.value = selectedType;
            if (window.ChecklistManager) await window.ChecklistManager.loadChecklist();
            Utils.showToast(`🎉 Master event scheduled for ${selectedType}!`, 'success');
          }
        } catch (err) {
          Utils.showToast('Could not schedule event: ' + err.message, 'error');
        }
      });
    }

    const gotoChecklistBtn = document.getElementById('btn-goto-checklist');
    if (gotoChecklistBtn) {
      gotoChecklistBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const navChecklist = document.getElementById('nav-checklist');
        if (navChecklist) {
          navChecklist.click();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    const resetBudgetBtn = document.getElementById('btn-reset-budget');
    if (resetBudgetBtn) {
      resetBudgetBtn.addEventListener('click', async () => {
        try {
          await API.resetBudget();
          Utils.showToast('Budget reset to default baseline', 'info');
          await this.loadOverview();
        } catch (err) {
          Utils.showToast('Reset failed', 'error');
        }
      });
    }

    const predictBtn = document.getElementById('btn-predict-budget');
    if (predictBtn) {
      predictBtn.addEventListener('click', async () => {
        try {
          const res = await API.predictBudgetOverrun(45, 45);
          if (res.success && res.data) {
            alert(`📈 AI Cost Creep Forecast:\n\nDaily Burn Rate: $${res.data.dailyBurnRate}/day\nProjected Final Cost: $${res.data.projectedFinalCost.toLocaleString()}\nOverrun Probability: ${res.data.overrunProbabilityPercent}%\n\nAdvice: ${res.data.recommendation}`);
          }
        } catch (err) {
          Utils.showToast('Prediction failed: ' + err.message, 'error');
        }
      });
    }
  }
};

window.Dashboard = Dashboard;
