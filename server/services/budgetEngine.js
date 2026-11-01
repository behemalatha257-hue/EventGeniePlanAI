/**
 * EventGeniePlan AI - Budget Strategy & Financial Health Engine
 * Health Gauge Scoring, Overrun Prediction & Dynamic Redistribution
 */

/**
 * Calculates the comprehensive Budget Health Score (0 - 100)
 * Evaluates:
 * 1. Spend vs Total ratio
 * 2. Category variance (over-budget penalties)
 * 3. Contingency reserve protection
 * 4. Days remaining burn-rate projection
 */
function calculateBudgetHealth(totalBudget, categories = [], daysRemaining = 45) {
  if (!totalBudget || totalBudget <= 0) {
    return { score: 0, status: 'critical', message: 'No budget defined' };
  }

  const totalSpent = categories.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalAllocated = categories.reduce((sum, c) => sum + (c.allocated || 0), 0);
  const spentRatio = totalSpent / totalBudget;

  let penaltyPoints = 0;
  const overruns = [];

  // 1. Analyze Category Level Overruns
  categories.forEach(cat => {
    if (cat.spent > cat.allocated) {
      const overAmount = cat.spent - cat.allocated;
      const overPercent = (overAmount / cat.allocated) * 100;
      overruns.push({
        id: cat.id,
        name: cat.name,
        allocated: cat.allocated,
        spent: cat.spent,
        overAmount,
        overPercent: parseFloat(overPercent.toFixed(1))
      });
      // Deduct score proportionally
      penaltyPoints += Math.min(25, overPercent * 1.5);
    }
  });

  // 2. Analyze Contingency Buffer
  const contingencyCat = categories.find(c => c.id === 'cat_contingency' || c.name.toLowerCase().includes('contingency'));
  const contingencyBuffer = contingencyCat ? contingencyCat.allocated - contingencyCat.spent : 0;
  const contingencyRatio = contingencyBuffer / totalBudget;

  if (contingencyRatio < 0.03) {
    penaltyPoints += 15; // Dangerously low contingency
  }

  // 3. Global Spend Ratio Penalty
  if (spentRatio > 1.0) {
    penaltyPoints += (spentRatio - 1.0) * 100;
  } else if (spentRatio > 0.85 && daysRemaining > 20) {
    // High spend too early in planning lifecycle
    penaltyPoints += 10;
  }

  const rawScore = Math.max(0, Math.min(100, Math.round(100 - penaltyPoints)));
  
  let status = 'healthy';
  let badgeColor = '#10b981'; // Green
  let label = 'Optimal Health';

  if (rawScore < 50) {
    status = 'critical';
    badgeColor = '#ef4444'; // Red
    label = 'Critical Overrun Alert';
  } else if (rawScore < 75) {
    status = 'warning';
    badgeColor = '#f59e0b'; // Amber
    label = 'Moderate Risk - Rebalancing Advised';
  }

  return {
    score: rawScore,
    status,
    badgeColor,
    label,
    totalBudget,
    totalSpent,
    totalAllocated,
    unallocated: totalBudget - totalAllocated,
    remainingSpendable: Math.max(0, totalBudget - totalSpent),
    spentPercent: parseFloat(((totalSpent / totalBudget) * 100).toFixed(1)),
    overruns,
    hasOverruns: overruns.length > 0,
    contingencyReserve: contingencyBuffer
  };
}

/**
 * Predicts eventual cost overrun at current burn-rate
 */
