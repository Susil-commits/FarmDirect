import ContactQuery from '../models/ContactQuery.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import sendEmail, {
  generateContactConfirmation, generateAdminNotification, generateAdminResponse,
} from '../utils/emailService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { ContactQueryStatus, InquiryType, ContactQueryPriority } from '../types/enums.js';
import { env } from '../config/env.js';
import type { Request, Response } from 'express';
import mongoose, { type Types } from 'mongoose';
import { parsePagination } from '../utils/pagination.js';

export const submitContactQuery = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, inquiryType, message } = req.body as {
    name: string; email: string; phone?: string; inquiryType: InquiryType; message: string;
  };

  if (!name || !email || !inquiryType || !message) return sendError(res, 'Please fill in all required fields', 400);
  if (message.length < 10) return sendError(res, 'Message must be at least 10 characters long', 400);

  const userId = (req.user as { _id?: Types.ObjectId } | undefined)?._id?.toString()
    ?? (req.user as { id?: string; _id?: Types.ObjectId } | undefined)?.id
    ?? null;

  const contactQuery = await ContactQuery.create({
    userId: userId ?? undefined,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || undefined,
    inquiryType,
    message: message.trim(),
    status: ContactQueryStatus.New,
    priority: inquiryType === InquiryType.FarmerPartnership ? ContactQueryPriority.High : ContactQueryPriority.Medium,
  });

  try {
    const confirmationEmail = generateContactConfirmation(name, inquiryType, message);
    await sendEmail({ to: email, ...confirmationEmail });
  } catch (emailError) {
    console.error('Error sending confirmation email:', emailError);
  }

  try {
    const adminNotification = generateAdminNotification(name, email, phone || null, inquiryType, message, contactQuery._id);
    await sendEmail({ to: env.adminEmail, ...adminNotification });
  } catch (emailError) {
    console.error('Error sending admin notification:', emailError);
  }

  if (userId) {
    try {
      await Notification.create({
        userId,
        title: 'Contact Query Submitted',
        message: `Your "${inquiryType}" inquiry has been submitted. Admin will respond within 24 hours.`,
        type: 'general',
        relatedId: String(contactQuery._id),
        actionUrl: null,
        priority: 'medium',
      });
    } catch (notifError) {
      console.error('Error creating notification for contact query:', notifError);
    }
  }

  res.status(201).json({
    success: true, message: 'Your inquiry has been submitted successfully!',
    data: { id: contactQuery._id, status: contactQuery.status },
  });
});

