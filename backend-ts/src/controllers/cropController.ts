import CropListing from '../models/CropListing.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import { notifyCropInterest } from '../socket/eventHandlers.js';
import { sendError } from '../utils/apiResponse.js';
import {
  CropStatus, CropAvailability, CropType, CropCategory, InterestedBuyerStatus, UserRole, KycStatus,
  OrderStatus, CancelledBy, ListingApprovalStatus,
} from '../types/enums.js';
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import type { ICropSpecifications } from '../types/index.js';
import { getCache, setCache, clearPrefix } from '../utils/cache.js';
import { parsePagination } from '../utils/pagination.js';
import { capturePriceSnapshot } from '../services/priceSnapshotService.js';
import { searchCropsHybrid, syncCropEmbedding } from '../services/listingEmbeddingService.js';
import { getHybridRecommendations, getSimilarCropsVector } from '../services/recsysService.js';

export async function createCrop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    
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

    let bodyImages: string[] = [];
    if (req.body.images) {
      try {
        bodyImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : (Array.isArray(req.body.images) ? req.body.images : []);
      } catch {
        bodyImages = Array.isArray(req.body.images) ? req.body.images : [];
      }
    }
    const uploadedUrls = req.uploadedFiles ? req.uploadedFiles.map((f) => f.url) : [];
    const imageUrls = Array.from(new Set([...bodyImages, ...uploadedUrls]));

    if (!cropName || !cropType || !price || !quantity || !pickupLocation || !contactNumber) {
      sendError(res, 'Missing required fields', 400);
      return;
    }

    if (!description || (description as string).trim().length < 10) {
      sendError(res, 'Description is required and must be at least 10 characters', 400);
      return;
    }

    if (!category) {
      sendError(res, 'Category is required', 400);
      return;
    }

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

    const isAutoApproved = req.user?.role === UserRole.Admin;
    const listingApprovalStatus = isAutoApproved ? ListingApprovalStatus.Approved : ListingApprovalStatus.Pending;

    let aiReview: Record<string, unknown> | undefined = undefined;
    if (req.body.aiReview) {
      try {
        aiReview = typeof req.body.aiReview === 'string' ? JSON.parse(req.body.aiReview) : req.body.aiReview;
      } catch {
        aiReview = undefined;
      }
    }

    const crop = await CropListing.create({
      farmerId: req.user!._id,
      cropName,
      cropType: (cropType as string) || CropType.Vegetables,
      category: (category as string),
      price,
      quantity,
      unit: (unit as string) || 'kg',
      description: (description as string).trim(),
      pickupLocation,
      contactNumber,
      specifications,
      images: imageUrls,
      status: CropStatus.Active,
      listingApprovalStatus,
      availability: CropAvailability.Available,
      ...(aiReview ? { aiReview } : {}),
    });
    await clearPrefix('crops:');

    const region = user.city || user.state || crop.pickupLocation || 'Odisha';
    capturePriceSnapshot({
      cropId: crop._id,
      cropName: crop.cropName,
      category: crop.category,
      region,
      price: crop.price,
      unit: crop.unit,
      isOrganic: Boolean(crop.specifications?.organicCertified),
      source: 'listing_created',
      at: new Date(),
    }).catch(() => {});

    syncCropEmbedding(crop._id).catch(() => {});

    const message = isAutoApproved
      ? 'Crop listing created and approved successfully'
      : 'Crop listing created and submitted for admin approval';
    res.status(201).json({ message, crop });
  } catch (error) {
    next(error);
  }
}

export async function getCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sortedQuery = Object.keys(req.query).sort().reduce<Record<string, unknown>>((acc, k) => { acc[k] = req.query[k]; return acc; }, {});
    const cacheKey = `crops:${JSON.stringify(sortedQuery)}`;
    const cachedResponse = await getCache(cacheKey);
    if (cachedResponse) {
      res.status(200).json(cachedResponse);
      return;
    }

    const {
      category, cropType, minPrice, maxPrice, search, location, rating, certifications,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 12, maxLimit: 50 });

    const query: Record<string, unknown> = {
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
    };

    const safeCategory = typeof category === 'string' && category !== 'all'
      ? Object.values(CropCategory).find((c) => c.toLowerCase() === category.toLowerCase())
      : undefined;
    if (safeCategory) query.category = safeCategory;

    const safeCropType = typeof cropType === 'string' && cropType !== 'all'
      ? Object.values(CropType).find((t) => t.toLowerCase() === cropType.toLowerCase())
      : undefined;
    if (safeCropType) query.cropType = safeCropType;

    if (minPrice || maxPrice) {
      const price: Record<string, number> = {};
      const numMin = Number(minPrice);
      const numMax = Number(maxPrice);
      if (!Number.isNaN(numMin)) price.$gte = numMin;
      if (!Number.isNaN(numMax)) price.$lte = numMax;
      if (Object.keys(price).length > 0) query.price = price;
    }

    if (typeof location === 'string' && location.trim() && location.trim() !== 'all') {
      const cleanLoc = location.trim().replace(/[^a-zA-Z0-9\s,_-]/g, '').slice(0, 100);
      if (cleanLoc) query.pickupLocation = { $regex: cleanLoc, $options: 'i' };
    }
    if (rating && !Number.isNaN(Number(rating))) query.rating = { $gte: Number(rating) };

    if (certifications && typeof certifications === 'string') {
      const certList = certifications.split(',').map((c) => c.trim().replace(/[^a-zA-Z0-9\s_-]/g, '')).filter(Boolean);
      if (certList.length > 0) query.certifications = { $all: certList };
    }

    if (typeof search === 'string' && search.trim()) {
      const cleanSearch = search.trim().replace(/[^a-zA-Z0-9\s_-]/g, '').slice(0, 100);
      if (cleanSearch) {
        query.$or = [
          { cropName: { $regex: cleanSearch, $options: 'i' } },
          { description: { $regex: cleanSearch, $options: 'i' } },
          { category: { $regex: cleanSearch, $options: 'i' } },
        ];
      }
    }

    const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'price', 'rating', 'sold', 'views', 'quantity']);
    const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [safeSortBy]: sortDir };

    const safeQuery = mongoose.sanitizeFilter(query);

    const [crops, total] = await Promise.all([
      CropListing.find(safeQuery).lean()
        .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
        .skip(skip)
        .limit(limit)
        .sort(sortOptions),
      CropListing.countDocuments(safeQuery),
    ]);

    const responseData = {
      crops,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };

    await setCache(cacheKey, responseData, 60);

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
}

