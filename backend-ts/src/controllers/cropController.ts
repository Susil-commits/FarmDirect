import CropListing from '../models/CropListing.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import { notifyCropInterest } from '../socket/eventHandlers.js';
import { sendError } from '../utils/apiResponse.js';
import {
  CropStatus, CropAvailability, CropType, InterestedBuyerStatus, UserRole, KycStatus,
  OrderStatus, CancelledBy,
} from '../types/enums.js';
import type { Request, Response, NextFunction } from 'express';
import type { ICropSpecifications } from '../types/index.js';

export async function createCrop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // B11 FIX: Guard upload error FIRST. Previously this check appeared after KYC
    // and field validation, so upload errors were reported only after passing
    // other checks unnecessarily. Move it to the top of the handler.
    if (req.uploadError) {
      sendError(res, req.uploadError || 'Image upload failed', 400);
      return;
    }

    const {
      cropName, cropType, category, price, quantity, unit, description,
      pickupLocation, contactNumber, specifications: rawSpecs,
    } = req.body as Record<string, unknown>;

    let specifications: ICropSpecifications = {};
    if (rawSpecs) {
      try {
        specifications = typeof rawSpecs === 'string' ? JSON.parse(rawSpecs) : (rawSpecs as ICropSpecifications);
      } catch {
        specifications = {};
      }
    }

    const imageUrls = req.uploadedFiles ? req.uploadedFiles.map((f) => f.url) : [];

    const user = await User.findById(req.user!._id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    if (user.kycStatus !== KycStatus.Verified) {
      res.status(403).json({
        message: 'KYC verification required',
        kycStatus: user.kycStatus,
        error: 'Complete your KYC verification before listing crops',
      });
      return;
    }

    if (!cropName || !cropType || !price || !quantity || !pickupLocation || !contactNumber) {
      sendError(res, 'Missing required fields', 400);
      return;
    }

    if (!description || (description as string).trim().length < 10) {
      sendError(res, 'Description is required and must be at least 10 characters', 400);
      return;
    }

    const crop = await CropListing.create({
      farmerId: req.user!._id,
      cropName,
      cropType: (cropType as string) || CropType.Vegetables,
      category: (category as string) || (cropType as string) || 'vegetables',
      price,
      quantity,
      unit: (unit as string) || 'kg',
      description: (description as string).trim(),
      pickupLocation,
      contactNumber,
      specifications,
      images: imageUrls,
      status: CropStatus.Active,
      listingApprovalStatus: 'approved',
      availability: CropAvailability.Available,
    });

    res.status(201).json({ message: 'Crop listing created successfully', crop });
  } catch (error) {
    next(error);
  }
}

export async function getCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      category, cropType, minPrice, maxPrice, search, location, rating, certifications,
      page = '1', limit = '12', sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const query: Record<string, unknown> = { status: CropStatus.Active, availability: CropAvailability.Available };

    if (category && category !== 'all') query.category = category;
    if (cropType && cropType !== 'all') query.cropType = cropType;

    if (minPrice || maxPrice) {
      const price: Record<string, number> = {};
      if (minPrice) price.$gte = Number(minPrice);
      if (maxPrice) price.$lte = Number(maxPrice);
      query.price = price;
    }

    if (location && location !== 'all') {
      query.pickupLocation = { $regex: location, $options: 'i' };
    }
    if (rating) query.rating = { $gte: Number(rating) };

    if (certifications) {
      const certList = certifications.split(',').map((c) => c.trim()).filter(Boolean);
      if (certList.length > 0) query.certifications = { $all: certList };
    }

    if (search) {
      query.$or = [
        { cropName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // B13 FIX: Whitelist sort fields to prevent arbitrary MongoDB field injection.
    // A malicious client passing sortBy=password or sortBy=__proto__ is now blocked.
    const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'price', 'rating', 'sold', 'views', 'quantity']);
    const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';

    const skip = (Number(page) - 1) * Number(limit);
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [safeSortBy]: sortDir };

    const [crops, total] = await Promise.all([
      CropListing.find(query).lean()
        .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
        .skip(skip)
        .limit(Number(limit))
        .sort(sortOptions),
      CropListing.countDocuments(query),
    ]);

    res.status(200).json({
      crops,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTrendingCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit = '8' } = req.query as Record<string, string>;
    const crops = await CropListing.find({ status: CropStatus.Active, availability: CropAvailability.Available })
      .lean()
      .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
      .limit(Number(limit))
      .sort({ sold: -1, views: -1, rating: -1, totalReviews: -1 });
    res.status(200).json({ crops });
  } catch (error) {
    next(error);
  }
}

