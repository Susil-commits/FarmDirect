import Review from '../models/Review.js';
import CropListing from '../models/CropListing.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { OrderStatus, UserRole } from '../types/enums.js';
import type { Request, Response } from 'express';
import mongoose, { type Types } from 'mongoose';
import { parsePagination } from '../utils/pagination.js';
import { analyzeReviewContent, generateCropReviewSummary } from '../services/reviewAnalysisService.js';

async function updateCropRating(cropId: Types.ObjectId | string): Promise<void> {
  const targetCropId = typeof cropId === 'string' ? new mongoose.Types.ObjectId(cropId) : cropId;
  const result = await Review.aggregate([
    { $match: { cropId: targetCropId, isFlagged: { $ne: true } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = result[0] ?? {};
  await CropListing.findByIdAndUpdate(cropId, {
    rating: count > 0 ? parseFloat(avg.toFixed(2)) : 0,
    totalReviews: count,
  });
}

async function updateFarmerRating(farmerId: Types.ObjectId | string): Promise<void> {
  const targetFarmerId = typeof farmerId === 'string' ? new mongoose.Types.ObjectId(farmerId) : farmerId;
  const result = await Review.aggregate([
    {
      $lookup: {
        from: 'croplistings',
        localField: 'cropId',
        foreignField: '_id',
        as: 'crop',
        pipeline: [{ $match: { farmerId: targetFarmerId } }, { $project: { _id: 1 } }],
      },
    },
    { $match: { 'crop.0': { $exists: true }, isFlagged: { $ne: true } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = result[0] ?? {};
  await User.findByIdAndUpdate(farmerId, {
    rating: count > 0 ? parseFloat(avg.toFixed(2)) : 0,
    totalReviews: count,
  });
}

export const addReview = asyncHandler(async (req: Request, res: Response) => {
  const { rating, comment } = req.body as { rating: number | string; comment: string };
  const cropId = req.params.cropId || (req.body as any).cropId;
  const userId = req.user!._id;

  if (!cropId) return sendError(res, 'Crop ID is required', 400);
  const numRating = Number(rating);
  if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
    return sendError(res, 'Rating must be a number between 1 and 5', 400);
  }

  const crop = await CropListing.findById(cropId);
  if (!crop) return sendError(res, 'Crop not found', 404);

  const order = await Order.findOne({ buyerId: userId, cropId, orderStatus: OrderStatus.Completed });
  if (!order) return sendError(res, 'You can only review crops you have purchased and received', 400);

  const analysis = analyzeReviewContent(comment, numRating);

  const existingReview = await Review.findOne({ cropId, userId });
  if (existingReview) {
    existingReview.rating = numRating;
    existingReview.comment = comment;
    existingReview.sentimentScore = analysis.sentimentScore;
    existingReview.sentimentLabel = analysis.sentimentLabel;
    existingReview.isFlagged = analysis.isFlagged;
    existingReview.flagReason = analysis.flagReason;
    existingReview.isApproved = !analysis.isFlagged;
    await existingReview.save();

    await updateCropRating(cropId);
    await updateFarmerRating(crop.farmerId);
    generateCropReviewSummary(cropId).catch(() => {});

    return res.status(200).json({
      success: true,
      message: analysis.isFlagged
        ? 'Review submitted and flagged for moderator inspection.'
        : 'Review updated successfully',
      data: existingReview,
    });
  }

  const review = await Review.create({
    cropId,
    userId,
    rating: numRating,
    comment,
    sentimentScore: analysis.sentimentScore,
    sentimentLabel: analysis.sentimentLabel,
    isFlagged: analysis.isFlagged,
    flagReason: analysis.flagReason,
    isApproved: !analysis.isFlagged,
  });

  await updateCropRating(cropId);
  await updateFarmerRating(crop.farmerId);
  generateCropReviewSummary(cropId).catch(() => {});

  res.status(201).json({
    success: true,
    message: analysis.isFlagged
      ? 'Review submitted and pending moderator review.'
      : 'Review added successfully',
    data: review,
  });
});

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const { cropId } = req.params;
  const { sortBy = 'newest' } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });
  const crop = await CropListing.findById(cropId);
  if (!crop) return sendError(res, 'Crop not found', 404);

  let sortOption: Record<string, 1 | -1> = {};
  if (sortBy === 'newest') sortOption = { createdAt: -1 };
  else if (sortBy === 'highest') sortOption = { rating: -1 };
  else if (sortBy === 'lowest') sortOption = { rating: 1 };

  // Only return non-flagged approved reviews to regular users
  const filter: Record<string, unknown> = { cropId, isFlagged: { $ne: true } };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .lean()
      .populate('userId', 'firstName lastName profilePicture')
      .skip(skip)
      .limit(limit)
      .sort(sortOption),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    summary: crop.reviewSummary || null,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getCropReviewSummaryController = asyncHandler(async (req: Request, res: Response) => {
  const { cropId } = req.params;
  const summary = await generateCropReviewSummary(cropId);
  if (!summary) return sendError(res, 'Crop not found', 404);

  res.status(200).json({
    success: true,
    data: summary,
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

  const crop = await CropListing.findById(cropId).select('farmerId');
  await Review.findByIdAndDelete(reviewId);
  await updateCropRating(cropId);
  if (crop) await updateFarmerRating(crop.farmerId);
  generateCropReviewSummary(cropId, true).catch(() => {});
  res.status(200).json({ success: true, message: 'Review deleted successfully' });
});

export const getFarmerReviews = asyncHandler(async (req: Request, res: Response) => {
  const { farmerId } = req.params;
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });
  const crops = await CropListing.find({ farmerId }).lean();
  const cropIds = crops.map((crop) => crop._id);

  const filter = { cropId: { $in: cropIds }, isFlagged: { $ne: true } };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .lean()
      .populate('userId', 'firstName lastName profilePicture')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
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