export async function getTrendingCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawLimit = parseInt(String(req.query.limit ?? '8'), 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 8 : Math.min(rawLimit, 30);
    const crops = await CropListing.find({
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
    })
      .lean()
      .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
      .limit(limit)
      .sort({ sold: -1, views: -1, rating: -1, totalReviews: -1 });
    res.status(200).json({ crops });
  } catch (error) {
    next(error);
  }
}

export async function getSimilarCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const rawLimit = parseInt(String(req.query.limit ?? '6'), 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 6 : Math.min(rawLimit, 30);

    // T3.5 Rank by embedding similarity with rating tiebreak
    let similar = await getSimilarCropsVector(id, limit);

    if (!similar || similar.length === 0) {
      const crop = await CropListing.findById(id).lean().select('category cropType farmerId');
      if (!crop) {
        sendError(res, 'Crop not found', 404);
        return;
      }
      similar = await CropListing.find({
        _id: { $ne: id },
        status: CropStatus.Active,
        availability: CropAvailability.Available,
        listingApprovalStatus: ListingApprovalStatus.Approved,
        $or: [{ category: crop.category }, { cropType: crop.cropType }],
      })
        .lean()
        .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
        .limit(limit)
        .sort({ rating: -1, sold: -1 });
    }

    res.status(200).json({ crops: similar });
  } catch (error) {
    next(error);
  }
}

export async function getRecommendedCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawLimit = parseInt(String(req.query.limit ?? '8'), 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 8 : Math.min(rawLimit, 30);
    const userId = req.user!._id;

    // T3.3 Hybrid Recommender (content similarity + co-occurrence + seasonal/regional boosts)
    const recommended = await getHybridRecommendations({
      userId,
      limit,
    });

    res.status(200).json({ crops: recommended });
  } catch (error) {
    next(error);
  }
}

/**
 * T3.2 Semantic + Multilingual Hybrid Search (RRF)
 */
export async function searchCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, query, category, region, minPrice, maxPrice, isOrganic, page, limit } = req.query;
    const rawLimit = parseInt(String(limit ?? '12'), 10);
    const safeLimit = isNaN(rawLimit) || rawLimit < 1 ? 12 : Math.min(rawLimit, 50);
    const rawPage = parseInt(String(page ?? '1'), 10);
    const safePage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const result = await searchCropsHybrid({
      query: String(q || query || ''),
      category: category ? String(category) : undefined,
      region: region ? String(region) : undefined,
      minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
      isOrganic: isOrganic !== undefined ? String(isOrganic) === 'true' : undefined,
      page: safePage,
      limit: safeLimit,
    });

    res.status(200).json({
      ...result,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total,
        limit: safeLimit,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCropById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const crop = await CropListing.findById(req.params.id)
      .populate([
        { path: 'farmerId', select: 'firstName lastName name avatar rating farmName location city state phone' },
        { path: 'interestedBuyers.buyerId', select: 'firstName lastName name phone email city state' },
      ]);
    if (!crop) {
      sendError(res, 'Crop not found', 404);
      return;
    }

    if (crop.listingApprovalStatus !== ListingApprovalStatus.Approved) {
      const farmerIdStr = ((crop.farmerId as any)?._id || crop.farmerId)?.toString();
      const isOwner = Boolean(req.user && farmerIdStr === req.user._id.toString());
      const isAdmin = Boolean(req.user && req.user.role === UserRole.Admin);
      if (!isOwner && !isAdmin) {
        sendError(res, 'Crop listing is pending approval', 404);
        return;
      }
    }

    await CropListing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    crop.views = (crop.views || 0) + 1;

    res.status(200).json({ crop });
  } catch (error) {
    next(error);
  }
}

