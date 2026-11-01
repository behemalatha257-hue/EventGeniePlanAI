/**
 * EventGeniePlan AI - Dynamic Checklist & Automated Run-Sheet Manager
 * Milestone Checklists, Cascading Date Shift Simulator & Day-Of Run-Sheet
 */

const ChecklistManager = {
  data: null,

  async init() {
    await this.loadChecklist();
    this.setupEventListeners();
  },

  async loadChecklist() {
    try {
      const response = await API.getChecklist();
      if (response.success && response.data) {
        this.data = response.data;
        this.renderChecklist();
        this.renderRunSheet();
        this.updateDateControls();
      }
    } catch (err) {
      console.error('Failed to load checklist:', err);
      Utils.showToast('Could not load checklist data', 'error');
    }
  },

  updateDateControls() {
    const input = document.getElementById('target-date-picker');
    const display = document.getElementById('target-date-display');
    if (input && this.data.targetDate) {
      input.value = this.data.targetDate;
    }
    if (display && this.data.targetDate) {
      display.textContent = Utils.formatDate(this.data.targetDate);
    }
  },

  renderChecklist() {
    const container = document.getElementById('checklist-milestones-container');
    const statsEl = document.getElementById('checklist-progress-stat');
    if (!container || !this.data) return;

    if (statsEl && this.data.stats) {
      statsEl.textContent = `${this.data.stats.completedCount} of ${this.data.stats.totalCount} completed (${this.data.stats.progressPercent}%)`;
    }

    container.innerHTML = this.data.milestones.map(m => {
      let priorityColor = 'var(--text-secondary)';
      if (m.priority === 'Critical') priorityColor = 'var(--accent-rose)';
      else if (m.priority === 'Urgent') priorityColor = 'var(--accent-gold)';
      else if (m.priority === 'High') priorityColor = 'var(--accent-purple)';

      return `
        <div class="milestone-item ${m.completed ? 'completed' : ''}" id="milestone-${m.id}">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="checkbox-custom ${m.completed ? 'checked' : ''}" data-milestone-id="${m.id}" role="checkbox" aria-checked="${m.completed}">
              ${m.completed ? '✔' : ''}
            </div>
            <div>
              <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem; text-decoration: ${m.completed ? 'line-through' : 'none'};">
                ${m.title}
              </div>
              <div style="display: flex; gap: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">
                <span>📅 Due: <strong>${Utils.formatDate(m.dueDate)}</strong></span>
                <span>• Phase: ${m.phase}</span>
                <span>• Lead: ${m.owner || 'Planner'}</span>
              </div>
            </div>
          </div>
          <div>
            <span class="chip-btn" style="color: ${priorityColor}; font-weight: 700; border-color: ${priorityColor}40;">
              ${m.priority}
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Attach toggle handlers
    container.querySelectorAll('.checkbox-custom').forEach(box => {
      box.addEventListener('click', async () => {
        const id = box.getAttribute('data-milestone-id');
        await this.handleToggle(id);
      });
    });
  },

  renderRunSheet() {
    const container = document.getElementById('run-sheet-timeline-container');
    if (!container || !this.data.runSheet) return;

    container.innerHTML = this.data.runSheet.map((item, idx) => `
      <div style="display: flex; gap: 1.25rem; align-items: flex-start; padding: 1rem; border-bottom: 1px solid var(--border-subtle);">
        <div style="min-width: 90px; text-align: right;">
          <strong style="color: var(--accent-gold); font-size: 0.95rem; font-family: 'Outfit', sans-serif;">${item.time}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${item.duration} mins</div>
        </div>
        <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--accent-purple); margin-top: 0.3rem; box-shadow: 0 0 8px var(--accent-purple);"></div>
        <div style="flex: 1;">
          <strong style="font-size: 0.95rem; color: var(--text-main);">${item.title}</strong>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Lead: <strong>${item.lead}</strong> ${item.notes ? `• <em>${item.notes}</em>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },

  async handleToggle(milestoneId) {
    try {
      const res = await API.toggleMilestone(milestoneId);
      if (res.success) {
        const item = this.data.milestones.find(m => m.id === milestoneId);
        if (item) item.completed = res.milestone.completed;
        this.data.stats = res.stats;
        this.renderChecklist();
        if (window.Dashboard) {
          window.Dashboard.loadOverview();
        }
      }
    } catch (err) {
      Utils.showToast('Could not update milestone: ' + err.message, 'error');
    }
  },

  async handleDateShift(newDateStr) {
    if (!newDateStr) return;

    Utils.showToast(`Cascading deadline changes to target date: ${newDateStr}...`, 'info');

    try {
      const res = await API.shiftTargetDate(newDateStr);
      if (res.success) {
        this.data.targetDate = newDateStr;
        this.data.milestones = res.data.milestones;
        this.renderChecklist();
        this.updateDateControls();
        Utils.showToast('🎉 All cascading milestones shifted successfully!', 'success');
        if (window.Dashboard) {
          window.Dashboard.loadOverview();
        }
      }
    } catch (err) {
      Utils.showToast('Date shift failed: ' + err.message, 'error');
    }
  },

  async handleGenerateTemplate(eventType) {
    Utils.showToast(`Generating custom roadmap for ${eventType}...`, 'info');
    try {
      const res = await API.generateChecklist(eventType, this.data.targetDate, 45000);
      if (res.success) {
        this.data = res.data;
        this.renderChecklist();
        this.renderRunSheet();
        Utils.showToast(`✨ Scheduled event for ${eventType}`, 'success');

        // Immediately update Dashboard hero, countdown, and financial categories
        if (window.Dashboard) {
          await window.Dashboard.loadOverview();
        }

        // Keep Dashboard event selector dropdown in sync
        const dashSelect = document.getElementById('dash-event-type-select');
        if (dashSelect) dashSelect.value = eventType;
      }
    } catch (err) {
      Utils.showToast('Generation failed: ' + err.message, 'error');
    }
  },

  _eventsBound: false,
  setupEventListeners() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    const shiftBtn = document.getElementById('btn-apply-date-shift');
    const dateInput = document.getElementById('target-date-picker');

    if (shiftBtn && dateInput) {
      shiftBtn.addEventListener('click', () => {
        this.handleDateShift(dateInput.value);
      });
    }

    // Quick shift buttons (+14 days, -7 days)
    const plus14Btn = document.getElementById('btn-shift-plus-14');
    if (plus14Btn) {
      plus14Btn.addEventListener('click', () => {
        if (!this.data.targetDate) return;
        const d = new Date(this.data.targetDate);
        d.setDate(d.getDate() + 14);
        const nextDate = d.toISOString().split('T')[0];
        this.handleDateShift(nextDate);
      });
    }

    const minus7Btn = document.getElementById('btn-shift-minus-7');
    if (minus7Btn) {
      minus7Btn.addEventListener('click', () => {
        if (!this.data.targetDate) return;
        const d = new Date(this.data.targetDate);
        d.setDate(d.getDate() - 7);
        const prevDate = d.toISOString().split('T')[0];
        this.handleDateShift(prevDate);
      });
    }

    // Template switcher
    const templateSelect = document.getElementById('event-template-select');
    if (templateSelect) {
      templateSelect.addEventListener('change', (e) => {
        this.handleGenerateTemplate(e.target.value);
      });
    }
  }
};

window.ChecklistManager = ChecklistManager;
