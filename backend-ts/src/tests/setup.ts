import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';
import { connection } from '../workers/queue.js';

let mongoServer: MongoMemoryReplSet;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, 60000);

afterAll(async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit().catch(() => {});
    }
  } catch {}
  try {
    if (connection) {
      connection.disconnect(false);
    }
  } catch {}
  try {
    await mongoose.disconnect();
  } catch {}
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
