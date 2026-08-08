import type { Request, Response, NextFunction } from 'express';
import Cart from '../models/Cart.js';
import CropListing from '../models/CropListing.js';
import { sendError } from '../utils/apiResponse.js';
import { Types } from 'mongoose';

export async function getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let cart = await Cart.findOne({ userId: req.user!._id }).populate('items.cropId');
    if (!cart) {
      cart = await Cart.create({ userId: req.user!._id, items: [] });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    next(error);
  }
}

export async function updateCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items } = req.body as { items: { cropId: string; quantity: number }[] };
    
    if (!Array.isArray(items)) {
      sendError(res, 'Items must be an array', 400);
      return;
    }

    const validItems = items.filter(item => Types.ObjectId.isValid(item.cropId) && item.quantity > 0);

    let cart = await Cart.findOne({ userId: req.user!._id });
    if (!cart) {
      cart = new Cart({ userId: req.user!._id, items: validItems });
    } else {
      cart.items = validItems.map(item => ({ cropId: new Types.ObjectId(item.cropId), quantity: item.quantity }));
    }
    
    await cart.save();
    
    const populatedCart = await cart.populate('items.cropId');
    res.status(200).json({ success: true, cart: populatedCart });
  } catch (error) {
    next(error);
  }
}

export async function clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user!._id },
      { $set: { items: [] } },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, cart });
  } catch (error) {
    next(error);
  }
}
