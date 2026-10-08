// Set test environment variables before any modules are loaded
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_at_least_32_chars_long_for_security';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_key_at_least_32_chars_long';
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '7.0.14';

// Disable external remote Redis during testing
delete process.env.REDIS_URI;
delete process.env.REDIS_URL;

// Prevent live Gemini API calls in test suite to protect API quotas and ensure deterministic offline test runs
process.env.GEMINI_API_KEY = '';

// Ensure deterministic Razorpay mock credentials for test suite
const isRzpPlaceholder = (val?: string) =>
  !val ||
  val.startsWith('your_') ||
  val === 'rzp_test_your_key_id' ||
  val === 'your_key_secret';

if (isRzpPlaceholder(process.env.RAZORPAY_KEY_ID)) {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_mock_key_id';
}
if (isRzpPlaceholder(process.env.RAZORPAY_KEY_SECRET)) {
  process.env.RAZORPAY_KEY_SECRET = 'test_secret';
}
if (isRzpPlaceholder(process.env.RAZORPAY_WEBHOOK_SECRET)) {
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
}
