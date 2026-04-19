import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// TEST: Manually set KYC status (NO AUTH - for testing only)
router.post('/test/set-kyc/:email/:status', async (req, res) => {
  try {
    const { email, status } = req.params;
    const User = (await import('../models/User.js')).default;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.kycStatus = status;
    if (status === 'pending') {
      user.kycSubmittedAt = new Date();
    }
    if (status === 'verified') {
      user.kycVerifiedAt = new Date();
    }
    await user.save();
    
    res.json({ 
      success: true,
      message: `✅ Set ${email} kycStatus to ${status}`,
      user: {
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// TEST: Delete user by email (NO AUTH - for testing only)
router.post('/test/delete-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const User = (await import('../models/User.js')).default;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const name = user.firstName + ' ' + user.lastName;
    await User.deleteOne({ email });
    
    res.json({ 
      success: true,
      message: `✅ Deleted user: ${name} (${email})`
    });
  } catch (error) {
    console.error('Delete test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// TEST: List all users with KYC info (NO AUTH - for debugging)
router.get('/test/all-users', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const users = await User.find({}).select('firstName lastName email role kycStatus status createdAt');
    
    res.json({ 
      success: true,
      total: users.length,
      users: users.map(u => ({
        name: u.firstName + ' ' + u.lastName,
        email: u.email,
        role: u.role,
        kycStatus: u.kycStatus,
        status: u.status,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error('List users test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// TEST: Get pending KYC (NO AUTH - for debugging)
router.get('/test/pending-kyc', async (req, res) => {
  try {
    const { role = 'buyer' } = req.query;
    const User = (await import('../models/User.js')).default;
    
    // Support both singular and plural forms
    let queryRole = role.toLowerCase().replace(/s$/, ''); // Remove trailing 's'
    const validRoles = ['farmer', 'buyer'];
    if (!validRoles.includes(queryRole)) {
      queryRole = 'buyer';
    }
    
    console.log(`🔍 Test: Fetching pending KYC for role: ${queryRole} (received: ${role})`);
    
    const users = await User.find({
      role: queryRole,
      kycStatus: 'pending'
    }).select('firstName lastName email role kycStatus phone createdAt kycSubmittedAt');
    
    console.log(`✅ Test: Found ${users.length} pending KYC users for role: ${queryRole}`);
    
    res.json({ 
      success: true,
      role: role,
      queryRole: queryRole,
      total: users.length,
      data: users.map(u => ({
        id: u._id,
        name: u.firstName + ' ' + u.lastName,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        phone: u.phone,
        kycStatus: u.kycStatus,
        createdAt: u.createdAt,
        kycSubmittedAt: u.kycSubmittedAt
      }))
    });
  } catch (error) {
    console.error('Pending KYC test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// All admin routes require admin authorization
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Users management
router.get('/users', adminController.getAllUsers);
router.get('/users-with-crops', adminController.getUsersWithCrops);
router.get('/users/approved/farmers', adminController.getApprovedFarmers);
router.get('/users/approved/buyers', adminController.getApprovedBuyers);
router.get('/users/suspended', adminController.getSuspendedUsers);
router.patch('/users/:userId/status', adminController.toggleUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

// KYC Management
router.get('/kyc/pending', adminController.getPendingKYC);
router.get('/kyc/rejected', adminController.getRejectedKYC);
router.get('/debug/users-kyc-status', adminController.debugGetAllUsersKYCStatus);
router.patch('/kyc/:farmerId/approve', adminController.approveFarmerKYC);
router.patch('/kyc/:farmerId/reject', adminController.rejectFarmerKYC);

// Crops management
router.get('/crops', adminController.getAllCrops);
router.patch('/crops/:cropId/approve', adminController.approveCrop);
router.patch('/crops/:cropId/reject', adminController.rejectCrop);
router.patch('/crops/:cropId/freeze', adminController.freezeCrop);
router.delete('/crops/:cropId', adminController.deleteCrop);

// Orders management
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:orderId/status', adminController.updateOrderStatus);

// Announcements
router.post('/announcements', adminController.sendAnnouncement);

// System logs
router.get('/logs', adminController.getSystemLogs);

// Analytics
router.get('/analytics/dashboard', adminController.getDashboardAnalytics);
router.get('/analytics/farmers/:farmerId', adminController.getFarmerAnalytics);
router.get('/analytics/buyers/:buyerId', adminController.getBuyerAnalytics);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// User role management
router.patch('/users/:userId/role', adminController.changeUserRole);

export default router;
