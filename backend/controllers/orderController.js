import Order from '../models/Order.js';
import CropListing from '../models/CropListing.js';

// @route POST /api/orders
// @desc Create a new order (Buyer only)
// @access Private
export const createOrder = async (req, res, next) => {
  try {
    const { cropId, quantity, deliveryAddress, paymentMethod } = req.body;

    // Get crop details
    const crop = await CropListing.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    if (crop.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient quantity available' });
    }

    const totalPrice = crop.price * quantity;

    const order = await Order.create({
      buyerId: req.user._id,
      farmerId: crop.farmerId,
      cropId,
      quantity,
      unitPrice: crop.price,
      totalPrice,
      deliveryAddress,
      paymentMethod,
      timeline: [
        {
          event: 'Order Placed',
          description: 'Your order has been placed successfully',
        },
      ],
    });

    // Update crop quantity
    await CropListing.findByIdAndUpdate(
      cropId,
      {
        $inc: { quantity: -quantity, sold: quantity },
      }
    );

    res.status(201).json({
      message: 'Order created successfully',
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

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('cropId', 'name price image')
      .populate('buyerId', 'name email phone')
      .populate('farmerId', 'name email phone location')
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
      .populate('cropId')
      .populate('buyerId', 'name email phone location avatar')
      .populate('farmerId', 'name email phone location avatar rating');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (
      order.buyerId._id.toString() !== req.user._id.toString() &&
      order.farmerId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
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
