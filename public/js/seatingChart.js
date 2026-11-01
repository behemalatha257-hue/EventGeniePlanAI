/**
 * EventGeniePlan AI - Intelligent Seating Chart Optimizer Module
 * Drag-and-Drop Floorplan, Friction Feud Detection & Dietary Clustering
 */

const SeatingChart = {
  tables: [],
  unassignedGuests: [],
  evaluation: null,
  draggedGuestId: null,
  _initialized: false,
  _eventsBound: false,

  async init() {
    this.setupEventListeners();
    await this.loadChart();
  },

  async loadChart() {
    try {
      const response = await API.getSeatingChart();
      if (response.success && response.data) {
        this.tables = response.data.tables;
        this.unassignedGuests = response.data.unassignedGuests;
        this.evaluation = response.data.evaluation;

        this.renderMetrics();
        this.renderTables();
        this.renderGuestPool();
      }
    } catch (err) {
      console.error('Failed to load seating chart:', err);
      Utils.showToast('Could not load seating data', 'error');
    }
  },

  renderMetrics() {
    const scoreEl = document.getElementById('seating-harmony-score');
    const clashesEl = document.getElementById('seating-clashes-stat');
    const alertBox = document.getElementById('seating-clashes-alert-box');

    if (scoreEl && this.evaluation) {
      scoreEl.textContent = `${this.evaluation.harmonyScore}%`;
    }

    if (clashesEl && this.evaluation) {
      clashesEl.textContent = `${this.evaluation.clashes.length} Active Clashes`;
      clashesEl.style.color = this.evaluation.hasClashes ? 'var(--accent-rose)' : 'var(--accent-emerald)';
    }

    if (alertBox && this.evaluation) {
      if (this.evaluation.hasClashes) {
        alertBox.style.display = 'block';
        alertBox.innerHTML = `
          <div style="background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); padding: 0.85rem 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <strong style="color: var(--accent-rose); font-size: 0.95rem;">🚨 Seating Clashes Detected!</strong>
              <button id="btn-quick-optimize-alert" class="btn-gold" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;">
                ⚡ Auto-Resolve Clashes
              </button>
            </div>
            <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: var(--text-main);">
              ${this.evaluation.clashes.map(c => `<li>${c.message}</li>`).join('')}
            </ul>
          </div>
        `;

        const quickSolve = document.getElementById('btn-quick-optimize-alert');
        if (quickSolve) {
          quickSolve.addEventListener('click', () => this.handleOptimize());
        }
      } else {
        alertBox.style.display = 'none';
      }
    }
  },

  renderTables() {
    const grid = document.getElementById('seating-tables-grid');
    if (!grid) return;

    grid.innerHTML = this.tables.map(table => {
      const isFull = table.seatedCount >= table.capacity;
      const tableClash = this.evaluation?.clashes?.find(c => c.tableId === table.id);

      return `
        <div class="table-circle-card ${tableClash ? 'has-clash' : ''}" data-table-id="${table.id}" id="table-${table.id}">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
            <div>
              <strong style="font-size: 1rem; color: var(--text-main);">${table.name}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${table.shape} • Max ${table.capacity} Seats</div>
            </div>
            <div>
              <span class="chip-btn" style="font-weight: 700; ${isFull ? 'color: var(--accent-rose);' : 'color: var(--accent-emerald);'}">
                ${table.seatedCount} / ${table.capacity} Seated
              </span>
            </div>
          </div>

          ${tableClash ? `
            <div style="background: rgba(244, 63, 94, 0.15); color: var(--accent-rose); font-size: 0.75rem; padding: 0.35rem 0.6rem; border-radius: 4px; margin-top: 0.5rem; font-weight: 600;">
              ⚠️ Conflict: Incompatible guests seated together
            </div>
          ` : ''}

          <div class="table-seated-list" data-table-drop="${table.id}">
            ${table.guests && table.guests.length > 0 ? table.guests.map(guest => this.renderGuestCardHtml(guest, table.id)).join('') : `
              <div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; margin: 2rem 0; font-style: italic;">
                Drop guests here to seat
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    this.attachDragAndDropHandlers();
  },

  renderGuestPool() {
    const pool = document.getElementById('seating-unassigned-pool');
    if (!pool) return;

    if (this.unassignedGuests.length === 0) {
      pool.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 2rem 0;">
          🎉 All guests have been assigned tables!
        </div>
      `;
      return;
    }

    pool.innerHTML = this.unassignedGuests.map(guest => this.renderGuestCardHtml(guest, null)).join('');
    this.attachDragAndDropHandlers();
  },

  renderGuestCardHtml(guest, currentTableId) {
    const hasDiet = guest.diet && guest.diet !== 'None';
    const hasFriction = guest.frictionWith && guest.frictionWith.length > 0;

    return `
      <div class="guest-card" draggable="true" data-guest-id="${guest.id}" data-origin-table="${currentTableId || ''}" id="guest-${guest.id}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 0.875rem; color: var(--text-main);">${guest.name}</strong>
          ${guest.vip ? '<span class="badge-vip">⭐ VIP</span>' : ''}
        </div>
        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.2rem;">
          <span style="font-size: 0.7rem; color: var(--text-secondary);">${guest.affinityGroup || 'General'}</span>
          ${hasDiet ? `<span class="badge-diet">🥗 ${guest.diet}</span>` : ''}
          ${hasFriction ? `<span class="badge-friction">⚡ Feud Risk</span>` : ''}
        </div>
      </div>
    `;
  },

  attachDragAndDropHandlers() {
    // Draggable guests
    document.querySelectorAll('.guest-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedGuestId = card.getAttribute('data-guest-id');
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', this.draggedGuestId);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.draggedGuestId = null;
      });
    });

    // Drop targets (Tables)
    document.querySelectorAll('.table-circle-card').forEach(tableCard => {
      const tableId = tableCard.getAttribute('data-table-id');

      tableCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        tableCard.classList.add('drag-over');
      });

      tableCard.addEventListener('dragleave', () => {
        tableCard.classList.remove('drag-over');
      });

      tableCard.addEventListener('drop', async (e) => {
        e.preventDefault();
        tableCard.classList.remove('drag-over');
        const guestId = e.dataTransfer.getData('text/plain') || this.draggedGuestId;
        if (guestId && tableId) {
          await this.handleAssignGuest(guestId, tableId);
        }
      });
    });

    // Drop target (Unassigned Pool)
    const poolBox = document.getElementById('seating-unassigned-pool');
    if (poolBox) {
      poolBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        poolBox.style.borderColor = 'var(--accent-purple)';
      });

      poolBox.addEventListener('dragleave', () => {
        poolBox.style.borderColor = 'var(--border-subtle)';
      });

      poolBox.addEventListener('drop', async (e) => {
        e.preventDefault();
        poolBox.style.borderColor = 'var(--border-subtle)';
        const guestId = e.dataTransfer.getData('text/plain') || this.draggedGuestId;
        if (guestId) {
          await this.handleAssignGuest(guestId, null);
        }
      });
    }
  },

  async handleAssignGuest(guestId, tableId) {
    try {
      const res = await API.assignGuest(guestId, tableId);
      if (res.success) {
        await this.loadChart();
        if (res.evaluation.hasClashes) {
          Utils.showToast('⚠️ Placed guest created a friction conflict!', 'warning');
        } else {
          Utils.showToast('Guest seated successfully', 'success');
        }
      }
    } catch (err) {
      Utils.showToast('Failed to assign guest: ' + err.message, 'error');
    }
  },

  async handleOptimize() {
    const btn = document.getElementById('btn-optimize-seating');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⚡ Solving Constraint Graph...';
    }

    Utils.showToast('Optimizing seating: Separating friction pairs & grouping affinities...', 'info');

    try {
      const res = await API.optimizeSeating(true);
      if (res.success) {
        await this.loadChart();
        Utils.showToast(`🎉 Optimization Complete! Harmony Score: ${res.evaluation.harmonyScore}%`, 'success');
      }
    } catch (err) {
      Utils.showToast('Optimization failed: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  },

  setupEventListeners() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    const optimizeBtn = document.getElementById('btn-optimize-seating');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => this.handleOptimize());
    }

    const resetBtn = document.getElementById('btn-reset-seating');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        try {
          await API.resetSeating();
          Utils.showToast('Seating chart reset to baseline', 'info');
          await this.loadChart();
        } catch (err) {
          Utils.showToast('Reset failed', 'error');
        }
      });
    }
  }
};

window.SeatingChart = SeatingChart;
