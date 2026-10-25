import request from 'supertest';
import app from '../../src/app.js';

describe('Health Check Endpoint', () => {
  it('GET /api/v1/health should return 200 with status healthy', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('requestId');
  });

  it('GET /non-existent-route should return 404 with standard error format', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe('fail');
  });
});
