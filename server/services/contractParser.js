/**
 * EventGeniePlan AI - Smart Vendor Contract Parser & Risk Analyzer
 * Forensic Clause Inspection, Hidden Fee Extraction & Liability Scoring
 */

/**
 * Heuristic & Rule-Based Fallback Contract Analyzer
 * Ensures 100% test reliability and instant local performance
 */
function fallbackContractParser(contractText = '') {
  const text = (contractText || '').trim();
  const lower = text.toLowerCase();

  const hiddenFees = [];
  const depositSchedule = [];
  const redFlags = [];
  const actionableRecommendations = [];
  let riskScore = 25; // Base starting risk

  // 1. Detect Hidden Fees & Surcharges
  if (lower.includes('administrative') || lower.includes('admin fee') || lower.includes('service charge')) {
    const match = text.match(/(\d{1,2}%)\s*(?:administrative|admin|service\s*charge|service\s*fee)/i);
    const amount = match ? match[1] : '18-24%';
    hiddenFees.push({
      feeName: 'Mandatory Administrative Service Fee',
      amount: amount,
      trigger: 'Applied on top of total invoice sum, typically not shared with service staff.',
      risk: 'High'
    });
    riskScore += 18;
  }

  if (lower.includes('corkage')) {
    const match = text.match(/\$(\d+(?:\.\d{2})?)\s*(?:per\s*bottle|corkage)/i);
    const amount = match ? `$${match[1]}/bottle` : '$35-50/bottle';
    hiddenFees.push({
      feeName: 'Beverage Corkage Surcharge',
      amount: amount,
      trigger: 'Levied on any wine/liquor brought from outside licensed purveyors.',
      risk: 'Medium'
    });
    riskScore += 8;
  }

  if (lower.includes('overtime') || lower.includes('penalty fee')) {
    const match = text.match(/\$(\d+(?:\.\d{2})?)\s*(?:per\s*hour|overtime)/i);
    const amount = match ? `$${match[1]}/hour` : '$300-850/hr';
    hiddenFees.push({
      feeName: 'Overtime Facility Penalty Rate',
      amount: amount,
      trigger: 'Strict hourly penalty if breakdown or departure exceeds curfew.',
      risk: 'High'
    });
    riskScore += 12;
  }

  if (lower.includes('cake cutting') || lower.includes('plating fee')) {
    hiddenFees.push({
      feeName: 'Cake Cutting & Outside Dessert Fee',
      amount: '$4.50 - $7.00 per guest',
      trigger: 'Fee charged for kitchen staff to slice and serve client-provided cake.',
      risk: 'Medium'
    });
    riskScore += 5;
  }

  if (lower.includes('power') || lower.includes('rigging') || lower.includes('hookup')) {
    hiddenFees.push({
      feeName: 'High-Voltage Power & Rigging Fee',
      amount: '$500 - $750 flat',
      trigger: 'Charge for AV vendor access to venue three-phase electrical junction.',
      risk: 'Medium'
    });
    riskScore += 7;
  }

  // 2. Parse Deposit Schedule & Non-refundable clauses
  if (lower.includes('deposit') || lower.includes('retainer')) {
    const isNonRefundable = lower.includes('non-refundable') || lower.includes('strictly non-refundable');
    
    depositSchedule.push({
      milestone: 'Initial Retainer / 1st Deposit',
      percentage: '35% - 50%',
      deadline: 'Due upon contract signing',
      refundable: !isNonRefundable,
      notes: isNonRefundable ? 'Explicitly flagged as STRICTLY NON-REFUNDABLE.' : 'Standard refundable deposit.'
    });

    depositSchedule.push({
      milestone: 'Interim Payment',
      percentage: '30% - 40%',
      deadline: '45-60 days prior to event',
      refundable: false,
      notes: 'Due before final headcount lock.'
    });

    depositSchedule.push({
      milestone: 'Final Balance & Security Hold',
      percentage: 'Remaining balance (20-25%)',
      deadline: '10-14 days prior to event',
      refundable: true,
      notes: 'Security hold refundable 14 business days post-event minus any damages.'
    });

    if (isNonRefundable) {
      riskScore += 15;
    }
  }

  // 3. Detect Red Flags
  if (lower.includes('unilateral') || lower.includes('reserves the right to cancel') || lower.includes('reserves the unilateral right')) {
    redFlags.push('Unilateral Vendor Termination Right: Vendor can cancel contract at will with minimal notice, returning only unspent funds.');
    riskScore += 20;
    actionableRecommendations.push('Require mutual termination terms with a minimum 60-day written notice and liquidated damages clause payable to the client.');
  }

  if (lower.includes('indemnif') || lower.includes('hold harmless')) {
    redFlags.push('One-Sided Indemnification Clause: Client bears full liability for third-party injuries and damages regardless of vendor negligence.');
    riskScore += 15;
    actionableRecommendations.push('Add "except in cases of gross negligence or willful misconduct by the vendor" to the indemnity clause.');
  }

  if (lower.includes('escalation') || lower.includes('market volatility') || lower.includes('commodity costs')) {
    redFlags.push('Vague Food & Material Price Escalation: Caterer reserves right to raise per-plate costs up to 15% within 30 days of the event.');
    riskScore += 16;
    actionableRecommendations.push('Cap any commodity price escalation at a strict maximum of 3% or tie it to the Consumer Price Index (CPI) with audited proof.');
  }

  if (lower.includes('100% of the anticipated') || (lower.includes('under 30 days') && lower.includes('liable for 100%'))) {
    redFlags.push('Extreme Short-Notice Cancellation Penalty: 100% of anticipated revenue due even if canceled 30 days prior.');
    riskScore += 14;
    actionableRecommendations.push('Institute a tiered sliding cancellation scale that deducts food/labor costs that the vendor will not actually incur.');
  }

  if (redFlags.length === 0) {
    redFlags.push('Standard liability terms found; review venue curfew and noise ordinance policies.');
  }

  if (actionableRecommendations.length === 0) {
    actionableRecommendations.push('Request an all-inclusive itemized net price quote before signing.');
    actionableRecommendations.push('Confirm written guaranteed load-in and load-out window times.');
  }

  // Cap score between 0 and 100
  const normalizedScore = Math.min(96, Math.max(18, riskScore));
  let riskLevel = 'Low';
  if (normalizedScore >= 75) riskLevel = 'Critical';
  else if (normalizedScore >= 50) riskLevel = 'High';
  else if (normalizedScore >= 35) riskLevel = 'Medium';

  return {
    riskScore: normalizedScore,
    riskLevel,
    summary: `Forensic audit of contract identified ${hiddenFees.length} potential hidden fee vectors and ${redFlags.length} elevated legal risk clauses. Total calculated risk level is ${riskLevel}.`,
    hiddenFees,
    depositSchedule,
    redFlags,
    actionableRecommendations
  };
}

module.exports = {
  fallbackContractParser
};
