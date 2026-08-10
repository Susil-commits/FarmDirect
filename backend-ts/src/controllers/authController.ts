import User from '../models/User.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { getServerStartTime } from '../utils/serverTime.js';
import { sendError } from '../utils/apiResponse.js';
import { isTokenRevoked, revokeToken } from '../services/tokenService.js';
import { UserRole, KycStatus } from '../types/enums.js';
import { env } from '../config/env.js';
import sendEmail from '../utils/emailService.js';
import type { RegisterDto, LoginDto } from '../types/index.js';
import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';

interface PublicUserDoc {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  verified?: boolean;
  profilePicture?: string | null;
  kycStatus: KycStatus;
  kycResultSeen?: boolean;
  kycRejectionReason?: string;
  kycSubmittedAt?: Date;
  kycVerifiedAt?: Date | null;
  kycDocuments?: Record<string, unknown>;
  kycDetails?: Record<string, unknown>;
  addresses?: unknown[];
  farmName?: string;
  farmArea?: string;
  experience?: number;
  save(): Promise<void>;
  toObject(): Record<string, unknown>;
}

function publicUser(user: PublicUserDoc) {
  return {
    id: user._id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    location: user.location,
    address: user.address,
    city: user.city,
    state: user.state,
    pincode: user.pincode,
    verified: user.verified,
    kycStatus: user.kycStatus,
    kycResultSeen: user.kycResultSeen,
    kycRejectionReason: user.kycRejectionReason,
    kycSubmittedAt: user.kycSubmittedAt,
    kycDocuments: user.kycDocuments ?? {},
    photo: user.profilePicture,
  };
}

export function getRefreshTokenCookieOptions() {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}


export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as RegisterDto & {
      location?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    const { firstName, lastName, email, password, role, phone, location, photo, address, city, state, pincode } = body;

    if (!firstName || !lastName || !email || !password) {
      sendError(res, 'First name, last name, email, and password are required', 400);
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      sendError(res, 'Email already registered', 400);
      return;
    }

    const hashedPassword = await hashPassword(password);
    const fullName = `${firstName} ${lastName}`.trim();

    const userData: Record<string, unknown> = {
      name: fullName,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || UserRole.Buyer,
      phone,
      location,
      profilePicture: photo || null,
    };
    if (address !== undefined) userData.address = address;
    if (city !== undefined) userData.city = city;
    if (state !== undefined) userData.state = state;
    if (pincode !== undefined) userData.pincode = pincode;

    const user = (await User.create(userData)) as unknown as PublicUserDoc;
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: publicUser(user),
      serverStartTime: getServerStartTime(),
    });
  } catch (error) {
    next(error);
  }
}


export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as LoginDto;
    if (!email || !password) {
      sendError(res, 'Please provide email and password', 400);
      return;
    }

    const user = (await User.findOne({ email }).select('+password')) as unknown as PublicUserDoc | null;
    if (!user) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }
    if (!user.password) {
      sendError(res, 'This account does not have a password set. Please use the forgot password flow to create one.', 400);
      return;
    }
    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      message: 'Login successful',
      token,
      user: publicUser(user),
      serverStartTime: getServerStartTime(),
    });
  } catch (error) {
    next(error);
  }
}


export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (await User.findById(req.user!._id)) as unknown as PublicUserDoc | null;
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    res.status(200).json({
      message: 'User fetched successfully',
      user: { ...user.toObject(), photo: user.profilePicture, id: user._id },
      serverStartTime: getServerStartTime(),
    });
  } catch (error) {
    next(error);
  }
}


export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name, phone, location, bio, avatar, photo, profilePicture,
      address, city, state, pincode,
    } = req.body as Record<string, unknown>;

    // BUG 4 FIX: Only include profilePicture in the update when at least one
    const updateDoc: Record<string, unknown> = {
      name, phone, location, bio, avatar,
      address, city, state, pincode,
    };
    const resolvedPhoto = photo || profilePicture || avatar;
    if (resolvedPhoto !== undefined) {
      updateDoc.profilePicture = resolvedPhoto;
    }

    const user = (await User.findByIdAndUpdate(
      req.user!._id,
      updateDoc,
      { new: true, runValidators: true },
    )) as unknown as PublicUserDoc | null;

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      token: generateToken(user._id),
      user: { ...user.toObject(), photo: user.profilePicture, id: user._id },
    });
  } catch (error) {
    next(error);
  }
}


