import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import AiConversation from '../models/AiConversation.js';
import { generateToken } from '../utils/jwt.js';

describe('T1.1 AiConversation - Conversation Memory & Scoping', () => {
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    await AiConversation.deleteMany({});
    await User.deleteMany({});

    userA = await User.create({
      firstName: 'Ravi',
      lastName: 'Patel',
      email: 'ravi@example.com',
      password: 'Password123!',
      role: 'farmer',
      isEmailVerified: true,
    });
    tokenA = generateToken(userA._id, userA.role);

    userB = await User.create({
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya@example.com',
      password: 'Password123!',
      role: 'buyer',
      isEmailVerified: true,
    });
    tokenB = generateToken(userB._id, userB.role);
  });

  it('creates an AiConversation on first message and persists turns', async () => {
    const res1 = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        message: 'How do I list my crops on FaRm?',
      })
      .expect(200);

    expect(res1.body.conversationId).toBeDefined();
    const conversationId = res1.body.conversationId;

    const convInDb = await AiConversation.findById(conversationId);
    expect(convInDb).not.toBeNull();
    expect(convInDb?.userId.toString()).toBe(userA._id.toString());
    expect(convInDb?.messages.length).toBe(2); // 1 user + 1 model
    expect(convInDb?.messages[0].role).toBe('user');
    expect(convInDb?.messages[0].content).toBe('How do I list my crops on FaRm?');
    expect(convInDb?.messages[1].role).toBe('model');

    // Follow-up message reusing conversationId
    const res2 = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        message: 'What about organic tomato pests?',
        conversationId,
      })
      .expect(200);

    expect(res2.body.conversationId).toBe(conversationId);

    const convAfterFollowUp = await AiConversation.findById(conversationId);
    expect(convAfterFollowUp?.messages.length).toBe(4); // 2 user + 2 model
  });

  it('lists user conversations with snippet and last update', async () => {
    // Create 2 conversations for User A
    await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ message: 'First conversation topic' })
      .expect(200);

    await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ message: 'Second conversation topic' })
      .expect(200);

    const listRes = await request(app)
      .get('/api/ai/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.conversations)).toBe(true);
    expect(listRes.body.conversations.length).toBe(2);
  });

  it('strictly enforces ownership and authorization scoping', async () => {
    // User A creates conversation
    const chatRes = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ message: 'Private farming secrets for user A' })
      .expect(200);

    const conversationId = chatRes.body.conversationId;

    // User B attempts to fetch User A conversation -> 404
    await request(app)
      .get(`/api/ai/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // User B attempts to delete User A conversation -> 404
    await request(app)
      .delete(`/api/ai/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // User A successfully fetches their own conversation -> 200
    const getRes = await request(app)
      .get(`/api/ai/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(getRes.body.success).toBe(true);
    expect(getRes.body.conversation._id).toBe(conversationId);

    // User A successfully deletes their conversation -> 200
    const delRes = await request(app)
      .delete(`/api/ai/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(delRes.body.success).toBe(true);

    const checkGone = await AiConversation.findById(conversationId);
    expect(checkGone).toBeNull();
  });
});
