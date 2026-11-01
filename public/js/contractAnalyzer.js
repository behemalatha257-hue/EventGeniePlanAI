/**
 * EventGeniePlan AI - Smart Vendor Contract Analyzer Module
 * Forensic Extraction of Hidden Fees, Deposit Schedules & Red Flags
 */

const ContractAnalyzer = {
  samples: [],
  _initialized: false,
  _eventsBound: false,

  async init() {
    this.setupEventListeners();
    if (!this._initialized) {
      this._initialized = true;
      await this.loadSamples();
    }
  },

  async loadSamples() {
    try {
      const response = await API.getContractSamples();
      if (response.success && response.samples) {
        this.samples = response.samples;
        this.renderSampleButtons();
      }
    } catch (err) {
      console.warn('Could not load contract samples:', err);
    }
  },

  renderSampleButtons() {
    const container = document.getElementById('contract-sample-buttons');
    if (!container) return;

    container.innerHTML = this.samples.map((s, idx) => `
      <button class="chip-btn ${idx === 0 ? 'active' : ''}" data-sample-id="${s.id}" id="sample-btn-${s.id}">
        📄 ${s.name}
      </button>
    `).join('');

    container.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        container.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sampleId = btn.getAttribute('data-sample-id');
        await this.loadSampleContent(sampleId);
      });
    });

    // Auto-load first sample
    if (this.samples.length > 0) {
      this.loadSampleContent(this.samples[0].id);
    }
  },

  async loadSampleContent(sampleId) {
    try {
      const res = await API.request(`/api/contracts/sample/${sampleId}`);
      if (res.success && res.sample) {
        const textarea = document.getElementById('contract-input-text');
        if (textarea) textarea.value = res.sample.text;
      }
    } catch (err) {
      console.error('Failed to load sample content:', err);
    }
  },

  async analyzeCurrentContract() {
    const textarea = document.getElementById('contract-input-text');
    const analyzeBtn = document.getElementById('btn-analyze-contract');
    const resultsContainer = document.getElementById('contract-results-box');

    if (!textarea || !textarea.value.trim()) {
      Utils.showToast('Please paste a contract or select a sample agreement', 'warning');
      return;
    }

    const originalBtnText = analyzeBtn.innerHTML;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '🔍 Analyzing Forensic Clauses...';
    Utils.showToast('AI Contract Audit in progress...', 'info');

    try {
      const response = await API.analyzeContract(textarea.value.trim());
      if (response.success && response.analysis) {
        this.renderAnalysisResults(response.analysis);
        Utils.showToast('Contract audit complete!', 'success');
      }
    } catch (err) {
      console.error('Contract analysis failed:', err);
      Utils.showToast('Audit failed: ' + err.message, 'error');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = originalBtnText;
    }
  },

  renderAnalysisResults(analysis) {
    const container = document.getElementById('contract-results-box');
    if (!container) return;

    container.style.display = 'block';

    let riskBadgeBg = 'rgba(16, 185, 129, 0.2)';
    let riskBadgeColor = 'var(--accent-emerald)';
    if (analysis.riskLevel === 'Critical') {
      riskBadgeBg = 'rgba(244, 63, 94, 0.2)';
      riskBadgeColor = 'var(--accent-rose)';
    } else if (analysis.riskLevel === 'High') {
      riskBadgeBg = 'rgba(245, 158, 11, 0.2)';
      riskBadgeColor = 'var(--accent-gold)';
    }

    container.innerHTML = `
      <!-- Risk Score Header -->
      <div class="risk-meter-box" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle);">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Overall Risk Assessment</span>
          <div style="font-size: 1.5rem; font-weight: 800; font-family: 'Outfit', sans-serif;">
            Risk Score: ${analysis.riskScore} / 100
          </div>
        </div>
        <div class="risk-badge" style="background: ${riskBadgeBg}; color: ${riskBadgeColor}; border: 1px solid ${riskBadgeColor}50;">
          ${analysis.riskLevel} Risk
        </div>
      </div>

      <!-- Executive Summary -->
      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.4rem; color: var(--text-main);">📋 Executive Audit Summary</h4>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">${analysis.summary}</p>
      </div>

      <!-- Hidden Fees Section -->
      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.6rem; color: var(--accent-gold);">💸 Hidden Fees & Surcharges (${analysis.hiddenFees.length})</h4>
        ${analysis.hiddenFees.map(fee => `
          <div class="fee-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong>${fee.feeName}</strong>
              <span class="badge-friction">${fee.amount}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
              <strong>Trigger:</strong> ${fee.trigger}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Red Flags Section -->
      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.6rem; color: var(--accent-rose);">🚩 Contract Red Flags (${analysis.redFlags.length})</h4>
        ${analysis.redFlags.map(rf => `
          <div class="red-flag-card">
            ⚠️ ${rf}
          </div>
        `).join('')}
      </div>

      <!-- Deposit Schedule -->
      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.6rem; color: var(--text-main);">📅 Deposit & Payment Milestones</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${analysis.depositSchedule.map(dep => `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 0.875rem;">${dep.milestone}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${dep.deadline} • ${dep.notes || ''}</div>
              </div>
              <div style="text-align: right;">
                <span style="font-weight: 700; color: var(--text-main);">${dep.percentage}</span>
                <div>
                  ${dep.refundable 
                    ? '<span class="badge-diet" style="font-size: 0.65rem;">Refundable</span>' 
                    : '<span class="badge-friction" style="font-size: 0.65rem;">Non-Refundable</span>'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Actionable Counter-Proposals -->
      <div>
        <h4 style="margin-bottom: 0.6rem; color: var(--accent-emerald);">🛡️ Actionable Negotiation Counter-Clauses</h4>
        <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">
          ${analysis.actionableRecommendations.map(rec => `
            <li style="margin-bottom: 0.4rem;"><strong>Negotiate:</strong> ${rec}</li>
          `).join('')}
        </ul>
      </div>
    `;

    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  setupEventListeners() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    const analyzeBtn = document.getElementById('btn-analyze-contract');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.analyzeCurrentContract());
    }

    const fileInput = document.getElementById('contract-file-upload');
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const textarea = document.getElementById('contract-input-text');
        const fileName = file.name.toLowerCase();

        // 1. Handle PDF Documents with PDF.js
        if (fileName.endsWith('.pdf')) {
          Utils.showToast(`Extracting readable text from ${file.name}...`, 'info');
          try {
            if (window.pdfjsLib) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              const arrayBuffer = await file.arrayBuffer();
              const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
              const pdf = await loadingTask.promise;

              let extractedText = '';
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageStrings = textContent.items.map(item => item.str).filter(Boolean);
                extractedText += `=== Page ${pageNum} ===\n` + pageStrings.join(' ') + '\n\n';
              }

              if (extractedText.trim().length > 20) {
                if (textarea) textarea.value = extractedText.trim();
                Utils.showToast(`✅ Successfully extracted text from ${file.name} (${pdf.numPages} pages)`, 'success');
                return;
              }
            }
          } catch (pdfErr) {
            console.warn('PDF.js parsing notice:', pdfErr);
          }
        }

        // 2. Handle Plain Text, Markdown, or Fallback
        const reader = new FileReader();
        reader.onload = (event) => {
          let content = event.target.result || '';
          // Clean non-printable binary bytes if a binary file was accidentally read
          if (content.includes('%PDF-') || /[\x00-\x08\x0E-\x1F]/.test(content)) {
            // Extract printable strings of 4+ characters
            const printableMatches = content.match(/[\x20-\x7E\t\r\n]{4,}/g);
            if (printableMatches && printableMatches.length > 5) {
              content = printableMatches.join(' ');
            }
          }
          if (textarea) textarea.value = content.trim();
          Utils.showToast(`Loaded ${file.name}`, 'info');
        };
        reader.readAsText(file);
      });
    }
  }
};

window.ContractAnalyzer = ContractAnalyzer;
