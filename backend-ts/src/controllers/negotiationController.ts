import mongoose from 'mongoose';
import type { Request, Response, NextFunction } from 'express';
import Negotiation from '../models/Negotiation.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { notifyNegotiationUpdate, notifyOrderUpdate } from '../socket/eventHandlers.js';
import { NegotiationStatus, OrderStatus, PaymentMethod, PaymentStatus, CropAvailability, CancelledBy, InterestedBuyerStatus, ListingApprovalStatus } from '../types/enums.js';
import type { MakeOfferDto, RespondOfferDto } from '../types/index.js';
import { getNegotiationCopilotGuidance } from '../services/negotiationCopilotService.js';
import { createOrderInSession } from '../services/orderService.js';
import { ApiError, CropNotFoundError, CropUnavailableError, ListingPendingApprovalError, InsufficientStockError } from '../utils/apiError.js';

export async function makeOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await mongoose.startSession();
  try {
    let negotiationId: mongoose.Types.ObjectId | undefined;
    let farmerIdStr = '';
    let cropName = '';
    let notifPayload: any = null;

    await session.withTransaction(async () => {
      const { cropId, offeredPrice, quantity, message } = req.body as MakeOfferDto;
      const buyerId = req.user!._id;

      if (!cropId || typeof cropId !== 'string' || !mongoose.isValidObjectId(cropId) || !offeredPrice || !quantity) {
        throw ApiError.badRequest('Valid Crop ID, offered price, and quantity are required.');
      }
      const safeCropId = new mongoose.Types.ObjectId(cropId);

      const crop = await CropListing.findById(safeCropId).session(session);
      if (!crop) throw new CropNotFoundError('Crop not found');
      if (crop.listingApprovalStatus !== ListingApprovalStatus.Approved) throw new ListingPendingApprovalError('Crop is pending admin approval');
      if (crop.availability !== CropAvailability.Available) throw new CropUnavailableError('Crop is no longer available');
      if (crop.quantity < quantity) throw new InsufficientStockError(`Insufficient quantity. Available: ${crop.quantity}`);

      const interestEntry = crop.interestedBuyers.find((ib) => ib.buyerId.toString() === buyerId.toString());
      if (!interestEntry) {
        crop.interestedBuyers.push({
          buyerId,
          status: InterestedBuyerStatus.Interested,
          interestedAt: new Date(),
        });
        await crop.save({ session });
      }

      const existing = await Negotiation.findOne({ cropId: safeCropId, buyerId, status: NegotiationStatus.Pending }).session(session);
      if (existing) {
        throw ApiError.badRequest('You already have a pending offer for this crop. Wait for the farmer to respond.');
      }

      const [negotiation] = await Negotiation.create([{
        cropId: safeCropId,
        buyerId,
        farmerId: crop.farmerId,
        originalPrice: crop.price,
        offeredPrice,
        quantity,
        status: NegotiationStatus.Pending,
        lastActionBy: buyerId,
        timeline: [{
          status: NegotiationStatus.Pending,
          offeredPrice,
          message: message || 'New offer placed',
          timestamp: new Date(),
        }],
      }], { session });

      negotiationId = negotiation._id as mongoose.Types.ObjectId;
      farmerIdStr = crop.farmerId.toString();
      cropName = crop.cropName;

      notifPayload = {
        userId: crop.farmerId,
        title: 'New Offer Received',
        message: `You received an offer of ₹${offeredPrice} for ${quantity} ${crop.unit} of ${crop.cropName}.`,
        type: 'order',
        relatedId: String(negotiation._id),
        priority: 'high',
        actionUrl: `/farmer/negotiations`,
      };
    });

    if (notifPayload) {
      await Notification.create([notifPayload]).catch((err) => console.error('Failed to create offer notification:', err));
    }

    if (negotiationId) {
      notifyNegotiationUpdate(
        negotiationId.toString(),
        farmerIdStr,
        req.user!._id.toString(),
        'negotiation:new',
        { status: NegotiationStatus.Pending, cropName },
      );
    }

    res.status(201).json({ success: true, message: 'Offer submitted successfully' });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

export async function respondToOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await mongoose.startSession();
  try {
    let responseData: any;
    let orderToNotify: any = null;
    let notifPayload: any = null;
    let socketNegData: any = null;

    await session.withTransaction(async () => {
      const { id } = req.params;
      const { action, offeredPrice, message } = req.body as RespondOfferDto;
      const userId = req.user!._id.toString();

      if (!action || !['accept', 'reject', 'counter'].includes(action)) {
        throw ApiError.badRequest('Invalid action. Must be accept, reject, or counter.');
      }

      const negotiation = await Negotiation.findById(id).session(session);
      if (!negotiation) throw new ApiError(404, 'Negotiation not found', { code: 'NOT_FOUND' });

      const isFarmer = negotiation.farmerId.toString() === userId;
      const isBuyer = negotiation.buyerId.toString() === userId;

      if (!isFarmer && !isBuyer) throw ApiError.forbidden('Not authorized');
      if (negotiation.status === NegotiationStatus.Accepted || negotiation.status === NegotiationStatus.Rejected) {
        throw ApiError.badRequest(`Negotiation is already ${negotiation.status}`);
      }

      // Turn enforcement:
      // When Pending, offer was created by buyer -> only farmer can respond
      if (negotiation.status === NegotiationStatus.Pending) {
        if (!isFarmer) {
          throw ApiError.forbidden("It is the farmer's turn to respond to this offer.");
        }
      } else if (negotiation.status === NegotiationStatus.CounterOffered) {
        // When CounterOffered, cannot respond to your own counter offer
        const lastActor = negotiation.lastActionBy
          ? negotiation.lastActionBy.toString()
          : (isFarmer ? negotiation.farmerId.toString() : '');
        if (lastActor && lastActor === userId) {
          throw ApiError.forbidden('You cannot respond to your own counter offer. Wait for the other party to respond.');
        }
      }

      const crop = await CropListing.findById(negotiation.cropId).session(session);
      if (!crop) throw new CropNotFoundError('Crop not found');

      if (action === 'reject') {
        negotiation.status = NegotiationStatus.Rejected;
        negotiation.lastActionBy = req.user!._id;
        negotiation.timeline.push({ status: NegotiationStatus.Rejected, message: message || 'Offer rejected', timestamp: new Date() });
        await negotiation.save({ session });
        responseData = { message: 'Offer rejected' };
        
      } else if (action === 'counter') {
        if (!offeredPrice || offeredPrice <= 0) throw ApiError.badRequest('Counter offer requires a valid positive offeredPrice');
        negotiation.status = NegotiationStatus.CounterOffered;
        negotiation.offeredPrice = offeredPrice;
        negotiation.lastActionBy = req.user!._id;
        negotiation.timeline.push({ status: NegotiationStatus.CounterOffered, offeredPrice, message: message || 'Counter offer made', timestamp: new Date() });
        await negotiation.save({ session });
        responseData = { message: 'Counter offer sent' };

      } else if (action === 'accept') {
        if (crop.quantity < negotiation.quantity) {
          throw new InsufficientStockError('Insufficient stock to accept this offer');
        }

        negotiation.status = NegotiationStatus.Accepted;
        negotiation.lastActionBy = req.user!._id;
        negotiation.timeline.push({ status: NegotiationStatus.Accepted, message: message || 'Offer accepted', timestamp: new Date() });
        
        const { order } = await createOrderInSession(
          {
            buyerId: negotiation.buyerId,
            cropId: crop._id,
            quantity: negotiation.quantity,
            customUnitPrice: negotiation.offeredPrice,
            paymentMethod: PaymentMethod.Cod,
            timelineEvent: {
              event: 'ORDER_CONFIRMED',
              description: 'Offer accepted. Order confirmed.',
            },
          },
          session,
        );

        negotiation.orderId = order._id as mongoose.Types.ObjectId;
        await negotiation.save({ session });

        orderToNotify = order;
        responseData = { message: 'Offer accepted and order created', orderId: order._id };
      }

      notifPayload = {
        userId: isFarmer ? negotiation.buyerId : negotiation.farmerId,
        title: `Negotiation ${action === 'accept' ? 'Accepted' : action === 'reject' ? 'Rejected' : 'Countered'}`,
        message: `Your negotiation for ${crop.cropName} was ${action}ed.`,
        type: 'order',
        relatedId: String(negotiation._id),
        priority: 'high',
      };

      socketNegData = {
        id: negotiation._id.toString(),
        farmerId: negotiation.farmerId.toString(),
        buyerId: negotiation.buyerId.toString(),
        status: negotiation.status,
        action,
      };
    });

    if (notifPayload) {
      await Notification.create([notifPayload]).catch((err) => console.error('Failed to create response notification:', err));
    }

    if (orderToNotify) {
      notifyOrderUpdate(orderToNotify, 'order:created');
    }
    
    if (socketNegData) {
      notifyNegotiationUpdate(
        socketNegData.id,
        socketNegData.farmerId,
        socketNegData.buyerId,
        'negotiation:updated',
        { status: socketNegData.status, action: socketNegData.action },
      );
    }

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

export async function getNegotiations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const role = req.user!.role;
    
    const query = role === 'farmer' ? { farmerId: userId } : { buyerId: userId };
    
    const negotiations = await Negotiation.find(query)
      .populate('cropId', 'cropName images price unit availability')
      .populate('buyerId', 'firstName lastName name avatar')
      .populate('farmerId', 'firstName lastName farmName avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({ negotiations });
  } catch (error) {
    next(error);
  }
}

export async function getCopilotGuidance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cropId, cropName, offeredPrice, quantity, role } = req.query as Record<string, string>;
    const userRole = (role as 'buyer' | 'farmer') || (req.user?.role === 'farmer' ? 'farmer' : 'buyer');

    const guidance = await getNegotiationCopilotGuidance({
      cropId,
      cropName,
      offeredPrice: offeredPrice ? parseFloat(offeredPrice) : undefined,
      quantity: quantity ? parseFloat(quantity) : undefined,
      role: userRole,
    });

    if (!guidance) {
      sendError(res, 'Crop details not found for negotiation guidance', 404);
      return;
    }

    sendSuccess(res, { data: guidance });
  } catch (error) {
    next(error);
  }
}
