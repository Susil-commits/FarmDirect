// Format currency (INR)
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency
  }).format(amount);
};

// Format date
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };
  
  return d.toLocaleDateString('en-IN', options[format]);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  const d = new Date(date);
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

// Format phone number
export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  
  return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
};

// Format number with commas
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// Truncate text
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

// Format rating
export const formatRating = (rating) => {
  return parseFloat(rating).toFixed(1);
};

// Capitalize string
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Convert status to readable text
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

// Get status color
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

// Format product title
export const formatProductTitle = (title) => {
  return title.split(' ').map(word => capitalize(word)).join(' ');
};

// Format address
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

// Get initials from name
export const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Get badge color based on priority
export const getPriorityColor = (priority) => {
  const colors = {
    low: 'blue',
    medium: 'yellow',
    high: 'red'
  };
  
  return colors[priority] || 'gray';
};

// Format review stars
export const formatStars = (rating) => {
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  return stars;
};
