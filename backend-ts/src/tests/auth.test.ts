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
    phone: '1234567890'
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
});
