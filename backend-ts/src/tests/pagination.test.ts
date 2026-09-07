import { parsePagination } from '../utils/pagination.js';
import request from 'supertest';
import app from './testApp.js';

describe('Pagination Utility & Clamping', () => {
  describe('parsePagination unit tests', () => {
    it('uses defaults when query parameters are missing', () => {
      const result = parsePagination({}, { defaultLimit: 20, maxLimit: 100, defaultPage: 1 });
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('parses valid page and limit numbers correctly', () => {
      const result = parsePagination({ page: '3', limit: '15' });
      expect(result).toEqual({ page: 3, limit: 15, skip: 30 });
    });

    it('clamps limit to maxLimit when client requests excessive limits (DoS prevention)', () => {
      const result = parsePagination({ limit: '1000000' }, { defaultLimit: 12, maxLimit: 50 });
      expect(result.limit).toBe(50);
      expect(result.skip).toBe(0);
    });

    it('falls back to defaultPage and defaultLimit on non-numeric inputs', () => {
      const result = parsePagination({ page: 'invalid', limit: 'abc' }, { defaultLimit: 10, defaultPage: 1 });
      expect(result).toEqual({ page: 1, limit: 10, skip: 0 });
    });

    it('handles negative or zero values by falling back to defaults', () => {
      const result = parsePagination({ page: '-5', limit: '0' }, { defaultLimit: 20, defaultPage: 1 });
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });
  });

  describe('Endpoint Limit Clamping Integration', () => {
    it('clamps limit to 50 on GET /api/crops when ?limit=100000 is requested', async () => {
      const res = await request(app).get('/api/crops?limit=100000');
      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.limit).toBe(50);
    });
  });
});