export async function updateCrop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      sendError(res, 'Valid crop ID is required', 400);
      return;
    }
    const safeCropId = new mongoose.Types.ObjectId(id);
    let crop = await CropListing.findById(safeCropId);
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

    // C3: If an approved listing changes price, description, images or specs, reset listingApprovalStatus to Pending
    const isApproved = crop.listingApprovalStatus === ListingApprovalStatus.Approved;
    const priceChanged = price !== undefined && Number(price) !== crop.price;
    const descChanged = description !== undefined && String(description).trim() !== String(crop.description || '').trim();
    const imagesChanged = newUploadUrls.length > 0 || (rawExistingUrls !== undefined && JSON.stringify(updateFields.images) !== JSON.stringify(crop.images || []));
    const specsChanged = rawSpecs !== undefined && JSON.stringify(updateFields.specifications) !== JSON.stringify(crop.specifications || {});

    if (isApproved && (priceChanged || descChanged || imagesChanged || specsChanged)) {
      updateFields.listingApprovalStatus = ListingApprovalStatus.Pending;
    }

    // C3: Use $inc for restocking instead of overwriting quantity
    const incFields: Record<string, number> = {};
    const { restockQuantity } = req.body as { restockQuantity?: number };
    if (restockQuantity !== undefined && !isNaN(Number(restockQuantity))) {
      const delta = Number(restockQuantity);
      if (delta !== 0) incFields.quantity = delta;
    } else if (quantity !== undefined && !isNaN(Number(quantity))) {
      const delta = Number(quantity) - crop.quantity;
      if (delta !== 0) incFields.quantity = delta;
    }

    const updateQuery: Record<string, unknown> = {};
    if (Object.keys(updateFields).length > 0) updateQuery.$set = updateFields;
    if (Object.keys(incFields).length > 0) updateQuery.$inc = incFields;

    const previousPrice = crop.price;
    crop = await CropListing.findByIdAndUpdate(safeCropId, updateQuery, { new: true, runValidators: true });
    await clearPrefix('crops:');

    if (crop && price !== undefined && Number(price) !== previousPrice) {
      const region = crop.pickupLocation || 'Odisha';
      capturePriceSnapshot({
        cropId: crop._id,
        cropName: crop.cropName,
        category: crop.category,
        region,
        price: crop.price,
        unit: crop.unit,
        isOrganic: Boolean(crop.specifications?.organicCertified),
        source: 'price_updated',
        at: new Date(),
      }).catch(() => {});
    }

    if (crop) {
      syncCropEmbedding(crop._id).catch(() => {});
    }

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

    const activeOrders = await Order.find({
      cropId: req.params.id,
      orderStatus: { $nin: [OrderStatus.Completed, OrderStatus.Cancelled] },
    });

    if (activeOrders.length > 0) {
      const session = await (await import('mongoose')).default.startSession();
      try {
        await session.withTransaction(async () => {
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
            await activeOrder.save({ session });
          }
        });
      } finally {
        await session.endSession();
      }

      // Notify buyers outside the transaction (best-effort)
      for (const activeOrder of activeOrders) {
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
    }

    await Promise.all([
      Wishlist.deleteMany({ cropId: req.params.id }),
      (await import('../models/Review.js')).default.deleteMany({ cropId: req.params.id }),
      Notification.deleteMany({ relatedId: req.params.id, type: { $ne: 'order' } }),
    ]);

    await CropListing.findByIdAndDelete(req.params.id);
    await clearPrefix('crops:');
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
    const crops = await CropListing.find({
      farmerId,
      status: CropStatus.Active,
      listingApprovalStatus: ListingApprovalStatus.Approved,
    }).lean().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ crops });
  } catch (error) {
    next(error);
  }
}

export async function getMyListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    
    const crops = await CropListing.find({ farmerId: req.user!._id })
      .lean()
      .populate(
        'interestedBuyers.buyerId',
        'firstName lastName name phone email city state',
      )
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ crops });
  } catch (error) {
    next(error);
  }
}

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
    if (crop.listingApprovalStatus !== ListingApprovalStatus.Approved) {
      sendError(res, 'Crop listing is pending admin approval', 400);
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
      .lean()
      .populate('farmerId', 'firstName lastName name phone farmName city state')
      .sort({ updatedAt: -1 })
      .limit(100);

    const cropsWithStatus = crops.map((crop) => {
      const myInterest = crop.interestedBuyers.find((ib) => ib.buyerId.toString() === req.user!._id.toString());
      return {
        ...crop, // already a plain object from .lean()
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

export async function uploadImagesHandler(req: Request, res: Response): Promise<void> {
  if (req.uploadError) {
    sendError(res, req.uploadError || 'Image upload failed', 400);
    return;
  }
  const imageUrls = req.uploadedFiles ? req.uploadedFiles.map((f) => f.url) : [];
  res.status(200).json({
    success: true,
    message: 'Images uploaded successfully',
    data: { images: imageUrls },
    images: imageUrls,
  });
}