export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    if (decoded?.jti) {
      await revokeToken(decoded.jti);
    }
  }
  res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
  res.status(200).json({ message: 'Logged out successfully' });
}


export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body as { email?: string };
    if (!email) { sendError(res, 'Please provide an email', 400); return; }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
      return;
    }

    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, { passwordResetToken, passwordResetExpires });

    const resetUrl = `${env.frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'FaRm — Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; border-radius: 8px 8px 0 0; color: white;">
              <h2 style="margin: 0;">Reset Your FaRm Password</h2>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hi ${user.firstName},</p>
              <p>We received a request to reset the password for your FaRm account.</p>
              <p>Click the button below to create a new password. This link is valid for <strong>10 minutes</strong>.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="background: #059669; color: white; padding: 14px 28px; text-decoration: none;
                          border-radius: 6px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will remain unchanged.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                Or copy this link into your browser:<br>
                <a href="${resetUrl}" style="color: #059669;">${resetUrl}</a>
              </p>
            </div>
          </div>`,
        text: `Reset your FaRm password by visiting: ${resetUrl}\n\nThis link expires in 10 minutes.`,
      });
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr);
    }

    res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body as { token?: string, password?: string };
    if (!token || !password) { sendError(res, 'Token and new password required', 400); return; }
    if (password.length < 6) { sendError(res, 'Password must be at least 6 characters', 400); return; }

    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }) as unknown as PublicUserDoc | null;

    if (!user) { sendError(res, 'Token is invalid or expired', 400); return; }

    user.password = await hashPassword(password);
    (user as any).passwordResetToken = undefined;
    (user as any).passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    next(error);
  }
}

export async function updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string, newPassword?: string };
    if (!currentPassword || !newPassword) { sendError(res, 'Current and new password required', 400); return; }
    if (newPassword.length < 6) { sendError(res, 'New password must be at least 6 characters', 400); return; }

    const user = await User.findById(req.user!._id).select('+password') as unknown as PublicUserDoc | null;
    if (!user || !user.password) { sendError(res, 'User not found', 404); return; }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) { sendError(res, 'Incorrect current password', 401); return; }

    user.password = await hashPassword(newPassword);
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
}


export async function refreshTokenHandler(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      sendError(res, 'Refresh token is required', 401);
      return;
    }
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    if (decoded.jti && await isTokenRevoked(decoded.jti)) {
      console.warn(`🔒 Refresh token reuse attempt detected for jti: ${decoded.jti}, user: ${decoded.id}`);
      res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
      sendError(res, 'Refresh token reuse detected. Please log in again.', 401);
      return;
    }

    if (decoded.jti) {
      await revokeToken(decoded.jti);
    }

    const newToken = generateToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);
    
    res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({ message: 'Token refreshed successfully', token: newToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(401).json({ message: 'Failed to refresh token', error: message });
  }
}


interface KycDocEntry {
  fileName?: string;
  url?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: Date;
  aadharNumber?: string;
  [key: string]: unknown;
}

function buildDocumentObject(
  uploadedFiles: { fieldName: string; fileName: string; url: string; publicId?: string; fileSize: number; mimeType: string }[] | undefined,
  docType: string,
): KycDocEntry | null {
  if (!uploadedFiles || uploadedFiles.length === 0) return null;

  let file = uploadedFiles.find((f) => f.fieldName === docType);
  if (!file) {
    file = uploadedFiles.find((f) => f.fileName && f.fileName.toLowerCase().includes(docType.toLowerCase()));
  }
  if (!file) return null;

  return {
    fileName: file.fileName,
    url: file.url,
    publicId: file.publicId,
    fileSize: file.fileSize,
    mimeType: file.mimeType,
    uploadedAt: new Date(),
  };
}

