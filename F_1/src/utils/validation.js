// Email validation
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Phone validation (Indian format)
export const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone.replace(/\D/g, ''));
};

// Name validation
export const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

// Password validation
export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

// Pin code validation (Indian format)
export const validatePincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};

// URL validation
export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Amount validation
export const validateAmount = (amount) => {
  return !isNaN(amount) && amount > 0;
};

// Quantity validation
export const validateQuantity = (quantity) => {
  return Number.isInteger(quantity) && quantity > 0;
};

// Rating validation
export const validateRating = (rating) => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// File validation
export const validateFile = (file, maxSize = 5242880, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
  if (!file) return { valid: false, error: 'File is required' };
  
  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${maxSize / 1024 / 1024}MB` };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  return { valid: true };
};

// Form validation with multiple fields
export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = values[field];
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${field} is required`;
      return;
    }
    
    if (rule.type === 'email' && value && !validateEmail(value)) {
      errors[field] = 'Invalid email address';
    }
    
    if (rule.type === 'phone' && value && !validatePhone(value)) {
      errors[field] = 'Invalid phone number';
    }
    
    if (rule.type === 'password' && value && !validatePassword(value)) {
      errors[field] = 'Password must be at least 8 characters with uppercase, lowercase, number and special character';
    }
    
    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = `${field} must be at least ${rule.minLength} characters`;
    }
    
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = `${field} must be less than ${rule.maxLength} characters`;
    }
    
    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${field} is invalid`;
    }
  });
  
  return errors;
};

// Check if form has errors
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Validate crop listing
export const validateCropListing = (cropData) => {
  const errors = {};
  
  if (!cropData.cropName || cropData.cropName.trim().length === 0) {
    errors.cropName = 'Crop name is required';
  }
  
  if (!cropData.category) {
    errors.category = 'Category is required';
  }
  
  if (!cropData.price || cropData.price <= 0) {
    errors.price = 'Valid price is required';
  }
  
  if (!cropData.quantity || cropData.quantity <= 0) {
    errors.quantity = 'Valid quantity is required';
  }
  
  if (!cropData.description || cropData.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }
  
  return errors;
};

// Validate address
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
