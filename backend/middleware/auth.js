import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

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

    // Handle hardcoded admin account
    if (decoded.id === 'admin_id_12345') {
      req.user = {
        _id: 'admin_id_12345',
        role: 'admin',
        email: 'admin@123'
      };
      return next();
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({ message: 'User account is suspended or banned' });
    }

    req.user = {
      _id: user._id,
      role: user.role,
      email: user.email
    };
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
export const requireKYC = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.user.role !== 'farmer') {
      return next(); // KYC only applies to farmers
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
