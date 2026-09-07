import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import type { Request, Response, NextFunction } from 'express';
import Negotiation from '../models/Negotiation.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { sendError } from '../utils/apiResponse.js';
import { notifyNegotiationUpdate, notifyOrderUpdate } from '../socket/eventHandlers.js';
import { NegotiationStatus, OrderStatus, PaymentMethod, PaymentStatus, CropAvailability, CancelledBy, InterestedBuyerStatus, ListingApprovalStatus } from '../types/enums.js';
import type { MakeOfferDto, RespondOfferDto } from '../types/index.js';

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

      if (!cropId || !offeredPrice || !quantity) {
        throw { status: 400, message: 'Crop ID, offered price, and quantity are required.' };
      }

      const crop = await CropListing.findById(cropId).session(session);
      if (!crop) throw { status: 404, message: 'Crop not found' };
      if (crop.listingApprovalStatus !== ListingApprovalStatus.Approved) throw { status: 400, message: 'Crop is pending admin approval' };
      if (crop.availability !== CropAvailability.Available) throw { status: 400, message: 'Crop is no longer available' };
      if (crop.quantity < quantity) throw { status: 400, message: `Insufficient quantity. Available: ${crop.quantity}` };

      const interestEntry = crop.interestedBuyers.find((ib) => ib.buyerId.toString() === buyerId.toString());
      if (!interestEntry) {
        crop.interestedBuyers.push({
          buyerId,
          status: InterestedBuyerStatus.Interested,
          interestedAt: new Date(),
        });
        await crop.save({ session });
      }

      const existing = await Negotiation.findOne({ cropId, buyerId, status: NegotiationStatus.Pending }).session(session);
      if (existing) {
        throw { status: 400, message: 'You already have a pending offer for this crop. Wait for the farmer to respond.' };
      }

      const [negotiation] = await Negotiation.create([{
        cropId,
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

    res.status(201).json({ message: 'Offer submitted successfully' });
  } catch (error: any) {
    if (error.status) sendError(res, error.message, error.status);
    else next(error);
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
        throw { status: 400, message: 'Invalid action. Must be accept, reject, or counter.' };
      }

      const negotiation = await Negotiation.findById(id).session(session);
      if (!negotiation) throw { status: 404, message: 'Negotiation not found' };

      const isFarmer = negotiation.farmerId.toString() === userId;
      const isBuyer = negotiation.buyerId.toString() === userId;

      if (!isFarmer && !isBuyer) throw { status: 403, message: 'Not authorized' };
      if (negotiation.status === NegotiationStatus.Accepted || negotiation.status === NegotiationStatus.Rejected) {
        throw { status: 400, message: `Negotiation is already ${negotiation.status}` };
      }

      // Turn enforcement:
      // When Pending, offer was created by buyer -> only farmer can respond
      if (negotiation.status === NegotiationStatus.Pending) {
        if (!isFarmer) {
          throw { status: 403, message: "It is the farmer's turn to respond to this offer." };
        }
      } else if (negotiation.status === NegotiationStatus.CounterOffered) {
        // When CounterOffered, cannot respond to your own counter offer
        const lastActor = negotiation.lastActionBy
          ? negotiation.lastActionBy.toString()
          : (isFarmer ? negotiation.farmerId.toString() : '');
        if (lastActor && lastActor === userId) {
          throw { status: 403, message: 'You cannot respond to your own counter offer. Wait for the other party to respond.' };
        }
      }

      const crop = await CropListing.findById(negotiation.cropId).session(session);
      if (!crop) throw { status: 404, message: 'Crop not found' };

      if (action === 'reject') {
        negotiation.status = NegotiationStatus.Rejected;
        negotiation.lastActionBy = req.user!._id;
        negotiation.timeline.push({ status: NegotiationStatus.Rejected, message: message || 'Offer rejected', timestamp: new Date() });
        await negotiation.save({ session });
        responseData = { message: 'Offer rejected' };
        
      } else if (action === 'counter') {
        if (!offeredPrice || offeredPrice <= 0) throw { status: 400, message: 'Counter offer requires a valid positive offeredPrice' };
        negotiation.status = NegotiationStatus.CounterOffered;
        negotiation.offeredPrice = offeredPrice;
        negotiation.lastActionBy = req.user!._id;
        negotiation.timeline.push({ status: NegotiationStatus.CounterOffered, offeredPrice, message: message || 'Counter offer made', timestamp: new Date() });
        await negotiation.save({ session });
        responseData = { message: 'Counter offer sent' };

      } else if (action === 'accept') {
        if (crop.quantity < negotiation.quantity) {
          throw { status: 400, message: 'Insufficient stock to accept this offer' };
        }

        negotiation.status = NegotiationStatus.Accepted;
        negotiation.lastActionBy = req.user!._id;
        negotiation.timeline.push({ status: NegotiationStatus.Accepted, message: message || 'Offer accepted', timestamp: new Date() });
        
        const totalAmount = negotiation.offeredPrice * negotiation.quantity;

        const [order] = await Order.create([{
          orderNumber: 'ORD-' + randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase(),
          buyerId: negotiation.buyerId,
          farmerId: negotiation.farmerId,
          cropId: crop._id,
          cropName: crop.cropName,
          quantity: negotiation.quantity,
          unitPrice: negotiation.offeredPrice,
          totalAmount,
          originalAmount: totalAmount,
          pickupLocation: crop.pickupLocation,
          farmerContact: crop.contactNumber,
          buyerContact: '', 
          paymentMethod: PaymentMethod.Cod, 
          paymentStatus: PaymentStatus.Pending,
          orderStatus: OrderStatus.Confirmed,
          timeline: [{ event: 'ORDER_CONFIRMED', description: 'Offer accepted. Order confirmed.', timestamp: new Date() }],
        }], { session });

        negotiation.orderId = order._id as mongoose.Types.ObjectId;
        await negotiation.save({ session });

        const updatedCrop = await CropListing.findOneAndUpdate(
          { _id: crop._id, quantity: { $gte: negotiation.quantity } },
          {
            $inc: { quantity: -negotiation.quantity, sold: negotiation.quantity },
            $set: { 'interestedBuyers.$[elem].status': InterestedBuyerStatus.Ordered, 'interestedBuyers.$[elem].orderId': order._id },
          },
          { arrayFilters: [{ 'elem.buyerId': negotiation.buyerId }], new: true, session },
        );

        if (!updatedCrop) throw { status: 400, message: 'Failed to deduct stock.' };
        if (updatedCrop.quantity <= 0) {
          await CropListing.findByIdAndUpdate(crop._id, { availability: CropAvailability.NotAvailable }, { session });
        }
        
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
  } catch (error: any) {
    if (error.status) sendError(res, error.message, error.status);
    else next(error);
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
