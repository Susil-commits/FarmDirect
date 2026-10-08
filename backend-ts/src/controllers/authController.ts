import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { getServerStartTime } from '../utils/serverTime.js';
import { sendError } from '../utils/apiResponse.js';
import { isTokenRevoked, revokeToken } from '../services/tokenService.js';
import { UserRole, KycStatus, UserStatus } from '../types/enums.js';
import { env } from '../config/env.js';
import sendEmail from '../utils/emailService.js';
import { deleteFile } from '../utils/cloudinaryService.js';
import { disconnectUserSockets } from '../socket/socketManager.js';
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

    if (!firstName || !lastName || !email || !password || typeof email !== 'string' || typeof password !== 'string') {
      sendError(res, 'Valid first name, last name, email, and password are required', 400);
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      sendError(res, 'Email already registered', 400);
      return;
    }

    const hashedPassword = await hashPassword(password);
    const fullName = `${firstName} ${lastName}`.trim();

    // Defense-in-depth: controller-level whitelist strictly permits Farmer or defaults to Buyer
    const assignedRole = role === UserRole.Farmer ? UserRole.Farmer : UserRole.Buyer;

    const userData: Record<string, unknown> = {
      name: fullName,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: assignedRole,
      phone,
      location,
      profilePicture: photo || null,
    };
    if (address !== undefined) userData.address = address;
    if (city !== undefined) userData.city = city;
    if (state !== undefined) userData.state = state;
    if (pincode !== undefined) userData.pincode = pincode;

    const user = (await User.create(userData)) as unknown as PublicUserDoc;
    const token = generateToken(user._id, user.role, (user as any).tokenVersion || 0);
    const refreshToken = generateRefreshToken(user._id, undefined, (user as any).tokenVersion || 0);

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
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      sendError(res, 'Please provide valid email and password', 400);
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = (await User.findOne({ email: cleanEmail }).select('+password')) as unknown as PublicUserDoc | null;
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

    const token = generateToken(user._id, user.role, (user as any).tokenVersion || 0);
    const refreshToken = generateRefreshToken(user._id, undefined, (user as any).tokenVersion || 0);

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

    const updateDoc: Record<string, unknown> = {};
    if (typeof name === 'string') updateDoc.name = name.trim();
    if (typeof phone === 'string') updateDoc.phone = phone.trim();
    if (typeof location === 'string') updateDoc.location = location.trim();
    if (typeof bio === 'string') updateDoc.bio = bio.trim();
    if (typeof address === 'string') updateDoc.address = address.trim();
    if (typeof city === 'string') updateDoc.city = city.trim();
    if (typeof state === 'string') updateDoc.state = state.trim();
    if (typeof pincode === 'string') updateDoc.pincode = pincode.trim();

    const resolvedPhoto = photo || profilePicture || avatar;
    if (typeof resolvedPhoto === 'string') {
      updateDoc.profilePicture = resolvedPhoto;
    }

    const user = (await User.findByIdAndUpdate(
      req.user!._id,
      { $set: updateDoc },
      { new: true, runValidators: true },
    )) as unknown as PublicUserDoc | null;

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      token: generateToken(user._id, user.role),
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
    if (!email || typeof email !== 'string') { sendError(res, 'Please provide a valid email', 400); return; }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, { $set: { passwordResetToken, passwordResetExpires } });

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

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }) as unknown as PublicUserDoc | null;

    if (!user) { sendError(res, 'Token is invalid or expired', 400); return; }

    user.password = await hashPassword(password);
    (user as any).passwordResetToken = undefined;
    (user as any).passwordResetExpires = undefined;
    (user as any).passwordChangedAt = new Date();
    (user as any).tokenVersion = ((user as any).tokenVersion || 0) + 1;
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

    const user = await User.findById(req.user!._id).select('+password') as unknown as PublicUserDoc | null;
    if (!user || !user.password) { sendError(res, 'User not found', 404); return; }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) { sendError(res, 'Incorrect current password', 401); return; }

    user.password = await hashPassword(newPassword);
    (user as any).passwordChangedAt = new Date();
    (user as any).tokenVersion = ((user as any).tokenVersion || 0) + 1;
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

    const user = await User.findById(decoded.id).select('role status tokenVersion');
    if (!user || user.status === 'banned' || user.status === 'suspended') {
      res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
      sendError(res, 'User no longer active', 401);
      return;
    }

    if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
      sendError(res, 'Session has expired or was revoked. Please log in again.', 401);
      return;
    }

    // Immediately revoke the consumed refresh token to prevent replay attacks
    if (decoded.jti) {
      await revokeToken(decoded.jti);
    }

    const currentVersion = user.tokenVersion || 0;
    const newToken = generateToken(user._id, user.role, currentVersion);
    const newRefreshToken = generateRefreshToken(user._id, undefined, currentVersion);
    
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

    let maskedAadhar: string | undefined;
    let aadharLast4: string | undefined;
    if (aadharNumber) {
      const cleanDigits = aadharNumber.replace(/\D/g, '');
      if (cleanDigits.length >= 4) {
        aadharLast4 = cleanDigits.slice(-4);
        maskedAadhar = `XXXX-XXXX-${aadharLast4}`;
      }
    }

    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      const kycDocs: Record<string, KycDocEntry | string> = {
        maskedAadhar: maskedAadhar || (user.kycDocuments?.maskedAadhar as string) || '',
        aadharLast4: aadharLast4 || (user.kycDocuments?.aadharLast4 as string) || '',
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
        ...(maskedAadhar ? { maskedAadhar, aadharLast4 } : {}),
      };
    }

    if (maskedAadhar || address || city || state || pincode || farmName || farmArea || experience) {
      user.kycDetails = {
        maskedAadhar,
        aadharLast4,
      };

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
    const { password } = req.body as { password?: string };
    if (!password) {
      sendError(res, 'Password confirmation is required to delete your account', 400);
      return;
    }

    const user = await User.findById(userId).select('+password');
    if (!user || !user.password) {
      sendError(res, 'User not found', 404);
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      sendError(res, 'Invalid password confirmation', 401);
      return;
    }

    // Retain orders as legally-mandated financial & tax records, but redact customer PII
    const Order = (await import('../models/Order.js')).default;
    await Order.updateMany({ buyerId: userId }, { $set: { buyerContact: '[Redacted]', deliveryAddress: '[Redacted]' } });
    await Order.updateMany({ farmerId: userId }, { $set: { farmerContact: '[Redacted]' } });

    const CropListing = (await import('../models/CropListing.js')).default;
    const Review = (await import('../models/Review.js')).default;
    const Wishlist = (await import('../models/Wishlist.js')).default;
    const Notification = (await import('../models/Notification.js')).default;
    const Cart = (await import('../models/Cart.js')).default;
    const Negotiation = (await import('../models/Negotiation.js')).default;
    const Message = (await import('../models/Message.js')).default;
    const AiConversation = (await import('../models/AiConversation.js')).default;

    if (user.role === UserRole.Farmer) {
      const farmerCropIds = await CropListing.find({ farmerId: userId }).distinct('_id');
      await CropListing.deleteMany({ farmerId: userId });
      await Review.deleteMany({ cropId: { $in: farmerCropIds } });
    }
    await Review.deleteMany({ userId });
    await Wishlist.deleteMany({ userId });
    await Notification.deleteMany({ userId });
    await Cart.deleteMany({ buyerId: userId });
    await Negotiation.deleteMany({ $or: [{ buyerId: userId }, { farmerId: userId }] });
    await Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });
    await AiConversation.deleteMany({ userId });

    // Clean up Cloudinary avatar if stored remotely
    if (user.profilePicture) {
      try {
        await deleteFile(user.profilePicture);
      } catch (fileErr) {
        console.warn('Failed to delete Cloudinary profile picture on account deletion:', fileErr);
      }
    }

    // Immediately terminate any open realtime socket connections
    disconnectUserSockets(String(userId));

    // Scrub identity and mark account deleted
    user.status = UserStatus.Suspended;
    user.email = `deleted_${userId}_${Date.now()}@farmdirect.deleted`;
    user.name = 'Deleted User';
    user.firstName = 'Deleted';
    user.lastName = 'User';
    user.phone = '';
    user.profilePicture = null;
    (user as any).tokenVersion = ((user as any).tokenVersion || 0) + 1;
    await user.save();

    res.clearCookie('refreshToken', getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Your account has been deleted and active sessions revoked. Financial records have been anonymized.',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    next(error);
  }
}

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
