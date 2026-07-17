import Razorpay from 'razorpay';
import { env, isRazorpayConfigured } from './env.js';

let instance: Razorpay | null = null;

export { isRazorpayConfigured };

export function getRazorpayInstance(): Razorpay | null {
  if (!isRazorpayConfigured()) return null;
  if (!instance) {
    instance = new Razorpay({
      key_id: env.razorpayKeyId!,
      key_secret: env.razorpayKeySecret!,
    });
  }
  return instance;
}
