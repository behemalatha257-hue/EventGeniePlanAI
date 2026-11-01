/**
 * Unit Tests - Hyper-Personalized RSVP Concierge Engine
 */

const { handleConciergeInquiry, EVENT_FAQS } = require('../server/services/rsvpConcierge');

describe('Hyper-Personalized RSVP Concierge Engine', () => {
  test('accurately resolves dress code inquiry instantly', async () => {
    const res = await handleConciergeInquiry('What should I wear? What is the dress code?');
    expect(res.success).toBe(true);
    expect(res.reply).toContain('Black-Tie');
    expect(res.category).toBe('faq-match');
  });

  test('accurately resolves parking and valet inquiry', async () => {
    const res = await handleConciergeInquiry('Is there parking or valet for my car?');
    expect(res.success).toBe(true);
    expect(res.reply.toLowerCase()).toContain('valet');
  });

  test('logs dietary requirements inquiry', async () => {
    const res = await handleConciergeInquiry('I have a severe nut allergy and eat vegan.');
    expect(res.success).toBe(true);
    expect(res.reply).toContain('Dietary Needs');
  });
});
