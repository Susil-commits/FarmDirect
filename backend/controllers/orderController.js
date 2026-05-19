import Order from '../models/Order.js';
import CropListing from '../models/CropListing.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @route POST /api/orders/start
// @desc Farmer starts an order for an interested buyer
// @access Private (Farmer only)
export const startOrder = async (req, res, next) => {
  try {
    const { cropId, buyerId } = req.body;

    if (!cropId || !buyerId) {
      return res.status(400).json({ message: 'Crop ID and Buyer ID are required' });
    }

    const crop = await CropListing.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Verify the requesting user is the farmer who owns this crop
    if (crop.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the crop owner can start an order' });
    }

    if (crop.availability !== 'available') {
      return res.status(400).json({ message: 'This crop is no longer available' });
    }

    // Check if buyer has marked interest
    const interestEntry = crop.interestedBuyers.find(
      (ib) => ib.buyerId.toString() === buyerId && ib.status === 'interested'
    );

    if (!interestEntry) {
      return res.status(400).json({
        message: 'This buyer has not marked interest in this crop',
      });
    }

    // Check if an order already exists for this buyer-crop combination
    const existingOrder = await Order.findOne({
      cropId,
      buyerId,
      orderStatus: { $nin: ['cancelled', 'completed'] },
    });
    if (existingOrder) {
      return res.status(400).json({
        message: 'An active order already exists for this buyer and crop',
      });
    }

    const buyer = await User.findById(buyerId).select('firstName lastName name phone email city state');
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    const orderQty = 1; // Default quantity, farmer and buyer negotiate actual quantity
    const totalAmount = crop.price * orderQty;

    const order = await Order.create({
      orderNumber: 'ORD-' + Date.now(),
      buyerId,
      farmerId: req.user._id,
      cropId: crop._id,
      cropName: crop.cropName,
      quantity: orderQty,
      unitPrice: crop.price,
      totalAmount,
      pickupLocation: crop.pickupLocation,
      farmerContact: crop.contactNumber,
      buyerContact: buyer.phone || '',
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      orderStatus: 'confirmed',
      timeline: [
        {
          event: 'ORDER_STARTED',
          description: 'Farmer has started the order. Preparing to begin.',
          timestamp: new Date(),
        },
      ],
    });

    // Update crop: mark interest as ordered
    await CropListing.findByIdAndUpdate(cropId, {
      $set: {
        'interestedBuyers.$[elem].status': 'ordered',
        'interestedBuyers.$[elem].orderId': order._id,
      },
    }, {
      arrayFilters: [{ 'elem.buyerId': buyerId }],
    });

    // Notify buyer that farmer has started the order
    try {
      await Notification.create({
        userId: buyerId,
        title: 'Order Started by Farmer 📦',
        message: `Farmer has started order #${order.orderNumber} for "${crop.cropName}". Track your order now!`,
        type: 'order',
        relatedId: order._id,
        priority: 'high',
        actionUrl: `/buyer/orders/${order._id}`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          cropName: crop.cropName,
          farmerId: req.user._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create start order notification:', notifErr);
    }

    res.status(201).json({
      message: 'Order started successfully! Buyer has been notified.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders
// @desc Create a new order from interested crop (Buyer only - after farmer confirms)
// @access Private
export const createOrder = async (req, res, next) => {
  try {
    const { cropId, quantity } = req.body;

    if (!cropId) {
      return res.status(400).json({ message: 'Crop ID is required' });
    }

    const crop = await CropListing.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    if (crop.availability !== 'available') {
      return res.status(400).json({ message: 'This crop is no longer available' });
    }

    if (crop.quantity < (quantity || 1)) {
      return res.status(400).json({ message: `Insufficient quantity. Available: ${crop.quantity} ${crop.unit}` });
    }

    // Check if buyer has marked interest
    const interestEntry = crop.interestedBuyers.find(
      (ib) => ib.buyerId.toString() === req.user._id.toString()
    );

    if (!interestEntry) {
      return res.status(400).json({
        message: 'You must mark interest in this crop before placing an order',
      });
    }

    const orderQty = quantity || 1;
    const totalAmount = crop.price * orderQty;

    const order = await Order.create({
      orderNumber: 'ORD-' + Date.now(),
      buyerId: req.user._id,
      farmerId: crop.farmerId,
      cropId: crop._id,
      cropName: crop.cropName,
      quantity: orderQty,
      unitPrice: crop.price,
      totalAmount,
      pickupLocation: crop.pickupLocation,
      farmerContact: crop.contactNumber,
      buyerContact: req.user.phone || '',
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      orderStatus: 'confirmed',
      timeline: [
        {
          event: 'ORDER_CONFIRMED',
          description: 'Order confirmed. Farmer will prepare your order.',
          timestamp: new Date(),
        },
      ],
    });

    // Update crop: reduce quantity, mark interest as ordered
    await CropListing.findByIdAndUpdate(cropId, {
      $inc: { quantity: -orderQty, sold: orderQty },
      $set: {
        'interestedBuyers.$[elem].status': 'ordered',
        'interestedBuyers.$[elem].orderId': order._id,
      },
    }, {
      arrayFilters: [{ 'elem.buyerId': req.user._id }],
    });

    // If quantity becomes 0, mark as not available
    if (crop.quantity - orderQty <= 0) {
      await CropListing.findByIdAndUpdate(cropId, { availability: 'not_available' });
    }

    // Notify farmer about new order
    try {
      await Notification.create({
        userId: crop.farmerId,
        title: 'New Order Received 📦',
        message: `Order #${order.orderNumber} for "${crop.cropName}" (${orderQty} ${crop.unit}). Start preparing!`,
        type: 'order',
        relatedId: order._id,
        priority: 'high',
        actionUrl: `/farmer/orders/${order._id}`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          cropName: crop.cropName,
          quantity: orderQty,
          totalAmount,
          buyerId: req.user._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create order notification:', notifErr);
    }

    res.status(201).json({
      message: 'Order placed successfully! Farmer will start preparing your order.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders
// @desc Get orders (filtered by role)
// @access Private
export const getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = {};

    // Filter based on user role
    if (req.user.role === 'farmer') {
      query.farmerId = req.user._id;
    } else if (req.user.role === 'buyer') {
      query.buyerId = req.user._id;
    }
    // Admin sees all orders (no filter)

    if (status) {
      query.orderStatus = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query).lean()
      .populate('cropId', 'cropName images price unit')
      .populate('buyerId', 'firstName lastName name phone email city state')
      .populate('farmerId', 'firstName lastName name phone farmName city state')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.status(200).json({
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/:id
// @desc Get single order details
// @access Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean()
      .populate('cropId')
      .populate('buyerId', 'firstName lastName name phone email city state avatar')
      .populate('farmerId', 'firstName lastName name phone farmName city state avatar');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const isBuyer = order.buyerId._id.toString() === req.user._id.toString();
    const isFarmer = order.farmerId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isFarmer && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/orders/:id/status
// @desc Update order status (Farmer only - manages preparation/delivery flow)
// @access Private
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only farmer (or admin) can update order status
    if (
      order.farmerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Only the farmer can update order status' });
    }

    // Validate status transitions
    const validTransitions = {
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['picked_up', 'cancelled'],
      picked_up: ['completed'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.orderStatus]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from "${order.orderStatus}" to "${status}"`,
      });
    }

    const statusDescriptions = {
      preparing: 'Farmer has started preparing your order',
      ready_for_pickup: 'Order is ready for pickup',
      picked_up: 'Order has been picked up',
      completed: 'Order completed successfully',
      cancelled: 'Order has been cancelled',
    };

    order.orderStatus = status;
    order.timeline.push({
      event: status.toUpperCase(),
      description: statusDescriptions[status] || `Order status updated to ${status}`,
      timestamp: new Date(),
    });

    if (status === 'completed') {
      order.completedAt = new Date();
      order.paymentStatus = 'completed';
    }

    await order.save();

    // Notify buyer about status update
    try {
      await Notification.create({
        userId: order.buyerId,
        title: `Order Status Updated 📋`,
        message: `Your order #${order.orderNumber} is now "${status}". ${statusDescriptions[status] || ''}`,
        type: 'order',
        relatedId: order._id,
        priority: 'medium',
        actionUrl: `/buyer/orders/${order._id}`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create status notification:', notifErr);
    }

    res.status(200).json({
      message: `Order status updated to "${status}"`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/:id/review
// @desc Add review to completed order
// @access Private
export const addOrderReview = async (req, res, next) => {
  try {
    const { rating, review: reviewText } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only buyer can review
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the buyer can review this order' });
    }

    // Only completed orders can be reviewed
    if (order.orderStatus !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed orders' });
    }

    order.review = {
      rating,
      review: reviewText,
      date: new Date(),
    };

    await order.save();

    res.status(200).json({
      message: 'Review added successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @route PATCH /api/orders/:id/cancel
// @desc Cancel order (buyer only, before preparing starts)
// @access Private
export const cancelOrder = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Allow both farmer and buyer to cancel, plus admin
    const isBuyer = order.buyerId.toString() === req.user._id.toString();
    const isFarmer = order.farmerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isFarmer && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Cannot cancel already terminal orders
    if (['completed', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        message: `Cannot cancel an order that is already "${order.orderStatus}"`,
      });
    }

    // Require reason for cancellation
    if (!cancellationReason || cancellationReason.trim().length < 5) {
      return res.status(400).json({
        message: 'Please provide a valid cancellation reason (at least 5 characters)',
      });
    }

    const cancelledBy = isAdmin ? 'admin' : isFarmer ? 'farmer' : 'buyer';
    const cancelledByLabel = cancelledBy === 'farmer' ? 'farmer' : cancelledBy === 'admin' ? 'admin' : 'buyer';

    order.orderStatus = 'cancelled';
    order.cancellationReason = cancellationReason.trim();
    order.cancelledBy = cancelledBy;
    order.cancelledAt = new Date();
    order.timeline.push({
      event: 'CANCELLED',
      description: `Order cancelled by ${cancelledByLabel}. Reason: ${cancellationReason.trim()}`,
      timestamp: new Date(),
    });

    await order.save();

    // Restore crop quantity
    await CropListing.findByIdAndUpdate(order.cropId, {
      $inc: { quantity: order.quantity, sold: -order.quantity },
      availability: 'available',
    });

    // Notify the OTHER party
    const notifyUserId = isFarmer ? order.buyerId : order.farmerId;
    const notifierLabel = isFarmer ? 'farmer' : 'buyer';
    try {
      await Notification.create({
        userId: notifyUserId,
        title: 'Order Cancelled ❌',
        message: `Order #${order.orderNumber} for "${order.cropName}" has been cancelled by the ${notifierLabel}. Reason: ${cancellationReason.trim()}`,
        type: 'order',
        relatedId: order._id,
        priority: 'high',
        actionUrl: isFarmer ? `/buyer/orders/${order._id}` : `/farmer/orders/${order._id}`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          cancelledBy: notifierLabel,
          reason: cancellationReason.trim(),
        },
      });
    } catch (notifErr) {
      console.error('Failed to create cancel notification:', notifErr);
    }

    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/:id/status
// @desc Get order status summary
// @access Private
export const getOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean().select('orderStatus orderNumber timeline');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ status: order.orderStatus, orderNumber: order.orderNumber, timeline: order.timeline });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/:id/track
// @desc Track order progress
// @access Private
export const trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean()
      .select('orderNumber orderStatus timeline pickupLocation farmerContact buyerContact cropName quantity unitPrice totalAmount')
      .populate('farmerId', 'firstName lastName name phone farmName')
      .populate('buyerId', 'firstName lastName name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/stats/summary
// @desc Get order stats for dashboard
// @access Private
export const getOrderStats = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'farmer') {
      query.farmerId = req.user._id;
    } else if (req.user.role === 'buyer') {
      query.buyerId = req.user._id;
    }

    const totalOrders = await Order.countDocuments(query);
    const completedOrders = await Order.countDocuments({ ...query, orderStatus: 'completed' });
    const pendingOrders = await Order.countDocuments({
      ...query,
      orderStatus: { $in: ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up'] },
    });
    const cancelledOrders = await Order.countDocuments({ ...query, orderStatus: 'cancelled' });

    // Total revenue (completed orders only)
    const revenueData = await Order.aggregate([
      { $match: { ...query, orderStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    res.status(200).json({
      stats: {
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/orders/:id/deny
// @desc    Farmer denies/rejects a cart-based order (order is cancelled)
// @access  Private (Farmer only)
export const denyOrder = async (req, res, next) => {
  try {
    const { denialReason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only the farmer of this order can deny it
    if (order.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to deny this order' });
    }

    // Can only deny active orders (not already completed/cancelled)
    if (['completed', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        message: `Cannot deny an order that is already "${order.orderStatus}"`,
      });
    }

    if (!denialReason || denialReason.trim().length < 5) {
      return res.status(400).json({
        message: 'Please provide a valid denial reason (at least 5 characters)',
      });
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = `Denied by farmer: ${denialReason.trim()}`;
    order.cancelledBy = 'farmer';
    order.cancelledAt = new Date();
    order.timeline.push({
      event: 'DENIED',
      description: `Order denied by farmer. Reason: ${denialReason.trim()}`,
      timestamp: new Date(),
    });

    await order.save();

    // Restore crop quantity
    await CropListing.findByIdAndUpdate(order.cropId, {
      $inc: { quantity: order.quantity, sold: -order.quantity },
      availability: 'available',
    });

    // Notify buyer
    try {
      await Notification.create({
        userId: order.buyerId,
        title: 'Order Denied by Farmer ❌',
        message: `Your order #${order.orderNumber} for "${order.cropName}" has been denied by the farmer. Reason: ${denialReason.trim()}`,
        type: 'order',
        relatedId: order._id,
        priority: 'high',
        actionUrl: `/buyer/orders/${order._id}`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          deniedBy: 'farmer',
          reason: denialReason.trim(),
        },
      });
    } catch (notifErr) {
      console.error('Failed to create denial notification:', notifErr);
    }

    res.status(200).json({ message: 'Order denied successfully', order });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/orders/:id/receive
// @desc    Buyer marks order as received (completes the order)
// @access  Private (Buyer only)
export const markOrderReceived = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only the buyer of this order can mark it received
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this order as received' });
    }

    // Can only mark as received from 'picked_up' status
    if (order.orderStatus !== 'picked_up') {
      return res.status(400).json({
        message: `Order must be in "picked_up" status to mark as received. Current status: "${order.orderStatus}"`,
      });
    }

    order.orderStatus = 'completed';
    order.completedAt = new Date();
    order.paymentStatus = 'completed';
    order.timeline.push({
      event: 'RECEIVED',
      description: 'Order marked as received by buyer',
      timestamp: new Date(),
    });

    await order.save();

    // Notify farmer
    try {
      await Notification.create({
        userId: order.farmerId,
        title: 'Order Received ✅',
        message: `Order #${order.orderNumber} for "${order.cropName}" has been marked as received by the buyer. Payment of ₹${order.totalAmount} is now due.`,
        type: 'order',
        relatedId: order._id,
        priority: 'high',
        actionUrl: `/farmer/orders/${order._id}`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: 'completed',
        },
      });
    } catch (notifErr) {
      console.error('Failed to create received notification:', notifErr);
    }

    res.status(200).json({ message: 'Order marked as received successfully', order });
  } catch (error) {
    next(error);
  }
};
