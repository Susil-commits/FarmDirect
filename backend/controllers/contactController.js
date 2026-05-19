import ContactQuery from '../models/ContactQuery.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import sendEmail, {
  generateContactConfirmation,
  generateAdminNotification,
  generateAdminResponse,
} from '../utils/emailService.js';

// Submit a new contact query
export const submitContactQuery = async (req, res) => {
  try {
    const { name, email, phone, inquiryType, message } = req.body;

    // Validation
    if (!name || !email || !inquiryType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields',
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long',
      });
    }

    // Get userId from authenticated user (if logged in), otherwise null for public submissions
    const userId = req.user?.id || null;

    // Create new contact query
    const contactQuery = new ContactQuery({
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      inquiryType,
      message: message.trim(),
      status: 'New',
      priority: inquiryType === 'Farmer Partnership' ? 'High' : 'Medium',
    });

    await contactQuery.save();

    // Send confirmation email to user
    try {
      const confirmationEmail = generateContactConfirmation(name, inquiryType, message);
      await sendEmail({
        to: email,
        ...confirmationEmail,
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email sending fails
    }

    // Send notification email to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@farm.local';
      const adminNotification = generateAdminNotification(
        name,
        email,
        phone,
        inquiryType,
        message,
        contactQuery._id
      );
      await sendEmail({
        to: adminEmail,
        ...adminNotification,
      });
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
    }

    // Create in-app notification for authenticated users
    if (userId) {
      try {
        await Notification.create({
          userId,
          title: 'Contact Query Submitted',
          message: `Your "${inquiryType}" inquiry has been submitted. Admin will respond within 24 hours.`,
          type: 'general',
          relatedId: contactQuery._id,
          actionUrl: null,
          priority: 'medium',
        });
      } catch (notifError) {
        console.error('Error creating notification for contact query:', notifError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Your inquiry has been submitted successfully!',
      data: {
        id: contactQuery._id,
        status: contactQuery.status,
      },
    });
  } catch (error) {
    console.error('Error submitting contact query:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting your inquiry. Please try again later.',
    });
  }
};

// Get all contact queries (Admin only)
export const getAllContactQueries = async (req, res) => {
  try {
    const { status, inquiryType, kycStatus, sortBy = 'createdAt', order = -1, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (inquiryType) filter.inquiryType = inquiryType;

    // KYC status filter: find queries whose userId matches users with given kycStatus
    let kycUserIds = null;
    if (kycStatus && (kycStatus === 'verified' || kycStatus === 'not_verified' || kycStatus === 'pending')) {
      const kycFilter = kycStatus === 'not_verified'
        ? { kycStatus: { $ne: 'verified' } }
        : { kycStatus: kycStatus };
      const users = await User.find(kycFilter).select('_id');
      kycUserIds = users.map(u => u._id);
      if (kycStatus === 'not_verified') {
        // Include queries without userId (public submissions) as not-verified
        filter.$or = [
          { userId: { $in: kycUserIds } },
          { userId: null },
        ];
      } else {
        filter.userId = { $in: kycUserIds };
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch queries
    const queries = await ContactQuery.find(filter)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('adminResponse.respondedBy', 'name email')
      .populate('userId', 'name email kycStatus role');

    // Get total count
    const total = await ContactQuery.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: queries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contact queries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching queries',
    });
  }
};

// Get single contact query (Admin only)
export const getContactQuery = async (req, res) => {
  try {
    const { id } = req.params;

    const query = await ContactQuery.findById(id).populate('adminResponse.respondedBy', 'name email');

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found',
      });
    }

    // Mark as read if status is 'New'
    if (query.status === 'New') {
      query.status = 'Read';
      await query.save();
    }

    res.status(200).json({
      success: true,
      data: query,
    });
  } catch (error) {
    console.error('Error fetching contact query:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching query',
    });
  }
};

// Update contact query status and add response (Admin only)
export const updateContactQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse, internalNotes, priority } = req.body;
    const adminId = req.user?.id; // From auth middleware

    const query = await ContactQuery.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found',
      });
    }

    // Update fields
    if (status) query.status = status;
    if (internalNotes) query.internalNotes = internalNotes;
    if (priority) query.priority = priority;

    // Add response
    if (adminResponse) {
      query.adminResponse = {
        respondedBy: adminId,
        responseMessage: adminResponse.trim(),
        respondedAt: new Date(),
      };
      query.status = 'Resolved';
    }

    await query.save();

    // Send response email to user if response is provided
    if (adminResponse) {
      try {
        const responseEmail = generateAdminResponse(query.name, query.inquiryType, adminResponse);
        await sendEmail({
          to: query.email,
          ...responseEmail,
        });
      } catch (emailError) {
        console.error('Error sending response email:', emailError);
      }

      // Create in-app notification for the user if they have a userId linked
      if (query.userId) {
        try {
          await Notification.create({
            userId: query.userId,
            title: 'Admin Response Received',
            message: `Admin has replied to your "${query.inquiryType}" inquiry: "${adminResponse.substring(0, 100)}${adminResponse.length > 100 ? '...' : ''}"`,
            type: 'general',
            relatedId: query._id,
            actionUrl: null,
            priority: 'high',
          });
        } catch (notifError) {
          console.error('Error creating notification for admin response:', notifError);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Query updated successfully',
      data: query,
    });
  } catch (error) {
    console.error('Error updating contact query:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating query',
    });
  }
};

// Delete contact query (Soft delete - Admin only)
export const deleteContactQuery = async (req, res) => {
  try {
    const { id } = req.params;

    const query = await ContactQuery.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Query deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contact query:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting query',
    });
  }
};

// Search contact queries (Admin only)
export const searchContactQueries = async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const searchFilter = {
      isDeleted: false,
      $text: { $search: q },
    };

    if (type) searchFilter.inquiryType = type;

    const results = await ContactQuery.find(searchFilter)
      .sort({ score: { $meta: 'textScore' } })
      .limit(50)
      .populate('adminResponse.respondedBy', 'name email');

    res.status(200).json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching contact queries:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching queries',
    });
  }
};

// Get statistics (Admin only)
export const getContactQueryStats = async (req, res) => {
  try {
    const stats = await ContactQuery.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: {
            $push: {
              status: '$status',
              count: 1,
            },
          },
          byInquiryType: {
            $push: {
              type: '$inquiryType',
              count: 1,
            },
          },
        },
      },
    ]);

    // Count by status properly
    const statusCounts = await ContactQuery.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Count by inquiry type
    const typeCounts = await ContactQuery.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$inquiryType',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await ContactQuery.countDocuments({ isDeleted: false });
    const newQueries = await ContactQuery.countDocuments({ status: 'New', isDeleted: false });
    const resolved = await ContactQuery.countDocuments({ status: 'Resolved', isDeleted: false });

    res.status(200).json({
      success: true,
      data: {
        total,
        newQueries,
        resolved,
        statusCounts: Object.fromEntries(statusCounts.map(s => [s._id, s.count])),
        typeCounts: Object.fromEntries(typeCounts.map(t => [t._id, t.count])),
      },
    });
  } catch (error) {
    console.error('Error getting contact query stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
    });
  }
};
