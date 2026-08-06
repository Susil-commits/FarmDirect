// ── Basic field validators ────────────────────────────────────────────────────

// Email validation
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

// Phone validation (Indian mobile: starts with 6-9, 10 digits)
export const validatePhone = (phone) => {
  if (!phone) return false;
  const re = /^[6-9]\d{9}$/;
  return re.test(phone.replace(/\D/g, ''));
};

// Name validation
export const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

// Password validation
export const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain at least one lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
  return { valid: true, message: 'Password meets requirements' };
};

/** Simple boolean check (for backwards compatibility) */
export const isValidPassword = (password) => validatePassword(password).valid;

// Pin code validation (Indian format: 6 digits)
export const validatePincode = (pincode) => {
  return /^\d{6}$/.test(String(pincode ?? ''));
};

// URL validation
export const validateURL = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Amount validation
export const validateAmount = (amount) => {
  const n = Number(amount);
  return !isNaN(n) && n > 0;
};

// Quantity validation
export const validateQuantity = (quantity) => {
  const n = Number(quantity);
  return Number.isInteger(n) && n > 0;
};

// Rating validation
export const validateRating = (rating) => {
  const n = Number(rating);
  return Number.isInteger(n) && n >= 1 && n <= 5;
};

// ── Indian-specific validators ────────────────────────────────────────────────

/**
 * Aadhar number validation — 12 digits.
 * Does NOT include Verhoeff checksum (requires extra library).
 */
export const validateAadhar = (aadhar) => {
  if (!aadhar) return false;
  const digits = String(aadhar).replace(/\D/g, '');
  return digits.length === 12 && !/^0+$/.test(digits);
};

/**
 * GST Identification Number (GSTIN) validation — 15 characters.
 * Format: 2-digit state code + 10-char PAN + 1 digit entity + 1 'Z' + 1 checksum
 */
export const validateGST = (gst) => {
  if (!gst) return false;
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(gst.toUpperCase().trim());
};

/**
 * IFSC code validation — 11 characters (bank code 4 chars + '0' + 6-digit branch code).
 */
export const validateIFSC = (ifsc) => {
  if (!ifsc) return false;
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase().trim());
};

// ── Crop-specific validators ──────────────────────────────────────────────────

/**
 * Validate crop price: must be a positive number up to 1,000,000.
 */
export const validateCropPrice = (price) => {
  const n = Number(price);
  if (isNaN(n) || n <= 0) return { valid: false, message: 'Price must be a positive number' };
  if (n > 1_000_000) return { valid: false, message: 'Price cannot exceed ₹10,00,000' };
  return { valid: true };
};

/**
 * Validate crop quantity: must be a positive integer up to 100,000.
 */
export const validateCropQuantity = (qty) => {
  const n = Number(qty);
  if (!Number.isInteger(n) || n <= 0) return { valid: false, message: 'Quantity must be a positive whole number' };
  if (n > 100_000) return { valid: false, message: 'Quantity cannot exceed 1,00,000' };
  return { valid: true };
};

// ── File validation ───────────────────────────────────────────────────────────

export const validateFile = (file, maxSize = 5242880, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
  if (!file) return { valid: false, error: 'File is required' };

  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)} MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    const allowed = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
    return { valid: false, error: `Invalid file type. Allowed: ${allowed}` };
  }

  return { valid: true };
};

// ── Form utilities ────────────────────────────────────────────────────────────

export const validateForm = (values, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = values[field];

    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${rule.label || field} is required`;
      return;
    }

    if (!value) return; // Skip further validation if empty and not required

    if (rule.type === 'email' && !validateEmail(value)) {
      errors[field] = 'Invalid email address';
    } else if (rule.type === 'phone' && !validatePhone(value)) {
      errors[field] = 'Invalid phone number (must be 10-digit Indian mobile)';
    } else if (rule.type === 'password') {
      const result = validatePassword(value);
      if (!result.valid) errors[field] = result.message;
    } else if (rule.type === 'pincode' && !validatePincode(value)) {
      errors[field] = 'Pincode must be 6 digits';
    } else if (rule.type === 'aadhar' && !validateAadhar(value)) {
      errors[field] = 'Aadhar number must be 12 digits';
    } else if (rule.type === 'url' && !validateURL(value)) {
      errors[field] = 'Invalid URL';
    }

    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} must be less than ${rule.maxLength} characters`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${rule.label || field} is invalid`;
    }
  });

  return errors;
};

export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

// Sanitize input to prevent XSS (browser-only)
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// ── Domain-specific form validators ──────────────────────────────────────────

export const validateCropListing = (cropData) => {
  const errors = {};

  if (!cropData.cropName || cropData.cropName.trim().length === 0) {
    errors.cropName = 'Crop name is required';
  } else if (cropData.cropName.trim().length < 2) {
    errors.cropName = 'Crop name must be at least 2 characters';
  }

  if (!cropData.category) {
    errors.category = 'Category is required';
  }

  const priceResult = validateCropPrice(cropData.price);
  if (!priceResult.valid) errors.price = priceResult.message;

  const qtyResult = validateCropQuantity(cropData.quantity);
  if (!qtyResult.valid) errors.quantity = qtyResult.message;

  if (!cropData.description || cropData.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (!cropData.pickupLocation || cropData.pickupLocation.trim().length < 5) {
    errors.pickupLocation = 'Pickup location is required (at least 5 characters)';
  }

  if (cropData.contactNumber && !validatePhone(cropData.contactNumber)) {
    errors.contactNumber = 'Invalid contact number (10-digit Indian mobile)';
  }

  return errors;
};

export const validateAddress = (address) => {
  const errors = {};

  if (!address.streetAddress || address.streetAddress.trim().length === 0) {
    errors.streetAddress = 'Street address is required';
  }

  if (!address.city || address.city.trim().length === 0) {
    errors.city = 'City is required';
  }

  if (!address.state || address.state.trim().length === 0) {
    errors.state = 'State is required';
  }

  if (!validatePincode(address.pincode)) {
    errors.pincode = 'Valid 6-digit pincode is required';
  }

  return errors;
};
