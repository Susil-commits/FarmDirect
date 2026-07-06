import Razorpay from 'razorpay';

let instance = null;

function isPlaceholder(value) {
  return !value || value === 'your_key_id' || value === 'your_key_secret' || value.startsWith('your_');
}

export function isRazorpayConfigured() {
  return !isPlaceholder(process.env.RAZORPAY_KEY_ID) && !isPlaceholder(process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayInstance() {
  if (!isRazorpayConfigured()) {
    return null;
  }
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
}
