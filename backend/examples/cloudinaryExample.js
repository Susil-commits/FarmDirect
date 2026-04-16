/**
 * Example: How to use Cloudinary in your crop controller
 * This shows the pattern to follow for all file uploads
 */

import CropListing from '../models/CropListing.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';

// Example: Create Crop with Images
export const createCropWithImages = asyncHandler(async (req, res) => {
  const { cropName, category, price, description, quantity, unit } = req.body;
  const { uploadedFiles } = req; // From cloudinaryUpload middleware

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one crop image is required'
    });
  }

  // Extract image URLs from uploaded files
  const imageUrls = uploadedFiles.map(file => file.url);

  // Create crop with Cloudinary image URLs
  const crop = await CropListing.create({
    farmerId: req.user._id,
    cropName,
    category,
    price,
    description,
    quantity,
    unit,
    images: imageUrls, // Array of Cloudinary URLs
    // Store public IDs for later deletion if needed
    imagePublicIds: uploadedFiles.map(file => file.public_id)
  });

  res.status(201).json({
    success: true,
    message: 'Crop created successfully',
    data: crop
  });
});

// Example: Update Crop Images
export const updateCropImages = asyncHandler(async (req, res) => {
  const { cropId } = req.params;
  const { uploadedFiles } = req;

  const crop = await CropListing.findById(cropId);

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  // Delete old images from Cloudinary
  if (crop.imagePublicIds && crop.imagePublicIds.length > 0) {
    for (const publicId of crop.imagePublicIds) {
      await deleteFromCloudinary(publicId);
    }
  }

  // Update with new images
  const imageUrls = uploadedFiles.map(file => file.url);
  const imagePublicIds = uploadedFiles.map(file => file.public_id);

  crop.images = imageUrls;
  crop.imagePublicIds = imagePublicIds;
  await crop.save();

  res.status(200).json({
    success: true,
    message: 'Crop images updated successfully',
    data: crop
  });
});

// Example: Delete Crop (including images)
export const deleteCrop = asyncHandler(async (req, res) => {
  const { cropId } = req.params;

  const crop = await CropListing.findById(cropId);

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  // Delete all images from Cloudinary
  if (crop.imagePublicIds && crop.imagePublicIds.length > 0) {
    for (const publicId of crop.imagePublicIds) {
      await deleteFromCloudinary(publicId);
    }
  }

  // Delete crop from database
  await CropListing.findByIdAndDelete(cropId);

  res.status(200).json({
    success: true,
    message: 'Crop deleted successfully'
  });
});

export default {
  createCropWithImages,
  updateCropImages,
  deleteCrop
};
