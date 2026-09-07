import request from 'supertest';
import app from './testApp.js';

describe('Health & Readiness Endpoints', () => {
  it('GET /health returns 200 OK and reports db connected status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('GET /healthz returns 200 OK as a PaaS/Kubernetes probe alias', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });

  it('GET /health/liveness returns 200 OK for process liveness', async () => {
    const res = await request(app).get('/health/liveness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('GET /health/readiness returns 200 OK when MongoDB is connected', async () => {
    const res = await request(app).get('/health/readiness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.dependencies).toBeDefined();
    expect(res.body.dependencies.mongo).toBe('UP');
  });
});
