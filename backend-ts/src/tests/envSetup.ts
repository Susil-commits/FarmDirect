// Set test environment variables before any modules are loaded
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_at_least_32_chars_long_for_security';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_key_at_least_32_chars_long';
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '7.0.14';

// Disable external remote Redis during testing
delete process.env.REDIS_URI;
delete process.env.REDIS_URL;
