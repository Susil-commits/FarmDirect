import User from '../models/User.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { getServerStartTime } from '../utils/serverTime.js';
import axios from 'axios';

// @route POST /api/auth/register
// @desc Register a new user (Farmer or Buyer)
// @access Public
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, phone, location, photo, address, city, state, pincode } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create full name from firstName and lastName
    const fullName = `${firstName} ${lastName}`.trim();

    // Build user object with optional address fields
    const userData = {
      name: fullName,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'buyer',
      phone,
      location,
      profilePicture: photo || null, // Store photo as profilePicture
    };

    // Add address fields if provided (may be "NA" for farmers without formal address)
    if (address !== undefined) userData.address = address;
    if (city !== undefined) userData.city = city;
    if (state !== undefined) userData.state = state;
    if (pincode !== undefined) userData.pincode = pincode;

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);
    const refreshToken = generateToken(user._id); // In production, use a different secret/expiry

    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      user: {
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
        kycStatus: user.kycStatus, // Include KYC verification status (should be 'not_submitted')
        photo: user.profilePicture, // Return as photo
      },
      serverStartTime: getServerStartTime()
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/login
// @desc Login user
// @access Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // ADMIN ACCOUNT - Hardcoded for local dev/testing
    if (email === 'admin@123' && password === 'password') {
      let adminUser = await User.findOne({ email: 'admin@123', role: 'admin' });

      if (!adminUser) {
        const bcrypt = (await import('bcryptjs')).default;
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('password', salt);

        adminUser = await User.create({
          firstName: 'FarmDirect',
          lastName: 'Admin',
          name: 'FarmDirect Admin',
          email: 'admin@123',
          password: hashedPassword,
          role: 'admin',
          kycStatus: 'verified',
          status: 'active',
          verified: true,
          emailVerified: true,
          phone: '0000000000',
        });
      }

      const token = generateToken(adminUser._id);
      const refreshToken = generateToken(adminUser._id);

      return res.status(200).json({
        message: 'Login successful',
        token,
        refreshToken,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          email: adminUser.email,
          role: adminUser.role,
          phone: adminUser.phone,
          location: adminUser.location,
          kycStatus: adminUser.kycStatus,
          verified: adminUser.verified,
          photo: adminUser.profilePicture,
        },
        serverStartTime: getServerStartTime()
      });
    }

    // Find user and select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Guard against social auth users who have no password
    if (!user.password) {
      return res.status(400).json({ message: 'This account uses social login. Please sign in with Google or GitHub.' });
    }

    // Compare password
    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate token
    const token = generateToken(user._id);
    const refreshToken = generateToken(user._id); // In production, use a different secret/expiry

    res.status(200).json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
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
        photo: user.profilePicture,
      },
      serverStartTime: getServerStartTime()
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/auth/me
// @desc Get current logged-in user
// @access Private
export const getCurrentUser = async (req, res, next) => {
  try {
    // Handle regular users from database
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User fetched successfully',
      user: {
        ...user.toObject(),
        photo: user.profilePicture,
        id: user._id
      },
      serverStartTime: getServerStartTime()
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/auth/update-profile
// @desc Update user profile
// @access Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location, bio, avatar, photo, profilePicture, address, city, state, pincode } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        phone,
        location,
        bio,
        avatar,
        profilePicture: photo || profilePicture || avatar, // Handle photo/profilePicture/avatar field names
        address,
        city,
        state,
        pincode,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      token: generateToken(user._id),
      user: {
        ...user.toObject(),
        photo: user.profilePicture, // Return as photo for frontend
        id: user._id, // Ensure id field
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/logout
// @desc Logout user (client-side token removal)
// @access Private
export const logout = async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

// @route POST /api/auth/google/callback
// @desc Handle Google OAuth callback
// @access Public
export const googleCallback = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Exchange code for access token with Google (in production, use confidential client)
    // For now, we'll assume the frontend handles verification
    const tokens = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.FRONTEND_URL}/auth/google/callback`,
      grant_type: 'authorization_code',
    });

    // Get user profile from Google
    const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.data.access_token}` },
    });

    const { email, name, picture } = userInfo.data;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      const [firstName = '', lastName = ''] = name?.split(' ') || [email.split('@')[0]];

      user = await User.create({
        name,
        firstName,
        lastName,
        email,
        password: null, // Social login users may not have password
        role: 'buyer',
        profilePicture: picture,
        verified: true, // Google verified emails
        socialAuth: {
          provider: 'google',
          providerId: userInfo.data.id,
        },
      });
    } else if (!user.socialAuth?.provider) {
      // Update existing user with social auth info
      user.socialAuth = {
        provider: 'google',
        providerId: userInfo.data.id,
      };
      if (!user.profilePicture) {
        user.profilePicture = picture;
      }
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);
    const refreshToken = generateToken(user._id); // In production, use different secret/expiry

    res.status(200).json({
      message: 'Google login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        photo: user.profilePicture,
        verified: user.verified,
        kycStatus: user.kycStatus || 'pending',
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error.message);
    res.status(401).json({
      message: 'Google authentication failed',
      error: error.message,
    });
  }
};

