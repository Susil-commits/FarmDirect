import Review from '../models/Review.js';
import CropListing from '../models/CropListing.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';

// Add review for crop
export const addReview = asyncHandler(async (req, res) => {
  const { cropId, rating, comment } = req.body;
  const userId = req.user._id;
  
  // Validate rating
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }
  
  // Check if crop exists
  const crop = await CropListing.findById(cropId);
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }
  
  // Check if user has purchased this crop
  const order = await Order.findOne({
    buyerId: userId,
    'items.cropId': cropId,
    orderStatus: 'delivered'
  });
  
  if (!order) {
    return res.status(400).json({
      success: false,
      message: 'You can only review crops you have purchased'
    });
  }
  
  // Check if review already exists
  const existingReview = await Review.findOne({
    cropId,
    userId
  });
  
  if (existingReview) {
    // Update existing review
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.updatedAt = new Date();
    await existingReview.save();
    
    // Recalculate crop rating
    await updateCropRating(cropId);
    
    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: existingReview
    });
  }
  
  // Create new review
  const review = await Review.create({
    cropId,
    userId,
    rating,
    comment
  });
  
  // Update crop rating
  await updateCropRating(cropId);
  
  // Update user rating if farming
  const user = await User.findById(userId);
  if (user.role === 'farmer') {
    await updateFarmerRating(userId);
  }
  
  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: review
  });
});

// Get reviews for crop
export const getReviews = asyncHandler(async (req, res) => {
  const { cropId } = req.params;
  const { page = 1, limit = 10, sortBy = 'newest' } = req.query;
  
  const crop = await CropListing.findById(cropId);
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }
  
  const skip = (page - 1) * limit;
  
  let sortOption = {};
  if (sortBy === 'newest') {
    sortOption = { createdAt: -1 };
  } else if (sortBy === 'highest') {
    sortOption = { rating: -1 };
  } else if (sortBy === 'lowest') {
    sortOption = { rating: 1 };
  }
  
  const reviews = await Review.find({ cropId })
    .populate('userId', 'firstName lastName profilePicture')
    .skip(skip)
    .limit(parseInt(limit))
    .sort(sortOption);
  
  const total = await Review.countDocuments({ cropId });
  
  res.status(200).json({
    success: true,
    data: reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Delete review
export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;
  
  const review = await Review.findById(reviewId);
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }
  
  if (review.userId.toString() !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review'
    });
  }
  
  const cropId = review.cropId;
  await Review.findByIdAndDelete(reviewId);
  
  // Update crop rating
  await updateCropRating(cropId);
  
  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// Get farmer reviews
export const getFarmerReviews = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const skip = (page - 1) * limit;
  
  // Get all crops by farmer
  const crops = await CropListing.find({ farmerId });
  const cropIds = crops.map(crop => crop._id);
  
  // Get reviews for these crops
  const reviews = await Review.find({ cropId: { $in: cropIds } })
    .populate('userId', 'firstName lastName profilePicture')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await Review.countDocuments({ cropId: { $in: cropIds } });
  
  res.status(200).json({
    success: true,
    data: reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Helper function to update crop rating
const updateCropRating = async (cropId) => {
  const reviews = await Review.find({ cropId });
  
  if (reviews.length === 0) {
    await CropListing.findByIdAndUpdate(
      cropId,
      { rating: 0, totalReviews: 0 }
    );
    return;
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = (totalRating / reviews.length).toFixed(2);
  
  await CropListing.findByIdAndUpdate(
    cropId,
    { rating: parseFloat(averageRating), totalReviews: reviews.length }
  );
};

// Helper function to update farmer rating
const updateFarmerRating = async (farmerId) => {
  const crops = await CropListing.find({ farmerId });
  const cropIds = crops.map(crop => crop._id);
  
  if (cropIds.length === 0) {
    await User.findByIdAndUpdate(
      farmerId,
      { rating: 0, totalReviews: 0 }
    );
    return;
  }
  
  const reviews = await Review.find({ cropId: { $in: cropIds } });
  
  if (reviews.length === 0) {
    await User.findByIdAndUpdate(
      farmerId,
      { rating: 0, totalReviews: 0 }
    );
    return;
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = (totalRating / reviews.length).toFixed(2);
  
  await User.findByIdAndUpdate(
    farmerId,
    { rating: parseFloat(averageRating), totalReviews: reviews.length }
  );
};

// Report review (abuse reporting)
export const reportReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { reason, description } = req.body;
  
  const review = await Review.findById(reviewId);
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }
  
  // Add report to review (optional: create a separate Report collection)
  review.reports = review.reports || [];
  review.reports.push({
    reportedBy: req.user._id,
    reason,
    description,
    reportedAt: new Date()
  });
  
  await review.save();
  
  res.status(200).json({
    success: true,
    message: 'Review reported successfully'
  });
});
