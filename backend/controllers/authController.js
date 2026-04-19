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
    const { firstName, lastName, email, password, role, phone, location, photo } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create full name from firstName and lastName
    const fullName = `${firstName} ${lastName}`.trim();

    // Create user
    const user = await User.create({
      name: fullName,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'buyer',
      phone,
      location,
      profilePicture: photo || null, // Store photo as profilePicture
    });

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
        kycStatus: user.kycStatus, // Include KYC verification status (should be 'pending')
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

    // ADMIN ACCOUNT - Hardcoded for testing
    if (email === 'admin@123' && password === 'password') {
      const token = generateToken('admin_id_12345');
      const refreshToken = generateToken('admin_id_12345');
      
      return res.status(200).json({
        message: 'Login successful',
        token,
        refreshToken,
        user: {
          id: 'admin_id_12345',
          name: 'Admin User',
          email: 'admin@123',
          role: 'admin',
          phone: '+91 9999999999',
          location: 'India',
          kycStatus: 'verified'
        },
        serverStartTime: getServerStartTime()
      });
    }

    // Find user and select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        verified: user.verified,
        kycStatus: user.kycStatus, // Include KYC verification status
        photo: user.profilePicture, // Include photo
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
    // Handle admin user (hardcoded for testing)
    if (req.user._id === 'admin_id_12345') {
      return res.status(200).json({
        message: 'User fetched successfully',
        user: {
          id: 'admin_id_12345',
          name: 'Admin User',
          email: 'admin@123',
          role: 'admin',
          phone: '+91 9999999999',
          location: 'India',
          kycStatus: 'verified',
          verified: true
        },
        serverStartTime: getServerStartTime()
      });
    }

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
      token: localStorage.token || generateToken(user._id), // Include token for consistency
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
    const { documents, aadharNumber, city, state, pincode } = req.body;

    console.log('📝 submitKYCDocuments called for user:', userId);
    console.log('📄 Documents received:', documents);
    console.log('👤 Personal details received:', { aadharNumber, city, state, pincode });
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`👤 User found: ${user.email}, role: ${user.role}, current kycStatus: ${user.kycStatus}`);

    // Update user's KYC documents and status
    user.kycStatus = 'pending';
    user.kycVerifiedAt = null; // Clear verification date
    user.kycSubmittedAt = new Date(); // Record submission time
    
    // Store document file names
    if (documents) {
      user.kycDocuments = {
        aadharNumber: aadharNumber,
        governmentId: documents.governmentId ? { fileName: documents.governmentId.fileName, uploadedAt: new Date() } : null,
        profilePhoto: documents.profilePhoto ? { fileName: documents.profilePhoto.fileName, uploadedAt: new Date() } : null,
        addressProof: documents.addressProof ? { fileName: documents.addressProof.fileName, uploadedAt: new Date() } : null,
        landOwnership: documents.landOwnership ? { fileName: documents.landOwnership.fileName, uploadedAt: new Date() } : null,
        farmRegistration: documents.farmRegistration ? { fileName: documents.farmRegistration.fileName, uploadedAt: new Date() } : null,
      };
    }
    
    // Store personal details
    if (aadharNumber || city || state || pincode) {
      user.kycDetails = {
        aadharNumber: aadharNumber,
      };
      
      // Update address if provided
      if (!user.addresses) user.addresses = [];
      if (user.addresses.length === 0) {
        user.addresses.push({
          city: city,
          state: state,
          pincode: pincode,
          isDefault: true
        });
      } else {
        user.addresses[0] = {
          ...user.addresses[0],
          city: city,
          state: state,
          pincode: pincode
        };
      }
    }
    
    await user.save();

    console.log(`✅ KYC submitted for user: ${user.email}, status: pending, submitted at: ${user.kycSubmittedAt}`);

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

// @route POST /api/auth/delete-account
// @desc Delete user account (user-initiated)
// @access Private
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    
    console.log('🗑️ Delete account requested for user:', userId);

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
      console.log('🌾 Deleted crop listings for farmer');
    }

    // Delete user's orders
    await Order.deleteMany({ $or: [{ buyerId: userId }, { farmerId: userId }] });
    console.log('📦 Deleted orders');

    // Delete user's reviews
    await Review.deleteMany({ $or: [{ reviewerId: userId }, { revieweeId: userId }] });
    console.log('⭐ Deleted reviews');

    // Delete wishlist items
    await Wishlist.deleteMany({ userId: userId });
    console.log('❤️ Deleted wishlist items');

    // Delete notifications
    await Notification.deleteMany({ userId: userId });
    console.log('🔔 Deleted notifications');

    // Delete user
    await User.findByIdAndDelete(userId);
    console.log(`✅ User deleted: ${userEmail}`);

    res.status(200).json({
      success: true,
      message: 'Your account has been permanently deleted. All associated data has been removed.'
    });
  } catch (error) {
    console.error('❌ Account deletion error:', error);
    next(error);
  }
};
