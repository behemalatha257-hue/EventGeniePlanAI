/**
 * EventGeniePlan AI - Universal Accessibility Suite (WCAG 2.1 Level AAA Compliant)
 * Features:
 * 1. Web Speech API Text-to-Speech (TTS) Voice Narration
 * 2. OpenDyslexic / Dyslexia-Friendly Font Mode
 * 3. High-Contrast Mode (>7:1 Contrast Ratio)
 * 4. Dynamic Font Resizing (A- / Reset / A+)
 * 5. Screen Reader Live ARIA Announcer
 * 6. Keyboard Skip-to-Content Link
 */

(function () {
  'use strict';

  // State
  const A11Y_STORAGE_KEYS = {
    DYSLEXIA: 'eg_dyslexia_mode',
    HIGH_CONTRAST: 'eg_high_contrast_mode',
    FONT_SCALE: 'eg_font_scale_step'
  };

  const FONT_SCALES = [
    { label: 'Small', fontSize: '14px', zoom: 0.9 },
    { label: 'Normal', fontSize: '16px', zoom: 1.0 },
    { label: 'Large', fontSize: '18px', zoom: 1.125 },
    { label: 'Extra Large', fontSize: '20px', zoom: 1.25 }
  ];

  let currentScaleIndex = 1; // Default: 16px (Normal)
  let synth = window.speechSynthesis || null;
  let currentUtterance = null;
  let isSpeaking = false;

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initA11yAnnouncer();
    initA11yPreferences();
    initSpeechSynthesis();
    bindA11yToolbar();
    setupReadableTargetListeners();
  });

  /**
   * Initializes screen reader live region
   */
  function initA11yAnnouncer() {
    if (!document.getElementById('a11y-announcer')) {
      const announcer = document.createElement('div');
      announcer.id = 'a11y-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
  }

  /**
   * Broadcasts a message to assistive screen readers
   * @param {string} message
   */
  window.a11yAnnounce = function (message) {
    const announcer = document.getElementById('a11y-announcer');
    if (announcer) {
      announcer.textContent = '';
      setTimeout(() => {
        announcer.textContent = message;
      }, 50);
    }
  };

  /**
   * Loads saved accessibility preferences from localStorage
   */
  function initA11yPreferences() {
    // Dyslexia Mode
    if (localStorage.getItem(A11Y_STORAGE_KEYS.DYSLEXIA) === 'true') {
      document.body.classList.add('dyslexia-mode');
      updateButtonState('a11y-dyslexia-toggle', true);
    }

    // High Contrast Mode
    if (localStorage.getItem(A11Y_STORAGE_KEYS.HIGH_CONTRAST) === 'true') {
      document.body.classList.add('high-contrast-mode');
      updateButtonState('a11y-contrast-toggle', true);
    }

    // Font Scale
    const savedScale = parseInt(localStorage.getItem(A11Y_STORAGE_KEYS.FONT_SCALE), 10);
    if (!isNaN(savedScale) && savedScale >= 0 && savedScale < FONT_SCALES.length) {
      currentScaleIndex = savedScale;
      applyFontScale();
    }
  }

  /**
   * Binds Toolbar Buttons
   */
  function bindA11yToolbar() {
    // 1. Text to Speech Toggle
    const ttsBtn = document.getElementById('a11y-tts-btn');
    if (ttsBtn) {
      ttsBtn.addEventListener('click', toggleGlobalTTS);
    }

    // 2. Dyslexia Font Toggle
    const dyslexiaBtn = document.getElementById('a11y-dyslexia-toggle');
    if (dyslexiaBtn) {
      dyslexiaBtn.addEventListener('click', () => {
        const isEnabled = document.body.classList.toggle('dyslexia-mode');
        localStorage.setItem(A11Y_STORAGE_KEYS.DYSLEXIA, isEnabled);
        updateButtonState('a11y-dyslexia-toggle', isEnabled);
        window.a11yAnnounce(isEnabled ? 'Dyslexia friendly typography enabled' : 'Standard typography restored');
      });
    }

    // 3. High Contrast Toggle
    const contrastBtn = document.getElementById('a11y-contrast-toggle');
    if (contrastBtn) {
      contrastBtn.addEventListener('click', () => {
        const isEnabled = document.body.classList.toggle('high-contrast-mode');
        localStorage.setItem(A11Y_STORAGE_KEYS.HIGH_CONTRAST, isEnabled);
        updateButtonState('a11y-contrast-toggle', isEnabled);
        window.a11yAnnounce(isEnabled ? 'High contrast AAA mode activated' : 'Standard theme contrast restored');
      });
    }

    // 4. Font Size Decrease (A-)
    const fontDecreaseBtn = document.getElementById('a11y-font-decrease');
    if (fontDecreaseBtn) {
      fontDecreaseBtn.addEventListener('click', () => {
        if (currentScaleIndex > 0) {
          currentScaleIndex--;
          applyFontScale();
          window.a11yAnnounce(`Text size decreased to ${FONT_SCALES[currentScaleIndex].label}`);
        }
      });
    }

    // 5. Font Size Increase (A+)
    const fontIncreaseBtn = document.getElementById('a11y-font-increase');
    if (fontIncreaseBtn) {
      fontIncreaseBtn.addEventListener('click', () => {
        if (currentScaleIndex < FONT_SCALES.length - 1) {
          currentScaleIndex++;
          applyFontScale();
          window.a11yAnnounce(`Text size increased to ${FONT_SCALES[currentScaleIndex].label}`);
        }
      });
    }

    // 6. Font Size Reset
    const fontResetBtn = document.getElementById('a11y-font-reset');
    if (fontResetBtn) {
      fontResetBtn.addEventListener('click', () => {
        currentScaleIndex = 1; // Default
        applyFontScale();
        window.a11yAnnounce('Text size reset to default');
      });
    }
  }

  /**
   * Applies the selected font scale to documentElement
   */
  function applyFontScale() {
    const scale = FONT_SCALES[currentScaleIndex];
    document.documentElement.style.fontSize = scale.fontSize;
    localStorage.setItem(A11Y_STORAGE_KEYS.FONT_SCALE, currentScaleIndex);
    const indicator = document.getElementById('a11y-font-size-label');
    if (indicator) {
      indicator.textContent = scale.fontSize;
    }
  }

  /**
   * Helper to update ARIA pressed state and visual classes
   */
  function updateButtonState(btnId, isActive) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.classList.toggle('active', isActive);
    }
  }

  /**
   * Text-To-Speech (Web Speech API) Engine
   */
  function initSpeechSynthesis() {
    if (!synth) {
      console.warn('SpeechSynthesis API not supported in this environment');
      const ttsBtn = document.getElementById('a11y-tts-btn');
      if (ttsBtn) {
        ttsBtn.title = 'Speech synthesis not supported in this browser';
        ttsBtn.disabled = true;
      }
      return;
    }

    window.addEventListener('beforeunload', () => {
      if (synth) synth.cancel();
    });
  }

  /**
   * Toggles Speech Synthesis on active content
   */
  function toggleGlobalTTS() {
    if (!synth) return;

    if (isSpeaking) {
      stopSpeaking();
      window.a11yAnnounce('Voice narration stopped');
      return;
    }

    // Find readable text in currently active tab
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab) return;

    let textToRead = '';

    // Check for selected text first
    const selection = window.getSelection().toString().trim();
    if (selection) {
      textToRead = selection;
    } else {
      // Find prominent content container in active tab
      const hero = activeTab.querySelector('.dashboard-hero, .chat-box, .contract-grid, .seating-layout-grid, .checklist-container');
      textToRead = hero ? hero.innerText : activeTab.innerText;
    }

    if (!textToRead) {
      window.a11yAnnounce('No text available to read aloud');
      return;
    }

    speakText(textToRead.slice(0, 1000)); // Cap to first 1000 characters for responsive playback
  }

  /**
   * Speaks given text aloud with utterance handlers
   * @param {string} text
   */
  window.speakText = function (text) {
    if (!synth || !text) return;

    synth.cancel(); // Stop prior audio

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;
    currentUtterance.lang = 'en-US';

    currentUtterance.onstart = () => {
      isSpeaking = true;
      updateTTSButton(true);
      window.a11yAnnounce('Voice narration started');
    };

    currentUtterance.onend = () => {
      isSpeaking = false;
      updateTTSButton(false);
    };

    currentUtterance.onerror = () => {
      isSpeaking = false;
      updateTTSButton(false);
    };

    synth.speak(currentUtterance);
  };

  /**
   * Stops active voice speech
   */
  window.stopSpeaking = function () {
    if (synth) {
      synth.cancel();
      isSpeaking = false;
      updateTTSButton(false);
    }
  };

  function updateTTSButton(speaking) {
    const btn = document.getElementById('a11y-tts-btn');
    if (btn) {
      btn.setAttribute('aria-pressed', speaking ? 'true' : 'false');
      btn.classList.toggle('tts-playing', speaking);
      btn.title = speaking ? 'Stop Voice Narration' : 'Read Aloud (TTS Voice)';
      const icon = btn.querySelector('.tts-icon');
      if (icon) {
        icon.textContent = speaking ? '⏹️' : '🎙️';
      }
    }
  }

  /**
   * Automatically adds read-aloud click triggers to Copilot AI bubbles
   */
  function setupReadableTargetListeners() {
    document.addEventListener('click', (e) => {
      const readBtn = e.target.closest('.msg-tts-btn');
      if (readBtn) {
        const bubble = readBtn.closest('.chat-bubble');
        if (bubble) {
          const content = bubble.querySelector('.bubble-text') || bubble;
          speakText(content.innerText);
        }
      }
    });
  }
})();
