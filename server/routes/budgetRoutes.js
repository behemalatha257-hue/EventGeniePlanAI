/**
 * EventGeniePlan AI - Budget Tracker, Health Gauge & Overrun Prediction Routes
 */

const express = require('express');
const router = express.Router();
const { calculateBudgetHealth, predictCostOverrun, calculateRedistribution } = require('../services/budgetEngine');
const { eventStore } = require('../data/eventStore');

/**
 * GET /api/budget/health
 * Returns current budget health score, category breakdown and overrun warnings
 */
router.get('/health', (req, res) => {
  const totalBudget = eventStore.getTotalBudget();
  const categories = eventStore.getBudgetCategories();
  const health = calculateBudgetHealth(totalBudget, categories);

  res.json({
    success: true,
    data: {
      ...health,
      currency: eventStore.getEvent().currency,
      categories
    }
  });
});

/**
 * POST /api/budget/predict
 * Forecasts cost creep and overrun probabilities
 */
router.post('/predict', (req, res) => {
  const { daysRemaining = 45, daysElapsed = 45 } = req.body || {};
  const totalBudget = eventStore.getTotalBudget();
  const categories = eventStore.getBudgetCategories();

  const prediction = predictCostOverrun(
    totalBudget,
    categories,
    daysRemaining,
    daysElapsed
  );

  res.json({
    success: true,
    data: prediction
  });
});

/**
 * POST /api/budget/redistribute
 * Triggers real-time dynamic budget rebalancing
 */
router.post('/redistribute', (req, res) => {
  const totalBudget = eventStore.getTotalBudget();
  const categories = eventStore.getBudgetCategories();

  const result = calculateRedistribution(totalBudget, categories);
  if (result.needed && result.updatedCategories) {
    eventStore.setBudgetCategories(result.updatedCategories);
  }

  const updatedCategories = eventStore.getBudgetCategories();
  const updatedHealth = calculateBudgetHealth(totalBudget, updatedCategories);

  res.json({
    success: true,
    redistribution: result,
    health: {
      ...updatedHealth,
      categories: updatedCategories
    }
  });
});

/**
 * POST /api/budget/update-category
 * Allows updating or creating a budget category
 */
router.post('/update-category', (req, res) => {
  const { id, allocated, spent, note } = req.body || {};
  const categories = eventStore.getBudgetCategories();

  const cat = categories.find(c => c.id === id);
  if (!cat) {
    return res.status(404).json({ error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found' } });
  }

  if (typeof allocated === 'number') cat.allocated = Math.max(0, allocated);
  if (typeof spent === 'number') cat.spent = Math.max(0, spent);
  if (note) cat.note = note;

  cat.status = cat.spent > cat.allocated ? 'warning' : 'safe';
  eventStore.setBudgetCategories(categories);

  const health = calculateBudgetHealth(eventStore.getTotalBudget(), categories);

  res.json({
    success: true,
    updatedCategory: cat,
    health
  });
});

/**
 * POST /api/budget/reset
 * Resets budget to default seed data
 */
router.post('/reset', (req, res) => {
  eventStore.reset();
  const health = calculateBudgetHealth(eventStore.getTotalBudget(), eventStore.getBudgetCategories());

  res.json({
    success: true,
    message: 'Budget reset to default baseline',
    health: {
      ...health,
      categories: eventStore.getBudgetCategories()
    }
  });
});

module.exports = router;
