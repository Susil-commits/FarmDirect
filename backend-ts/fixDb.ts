import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixDb() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmdirect');
  const db = mongoose.connection.db;
  if (!db) throw new Error('DB connection failed');
  
  const users = await db.collection('users').find({}).toArray();
  let farmersCount = 0;
  let buyersCount = 0;
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const newRole = (i % 2 === 0) ? 'farmer' : 'buyer';
    
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { role: newRole, status: 'active' } }
    );
    
    if (newRole === 'farmer') farmersCount++;
    else buyersCount++;
  }
  
  console.log(`Successfully updated ${users.length} users.`);
  console.log(`Set ${farmersCount} as farmers and ${buyersCount} as buyers with 'active' status.`);
  
  await mongoose.disconnect();
}

fixDb().catch(console.error);
