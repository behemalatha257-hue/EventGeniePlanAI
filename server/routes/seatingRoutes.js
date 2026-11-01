/**
 * EventGeniePlan AI - Intelligent Seating Chart Optimizer Routes
 */

const express = require('express');
const router = express.Router();
const { evaluateSeatingChart, algorithmicSeatingSolver } = require('../services/seatingOptimizer');
const { optimizeSeatingWithAI } = require('../services/geminiService');
const { eventStore } = require('../data/eventStore');

/**
 * GET /api/seating/chart
 * Returns the current tables, guests, clashes, and harmony score
 */
router.get('/chart', (req, res) => {
  const currentTables = eventStore.getTables();
  const currentGuests = eventStore.getGuests();
  const evaluation = evaluateSeatingChart(currentGuests, currentTables);

  res.json({
    success: true,
    data: {
      tables: currentTables.map(t => {
        const seatedGuests = currentGuests.filter(g => g.tableId === t.id);
        return {
          ...t,
          assignedGuests: seatedGuests.map(g => g.id),
          seatedCount: seatedGuests.length,
          guests: seatedGuests
        };
      }),
      unassignedGuests: currentGuests.filter(g => !g.tableId),
      evaluation
    }
  });
});

/**
 * POST /api/seating/assign
 * Moves or assigns a guest to a specific table (supports drag-and-drop in UI)
 */
router.post('/assign', (req, res) => {
  const { guestId, tableId } = req.body || {};
  const currentTables = eventStore.getTables();
  const currentGuests = eventStore.getGuests();

  const guest = currentGuests.find(g => g.id === guestId);
  if (!guest) {
    return res.status(404).json({ error: { code: 'GUEST_NOT_FOUND', message: 'Guest not found' } });
  }

  if (tableId) {
    const table = currentTables.find(t => t.id === tableId);
    if (!table) {
      return res.status(404).json({ error: { code: 'TABLE_NOT_FOUND', message: 'Target table not found' } });
    }
    guest.tableId = tableId;
  } else {
    // Unassign
    guest.tableId = null;
  }

  eventStore.setGuests(currentGuests);
  const evaluation = evaluateSeatingChart(currentGuests, currentTables);

  res.json({
    success: true,
    message: `Guest ${guest.name} assigned to ${tableId ? tableId : 'Unassigned pool'}`,
    guest,
    evaluation
  });
});

/**
 * POST /api/seating/optimize
 * Runs AI + constraint satisfaction optimization to resolve all clashes and group affinities
 */
router.post('/optimize', async (req, res, next) => {
  try {
    const { useAi = true } = req.body || {};
    let currentTables = eventStore.getTables();
    let currentGuests = eventStore.getGuests();

    let optimizationResult;
    if (useAi) {
      const aiResponse = await optimizeSeatingWithAI(currentGuests, currentTables);
      if (aiResponse.success && aiResponse.result && aiResponse.result.tableAssignments) {
        aiResponse.result.tableAssignments.forEach(ta => {
          (ta.guestIds || []).forEach(gId => {
            const guest = currentGuests.find(g => g.id === gId);
            if (guest) guest.tableId = ta.tableId;
          });
        });
        optimizationResult = aiResponse.result;
      } else {
        const solverResult = algorithmicSeatingSolver(currentGuests, currentTables);
        currentGuests = solverResult.updatedGuests;
        optimizationResult = solverResult;
      }
    } else {
      const solverResult = algorithmicSeatingSolver(currentGuests, currentTables);
      currentGuests = solverResult.updatedGuests;
      optimizationResult = solverResult;
    }

    eventStore.setGuests(currentGuests);
    const evaluation = evaluateSeatingChart(currentGuests, currentTables);

    res.json({
      success: true,
      optimization: optimizationResult,
      evaluation,
      tables: currentTables.map(t => {
        const seatedGuests = currentGuests.filter(g => g.tableId === t.id);
        return {
          ...t,
          assignedGuests: seatedGuests.map(g => g.id),
          seatedCount: seatedGuests.length,
          guests: seatedGuests
        };
      }),
      unassignedGuests: currentGuests.filter(g => !g.tableId)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/seating/reset
 * Resets seating arrangement to default demo state
 */
router.post('/reset', (req, res) => {
  eventStore.reset();
  const currentTables = eventStore.getTables();
  const currentGuests = eventStore.getGuests();
  const evaluation = evaluateSeatingChart(currentGuests, currentTables);

  res.json({
    success: true,
    message: 'Seating chart reset to baseline scenario',
    evaluation
  });
});

module.exports = router;
