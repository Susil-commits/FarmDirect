
export const formatCurrency = (amount, currency = 'INR') => {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency
  }).format(num);
};

export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };
  
  return d.toLocaleDateString('en-IN', options[format] ?? options.short);
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);
  
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  
  return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
};

export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

export const formatRating = (rating) => {
  const n = parseFloat(rating);
  return isNaN(n) ? '0.0' : n.toFixed(1);
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    active: 'Active',
    inactive: 'Inactive',
    soldOut: 'Sold Out',
    approved: 'Approved',
    rejected: 'Rejected',
    verified: 'Verified'
  };
  
  return labels[status] || capitalize(status);
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'yellow',
    confirmed: 'blue',
    processing: 'blue',
    shipped: 'cyan',
    delivered: 'green',
    cancelled: 'red',
    active: 'green',
    inactive: 'gray',
    soldOut: 'red',
    approved: 'green',
    rejected: 'red',
    verified: 'green'
  };
  
  return colors[status] || 'gray';
};

export const formatProductTitle = (title) => {
  if (!title) return '';
  return title.split(' ').map(word => capitalize(word)).join(' ');
};

export const formatAddress = (address) => {
  if (!address) return '';
  const parts = [
    address.streetAddress,
    address.area,
    address.city,
    address.state,
    address.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getPriorityColor = (priority) => {
  const colors = {
    low: 'blue',
    medium: 'yellow',
    high: 'red'
  };
  
  return colors[priority] || 'gray';
};

export const formatStars = (rating) => {
  const n = Math.max(0, Math.min(5, Math.floor(Number(rating) || 0)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
};

export const formatOrderStatus = (status) => {
  const map = {
    pending:           { label: 'Pending',           color: 'yellow' },
    confirmed:         { label: 'Confirmed',         color: 'blue'   },
    preparing:         { label: 'Preparing',         color: 'orange' },
    ready_for_pickup:  { label: 'Ready for Pickup',  color: 'teal'   },
    picked_up:         { label: 'Picked Up',         color: 'indigo' },
    completed:         { label: 'Completed',         color: 'green'  },
    cancelled:         { label: 'Cancelled',         color: 'red'    },
    denied:            { label: 'Denied',            color: 'red'    },
  };
  return map[status] ?? { label: capitalize(status || 'Unknown'), color: 'gray' };
};

export const CROP_FALLBACK_IMAGES = {
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
  grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
  pulses: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?w=800&auto=format&fit=crop&q=80',
  spices: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop&q=80',
  seeds: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop&q=80',
  herbs: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=800&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
};

export const getCropFallbackImage = (categoryOrName = '') => {
  const term = String(categoryOrName || '').toLowerCase();
  if (term.includes('veg') || term.includes('tomato') || term.includes('potato') || term.includes('onion') || term.includes('carrot') || term.includes('cabbage')) {
    return CROP_FALLBACK_IMAGES.vegetables;
  }
  if (term.includes('fruit') || term.includes('apple') || term.includes('mango') || term.includes('banana') || term.includes('grape') || term.includes('orange')) {
    return CROP_FALLBACK_IMAGES.fruits;
  }
  if (term.includes('grain') || term.includes('wheat') || term.includes('rice') || term.includes('corn') || term.includes('barley') || term.includes('millet')) {
    return CROP_FALLBACK_IMAGES.grains;
  }
  if (term.includes('pulse') || term.includes('dal') || term.includes('bean') || term.includes('lentil') || term.includes('chana') || term.includes('pea')) {
    return CROP_FALLBACK_IMAGES.pulses;
  }
  if (term.includes('spice') || term.includes('chilli') || term.includes('turmeric') || term.includes('pepper') || term.includes('cardamom') || term.includes('ginger')) {
    return CROP_FALLBACK_IMAGES.spices;
  }
  if (term.includes('milk') || term.includes('dairy') || term.includes('butter') || term.includes('paneer') || term.includes('ghee')) {
    return CROP_FALLBACK_IMAGES.dairy;
  }
  if (term.includes('herb') || term.includes('mint') || term.includes('coriander') || term.includes('basil')) {
    return CROP_FALLBACK_IMAGES.herbs;
  }
  if (term.includes('seed') || term.includes('sesame') || term.includes('mustard')) {
    return CROP_FALLBACK_IMAGES.seeds;
  }
  return CROP_FALLBACK_IMAGES.default;
};

export const getImageUrl = (url, categoryOrName = '') => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getCropFallbackImage(categoryOrName);
  }

  const cleanUrl = url.trim();

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }

  let normalizedPath = cleanUrl.startsWith('/') ? cleanUrl : '/' + cleanUrl;

  if (normalizedPath.startsWith('/uploads/') || normalizedPath.startsWith('/images/')) {
    const backendOrigin = (import.meta.env.VITE_API_DIRECT_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    return `${backendOrigin}${normalizedPath}`;
  }

  return cleanUrl;
};
