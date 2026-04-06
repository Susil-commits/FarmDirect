import Wishlist from '../models/Wishlist.js';
import CropListing from '../models/CropListing.js';

// @route POST /api/wishlist
// @desc Add crop to wishlist
// @access Private
export const addToWishlist = async (req, res, next) => {
  try {
    const { cropId } = req.body;

    // Check if crop exists
    const crop = await CropListing.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Check if already in wishlist
    const exists = await Wishlist.findOne({
      userId: req.user._id,
      cropId,
    });

    if (exists) {
      return res.status(400).json({ message: 'Crop already in wishlist' });
    }

    const wishlistItem = await Wishlist.create({
      userId: req.user._id,
      cropId,
    });

    res.status(201).json({
      message: 'Added to wishlist',
      wishlistItem,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/wishlist
// @desc Get user's wishlist
// @access Private
export const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.find({ userId: req.user._id })
      .populate('cropId')
      .sort({ addedAt: -1 });

    res.status(200).json({ wishlist });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/wishlist/:cropId
// @desc Remove crop from wishlist
// @access Private
export const removeFromWishlist = async (req, res, next) => {
  try {
    const result = await Wishlist.findOneAndDelete({
      userId: req.user._id,
      cropId: req.params.cropId,
    });

    if (!result) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    res.status(200).json({ message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/wishlist/check/:cropId
// @desc Check if crop is in wishlist
// @access Private
export const checkWishlist = async (req, res, next) => {
  try {
    const inWishlist = await Wishlist.findOne({
      userId: req.user._id,
      cropId: req.params.cropId,
    });

    res.status(200).json({ inWishlist: !!inWishlist });
  } catch (error) {
    next(error);
  }
};
