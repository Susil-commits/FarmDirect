import UserOrderStats from '../models/UserOrderStats.js';
import Order from '../models/Order.js';

export async function flagAnomalyAsync(orderId: string, amount: number, userId: string): Promise<void> {
  try {
    let stats = await UserOrderStats.findById(userId);
    
    if (!stats || stats.n < 4) {
      const globalStats = await UserOrderStats.findById('global');
      if (globalStats && globalStats.n >= 4) {
        stats = globalStats;
      }
    }
    
    let isAnomaly = false;
    let zScore: number | null = null;
    
    if (stats && stats.n >= 4) {
      const stddev = Math.sqrt(stats.m2 / (stats.n - 1));
      if (stddev === 0) {
        zScore = (amount !== stats.mean) ? 10 : 0;
      } else {
        zScore = (amount - stats.mean) / stddev;
      }
      
      if (Math.abs(zScore) > 3) {
        isAnomaly = true;
      }
      
      await Order.findByIdAndUpdate(orderId, {
        flaggedAsAnomaly: isAnomaly,
        anomalyScore: zScore
      });
    }

    await updateWelfordStats(userId, amount);
    
    await updateWelfordStats('global', amount);

  } catch (error) {
    console.error('Failed to run anomaly detection:', error);
  }
}

async function updateWelfordStats(id: string, amount: number) {
  await UserOrderStats.findOneAndUpdate(
    { _id: id },
    [
      {
        $set: {
          n: { $add: [{ $ifNull: ['$n', 0] }, 1] },
          delta: { $subtract: [amount, { $ifNull: ['$mean', 0] }] }
        }
      },
      {
        $set: {
          mean: { $add: [{ $ifNull: ['$mean', 0] }, { $divide: ['$delta', '$n'] }] }
        }
      },
      {
        $set: {
          delta2: { $subtract: [amount, '$mean'] }
        }
      },
      {
        $set: {
          m2: { $add: [{ $ifNull: ['$m2', 0] }, { $multiply: ['$delta', '$delta2'] }] },
          updatedAt: new Date()
        }
      },
      {
        $unset: ['delta', 'delta2']
      }
    ],
    { upsert: true }
  );
}
