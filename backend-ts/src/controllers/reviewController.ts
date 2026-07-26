import Review from '../models/Review.js';
import CropListing from '../models/CropListing.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { OrderStatus, UserRole } from '../types/enums.js';
import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

async function updateCropRating(cropId: Types.ObjectId | string): Promise<void> {
  const reviews = await Review.find({ cropId });
  if (reviews.length === 0) {
    await CropListing.findByIdAndUpdate(cropId, { rating: 0, totalReviews: 0 });
    return;
  }
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = (totalRating / reviews.length).toFixed(2);
  await CropListing.findByIdAndUpdate(cropId, { rating: parseFloat(averageRating), totalReviews: reviews.length });
}

async function updateFarmerRating(farmerId: Types.ObjectId | string): Promise<void> {
  const crops = await CropListing.find({ farmerId });
  const cropIds = crops.map((crop) => crop._id);
  if (cropIds.length === 0) {
    await User.findByIdAndUpdate(farmerId, { rating: 0, totalReviews: 0 });
    return;
  }
  const reviews = await Review.find({ cropId: { $in: cropIds } });
  if (reviews.length === 0) {
    await User.findByIdAndUpdate(farmerId, { rating: 0, totalReviews: 0 });
    return;
  }
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = (totalRating / reviews.length).toFixed(2);
  await User.findByIdAndUpdate(farmerId, { rating: parseFloat(averageRating), totalReviews: reviews.length });
}

export const addReview = asyncHandler(async (req: Request, res: Response) => {
  const { cropId, rating, comment } = req.body as { cropId: string; rating: number; comment: string };
  const userId = req.user!._id;

  if (rating < 1 || rating > 5) return sendError(res, 'Rating must be between 1 and 5', 400);

  const crop = await CropListing.findById(cropId);
  if (!crop) return sendError(res, 'Crop not found', 404);

  const order = await Order.findOne({ buyerId: userId, cropId, orderStatus: OrderStatus.Completed });
  if (!order) return sendError(res, 'You can only review crops you have purchased', 400);

  const existingReview = await Review.findOne({ cropId, userId });
  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
    await existingReview.save();
    await updateCropRating(cropId);
    // B1 FIX: Also re-calculate the farmer's aggregate rating after an edit
    await updateFarmerRating(crop.farmerId);
    return res.status(200).json({ success: true, message: 'Review updated successfully', data: existingReview });
  }

  const review = await Review.create({ cropId, userId, rating, comment });
  await updateCropRating(cropId);

  // Update the FARMER's aggregate rating (crop.farmerId), not the reviewer's (Task 3.8 fix)
  await updateFarmerRating(crop.farmerId);

  res.status(201).json({ success: true, message: 'Review added successfully', data: review });
});

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const { cropId } = req.params;
  const { page = '1', limit = '10', sortBy = 'newest' } = req.query as Record<string, string>;
  const crop = await CropListing.findById(cropId);
  if (!crop) return sendError(res, 'Crop not found', 404);

  const skip = (Number(page) - 1) * Number(limit);
  let sortOption: Record<string, 1 | -1> = {};
  if (sortBy === 'newest') sortOption = { createdAt: -1 };
  else if (sortBy === 'highest') sortOption = { rating: -1 };
  else if (sortBy === 'lowest') sortOption = { rating: 1 };

  const [reviews, total] = await Promise.all([
    Review.find({ cropId }).lean().populate('userId', 'firstName lastName profilePicture').skip(skip).limit(Number(limit)).sort(sortOption),
    Review.countDocuments({ cropId }),
  ]);

  res.status(200).json({
    success: true, data: reviews,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const userId = req.user!._id;
  const review = await Review.findById(reviewId);
  if (!review) return sendError(res, 'Review not found', 404);
  if (review.userId.toString() !== userId.toString() && req.user!.role !== UserRole.Admin) {
    return sendError(res, 'Not authorized to delete this review', 403);
  }
  const cropId = review.cropId;
  // B2 FIX: Load the crop so we can update the farmer's aggregate rating after deletion
  const crop = await CropListing.findById(cropId).select('farmerId');
  await Review.findByIdAndDelete(reviewId);
  await updateCropRating(cropId);
  // Re-calculate the farmer's rating now that the review is gone
  if (crop) await updateFarmerRating(crop.farmerId);
  res.status(200).json({ success: true, message: 'Review deleted successfully' });
});

export const getFarmerReviews = asyncHandler(async (req: Request, res: Response) => {
  const { farmerId } = req.params;
  const { page = '1', limit = '10' } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);
  const crops = await CropListing.find({ farmerId }).lean();
  const cropIds = crops.map((crop) => crop._id);

  const [reviews, total] = await Promise.all([
    Review.find({ cropId: { $in: cropIds } }).lean().populate('userId', 'firstName lastName profilePicture').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Review.countDocuments({ cropId: { $in: cropIds } }),
  ]);

  res.status(200).json({
    success: true, data: reviews,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
});

export const reportReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { reason, description } = req.body as { reason: string; description: string };
  const review = await Review.findById(reviewId);
  if (!review) return sendError(res, 'Review not found', 404);
  review.reports = review.reports || [];
  review.reports.push({ reportedBy: req.user!._id, reason: reason as never, description, reportedAt: new Date() });
  await review.save();
  res.status(200).json({ success: true, message: 'Review reported successfully' });
});
