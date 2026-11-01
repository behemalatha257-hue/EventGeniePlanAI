/**
 * EventGeniePlan AI - Dynamic Checklist & Automated Run-Sheet Routes
 */

const express = require('express');
const router = express.Router();
const { getDeterministicChecklist, cascadeDateShift } = require('../services/checklistEngine');
const { generateChecklistWithAI } = require('../services/geminiService');
const { eventStore } = require('../data/eventStore');
const { validateDateShiftRequest } = require('../middleware/validation');

/**
 * GET /api/checklist
 * Returns active milestones, run-sheet timeline and progress stats
 */
router.get('/', (req, res) => {
  const milestones = eventStore.getMilestones();
  const runSheet = eventStore.getRunSheet();
  const completedCount = milestones.filter(m => m.completed).length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  res.json({
    success: true,
    data: {
      eventType: eventStore.getEvent().eventType,
      targetDate: eventStore.getTargetDate(),
      milestones,
      runSheet,
      stats: {
        completedCount,
        totalCount,
        progressPercent
      }
    }
  });
});

/**
 * POST /api/checklist/shift
 * Cascades deadline changes when the target date changes
 */
router.post('/shift', validateDateShiftRequest, (req, res) => {
  const { newTargetDate } = req.body;
  const milestones = eventStore.getMilestones();

  const result = cascadeDateShift(newTargetDate, milestones);
  eventStore.setTargetDate(newTargetDate);
  eventStore.setMilestones(result.milestones);

  res.json({
    success: true,
    message: `Target event date updated to ${newTargetDate}. All dependent milestones cascaded.`,
    data: {
      ...result,
      targetDate: newTargetDate,
      runSheet: eventStore.getRunSheet()
    }
  });
});

/**
 * POST /api/checklist/toggle
 * Toggles completion status of a specific milestone
 */
router.post('/toggle', (req, res) => {
  const { milestoneId } = req.body || {};
  const milestones = eventStore.getMilestones();

  const milestone = milestones.find(m => m.id === milestoneId);
  if (!milestone) {
    return res.status(404).json({ error: { code: 'MILESTONE_NOT_FOUND', message: 'Milestone not found' } });
  }

  milestone.completed = !milestone.completed;
  eventStore.setMilestones(milestones);

  const completedCount = milestones.filter(m => m.completed).length;
  const totalCount = milestones.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  res.json({
    success: true,
    milestone,
    stats: {
      completedCount,
      totalCount,
      progressPercent
    }
  });
});

/**
 * POST /api/checklist/generate
 * Generates fresh checklist and run-sheet for chosen event type
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { eventType, targetDate, budget = 45000, useAi = false } = req.body || {};
    const activeTargetDate = targetDate || eventStore.getTargetDate();

    // Synchronize eventStore so the entire platform and dashboard switch to the new event
    eventStore.switchEventType(eventType, activeTargetDate);

    let generated;
    if (useAi) {
      const aiResult = await generateChecklistWithAI(eventType, activeTargetDate, budget || eventStore.getTotalBudget());
      generated = aiResult.data;
      if (generated && generated.milestones) {
        eventStore.setMilestones(generated.milestones);
      }
      if (generated && generated.dayOfRunSheet) {
        eventStore.setRunSheet(generated.dayOfRunSheet);
      }
    }

    const event = eventStore.getEvent();
    const milestones = eventStore.getMilestones();
    const completedCount = milestones.filter(m => m.completed).length;
    const totalCount = milestones.length;

    res.json({
      success: true,
      message: `Generated custom roadmap for ${event.eventType}`,
      data: {
        eventType: event.eventType,
        targetDate: eventStore.getTargetDate(),
        milestones,
        runSheet: eventStore.getRunSheet(),
        stats: {
          completedCount,
          totalCount,
          progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/checklist/reset
 * Resets checklist to default
 */
router.post('/reset', (req, res) => {
  eventStore.reset();

  res.json({
    success: true,
    message: 'Checklist and Run-Sheet reset to default baseline',
    data: {
      eventType: eventStore.getEvent().eventType,
      targetDate: eventStore.getTargetDate(),
      milestones: eventStore.getMilestones(),
      runSheet: eventStore.getRunSheet()
    }
  });
});

module.exports = router;
