import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Routes that suspended/banned users can still access
const suspendedAllowedPaths = [
  '/api/notifications',   // So users can see why they were suspended
  '/api/auth/me',         // So users can check their account status
  '/api/auth/logout',     // So users can log out
  '/api/users/profile',   // So users can view their profile
  '/api/contact'          // So users can contact support
];

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Attach user to request BEFORE checking status (needed even for suspended users)
    req.user = {
      _id: user._id,
      role: user.role,
      email: user.email,
      status: user.status
    };

    // Suspended/banned users can only access allowed paths (notifications, profile, contact)
    if (user.status === 'banned' || user.status === 'suspended') {
      const isAllowed = suspendedAllowedPaths.some(p => req.originalUrl.startsWith(p));
      if (!isAllowed) {
        return res.status(403).json({
          message: `Your account is ${user.status}. Go to notifications to learn why or contact support.`,
          accountStatus: user.status,
          suspensionReason: user.suspensionReason
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }

    next();
  };
};

// Middleware: Check if user has completed KYC verification
// Applies to farmers (for crop listing) and buyers (for ordering)
export const requireKYC = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // KYC required for farmers and buyers (admin exempt)
    if (req.user.role === 'admin') {
      return next();
    }

    const user = await User.findById(req.user._id);
    if (!user || user.kycStatus !== 'verified') {
      return res.status(403).json({
        message: 'KYC verification required',
        kycStatus: user?.kycStatus || 'pending',
        error: 'Complete your KYC verification to perform this action'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'KYC check failed', error: error.message });
  }
};

// Middleware: Check resource ownership
export const ownershipCheck = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Admin can access all resources
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.body[resourceField] || req.params[resourceField];
      if (!resourceId) {
        return res.status(400).json({ message: `Missing resource field: ${resourceField}` });
      }

      // Check if user owns the resource
      if (resourceId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to access this resource' });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Ownership check failed', error: error.message });
    }
  };
};