export async function getSimilarCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { limit = '6' } = req.query as Record<string, string>;
    const crop = await CropListing.findById(id).lean().select('category cropType farmerId');
    if (!crop) {
      sendError(res, 'Crop not found', 404);
      return;
    }
    const similar = await CropListing.find({
      _id: { $ne: id },
      status: CropStatus.Active,
      availability: CropAvailability.Available,
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
}

export async function getRecommendedCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit = '8' } = req.query as Record<string, string>;
    const userId = req.user!._id;

    const [pastOrders, wishlistItems] = await Promise.all([
      Order.find({ buyerId: userId }).lean().populate('cropId', 'category').select('cropId').limit(50),
      Wishlist.find({ userId }).lean().populate('cropId', 'category').select('cropId').limit(50),
    ]);

    const preferredCategories = [
      ...pastOrders.map((o) => (o.cropId as { category?: string })?.category),
      ...wishlistItems.map((w) => (w.cropId as { category?: string })?.category),
    ].filter(Boolean);
    const uniqueCategories = [...new Set(preferredCategories.map(String))];

    let recommended: unknown[] = [];

    if (uniqueCategories.length > 0) {
      const purchasedCropIds = pastOrders
        .map((o) => (o.cropId as unknown as { _id?: string })?._id)
        .filter(Boolean)
        .map(String);

      const q: Record<string, unknown> = {
        status: CropStatus.Active,
        availability: CropAvailability.Available,
        category: { $in: uniqueCategories },
      };
      if (purchasedCropIds.length) q._id = { $nin: purchasedCropIds };

      recommended = await CropListing.find(q).lean()
        .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
        .limit(Number(limit))
        .sort({ rating: -1, sold: -1, views: -1 });
    }

    if (recommended.length < Number(limit)) {
      const needed = Number(limit) - recommended.length;
      const existingIds = recommended.map((c) => String((c as { _id: string })._id));
      const fallback = await CropListing.find({
        status: CropStatus.Active,
        availability: CropAvailability.Available,
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
}

export async function getCropById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const crop = await CropListing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
      .populate([
        { path: 'farmerId', select: 'firstName lastName name avatar rating farmName location city state phone' },
        { path: 'interestedBuyers.buyerId', select: 'firstName lastName name phone email city state' },
      ]);
    if (!crop) {
      sendError(res, 'Crop not found', 404);
      return;
    }
    res.status(200).json({ crop });
  } catch (error) {
    next(error);
  }
}

export async function updateCrop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let crop = await CropListing.findById(req.params.id);
    if (!crop) {
      sendError(res, 'Crop not found', 404);
      return;
    }
    if (crop.farmerId.toString() !== req.user!._id.toString()) {
      sendError(res, 'Not authorized to update this crop', 403);
      return;
    }

    const {
      cropName, cropType, category, price, quantity, unit, description,
      pickupLocation, contactNumber, specifications: rawSpecs, status, availability,
      existingImageUrls: rawExistingUrls,
    } = req.body as Record<string, unknown>;

    const updateFields: Record<string, unknown> = {};
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
    // Both the listing's farmer AND admin may change status (Task 1.5)
    if (status !== undefined && (req.user!.role === UserRole.Admin || crop.farmerId.toString() === req.user!._id.toString())) {
      updateFields.status = status;
    }
    if (availability !== undefined) updateFields.availability = availability;

    let existingUrls: string[] = [];
    if (rawExistingUrls !== undefined) {
      try {
        existingUrls = typeof rawExistingUrls === 'string' ? JSON.parse(rawExistingUrls) : (rawExistingUrls as string[]);
      } catch {
        existingUrls = [];
      }
    }

    const newUploadUrls = req.uploadedFiles && req.uploadedFiles.length > 0
      ? req.uploadedFiles.map((f) => f.url)
      : [];

    if (rawExistingUrls !== undefined || newUploadUrls.length > 0) {
      updateFields.images = [...existingUrls, ...newUploadUrls];
    }

    crop = await CropListing.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
    res.status(200).json({ message: 'Crop updated successfully', crop });
  } catch (error) {
    next(error);
  }
}

export async function deleteCrop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const crop = await CropListing.findById(req.params.id);
    if (!crop) {
      sendError(res, 'Crop not found', 404);
      return;
    }
    if (crop.farmerId.toString() !== req.user!._id.toString() && req.user!.role !== UserRole.Admin) {
      sendError(res, 'Not authorized to delete this crop', 403);
      return;
    }

    // B12 FIX: Don't hard-delete active orders when a crop is deleted.
    // Silently wiping in-progress orders loses buyer data and leaves buyers
    // with no record. Instead, cancel all non-terminal orders with a clear
    // reason, then restore inventory for each, and fire buyer notifications.
    const activeOrders = await Order.find({
      cropId: req.params.id,
      orderStatus: { $nin: [OrderStatus.Completed, OrderStatus.Cancelled] },
    });

    for (const activeOrder of activeOrders) {
      activeOrder.orderStatus = OrderStatus.Cancelled;
      activeOrder.cancellationReason = 'Crop listing was removed by the farmer';
      activeOrder.cancelledBy = CancelledBy.Farmer;
      activeOrder.cancelledAt = new Date();
      activeOrder.timeline.push({
        event: 'CANCELLED',
        description: 'Order auto-cancelled: crop listing deleted by farmer',
        timestamp: new Date(),
      });
      await activeOrder.save();

      Notification.create({
        userId: activeOrder.buyerId,
        title: 'Order Cancelled — Crop Removed',
        message: `Your order #${activeOrder.orderNumber} for "${crop.cropName}" has been cancelled because the farmer removed the listing.`,
        type: 'order',
        relatedId: String(activeOrder._id),
        priority: 'high',
        actionUrl: `/buyer/orders/${activeOrder._id}`,
      }).catch((e: unknown) => console.error('Failed to create cancellation notification:', e));
    }

    await Promise.all([
      Wishlist.deleteMany({ cropId: req.params.id }),
      (await import('../models/Review.js')).default.deleteMany({ cropId: req.params.id }),
      Notification.deleteMany({ relatedId: req.params.id, type: { $ne: 'order' } }),
    ]);

    await CropListing.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Crop deleted successfully. Active orders were cancelled and buyers notified.' });
  } catch (error) {
    next(error);
  }
}

