import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm';

async function main() {
  console.log('Connecting to:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  const admin = await usersCollection.findOne({ role: 'admin' });
  console.log('Admin found:', admin ? admin.email : 'NONE - will need to seed admin');

  const result = await usersCollection.deleteMany({ role: { $ne: 'admin' } });
  console.log('Deleted users:', result.deletedCount);

  const remaining = await usersCollection.find({}, { projection: { email: 1, role: 1 } }).toArray();
  console.log('Remaining users:', remaining.length);
  remaining.forEach(u => console.log('  -', u.email, '(' + u.role + ')'));

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});