// @route POST /api/auth/github/callback
// @desc Handle GitHub OAuth callback
// @access Public
export const githubCallback = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Exchange code for access token with GitHub
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.FRONTEND_URL}/auth/github/callback`,
    }, {
      headers: { Accept: 'application/json' },
    });

    if (tokenResponse.data.error) {
      throw new Error(tokenResponse.data.error_description);
    }

    const accessToken = tokenResponse.data.access_token;

    // Get user profile from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Get user email from GitHub (if not public)
    let email = userResponse.data.email;
    if (!email) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const primaryEmail = emailResponse.data.find(e => e.primary);
      email = primaryEmail?.email;
    }

    if (!email) {
      return res.status(400).json({ message: 'Could not retrieve email from GitHub' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      const firstName = userResponse.data.name?.split(' ')[0] || userResponse.data.login;
      const lastName = userResponse.data.name?.split(' ')[1] || '';

      user = await User.create({
        name: userResponse.data.name || userResponse.data.login,
        firstName,
        lastName,
        email,
        password: null, // Social login users may not have password
        role: 'buyer',
        profilePicture: userResponse.data.avatar_url,
        verified: true,
        socialAuth: {
          provider: 'github',
          providerId: userResponse.data.id,
        },
      });
    } else if (!user.socialAuth?.provider) {
      // Update existing user with social auth info
      user.socialAuth = {
        provider: 'github',
        providerId: userResponse.data.id,
      };
      if (!user.profilePicture) {
        user.profilePicture = userResponse.data.avatar_url;
      }
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);
    const refreshToken = generateToken(user._id); // In production, use different secret

    res.status(200).json({
      message: 'GitHub login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        photo: user.profilePicture,
        verified: user.verified,
        kycStatus: user.kycStatus || 'pending',
      },
    });
  } catch (error) {
    console.error('GitHub OAuth error:', error.message);
    res.status(401).json({
      message: 'GitHub authentication failed',
      error: error.message,
    });
  }
};

// @route POST /api/auth/refresh-token
// @desc Refresh authentication token
// @access Public
export const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const newToken = generateToken(decoded.id);

    res.status(200).json({
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: refreshToken, // Return same refresh token
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      message: 'Failed to refresh token',
      error: error.message,
    });
  }
};

// @route POST /api/kyc/submit
// @desc Submit KYC documents for verification
// @access Private
export const submitKYCDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { aadharNumber, address, city, state, pincode, farmName, farmArea, experience } = req.body;

    // CRITICAL: If files were sent but upload failed, return error
    // Don't silently proceed - the user needs to know their upload failed
    if (req.uploadError) {
      console.error('❌ File upload failed:', req.uploadError);
      return res.status(500).json({
        success: false,
        message: 'File upload to storage failed. Please try again.',
        error: req.uploadError
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // ALWAYS update KYC status and submission time — even if no files were uploaded
    // This ensures the admin can see the user in the pending KYC list
    user.kycStatus = 'pending';
    user.kycVerifiedAt = null; // Clear verification date
    user.kycSubmittedAt = new Date(); // Record submission time
    
    // Store document URLs and metadata from local uploads
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      // Dynamically map all uploaded files by their fieldName
      // This supports both buyer docs (governmentId, businessRegistration, bankDetails, taxId, addressProof)
      // and farmer docs (governmentId, landOwnership, bankAccount, farmRegistration, landSurvey)
      const kycDocs = {
        aadharNumber: aadharNumber || user.kycDocuments?.aadharNumber,
      };
      
      req.uploadedFiles.forEach(file => {
        const docType = file.fieldName || 'unknown';
        kycDocs[docType] = {
          fileName: file.fileName,
          url: file.url,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedAt: new Date()
        };
      });
      
      // Also try to match by known document types for backward compatibility
      const knownTypes = ['governmentId', 'profilePhoto', 'addressProof', 'landOwnership',
                          'farmRegistration', 'businessRegistration', 'bankDetails', 'taxId',
                          'bankAccount', 'landSurvey'];
      knownTypes.forEach(type => {
        if (!kycDocs[type]) {
          const matched = buildDocumentObject(req.uploadedFiles, type);
          if (matched) {
            kycDocs[type] = matched;
          }
        }
      });
      
      user.kycDocuments = kycDocs;
    } else {
      // No new files uploaded — preserve existing documents if any
      // Only update aadharNumber if provided; keep all existing doc fields
      user.kycDocuments = {
        ...(user.kycDocuments || {}),
        ...(aadharNumber ? { aadharNumber } : {}),
      };
    }
    
    // Store personal details
    if (aadharNumber || address || city || state || pincode || farmName || farmArea || experience) {
      user.kycDetails = {
        aadharNumber: aadharNumber,
      };
      
      // Update address if provided
      if (!user.addresses) user.addresses = [];
      if (user.addresses.length === 0) {
        user.addresses.push({
          streetAddress: address || '',
          city: city,
          state: state,
          pincode: pincode,
          isDefault: true
        });
      } else {
        user.addresses[0] = {
          ...user.addresses[0],
          streetAddress: address || user.addresses[0].streetAddress || '',
          city: city,
          state: state,
          pincode: pincode
        };
      }

      // Also update top-level address fields for backward compatibility
      if (address) user.address = address;
      if (city) user.city = city;
      if (state) user.state = state;
      if (pincode) user.pincode = pincode;
      
      // Save farmer-specific fields (only for farmer role)
      if (user.role === 'farmer') {
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
        kycDetails: user.kycDetails
      }
    });
  } catch (error) {
    console.error('❌ KYC submission error:', error);
    next(error);
  }
};

/**
 * Helper function to build document object from uploaded files
 * Matches files by fieldName (form field name) first, then falls back to filename matching
 */
const buildDocumentObject = (uploadedFiles, docType) => {
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return null;
  }
  
  // First try to match by fieldName (exact match from form field)
  let file = uploadedFiles.find(f => f.fieldName === docType);
  
  // Fallback: try matching by filename containing docType
  if (!file) {
    file = uploadedFiles.find(f => f.fileName && f.fileName.toLowerCase().includes(docType.toLowerCase()));
  }
  
  // No fallback to first file - only return a match if we actually found one
  if (!file) {
    return null;
  }

  return {
    fileName: file.fileName,
    url: file.url,
    publicId: file.publicId,
    fileSize: file.fileSize,
    mimeType: file.mimeType,
    uploadedAt: new Date()
  };
};

// @route POST /api/auth/delete-account
// @desc Delete user account (user-initiated)
// @access Private
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Import related models
    const CropListing = (await import('../models/CropListing.js')).default;
    const Order = (await import('../models/Order.js')).default;
    const Review = (await import('../models/Review.js')).default;
    const Wishlist = (await import('../models/Wishlist.js')).default;
    const Notification = (await import('../models/Notification.js')).default;

    const userEmail = user.email;

    // Delete all related data
    if (user.role === 'farmer') {
      // Delete farmer's crop listings
      await CropListing.deleteMany({ farmerId: userId });
    }

    // Delete user's orders
    await Order.deleteMany({ $or: [{ buyerId: userId }, { farmerId: userId }] });

    // Delete user's reviews
    await Review.deleteMany({ $or: [{ reviewerId: userId }, { revieweeId: userId }] });

    // Delete wishlist items
    await Wishlist.deleteMany({ userId: userId });

    // Delete notifications
    await Notification.deleteMany({ userId: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Your account has been permanently deleted. All associated data has been removed.'
    });
  } catch (error) {
    console.error('❌ Account deletion error:', error);
    next(error);
  }
};
