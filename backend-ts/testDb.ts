import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmdirect');
  const db = mongoose.connection.db;
  if (!db) throw new Error('DB connection failed');
  
  const users = await db.collection('users').find({}).toArray();
  console.log(`Total users: ${users.length}`);
  
  const statuses = {};
  users.forEach(u => {
    const s = u.status || 'undefined';
    statuses[s] = (statuses[s] || 0) + 1;
  });
  console.log('Statuses:', statuses);

  const roles = {};
  users.forEach(u => {
    const r = u.role || 'undefined';
    roles[r] = (roles[r] || 0) + 1;
  });
  console.log('Roles:', roles);

  const farmersActive = await db.collection('users').countDocuments({ role: 'farmer', status: 'active' });
  const buyersActive = await db.collection('users').countDocuments({ role: 'buyer', status: 'active' });
  
  console.log('farmersActive:', farmersActive, 'buyersActive:', buyersActive);
  
  await mongoose.disconnect();
}

run().catch(console.error);
