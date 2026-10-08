import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics to verify zero-oversell invariant
const successfulOrders = new Counter('successful_orders');
const rejectedDueToStock = new Counter('rejected_insufficient_stock');
const orderDuration = new Trend('order_placement_duration');

export const options = {
  scenarios: {
    hot_inventory_checkout: {
      executor: 'per-vu-iterations',
      vus: 100, // 100 concurrent buyers
      iterations: 1, // 1 checkout attempt per buyer simultaneously
      maxDuration: '30s',
    },
  },
  thresholds: {
    successful_orders: ['count == 10'], // Exactly 10 units available
    rejected_insufficient_stock: ['count == 90'], // Exactly 90 buyers rejected cleanly
    http_req_duration: ['p(95)<500'], // 95% of requests handled under 500ms
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api';
const TARGET_CROP_ID = __ENV.CROP_ID || '660e1b234567890123456789';

export default function () {
  const vuId = __VU;
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'test_buyer_token_' + vuId}`,
    },
  };

  const payload = JSON.stringify({
    cropId: TARGET_CROP_ID,
    quantity: 1, // Each buyer requests 1 unit
    deliveryAddress: {
      street: '42 Kisan Colony',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422003',
    },
    paymentMethod: 'razorpay',
  });

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/orders`, payload, params);
  orderDuration.add(Date.now() - startTime);

  if (res.status === 201 || res.status === 200) {
    successfulOrders.add(1);
    check(res, {
      'Order placed successfully': (r) => r.status === 201 || r.status === 200,
    });
  } else if (res.status === 400 || res.status === 409) {
    rejectedDueToStock.add(1);
    check(res, {
      'Clean rejection due to stock exhaustion': (r) => {
        const body = JSON.parse(r.body || '{}');
        return body.code === 'INSUFFICIENT_STOCK' || 
               body.code === 'CROP_UNAVAILABLE' || 
               (body.message && body.message.toLowerCase().includes('stock'));
      },
    });
  } else {
    check(res, {
      'Expected status 201 or 400/409': () => false,
    });
  }
}

export function teardown() {
  console.log(`\n=== Concurrency Load Test Completed ===`);
  console.log(`Target: 100 concurrent buyers competing for 10 units`);
  console.log(`Guaranteed Invariant: Total successful allocations = 10, Zero Oversell`);
}
