import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import type { Request, Response, NextFunction } from 'express';
import Negotiation from '../models/Negotiation.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { sendError } from '../utils/apiResponse.js';
import { notifyNegotiationUpdate, notifyOrderUpdate } from '../socket/eventHandlers.js';
import { NegotiationStatus, OrderStatus, PaymentMethod, PaymentStatus, CropAvailability, CancelledBy, InterestedBuyerStatus } from '../types/enums.js';
import type { MakeOfferDto, RespondOfferDto } from '../types/index.js';

export async function makeOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await mongoose.startSession();
  try {
    let negotiationId: mongoose.Types.ObjectId | undefined;
    let farmerIdStr = '';
    let cropName = '';

    await session.withTransaction(async () => {
      const { cropId, offeredPrice, quantity, message } = req.body as MakeOfferDto;
      const buyerId = req.user!._id;

      if (!cropId || !offeredPrice || !quantity) {
        throw { status: 400, message: 'Crop ID, offered price, and quantity are required.' };
      }

      const crop = await CropListing.findById(cropId).session(session);
      if (!crop) throw { status: 404, message: 'Crop not found' };
      if (crop.availability !== CropAvailability.Available) throw { status: 400, message: 'Crop is no longer available' };
      if (crop.quantity < quantity) throw { status: 400, message: `Insufficient quantity. Available: ${crop.quantity}` };

      // Ensure buyer has interest
      const interestEntry = crop.interestedBuyers.find((ib) => ib.buyerId.toString() === buyerId.toString());
      if (!interestEntry) {
        crop.interestedBuyers.push({
          buyerId,
          status: InterestedBuyerStatus.Interested,
          interestedAt: new Date()
        });
        await crop.save({ session });
      }

      // Check if a pending negotiation already exists for this buyer & crop
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
        timeline: [{
          status: NegotiationStatus.Pending,
          offeredPrice,
          message: message || 'New offer placed',
          timestamp: new Date()
        }]
      }], { session });

      negotiationId = negotiation._id as mongoose.Types.ObjectId;
      farmerIdStr = crop.farmerId.toString();
      cropName = crop.cropName;

      await Notification.create([{
        userId: crop.farmerId,
        title: 'New Offer Received',
        message: `You received an offer of ₹${offeredPrice} for ${quantity} ${crop.unit} of ${crop.cropName}.`,
        type: 'order',
        relatedId: String(negotiation._id),
        priority: 'high',
        actionUrl: `/farmer/negotiations`
      }], { session });
    });

    if (negotiationId) {
      notifyNegotiationUpdate(
        negotiationId.toString(),
        farmerIdStr,
        req.user!._id.toString(),
        'negotiation:new',
        { status: NegotiationStatus.Pending, cropName }
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

    await session.withTransaction(async () => {
      const { id } = req.params;
      const { action, offeredPrice, message } = req.body as RespondOfferDto;
      const userId = req.user!._id.toString();

      const negotiation = await Negotiation.findById(id).session(session);
      if (!negotiation) throw { status: 404, message: 'Negotiation not found' };

      const isFarmer = negotiation.farmerId.toString() === userId;
      const isBuyer = negotiation.buyerId.toString() === userId;

      if (!isFarmer && !isBuyer) throw { status: 403, message: 'Not authorized' };
      if (negotiation.status === NegotiationStatus.Accepted || negotiation.status === NegotiationStatus.Rejected) {
        throw { status: 400, message: `Negotiation is already ${negotiation.status}` };
      }

      const crop = await CropListing.findById(negotiation.cropId).session(session);
      if (!crop) throw { status: 404, message: 'Crop not found' };

      if (action === 'reject') {
        negotiation.status = NegotiationStatus.Rejected;
        negotiation.timeline.push({ status: NegotiationStatus.Rejected, message: message || 'Offer rejected', timestamp: new Date() });
        await negotiation.save({ session });
        responseData = { message: 'Offer rejected' };
        
      } else if (action === 'counter') {
        if (!offeredPrice) throw { status: 400, message: 'Counter offer requires an offeredPrice' };
        negotiation.status = NegotiationStatus.CounterOffered;
        negotiation.offeredPrice = offeredPrice;
        negotiation.timeline.push({ status: NegotiationStatus.CounterOffered, offeredPrice, message: message || 'Counter offer made', timestamp: new Date() });
        await negotiation.save({ session });
        responseData = { message: 'Counter offer sent' };

      } else if (action === 'accept') {
        if (crop.quantity < negotiation.quantity) {
          throw { status: 400, message: 'Insufficient stock to accept this offer' };
        }

        negotiation.status = NegotiationStatus.Accepted;
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
          buyerContact: '', // would need to populate buyer
          paymentMethod: PaymentMethod.Cod, // Default to COD for negotiated orders for simplicity
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

      await Notification.create([{
        userId: isFarmer ? negotiation.buyerId : negotiation.farmerId,
        title: `Negotiation ${action === 'accept' ? 'Accepted' : action === 'reject' ? 'Rejected' : 'Countered'}`,
        message: `Your negotiation for ${crop.cropName} was ${action}ed.`,
        type: 'order',
        relatedId: String(negotiation._id),
        priority: 'high',
      }], { session });
    });

    if (orderToNotify) {
      notifyOrderUpdate(orderToNotify, 'order:created');
    }
    
    // Notify about the negotiation update
    const neg = await Negotiation.findById(req.params.id);
    if (neg) {
      notifyNegotiationUpdate(
        neg._id.toString(),
        neg.farmerId.toString(),
        neg.buyerId.toString(),
        'negotiation:updated',
        { status: neg.status, action: req.body.action }
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
