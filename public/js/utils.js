/**
 * EventGeniePlan AI - Frontend Utilities & SVG Visual Helpers
 */

const Utils = {
  /**
   * Formats number as USD currency
   */
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount || 0);
  },

  /**
   * Formats ISO date string to human readable format
   */
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  /**
   * Calculates live countdown components (days, hours, minutes, seconds)
   */
  calculateCountdown(targetDateStr) {
    const target = new Date(targetDateStr + 'T09:00:00').getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isPast: false };
  },

  /**
   * Maps a budget health score (0-100) to gauge needle rotation degrees (-90 to +90)
   */
  scoreToNeedleAngle(score) {
    const clamped = Math.max(0, Math.min(100, score || 0));
    // 0 -> -90 deg, 50 -> 0 deg, 100 -> +90 deg
    return (clamped / 100) * 180 - 90;
  },

  /**
   * Renders toast notification
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Simple markdown to HTML formatter for AI responses
   */
  renderMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/^### (.*$)/gim, '<h3 style="margin: 0.8rem 0 0.4rem 0; font-size: 1.1rem; color: var(--accent-gold);">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 style="margin: 0.6rem 0 0.3rem 0; font-size: 0.95rem; color: var(--text-main);">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.25rem;">$1</li>')
      .replace(/\n/g, '<br/>');
  }
};

window.Utils = Utils;
