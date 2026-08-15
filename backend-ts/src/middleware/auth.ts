import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { UserRole, KycStatus, UserStatus } from '../types/enums.js';
import { ApiError } from '../utils/apiError.js';

const suspendedAllowedPaths = [
  '/api/notifications',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/users/profile',
  '/api/contact',
];

export const protect: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('No authentication token provided'));
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || !parts[1]) {
      return next(ApiError.unauthorized('Malformed authorization header'));
    }

    const token = parts[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(ApiError.unauthorized('Invalid or expired token'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(ApiError.notFound('User not found'));
    }

    req.user = {
      _id: user._id,
      role: user.role,
      email: user.email,
      status: user.status,
    };
    req.userDoc = user;

    if (user.status === UserStatus.Banned || user.status === UserStatus.Suspended) {
      const isAllowed = suspendedAllowedPaths.some((p) => req.originalUrl.startsWith(p));
      if (!isAllowed) {
        return next(new ApiError(403, `Your account is ${user.status}. Go to notifications to learn why or contact support.`, {
          details: {
            accountStatus: user.status,
            suspensionReason: (user as unknown as { suspensionReason?: string }).suspensionReason,
          },
          code: 'ACCOUNT_SUSPENDED',
        }));
      }
    }

    next();
  } catch (error) {
    next(ApiError.fromUnknown(error, 'Authentication failed'));
  }
};

export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`This action requires one of these roles: ${roles.join(', ')}`));
    }
    next();
  };
};

export const requireKYC: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized('Not authenticated'));
    }
    if (req.user.role === UserRole.Admin) {
      return next();
    }
    const user = req.userDoc ?? await User.findById(req.user._id);
    if (!user || user.kycStatus !== KycStatus.Verified) {
      return next(new ApiError(403, 'KYC verification required', {
        details: {
          kycStatus: user?.kycStatus ?? KycStatus.Pending,
          hint: 'Complete your KYC verification to perform this action',
        },
        code: 'KYC_REQUIRED',
      }));
    }
    next();
  } catch (error) {
    next(ApiError.fromUnknown(error, 'KYC check failed'));
  }
};

export const ownershipCheck = (resourceField = 'userId'): RequestHandler => {
  return async (req, _res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Not authenticated'));
      }
      if (req.user.role === UserRole.Admin) {
        return next();
      }
      const resourceId = req.body[resourceField] || req.params[resourceField];
      if (!resourceId) {
        return next(ApiError.badRequest(`Missing resource field: ${resourceField}`));
      }
      if (resourceId.toString() !== req.user._id.toString()) {
        return next(ApiError.forbidden('Not authorized to access this resource'));
      }
      next();
    } catch (error) {
      next(ApiError.fromUnknown(error, 'Ownership check failed'));
    }
  };
};
