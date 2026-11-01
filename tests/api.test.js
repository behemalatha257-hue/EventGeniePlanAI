/**
 * Integration Tests - EventGeniePlan AI Express Endpoints
 */

const request = require('supertest');
const app = require('../server');

jest.setTimeout(25000);

describe('EventGeniePlan AI REST API Endpoints', () => {
  test('GET /api/health returns online status and system diagnostics', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.appName).toBe('EventGeniePlan AI');
    expect(res.body.aiEngine).toBeDefined();
  });

  test('GET /api/event/overview returns live countdown and dashboard metrics', async () => {
    const res = await request(app).get('/api/event/overview');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBeDefined();
    expect(res.body.data.budgetHealth).toBeDefined();
    expect(res.body.data.taskProgress).toBeDefined();
  });

  test('GET /api/chat/agents returns Planning Committee personas', async () => {
    const res = await request(app).get('/api/chat/agents');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.agents.length).toBe(4);
    const agentIds = res.body.agents.map(a => a.id);
    expect(agentIds).toContain('budget_bot');
    expect(agentIds).toContain('design_bot');
    expect(agentIds).toContain('chaos_bot');
    expect(agentIds).toContain('spatial_bot');
  });

  test('POST /api/chat/committee validates input and rejects empty message', async () => {
    const res = await request(app)
      .post('/api/chat/committee')
      .send({ agentId: 'budget_bot', message: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMPTY_MESSAGE');
  });

  test('POST /api/contracts/analyze analyzes sample contract', async () => {
    const res = await request(app)
      .post('/api/contracts/analyze')
      .send({ sampleId: 'venue_luminary_estate' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analysis).toBeDefined();
    expect(res.body.analysis.riskScore).toBeGreaterThan(0);
    expect(res.body.analysis.hiddenFees.length).toBeGreaterThan(0);
  });

  test('POST /api/seating/optimize returns conflict-free arrangement', async () => {
    const res = await request(app)
      .post('/api/seating/optimize')
      .send({ useAi: false }); // Test algorithmic deterministic solver
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.evaluation.harmonyScore).toBeGreaterThanOrEqual(70);
  });

  test('POST /api/checklist/shift cascades milestone dates', async () => {
    const res = await request(app)
      .post('/api/checklist/shift')
      .send({ newTargetDate: '2026-12-25' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.newTargetDate).toBe('2026-12-25');
  });

  test('POST /api/checklist/shift rejects invalid date formats', async () => {
    const res = await request(app)
      .post('/api/checklist/shift')
      .send({ newTargetDate: 'invalid-date-string' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
  });

  test('POST /api/event/switch-type switches active event to Birthday Bash and updates overview', async () => {
    const res = await request(app)
      .post('/api/event/switch-type')
      .send({ eventType: 'Birthday Bash' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eventType).toBe('Birthday Bash');
    expect(res.body.data.title).toContain('Birthday');
    expect(res.body.data.venue).toContain('Penthouse');
    expect(res.body.data.totalBudget).toBe(18000);
  });

  test('POST /api/checklist/generate updates master event state for Birthday', async () => {
    const res = await request(app)
      .post('/api/checklist/generate')
      .send({ eventType: 'Birthday Bash' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eventType).toBe('Birthday Bash');

    // Confirm global event overview is now Birthday
    const overviewRes = await request(app).get('/api/event/overview');
    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.eventType).toBe('Birthday Bash');
    expect(overviewRes.body.data.title).toContain('Birthday');
  });
});