export const getAllContactQueries = asyncHandler(async (req: Request, res: Response) => {
  const { status, inquiryType, kycStatus, sortBy = 'createdAt', order = '-1' } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter: Record<string, unknown> = { isDeleted: false };
  if (status && Object.values(ContactQueryStatus).includes(status as ContactQueryStatus)) filter.status = status;
  if (inquiryType && Object.values(InquiryType).includes(inquiryType as InquiryType)) filter.inquiryType = inquiryType;

  if (kycStatus && ['verified', 'not_verified', 'pending'].includes(kycStatus)) {
    const kycFilter = kycStatus === 'not_verified' ? { kycStatus: { $ne: 'verified' } } : { kycStatus };
    const users = await User.find(kycFilter).select('_id');
    const kycUserIds = users.map((u) => u._id);
    if (kycStatus === 'not_verified') {
      filter.$or = [{ userId: { $in: kycUserIds } }, { userId: null }];
    } else {
      filter.userId = { $in: kycUserIds };
    }
  }

  const sortField = typeof sortBy === 'string' && ['createdAt', 'updatedAt', 'priority', 'status'].includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = order === '1' ? 1 : -1;
  const sortOption: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [queries, total] = await Promise.all([
    ContactQuery.find(filter).sort(sortOption).skip(skip).limit(limit)
      .populate('adminResponse.respondedBy', 'name email').populate('userId', 'name email kycStatus role'),
    ContactQuery.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true, data: queries,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

export const getContactQuery = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id || !mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid query ID', 400);
  }
  const safeId = new mongoose.Types.ObjectId(req.params.id);
  const query = await ContactQuery.findById(safeId).populate('adminResponse.respondedBy', 'name email');
  if (!query) return sendError(res, 'Query not found', 404);
  if (query.status === ContactQueryStatus.New) {
    query.status = ContactQueryStatus.Read;
    await query.save();
  }
  res.status(200).json({ success: true, data: query });
});

export const updateContactQuery = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id || !mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid query ID', 400);
  }
  const safeId = new mongoose.Types.ObjectId(req.params.id);
  const { status, adminResponse, internalNotes, priority } = req.body as {
    status?: ContactQueryStatus; adminResponse?: string; internalNotes?: string; priority?: ContactQueryPriority;
  };
  const adminId = (req.user as { _id?: Types.ObjectId } | undefined)?._id?.toString()
    ?? (req.user as { id?: string; _id?: Types.ObjectId } | undefined)?.id;
  const query = await ContactQuery.findById(safeId);
  if (!query) { sendError(res, 'Query not found', 404); return; }

  if (status && Object.values(ContactQueryStatus).includes(status)) query.status = status;
  if (typeof internalNotes === 'string') query.internalNotes = internalNotes.trim();
  if (priority && Object.values(ContactQueryPriority).includes(priority)) query.priority = priority;

  if (adminResponse && typeof adminResponse === 'string') {
    query.adminResponse = { respondedBy: adminId as unknown as Types.ObjectId, responseMessage: String(adminResponse).trim(), respondedAt: new Date() };
    query.status = ContactQueryStatus.Resolved;
  }

  await query.save();

  if (adminResponse) {
    try {
      const responseEmail = generateAdminResponse(query.name, query.inquiryType, String(adminResponse));
      await sendEmail({ to: query.email, ...responseEmail });
    } catch (emailError) {
      console.error('Error sending response email:', emailError);
    }

    if (query.userId) {
      try {
        await Notification.create({
          userId: query.userId,
          title: 'Admin Response Received',
          message: `Admin has replied to your "${query.inquiryType}" inquiry: "${String(adminResponse).substring(0, 100)}${String(adminResponse).length > 100 ? '...' : ''}"`,
          type: 'general',
          relatedId: String(query._id),
          actionUrl: null,
          priority: 'high',
        });
      } catch (notifError) {
        console.error('Error creating notification for admin response:', notifError);
      }
    }
  }

  res.status(200).json({ success: true, message: 'Query updated successfully', data: query });
});

export const deleteContactQuery = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id || !mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid query ID', 400);
  }
  const safeId = new mongoose.Types.ObjectId(req.params.id);
  const query = await ContactQuery.findByIdAndUpdate(safeId, { $set: { isDeleted: true } }, { new: true });
  if (!query) return sendError(res, 'Query not found', 404);
  res.status(200).json({ success: true, message: 'Query deleted successfully' });
});

export const searchContactQueries = asyncHandler(async (req: Request, res: Response) => {
  const { q, type } = req.query as { q?: string; type?: string };
  if (!q || typeof q !== 'string') return sendError(res, 'Search query is required', 400);
  const safeQ = q.trim().slice(0, 100);
  const searchFilter: Record<string, unknown> = { isDeleted: false, $text: { $search: safeQ } };
  if (type && typeof type === 'string' && Object.values(InquiryType).includes(type as InquiryType)) {
    searchFilter.inquiryType = type;
  }
  const results = await ContactQuery.find(searchFilter).sort({ score: { $meta: 'textScore' } }).limit(50).populate('adminResponse.respondedBy', 'name email');
  res.status(200).json({ success: true, data: results, count: results.length });
});

export const getContactQueryStats = asyncHandler(async (_req: Request, res: Response) => {
  const [statusCounts, typeCounts, total, newQueries, resolved] = await Promise.all([
    ContactQuery.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ContactQuery.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$inquiryType', count: { $sum: 1 } } }]),
    ContactQuery.countDocuments({ isDeleted: false }),
    ContactQuery.countDocuments({ status: ContactQueryStatus.New, isDeleted: false }),
    ContactQuery.countDocuments({ status: ContactQueryStatus.Resolved, isDeleted: false }),
  ]);
  res.status(200).json({
    success: true,
    data: {
      total, newQueries, resolved,
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
      typeCounts: Object.fromEntries(typeCounts.map((t) => [t._id, t.count])),
    },
  });
});
