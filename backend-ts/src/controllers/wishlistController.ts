import Wishlist from '../models/Wishlist.js';
import CropListing from '../models/CropListing.js';
import { sendError } from '../utils/apiResponse.js';
import type { Request, Response, NextFunction } from 'express';

export async function addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cropId } = req.body as { cropId: string };
    const crop = await CropListing.findById(cropId);
    if (!crop) { sendError(res, 'Crop not found', 404); return; }

    const exists = await Wishlist.findOne({ userId: req.user!._id, cropId });
    if (exists) { sendError(res, 'Crop already in wishlist', 400); return; }

    const wishlistItem = await Wishlist.create({ userId: req.user!._id, cropId });
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
    const result = await Wishlist.findOneAndDelete({ userId: req.user!._id, cropId: req.params.cropId });
    if (!result) { sendError(res, 'Wishlist item not found', 404); return; }
    res.status(200).json({ message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
}

export async function checkWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inWishlist = await Wishlist.findOne({ userId: req.user!._id, cropId: req.params.cropId });
    res.status(200).json({ inWishlist: !!inWishlist });
  } catch (error) {
    next(error);
  }
}