export async function submitKYCDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { aadharNumber, address, city, state, pincode, farmName, farmArea, experience } = req.body as Record<string, string | undefined>;

    if (req.uploadError) {
      console.error('File upload failed:', req.uploadError);
      res.status(500).json({ success: false, message: 'File upload to storage failed. Please try again.', error: req.uploadError });
      return;
    }

    const user = (await User.findById(userId)) as unknown as (PublicUserDoc & {
      kycDocuments?: Record<string, unknown>;
      kycDetails?: { aadharNumber?: string };
      addresses?: { streetAddress?: string; city?: string; state?: string; pincode?: string; isDefault?: boolean }[];
      role: UserRole;
      farmName?: string;
      farmArea?: string;
      experience?: number;
    }) | null;

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    user.kycStatus = KycStatus.Pending;
    user.kycVerifiedAt = null;
    user.kycSubmittedAt = new Date();

    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      const kycDocs: Record<string, KycDocEntry | string> = {
        aadharNumber: aadharNumber || (user.kycDocuments?.aadharNumber as string) || '',
      };

      req.uploadedFiles.forEach((file) => {
        const docType = file.fieldName || 'unknown';
        kycDocs[docType] = {
          fileName: file.fileName,
          url: file.url,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedAt: new Date(),
        };
      });

      const knownTypes = ['governmentId', 'profilePhoto', 'addressProof', 'landOwnership', 'farmRegistration', 'businessRegistration', 'bankDetails', 'taxId', 'bankAccount', 'landSurvey'];
      knownTypes.forEach((type) => {
        if (!kycDocs[type]) {
          const matched = buildDocumentObject(req.uploadedFiles, type);
          if (matched) kycDocs[type] = matched;
        }
      });

      user.kycDocuments = kycDocs as Record<string, unknown>;
    } else {
      user.kycDocuments = {
        ...(user.kycDocuments || {}),
        ...(aadharNumber ? { aadharNumber } : {}),
      };
    }

    if (aadharNumber || address || city || state || pincode || farmName || farmArea || experience) {
      user.kycDetails = { aadharNumber };

      if (!user.addresses) user.addresses = [];
      if (user.addresses.length === 0) {
        user.addresses.push({ streetAddress: address || '', city, state, pincode, isDefault: true });
      } else {
        user.addresses[0] = {
          ...user.addresses[0],
          streetAddress: address || user.addresses[0].streetAddress || '',
          city, state, pincode,
        };
      }

      if (address) (user as unknown as { address?: string }).address = address;
      if (city) (user as unknown as { city?: string }).city = city;
      if (state) (user as unknown as { state?: string }).state = state;
      if (pincode) (user as unknown as { pincode?: string }).pincode = pincode;

      if (user.role === UserRole.Farmer) {
        if (farmName) user.farmName = farmName;
        if (farmArea) user.farmArea = farmArea;
        if (experience !== undefined && experience !== '') user.experience = Number(experience);
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'KYC documents submitted successfully. Please wait for admin approval.',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        kycStatus: user.kycStatus,
        kycSubmittedAt: user.kycSubmittedAt,
        kycDocuments: user.kycDocuments,
        kycDetails: user.kycDetails,
      },
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    next(error);
  }
}


export async function deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const user = await User.findById(userId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const CropListing = (await import('../models/CropListing.js')).default;
    const Order = (await import('../models/Order.js')).default;
    const Review = (await import('../models/Review.js')).default;
    const Wishlist = (await import('../models/Wishlist.js')).default;
    const Notification = (await import('../models/Notification.js')).default;

    if (user.role === UserRole.Farmer) {
      const farmerCropIds = await CropListing.find({ farmerId: userId }).distinct('_id');
      await CropListing.deleteMany({ farmerId: userId });
      await Review.deleteMany({ cropId: { $in: farmerCropIds } });
    }
    await Order.deleteMany({ $or: [{ buyerId: userId }, { farmerId: userId }] });
    await Review.deleteMany({ userId });
    await Wishlist.deleteMany({ userId });
    await Notification.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Your account has been permanently deleted. All associated data has been removed.',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    next(error);
  }
}


/**
 * POST /auth/complete-onboarding
 * Allows a newly registered user to supply additional profile details
 * (role-specific fields like farmName, farmArea, etc.) that were not
 * collected at registration. Idempotent — safe to call multiple times.
 */
export async function completeOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const {
      farmName, farmArea, cropsGrown, experience,
      bio, phone, address, city, state, pincode,
    } = req.body as Record<string, unknown>;

    const user = (await User.findById(userId)) as unknown as PublicUserDoc | null;
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const updates: Record<string, unknown> = {};
    if (farmName !== undefined) updates.farmName = farmName;
    if (farmArea !== undefined) updates.farmArea = farmArea;
    if (cropsGrown !== undefined) updates.cropsGrown = cropsGrown;
    if (experience !== undefined) updates.experience = Number(experience);
    if (bio !== undefined) updates.bio = bio;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (pincode !== undefined) updates.pincode = pincode;

    const updated = (await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true },
    )) as unknown as PublicUserDoc | null;

    if (!updated) {
      sendError(res, 'User not found', 404);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      user: publicUser(updated),
    });
  } catch (error) {
    next(error);
  }
}
