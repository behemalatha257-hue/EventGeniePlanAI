/**
 * Unit Tests - Dynamic Checklist & Automated Run-Sheet Engine
 */

const { getDeterministicChecklist, cascadeDateShift } = require('../server/services/checklistEngine');
const { EVENT_TYPES } = require('../server/config/constants');

describe('Dynamic Checklist & Automated Run-Sheet Engine', () => {
  test('generates customized milestone checklist for Wedding', () => {
    const checklist = getDeterministicChecklist(EVENT_TYPES.WEDDING, '2026-12-31');

    expect(checklist).toBeDefined();
    expect(checklist.eventType).toBe(EVENT_TYPES.WEDDING);
    expect(checklist.targetDate).toBe('2026-12-31');
    expect(checklist.milestones.length).toBeGreaterThan(4);
    expect(checklist.dayOfRunSheet.length).toBeGreaterThan(5);

    // Verify day-of milestone has dueDate matching targetDate
    const dayOfMilestone = checklist.milestones.find(m => m.daysBeforeEvent === 0);
    expect(dayOfMilestone).toBeDefined();
    expect(dayOfMilestone.dueDate).toBe('2026-12-31');
  });

  test('generates distinct templates for Community Gala and Birthday', () => {
    const gala = getDeterministicChecklist(EVENT_TYPES.COMMUNITY_GALA, '2026-11-20');
    const birthday = getDeterministicChecklist(EVENT_TYPES.BIRTHDAY, '2026-11-20');

    expect(gala.milestones[0].title).not.toBe(birthday.milestones[0].title);
    expect(gala.eventType).toBe(EVENT_TYPES.COMMUNITY_GALA);
    expect(birthday.eventType).toBe(EVENT_TYPES.BIRTHDAY);
  });

  test('cascadeDateShift automatically updates milestone due dates when target shifts', () => {
    const initialChecklist = getDeterministicChecklist(EVENT_TYPES.WEDDING, '2026-10-01');
    
    // Shift target date by 30 days into the future: '2026-10-31'
    const shifted = cascadeDateShift('2026-10-31', initialChecklist.milestones);

    expect(shifted.newTargetDate).toBe('2026-10-31');
    expect(shifted.milestones.length).toBe(initialChecklist.milestones.length);

    // Day of event task should now be on 2026-10-31
    const dayOfTask = shifted.milestones.find(m => m.daysBeforeEvent === 0);
    expect(dayOfTask.dueDate).toBe('2026-10-31');

    // 30 days before task should now be 2026-10-01
    const thirtyDaysBefore = shifted.milestones.find(m => m.daysBeforeEvent === 30);
    expect(thirtyDaysBefore.dueDate).toBe('2026-10-01');
  });
});