function predictCostOverrun(totalBudget, categories = [], daysRemaining = 45, daysElapsed = 45) {
  const totalSpent = categories.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalAllocated = categories.reduce((sum, c) => sum + (c.allocated || 0), 0);

  // Daily average burn rate
  const safeDaysElapsed = Math.max(1, daysElapsed);
  const dailyBurnRate = totalSpent / safeDaysElapsed;

  // Uncommitted allocation
  const unspentAllocated = Math.max(0, totalAllocated - totalSpent);

  // Risk factor modifier based on pending volatile categories (e.g., catering, AV)
  let volatilityMultiplier = 1.05; // 5% baseline volatility

  categories.forEach(cat => {
    if (cat.name.toLowerCase().includes('catering') || cat.name.toLowerCase().includes('venue')) {
      if (cat.spent / cat.allocated > 0.8) {
        volatilityMultiplier += 0.03;
      }
    }
  });

  const projectedFinalCost = Math.round(totalSpent + (unspentAllocated * volatilityMultiplier));
  const projectedDifference = projectedFinalCost - totalBudget;
  const isProjectedOverrun = projectedDifference > 0;

  return {
    dailyBurnRate: Math.round(dailyBurnRate),
    projectedFinalCost,
    projectedDifference,
    isProjectedOverrun,
    overrunProbabilityPercent: isProjectedOverrun ? Math.min(98, Math.round(50 + (projectedDifference / totalBudget) * 200)) : 12,
    volatilityMultiplier: parseFloat(volatilityMultiplier.toFixed(2)),
    recommendation: isProjectedOverrun
      ? `Projected to exceed budget by $${projectedDifference.toLocaleString()}. Triggering dynamic redistribution.`
      : 'Current burn-rate within target envelope. Maintain milestone expense audits.'
  };
}

/**
 * Real-time Dynamic Budget Redistribution
 * Rebalances money from flexible/cushion categories to cover overdrawn categories.
 */
function calculateRedistribution(totalBudget, categories = []) {
  const categoriesCopy = JSON.parse(JSON.stringify(categories));
  let totalDeficit = 0;
  const deficitCategories = [];
  const surplusCategories = [];

  categoriesCopy.forEach(cat => {
    const balance = cat.allocated - cat.spent;
    if (balance < 0) {
      const deficit = Math.abs(balance);
      totalDeficit += deficit;
      deficitCategories.push({ id: cat.id, name: cat.name, deficit, originalAllocated: cat.allocated });
    } else if (balance > 0) {
      // Available surplus
      surplusCategories.push({
        id: cat.id,
        name: cat.name,
        available: balance,
        spent: cat.spent,
        originalAllocated: cat.allocated,
        isContingency: cat.id === 'cat_contingency' || cat.name.toLowerCase().includes('contingency')
      });
    }
  });

  if (totalDeficit === 0) {
    return {
      needed: false,
      message: 'All categories are within their allocated envelopes. No redistribution required.',
      updatedCategories: categoriesCopy,
      transfers: []
    };
  }

  // Prioritize drawing from Contingency first, then high-surplus non-critical categories
  surplusCategories.sort((a, b) => {
    if (a.isContingency) return -1;
    if (b.isContingency) return 1;
    return b.available - a.available;
  });

  let remainingDeficit = totalDeficit;
  const transfers = [];

  for (const surplus of surplusCategories) {
    if (remainingDeficit <= 0) break;

    // Take up to 75% of available surplus to leave a breathing cushion
    const maxDrain = surplus.isContingency ? surplus.available : Math.floor(surplus.available * 0.7);
    if (maxDrain <= 0) continue;

    const transferAmount = Math.min(remainingDeficit, maxDrain);
    remainingDeficit -= transferAmount;

    // Apply to target
    surplus.available -= transferAmount;
    const catToUpdate = categoriesCopy.find(c => c.id === surplus.id);
    if (catToUpdate) {
      catToUpdate.allocated -= transferAmount;
    }

    transfers.push({
      fromCategory: surplus.name,
      amount: transferAmount,
      reason: surplus.isContingency ? 'Absorbed via Emergency Reserve' : 'Trimmed non-committed category cushion'
    });
  }

  // Allocate transfer amounts to the deficit categories
  deficitCategories.forEach(def => {
    const targetCat = categoriesCopy.find(c => c.id === def.id);
    if (targetCat) {
      targetCat.allocated = targetCat.spent; // Increase allocation to match spend
      targetCat.status = 'rebalanced';
    }
  });

  return {
    needed: true,
    totalDeficit,
    coveredAmount: totalDeficit - remainingDeficit,
    uncoveredDeficit: Math.max(0, remainingDeficit),
    transfers,
    updatedCategories: categoriesCopy,
    strategy: remainingDeficit === 0
      ? 'Fully stabilized! Total budget bottom line preserved.'
      : `Partial stabilization. $${remainingDeficit} still requires vendor scope trimming or contingency injection.`
  };
}

module.exports = {
  calculateBudgetHealth,
  predictCostOverrun,
  calculateRedistribution
};
