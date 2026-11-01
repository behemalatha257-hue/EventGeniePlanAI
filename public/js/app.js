/**
 * EventGeniePlan AI - Master Application Orchestrator
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🧞 Initializing EventGeniePlan AI client application...');

  // 1. Theme Setup (Dark / Light)
  const savedTheme = localStorage.getItem('eventgenie_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('eventgenie_theme', next);
      updateThemeIcon(next);
      Utils.showToast(`Switched to ${next === 'dark' ? 'Midnight Luxury' : 'Daylight Crisp'} theme`, 'info');
    });
  }

  function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // 2. Tab Navigation
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(`tab-${targetTab}`);
      if (activePane) {
        activePane.classList.add('active');
      }

      // Lazy load sub-module data if opening specific tab
      if (targetTab === 'dashboard' && window.Dashboard) {
        window.Dashboard.loadOverview();
      } else if (targetTab === 'copilot' && window.Copilot) {
        window.Copilot.init();
      } else if (targetTab === 'contract' && window.ContractAnalyzer) {
        window.ContractAnalyzer.init();
      } else if (targetTab === 'seating' && window.SeatingChart) {
        window.SeatingChart.init();
      } else if (targetTab === 'checklist' && window.ChecklistManager) {
        window.ChecklistManager.init();
      } else if ((targetTab === 'spatial' || targetTab === 'eco' || targetTab === 'rsvp') && window.AdvancedFeatures) {
        window.AdvancedFeatures.init();
      }
    });
  });

  // Initialize AdvancedFeatures in background
  if (window.AdvancedFeatures) {
    window.AdvancedFeatures.init();
  }

  // 3. Initialize Dashboard by default
  if (window.Dashboard) {
    await window.Dashboard.init();
  }

  // Check health and connectivity
  try {
    const health = await API.request('/api/health');
    const badge = document.getElementById('system-status-indicator');
    if (badge && health.status === 'online') {
      badge.innerHTML = `🟢 AI Engine: <strong>${health.aiEngine?.model || 'Gemini 2.5'}</strong> (${health.aiEngine?.isKeyConfigured ? 'Live Key' : 'Local Fallback'})`;
    }
  } catch (e) {
    console.warn('Health check notice:', e);
  }

  console.log('✅ EventGeniePlan AI initialized successfully.');
});
