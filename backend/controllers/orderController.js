import Order from '../models/Order.js';
import CropListing from '../models/CropListing.js';
import User from '../models/User.js';

// @route POST /api/orders
// @desc Create a new order (COD Only - Buyer only)
// @access Private
export const createOrder = async (req, res, next) => {
  try {
    const { items, deliveryAddress, deliveryCharges = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    let subtotal = 0;
    const processedItems = [];

    // Process each item
    for (const item of items) {
      const crop = await CropListing.findById(item.cropId);
      if (!crop) {
        return res.status(404).json({ message: `Crop ${item.cropId} not found` });
      }

      if (crop.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient quantity for ${crop.name}` });
      }

      const itemTotal = crop.price * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        cropId: item.cropId,
        farmerId: crop.farmerId,
        cropName: crop.name,
        quantity: item.quantity,
        unitPrice: crop.price,
        totalPrice: itemTotal
      });

      // Update crop quantity
      await CropListing.findByIdAndUpdate(
        item.cropId,
        {
          $inc: { quantity: -item.quantity, sold: item.quantity },
        }
      );
    }

    const taxAmount = Math.round(subtotal * 0.05); // 5% tax
    const totalAmount = subtotal + taxAmount + deliveryCharges;

    const order = await Order.create({
      orderNumber: 'ORD-' + Date.now(),
      buyerId: req.user._id,
      items: processedItems,
      deliveryAddress,
      subtotal,
      taxAmount,
      deliveryCharges,
      totalAmount,
      totalWithCharges: totalAmount,
      paymentMethod: 'cod', // Only COD
      paymentStatus: 'pending',
      orderStatus: 'verification_pending', // Start with verification
      verificationCall: {
        status: 'pending',
        callInitiatedAt: new Date()
      },
      adminApproval: {
        status: 'pending'
      },
      timeline: [
        {
          event: 'ORDER_PLACED',
          description: 'Your order has been placed successfully',
          timestamp: new Date()
        },
        {
          event: 'VERIFICATION_PENDING',
          description: 'Waiting for verification call',
          timestamp: new Date()
        }
      ],
    });

    res.status(201).json({
      message: 'Order placed successfully! Our team will call for verification.',
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
      // FIX: Support multi-farmer orders - farmers appear in items array
      query['items.farmerId'] = req.user._id;
    } else if (req.user.role === 'buyer') {
      query.buyerId = req.user._id;
    }
    // Admin sees all orders (no filter)

    if (status) {
      query.orderStatus = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('items.cropId', 'name price image')
      .populate('buyerId', 'name email phone')
      .populate('items.farmerId', 'name email phone location')
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
    const order = await Order.findById(req.params.id)
      .populate('items.cropId')
      .populate('buyerId', 'name email phone location avatar')
      .populate('items.farmerId', 'name email phone location avatar rating');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const isBuyer = order.buyerId._id.toString() === req.user._id.toString();
    const isFarmer = order.items.some(item => item.farmerId._id.toString() === req.user._id.toString());
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
// @desc Update order status
// @access Private
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization - only farmer or admin can update status
    if (
      order.farmerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      message: 'Order status updated',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/:id/review
// @desc Add review to order
// @access Private
export const addOrderReview = async (req, res, next) => {
  try {
    const { rating, review: reviewText } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization - only buyer can review
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyer can review this order' });
    }

    order.rating = {
      value: rating,
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

// ===================== COD VERIFICATION WORKFLOW =====================

// @route PUT /api/orders/:id/verification-call
// @desc Complete verification call
// @access Private (Admin only)
export const completeVerificationCall = async (req, res, next) => {
  try {
    const { status, verificationNotes } = req.body;

    if (!['completed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only admin can complete verification
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can complete verification' });
    }

    order.verificationCall.status = status;
    order.verificationCall.verifiedAt = new Date();
    order.verificationCall.verificationNotes = verificationNotes;
    order.verificationCall.verifiedBy = req.user._id;
    order.verificationCall.attempts += 1;

    if (status === 'completed') {
      order.orderStatus = 'verification_completed';
      order.timeline.push({
        event: 'VERIFICATION_COMPLETED',
        description: 'Verification call completed successfully',
        timestamp: new Date()
      });
    } else {
      order.orderStatus = 'cancelled';
      order.timeline.push({
        event: 'VERIFICATION_REJECTED',
        description: `Verification rejected: ${verificationNotes}`,
        timestamp: new Date()
      });
    }

    await order.save();

    res.status(200).json({
      message: `Verification call ${status} successfully`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/orders/:id/admin-approval
// @desc Admin approval for order
// @access Private (Admin only)
export const adminApprovalOrder = async (req, res, next) => {
  try {
    const { status, rejectionReason, notes } = req.body;

    if (!['approved', 'rejected', 'hold'].includes(status)) {
      return res.status(400).json({ message: 'Invalid approval status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only admin can approve
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can approve orders' });
    }

    order.adminApproval.status = status;
    order.adminApproval.approvedAt = new Date();
    order.adminApproval.approvedBy = req.user._id;
    order.adminApproval.notes = notes;

    if (status === 'approved') {
      order.orderStatus = 'admin_approved';
      order.orderStatus = 'ready_for_delivery';
      order.timeline.push({
        event: 'ADMIN_APPROVED',
        description: 'Order approved by admin. Ready for delivery',
        timestamp: new Date()
      });
    } else if (status === 'rejected') {
      order.orderStatus = 'cancelled';
      order.adminApproval.rejectionReason = rejectionReason;
      order.timeline.push({
        event: 'ADMIN_REJECTED',
        description: `Order rejected: ${rejectionReason}`,
        timestamp: new Date()
      });
    } else {
      order.orderStatus = 'admin_approval_pending';
      order.timeline.push({
        event: 'ADMIN_HOLD',
        description: `Order on hold: ${notes}`,
        timestamp: new Date()
      });
    }

    await order.save();

    res.status(200).json({
      message: `Order ${status} successfully`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/orders/:id/additional-charges
// @desc Add additional charges to order (for buyer issues)
// @access Private (Admin only)
export const addAdditionalCharges = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Charges amount must be greater than 0' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only admin can add charges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can add charges' });
    }

    order.additionalCharges = {
      amount,
      reason,
      appliedAt: new Date(),
      appliedBy: req.user._id
    };

    order.timeline.push({
      event: 'ADDITIONAL_CHARGES',
      description: `Additional charges of ₹${amount} applied: ${reason}`,
      timestamp: new Date()
    });

    await order.save();

    res.status(200).json({
      message: 'Additional charges added successfully',
      order,
      newTotal: order.totalWithCharges,
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/orders/:id/issue-fine
// @desc Issue fine to buyer (reduces rating)
// @access Private (Admin only)
export const issueFineToOrder = async (req, res, next) => {
  try {
    const { amount, reason, ratingReduction } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Fine amount must be greater than 0' });
    }

    if (ratingReduction < 0 || ratingReduction > 5) {
      return res.status(400).json({ message: 'Rating reduction must be between 0 and 5' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only admin can issue fine
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can issue fines' });
    }

    order.issueFine = {
      amount,
      reason,
      ratingReduction,
      appliedAt: new Date(),
      appliedBy: req.user._id
    };

    // Update buyer rating
    const buyer = await User.findById(order.buyerId);
    if (buyer) {
      buyer.rating = Math.max(0, (buyer.rating || 5) - ratingReduction);
      await buyer.save();
    }

    order.timeline.push({
      event: 'FINE_ISSUED',
      description: `Fine of ₹${amount} issued (Rating reduced by ${ratingReduction}): ${reason}`,
      timestamp: new Date()
    });

    await order.save();

    res.status(200).json({
      message: 'Fine issued successfully',
      order,
      buyerNewRating: buyer.rating,
      newTotal: order.totalWithCharges,
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/orders/:id/payment-received
// @desc Mark payment as received (COD)
// @access Private (Admin only)
export const markPaymentReceived = async (req, res, next) => {
  try {
    const { amount, notes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only admin can mark payment received
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can mark payment received' });
    }

    order.paymentReceived = {
      amount: amount || order.totalWithCharges,
      receivedAt: new Date(),
      notes
    };
    order.paymentStatus = 'completed';

    order.timeline.push({
      event: 'PAYMENT_RECEIVED',
      description: `Payment of ₹${amount || order.totalWithCharges} received`,
      timestamp: new Date()
    });

    await order.save();

    res.status(200).json({
      message: 'Payment marked as received',
      order,
    });
  } catch (error) {
    next(error);
  }
};
