import Razorpay from 'razorpay';
import { env, isRazorpayConfigured } from './env.js';

let instance: Razorpay | null = null;

export { isRazorpayConfigured };

export function getRazorpayInstance(): Razorpay | null {
  if (!isRazorpayConfigured()) return null;
  if (!instance) {
    instance = new Razorpay({
      key_id: env.razorpayKeyId || 'rzp_test_mock_key',
      key_secret: env.razorpayKeySecret || 'rzp_test_mock_secret',
    });
  }
  return instance;
}

export function setRazorpayInstance(mock: any | null): void {
  instance = mock;
}
