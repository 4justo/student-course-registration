import request from 'supertest';
import app from '../server/app.js';

describe('Health check', () => {
  it('returns ok status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('Frontend', () => {
  it('serves the home page', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('EduRegister');
  });
});
