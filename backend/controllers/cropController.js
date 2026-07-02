import CropListing from '../models/CropListing.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import { notifyCropInterest } from '../socket/eventHandlers.js';

// @route POST /api/crops
// @desc Create a new crop listing (Farmer only - KYC already verified)
// @access Private
export const createCrop = async (req, res, next) => {
  try {
    // When using multer (multipart/form-data), fields come from req.body
    // Images come from req.uploadedFiles (set by uploadCropImages middleware)
    const {
      cropName,
      cropType,
      category,
      price,
      quantity,
      unit,
      description,
      pickupLocation,
      contactNumber,
      specifications: rawSpecs,
    } = req.body;

    // Parse specifications if sent as JSON string (FormData sends strings)
    let specifications = {};
    if (rawSpecs) {
      try {
        specifications = typeof rawSpecs === 'string' ? JSON.parse(rawSpecs) : rawSpecs;
      } catch {
        specifications = {};
      }
    }

    // Extract image URLs from uploaded files
    const imageUrls = req.uploadedFiles
      ? req.uploadedFiles.map(f => f.url)
      : [];

    // Fetch user to validate farmer profile completeness
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate KYC verification (only gate - no additional checks needed)
    if (user.kycStatus !== 'verified') {
      return res.status(403).json({
        message: 'KYC verification required',
        kycStatus: user.kycStatus,
        error: 'Complete your KYC verification before listing crops',
      });
    }

    // Validate required fields
    if (!cropName || !cropType || !price || !quantity || !pickupLocation || !contactNumber) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'cropName, cropType, price, quantity, pickupLocation, and contactNumber are required',
      });
    }

    const crop = await CropListing.create({
      farmerId: req.user._id,
      cropName,
      cropType: cropType || 'vegetables',
      category: category || cropType || 'vegetables',
      price,
      quantity,
      unit: unit || 'kg',
      description: description || '',
      pickupLocation,
      contactNumber,
      specifications,
      images: imageUrls,
      status: 'active',
      listingApprovalStatus: 'approved',
      availability: 'available',
    });

    res.status(201).json({
      message: 'Crop listing created successfully',
      crop,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops
// @desc Get all available crops with filters
// @access Public
export const getCrops = async (req, res, next) => {
  try {
    const {
      category,
      cropType,
      minPrice,
      maxPrice,
      search,
      location,
      rating,
      certifications,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { status: 'active', availability: 'available' };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (cropType && cropType !== 'all') {
      query.cropType = cropType;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (location && location !== 'all') {
      query.pickupLocation = { $regex: location, $options: 'i' };
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    if (certifications) {
      // Accept comma-separated certifications; require all to be present
      const certList = certifications.split(',').map((c) => c.trim()).filter(Boolean);
      if (certList.length > 0) {
        query.certifications = { $all: certList };
      }
    }

    if (search) {
      query.$or = [
        { cropName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDir };

    const crops = await CropListing.find(query)
      .lean()
      .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
      .skip(skip)
      .limit(Number(limit))
      .sort(sortOptions);

    const total = await CropListing.countDocuments(query);

    res.status(200).json({
      crops,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops/trending
// @desc Get trending crops (by sold + views + rating)
// @access Public
export const getTrendingCrops = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;

    const crops = await CropListing.find({
      status: 'active',
      availability: 'available',
    })
      .lean()
      .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
      .limit(Number(limit))
      .sort({ sold: -1, views: -1, rating: -1, totalReviews: -1 });

    res.status(200).json({ crops });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops/:id/similar
// @desc Get crops similar to a given crop (same category, exclude self)
// @access Public
export const getSimilarCrops = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 6 } = req.query;

    const crop = await CropListing.findById(id).lean().select('category cropType farmerId');
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    const similar = await CropListing.find({
      _id: { $ne: id },
      status: 'active',
      availability: 'available',
      $or: [{ category: crop.category }, { cropType: crop.cropType }],
    })
      .lean()
      .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
      .limit(Number(limit))
      .sort({ rating: -1, sold: -1 });

    res.status(200).json({ crops: similar });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops/buyer/recommended
// @desc Get personalized recommendations for a buyer based on order history
//       + wishlist categories, falling back to trending.
// @access Private (buyer)
export const getRecommendedCrops = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;
    const userId = req.user._id;

    // 1. Gather categories the buyer has ordered or wishlisted
    const [pastOrders, wishlistItems] = await Promise.all([
      Order.find({ buyerId: userId })
        .lean()
        .populate('cropId', 'category')
        .select('cropId')
        .limit(50),
      Wishlist.find({ userId }).lean().populate('cropId', 'category').select('cropId').limit(50),
    ]);

    const preferredCategories = [
      ...pastOrders.map((o) => o.cropId?.category),
      ...wishlistItems.map((w) => w.cropId?.category),
    ].filter(Boolean);

    const uniqueCategories = [...new Set(preferredCategories.map(String))];

    let recommended = [];

    // 2. If we have preferences, find available crops in those categories the
    //    buyer hasn't already purchased
    if (uniqueCategories.length > 0) {
      const purchasedCropIds = pastOrders
        .map((o) => o.cropId?._id)
        .filter(Boolean)
        .map(String);

      const excludeIds = purchasedCropIds.length
        ? purchasedCropIds.map((id) => id)
        : [];

      const q = {
        status: 'active',
        availability: 'available',
        category: { $in: uniqueCategories },
      };
      if (excludeIds.length) {
        q._id = { $nin: excludeIds };
      }

      recommended = await CropListing.find(q)
        .lean()
        .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
        .limit(Number(limit))
        .sort({ rating: -1, sold: -1, views: -1 });
    }

    // 3. Fall back to trending if preferences yielded too few results
    if (recommended.length < Number(limit)) {
      const needed = Number(limit) - recommended.length;
      const existingIds = recommended.map((c) => String(c._id));
      const fallback = await CropListing.find({
        status: 'active',
        availability: 'available',
        _id: existingIds.length ? { $nin: existingIds } : { $exists: true },
      })
        .lean()
        .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
        .limit(needed)
        .sort({ sold: -1, views: -1, rating: -1 });

      recommended = [...recommended, ...fallback];
    }

    res.status(200).json({ crops: recommended });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops/:id
// @desc Get single crop details
// @access Public
export const getCropById = async (req, res, next) => {
  try {
    const crop = await CropListing.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate([
      { path: 'farmerId', select: 'firstName lastName name avatar rating farmName location city state phone' },
      { path: 'interestedBuyers.buyerId', select: 'firstName lastName name phone email city state' },
    ]);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    res.status(200).json({ crop });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/crops/:id
// @desc Update crop listing (Farmer only - owner)
// @access Private
export const updateCrop = async (req, res, next) => {
  try {
    let crop = await CropListing.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Check ownership
    if (crop.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this crop' });
    }

    // Update allowed fields (images come from req.uploadedFiles via multer middleware)
    const {
      cropName,
      cropType,
      category,
      price,
      quantity,
      unit,
      description,
      pickupLocation,
      contactNumber,
      specifications: rawSpecs,
      status,
      availability,
      existingImageUrls: rawExistingUrls,
    } = req.body;

    const updateFields = {};
    if (cropName !== undefined) updateFields.cropName = cropName;
    if (cropType !== undefined) updateFields.cropType = cropType;
    if (category !== undefined) updateFields.category = category;
    if (price !== undefined) updateFields.price = price;
    if (quantity !== undefined) updateFields.quantity = quantity;
    if (unit !== undefined) updateFields.unit = unit;
    if (description !== undefined) updateFields.description = description;
    if (pickupLocation !== undefined) updateFields.pickupLocation = pickupLocation;
    if (contactNumber !== undefined) updateFields.contactNumber = contactNumber;
    if (rawSpecs !== undefined) {
      try {
        updateFields.specifications = typeof rawSpecs === 'string' ? JSON.parse(rawSpecs) : rawSpecs;
      } catch {
        updateFields.specifications = {};
      }
    }
    if (status !== undefined && req.user.role === 'admin') updateFields.status = status;
    if (availability !== undefined) updateFields.availability = availability;

    // Handle image updates: merge existing kept URLs with new uploads
    // existingImageUrls: sent by frontend to indicate which existing images were kept
    // If not sent at all (legacy client), preserve behavior by not touching images
    let existingUrls = [];
    if (rawExistingUrls !== undefined) {
      try {
        existingUrls = typeof rawExistingUrls === 'string'
          ? JSON.parse(rawExistingUrls)
          : rawExistingUrls;
      } catch {
        existingUrls = [];
      }
    }

    const newUploadUrls = (req.uploadedFiles && req.uploadedFiles.length > 0)
      ? req.uploadedFiles.map(f => f.url)
      : [];

    // Only set images when either existingUrls was explicitly sent OR new uploads exist
    if (rawExistingUrls !== undefined || newUploadUrls.length > 0) {
      updateFields.images = [...existingUrls, ...newUploadUrls];
    }

    crop = await CropListing.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Crop updated successfully',
      crop,
    });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/crops/:id
// @desc Delete crop listing (Farmer only - owner) with cascade cleanup
// @access Private
export const deleteCrop = async (req, res, next) => {
  try {
    // Import models at the top for cascade (using dynamic import to avoid circular deps)
    const Order = (await import('../models/Order.js')).default;
    const Wishlist = (await import('../models/Wishlist.js')).default;
    const Review = (await import('../models/Review.js')).default;

    const crop = await CropListing.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Check ownership
    if (crop.farmerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this crop' });
    }

    // Cascade delete all related records to keep DB clean and marketplace in sync
    await Promise.all([
      Order.deleteMany({ cropId: req.params.id }),
      Wishlist.deleteMany({ cropId: req.params.id }),
      Review.deleteMany({ cropId: req.params.id }),
      Notification.deleteMany({ relatedId: req.params.id }),
    ]);

    await CropListing.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Crop deleted successfully. All related orders, wishlists, and reviews cleaned up.' });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops/farmer/:farmerId
// @desc Get all crops by a farmer
// @access Public
export const getCropsByFarmer = async (req, res, next) => {
  try {
    const { farmerId } = req.params;

    if (!farmerId || farmerId === 'undefined') {
      return res.status(400).json({ message: 'Valid farmer ID is required' });
    }

    const crops = await CropListing.find({
      farmerId,
      status: 'active',
    }).lean().sort({ createdAt: -1 });

    res.status(200).json({ crops });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops/my-listings
// @desc Get current farmer's own crop listings (including not available)
// @access Private (Farmer only)
export const getMyListings = async (req, res, next) => {
  try {
    const crops = await CropListing.find({ farmerId: req.user._id })
      .lean()
      .populate(
        'interestedBuyers.buyerId',
        'firstName lastName name phone email city state address pincode profilePicture bio kycStatus kycDocuments kycDetails kycVerifiedAt kycSubmittedAt verified emailVerified rating totalReviews createdAt'
      )
      .sort({ createdAt: -1 });

    res.status(200).json({ crops });
  } catch (error) {
    next(error);
  }
};

// ===================== INTEREST / UNINTEREST WORKFLOW =====================

// @route POST /api/crops/:id/interest
// @desc Mark interest in a crop (Buyer only)
// @access Private
export const toggleInterest = async (req, res, next) => {
  try {
    const crop = await CropListing.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Only buyers can mark interest
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can mark interest in crops' });
    }

    // Check if crop is available
    if (crop.availability !== 'available') {
      return res.status(400).json({ message: 'This crop is no longer available' });
    }

    // Check if buyer already marked interest
    const existingIndex = crop.interestedBuyers.findIndex(
      (ib) => ib.buyerId.toString() === req.user._id.toString()
    );

    if (existingIndex > -1) {
      // Toggle: if already interested, remove interest (uninterested)
      const existing = crop.interestedBuyers[existingIndex];

      if (existing.status === 'ordered') {
        return res.status(400).json({
          message: 'Cannot remove interest - an order is already in progress for this crop',
        });
      }

      crop.interestedBuyers.splice(existingIndex, 1);
      await crop.save();

      return res.status(200).json({
        message: 'Interest removed successfully',
        interested: false,
        interestedBuyers: crop.interestedBuyers,
      });
    }

    // Add new interest
    crop.interestedBuyers.push({
      buyerId: req.user._id,
      status: 'interested',
      interestedAt: new Date(),
    });

    await crop.save();

    // Populate buyer details for notification
    const buyer = await User.findById(req.user._id).select('firstName lastName name phone email city state');

    // Send notification to the farmer
    try {
      await Notification.create({
        userId: crop.farmerId,
        title: 'New Interest in Your Crop 🌾',
        message: `${buyer.firstName || buyer.name} is interested in your crop "${crop.cropName}". Contact them to finalize the order.`,
        type: 'interest',
        relatedId: crop._id,
        priority: 'high',
        actionUrl: `/farmer/crops/${crop._id}`,
        data: {
          cropId: crop._id,
          cropName: crop.cropName,
          buyerId: buyer._id,
          buyerName: buyer.firstName || buyer.name,
          buyerPhone: buyer.phone,
          buyerEmail: buyer.email,
          buyerCity: buyer.city,
          buyerState: buyer.state,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create interest notification:', notifErr);
    }

    notifyCropInterest(crop.farmerId, crop, buyer);

    res.status(200).json({
      message: 'Interest marked successfully',
      interested: true,
      interestedBuyers: crop.interestedBuyers,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops/:id/interested-buyers
// @desc Get list of interested buyers for a crop (Farmer only - owner)
// @access Private
export const getInterestedBuyers = async (req, res, next) => {
  try {
    const crop = await CropListing.findById(req.params.id)
      .populate('interestedBuyers.buyerId', 'firstName lastName name phone email city state');

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Only the farmer who owns this crop can see interested buyers
    if (crop.farmerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view interested buyers' });
    }

    res.status(200).json({
      cropId: crop._id,
      cropName: crop.cropName,
      interestedBuyers: crop.interestedBuyers,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops/buyer/interested
// @desc Get all crops the current buyer has marked as interested
// @access Private (Buyer only)
export const getMyInterestedCrops = async (req, res, next) => {
  try {
    const crops = await CropListing.find({
      'interestedBuyers.buyerId': req.user._id,
    })
      .populate('farmerId', 'firstName lastName name phone farmName city state')
      .sort({ updatedAt: -1 });

    // Add the buyer's interest status to each crop
    const cropsWithStatus = crops.map((crop) => {
      const myInterest = crop.interestedBuyers.find(
        (ib) => ib.buyerId.toString() === req.user._id.toString()
      );
      return {
        ...crop.toObject(),
        myInterestStatus: myInterest ? myInterest.status : null,
        myInterestedAt: myInterest ? myInterest.interestedAt : null,
        myOrderId: myInterest ? myInterest.orderId : null,
      };
    });

    res.status(200).json({ crops: cropsWithStatus });
  } catch (error) {
    next(error);
  }
};
