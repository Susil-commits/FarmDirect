import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { UserRole, KycStatus, UserStatus } from '../types/enums.js';
import { sendError } from '../utils/apiResponse.js';

const suspendedAllowedPaths = [
  '/api/notifications',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/users/profile',
  '/api/contact',
];

/** Require a valid JWT; attaches the minimal user object to `req.user`.
 *  B18 FIX: Also attaches the full Mongoose document to `req.userDoc` so
 *  downstream middleware (requireKYC) can reuse it without a second DB hit.
 *  The compound index `{ _id: 1, status: 1 }` on the User collection is
 *  recommended to make this lookup O(log n). */
export const protect: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return sendError(res, 'No token provided', 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return sendError(res, 'Invalid or expired token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    req.user = {
      _id: user._id,
      role: user.role,
      email: user.email,
      status: user.status,
    };
    // Attach full document for middleware reuse (avoids N duplicate DB lookups)
    req.userDoc = user;

    if (user.status === UserStatus.Banned || user.status === UserStatus.Suspended) {
      const isAllowed = suspendedAllowedPaths.some((p) => req.originalUrl.startsWith(p));
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `Your account is ${user.status}. Go to notifications to learn why or contact support.`,
          accountStatus: user.status,
          suspensionReason: user.suspensionReason,
        });
      }
    }

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message: 'Authentication failed', error: message });
  }
};

/** Restrict a route to one or more roles. */
export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Not authorized for this action', 403);
    }
    next();
  };
};

/** Require KYC verification (farmers & buyers; admin is exempt).
 *  B19 FIX: Reuses `req.userDoc` set by the `protect` middleware instead
 *  of making a second `User.findById` DB call on every KYC-protected request. */
export const requireKYC: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401);
    }
    if (req.user.role === UserRole.Admin) {
      return next();
    }
    // Prefer the already-loaded userDoc; fall back to a fresh query only if missing
    const user = req.userDoc ?? await User.findById(req.user._id);
    if (!user || user.kycStatus !== KycStatus.Verified) {
      return res.status(403).json({
        success: false,
        message: 'KYC verification required',
        kycStatus: user?.kycStatus ?? KycStatus.Pending,
        error: 'Complete your KYC verification to perform this action',
      });
    }
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message: 'KYC check failed', error: message });
  }
};

/** Check that the authenticated user owns the resource identified by a field. */
export const ownershipCheck = (resourceField = 'userId'): RequestHandler => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }
      if (req.user.role === UserRole.Admin) {
        return next();
      }
      const resourceId = req.body[resourceField] || req.params[resourceField];
      if (!resourceId) {
        return sendError(res, `Missing resource field: ${resourceField}`, 400);
      }
      if (resourceId.toString() !== req.user._id.toString()) {
        return sendError(res, 'Not authorized to access this resource', 403);
      }
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, message: 'Ownership check failed', error: message });
    }
  };
};
