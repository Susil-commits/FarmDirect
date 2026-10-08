import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import CropListing from '../models/CropListing.js';
import { sendError } from '../utils/apiResponse.js';
import type { Request, Response, NextFunction } from 'express';

export async function addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cropId } = req.body as { cropId?: unknown };
    if (!cropId || typeof cropId !== 'string' || !mongoose.isValidObjectId(cropId)) {
      sendError(res, 'A valid cropId is required', 400);
      return;
    }
    const validCropId = new mongoose.Types.ObjectId(cropId);
    const crop = await CropListing.findById(validCropId);
    if (!crop) { sendError(res, 'Crop not found', 404); return; }

    const exists = await Wishlist.findOne({ userId: req.user!._id, cropId: validCropId });
    if (exists) { sendError(res, 'Crop already in wishlist', 400); return; }

    const wishlistItem = await Wishlist.create({ userId: req.user!._id, cropId: validCropId });
    res.status(201).json({ message: 'Added to wishlist', wishlistItem });
  } catch (error) {
    next(error);
  }
}

export async function getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wishlist = await Wishlist.find({ userId: req.user!._id }).lean().populate('cropId').sort({ addedAt: -1 });
    res.status(200).json({ wishlist });
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cropId } = req.params;
    if (!cropId || typeof cropId !== 'string' || !mongoose.isValidObjectId(cropId)) {
      sendError(res, 'Invalid cropId', 400);
      return;
    }
    const validCropId = new mongoose.Types.ObjectId(cropId);
    const result = await Wishlist.findOneAndDelete({ userId: req.user!._id, cropId: validCropId });
    if (!result) { sendError(res, 'Wishlist item not found', 404); return; }
    res.status(200).json({ message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
}

export async function checkWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cropId } = req.params;
    if (!cropId || typeof cropId !== 'string' || !mongoose.isValidObjectId(cropId)) {
      sendError(res, 'Invalid cropId', 400);
      return;
    }
    const validCropId = new mongoose.Types.ObjectId(cropId);
    const inWishlist = await Wishlist.findOne({ userId: req.user!._id, cropId: validCropId });
    res.status(200).json({ inWishlist: !!inWishlist });
  } catch (error) {
    next(error);
  }
}
