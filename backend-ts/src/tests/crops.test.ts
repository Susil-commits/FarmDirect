import request from 'supertest';
import app from './testApp.js';

describe('Crops Endpoints', () => {
  it('should fetch all crops with pagination', async () => {
    const res = await request(app).get('/api/crops');
    if (res.status !== 200) console.log('Crops Fetch Error:', res.body);
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(Array.isArray(res.body.crops)).toBe(true);
  });
});