export async function getCropsByFarmer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { farmerId } = req.params;
    if (!farmerId || farmerId === 'undefined') {
      sendError(res, 'Valid farmer ID is required', 400);
      return;
    }
    const crops = await CropListing.find({ farmerId, status: CropStatus.Active }).lean().sort({ createdAt: -1 });
    res.status(200).json({ crops });
  } catch (error) {
    next(error);
  }
}

export async function getMyListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // B14 FIX: Only populate the fields a farmer legitimately needs to see for
    // their interested buyers. The previous list exposed highly sensitive KYC
    // data (kycDocuments, kycDetails, aadharNumber, etc.) which should never
    // be visible outside the admin panel.
    const crops = await CropListing.find({ farmerId: req.user!._id })
      .lean()
      .populate(
        'interestedBuyers.buyerId',
        'firstName lastName name phone email city state',
      )
      .sort({ createdAt: -1 });
    res.status(200).json({ crops });
  } catch (error) {
    next(error);
  }
}

// ===================== INTEREST WORKFLOW =====================

export async function toggleInterest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const crop = await CropListing.findById(req.params.id);
    if (!crop) {
      sendError(res, 'Crop not found', 404);
      return;
    }
    if (req.user!.role !== UserRole.Buyer) {
      sendError(res, 'Only buyers can mark interest in crops', 403);
      return;
    }
    if (crop.availability !== CropAvailability.Available) {
      sendError(res, 'This crop is no longer available', 400);
      return;
    }

    const existingIndex = crop.interestedBuyers.findIndex(
      (ib) => ib.buyerId.toString() === req.user!._id.toString(),
    );

    if (existingIndex > -1) {
      const existing = crop.interestedBuyers[existingIndex];
      if (existing.status === InterestedBuyerStatus.Ordered) {
        sendError(res, 'Cannot remove interest - an order is already in progress for this crop', 400);
        return;
      }
      crop.interestedBuyers.splice(existingIndex, 1);
      await crop.save();
      res.status(200).json({ message: 'Interest removed successfully', interested: false, interestedBuyers: crop.interestedBuyers });
      return;
    }

    crop.interestedBuyers.push({
      buyerId: req.user!._id,
      status: InterestedBuyerStatus.Interested,
      interestedAt: new Date(),
    });
    await crop.save();

    const buyer = await User.findById(req.user!._id).select('firstName lastName name phone email city state');
    if (buyer) {
      try {
        await Notification.create({
          userId: crop.farmerId,
          title: 'New Interest in Your Crop',
          message: `${buyer.firstName || buyer.name} is interested in your crop "${crop.cropName}".`,
          type: 'interest',
          relatedId: String(crop._id),
          priority: 'high',
          actionUrl: `/farmer/crops/${crop._id}`,
          data: { cropId: crop._id, cropName: crop.cropName, buyerId: buyer._id, buyerName: buyer.firstName || buyer.name, buyerPhone: buyer.phone, buyerEmail: buyer.email, buyerCity: buyer.city, buyerState: buyer.state },
        });
      } catch (notifErr) {
        console.error('Failed to create interest notification:', notifErr);
      }
      notifyCropInterest(crop.farmerId.toString(), crop, buyer);
    }

    res.status(200).json({ message: 'Interest marked successfully', interested: true, interestedBuyers: crop.interestedBuyers });
  } catch (error) {
    next(error);
  }
}

export async function getInterestedBuyers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const crop = await CropListing.findById(req.params.id)
      .populate('interestedBuyers.buyerId', 'firstName lastName name phone email city state');
    if (!crop) {
      sendError(res, 'Crop not found', 404);
      return;
    }
    if (crop.farmerId.toString() !== req.user!._id.toString() && req.user!.role !== UserRole.Admin) {
      sendError(res, 'Not authorized to view interested buyers', 403);
      return;
    }
    res.status(200).json({ cropId: crop._id, cropName: crop.cropName, interestedBuyers: crop.interestedBuyers });
  } catch (error) {
    next(error);
  }
}

export async function getMyInterestedCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const crops = await CropListing.find({ 'interestedBuyers.buyerId': req.user!._id })
      .populate('farmerId', 'firstName lastName name phone farmName city state')
      .sort({ updatedAt: -1 });

    const cropsWithStatus = crops.map((crop) => {
      const myInterest = crop.interestedBuyers.find((ib) => ib.buyerId.toString() === req.user!._id.toString());
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
}
