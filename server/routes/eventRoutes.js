/**
 * EventGeniePlan AI - Global Event Overview & Dashboard Metrics Routes
 */

const express = require('express');
const router = express.Router();
const { eventStore } = require('../data/eventStore');

/**
 * GET /api/event/overview
 * Returns unified dashboard data: countdown, budget gauge, progress ring, RSVP stats
 */
router.get('/overview', (req, res) => {
  res.json({
    success: true,
    data: eventStore.getOverview()
  });
});

/**
 * POST /api/event/update
 * Updates global event parameters (e.g. title, venue, guest counts)
 */
router.post('/update', (req, res) => {
  const { title, venue, expectedGuests, confirmedRsvps, targetDate, totalBudget } = req.body || {};
  const event = eventStore.getEvent();

  if (title) event.title = title;
  if (venue) event.venue = venue;
  if (typeof expectedGuests === 'number') event.expectedGuests = expectedGuests;
  if (typeof confirmedRsvps === 'number') event.confirmedRsvps = confirmedRsvps;
  if (targetDate) eventStore.setTargetDate(targetDate);
  if (typeof totalBudget === 'number') eventStore.setTotalBudget(totalBudget);

  res.json({
    success: true,
    message: 'Event parameters updated',
    data: eventStore.getOverview()
  });
});

/**
 * POST /api/event/switch-type
 * Switches the active master event type across the entire platform
 * (e.g. Birthday Bash, Community Gala, Wedding) and recalculates all metrics.
 */
router.post('/switch-type', (req, res) => {
  const { eventType, targetDate } = req.body || {};
  if (!eventType) {
    return res.status(400).json({ error: { code: 'MISSING_EVENT_TYPE', message: 'eventType is required' } });
  }

  const updatedOverview = eventStore.switchEventType(eventType, targetDate);
  res.json({
    success: true,
    message: `Active event successfully switched to ${eventType}`,
    data: updatedOverview
  });
});

module.exports = router;
