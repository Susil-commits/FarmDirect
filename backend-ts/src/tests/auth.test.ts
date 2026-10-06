import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';

describe('Auth Endpoints', () => {
  const testUser = {
    firstName: 'Test',
    lastName: 'Farmer',
    email: 'testfarmer@farm.com',
    password: 'Password123!',
    role: 'farmer',
    phone: '9876543210'
  };

  beforeEach(async () => {
    const { hashPassword } = await import('../utils/password.js');
    const hashedPassword = await hashPassword(testUser.password);
    await User.create({
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email,
      password: hashedPassword,
      role: testUser.role,
      phone: testUser.phone
    });
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'newuser@farm.com' });
    
    if (res.status !== 201) console.log('Register Error:', res.body);
    
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('newuser@farm.com');
  });

  it('should not register user with existing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.status).toBe(400);
  });

  it('should login the user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });
    
    expect(res.status).toBe(401);
  });

  it('should revoke a token and persist to MongoDB when Redis is not ready', async () => {
    const { revokeToken, isTokenRevoked } = await import('../services/tokenService.js');
    const RevokedToken = (await import('../models/RevokedToken.js')).default;

    const jti = 'test-jti-revoked-fallback-123';
    expect(await isTokenRevoked(jti)).toBe(false);

    await revokeToken(jti, 3600);

    expect(await isTokenRevoked(jti)).toBe(true);

    const doc = await RevokedToken.findOne({ jti });
    expect(doc).not.toBeNull();
    expect(doc?.jti).toBe(jti);
  });
});

