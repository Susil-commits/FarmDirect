# Cash on Delivery (COD) Workflow Documentation

## Overview

The new COD system replaces all other payment methods with a verification-first approach that ensures order authenticity and protects both buyers and sellers.

---

## Order Lifecycle Stages

### 1. **Order Placed** (Status: `pending` → `verification_pending`)
- Customer completes checkout with address and delivery info
- **No payment method selection** - COD is the only option
- Order created with initial status `verification_pending`
- Timeline event: "Order Placed"

### 2. **Verification Call** (Status: `verification_pending`)
**Our team calls the buyer to verify:**
- Correct delivery address
- Correct phone number
- Confirm order details
- Confirm delivery time preference

**Admin Actions:**
- Mark verification as `completed` or `rejected`
- Add verification notes
- Track call attempts

**Fields:**
```javascript
verificationCall: {
  status: 'pending' | 'completed' | 'rejected',
  callInitiatedAt: Date,
  verifiedAt: Date,
  verificationNotes: String,
  verifiedBy: ObjectId (User),
  attempts: Number
}
```

### 3. **Admin Approval** (Status: `verification_completed` → `admin_approval_pending`)
**After verification, admin reviews and approves:**
- Validates order data
- Checks inventory availability
- Reviews buyer history
- Approves or rejects order

**Admin Status Options:**
- `approved` → Order moves to `ready_for_delivery`
- `rejected` → Order cancelled (with reason)
- `hold` → Order on hold for review

**Fields:**
```javascript
adminApproval: {
  status: 'pending' | 'approved' | 'rejected' | 'hold',
  approvedAt: Date,
  approvedBy: ObjectId (User),
  rejectionReason: String,
  notes: String
}
```

### 4. **Ready for Delivery** (Status: `ready_for_delivery`)
**Order approved and ready to ship:**
- Farmer/Admin prepares shipment
- Tracking information assigned
- Delivery arrangements made

**Fields:**
```javascript
orderStatus: 'ready_for_delivery',
trackingNumber: String,
estimatedDeliveryDate: Date
```

### 5. **Delivered** (Status: `shipped` → `delivered`)
- Product delivered to buyer
- COD payment collected at doorstep

### 6. **Payment Collection** (Status: Payment Status Change)
**Admin records payment received:**
- Amount collected (including any additional charges/fines)
- Payment method notes
- Payment timestamp

**Fields:**
```javascript
paymentStatus: 'completed',
paymentReceived: {
  amount: Number,
  receivedAt: Date,
  notes: String
}
```

---

## Additional Charges & Fines System

### Additional Charges
**When to apply:**
- Product damage during delivery
- Returned/rejected items
- Packaging issues
- Other delivery-related costs

**Effects:**
- Added to order total
- Must be paid before/with delivery
- Does NOT affect buyer rating

**API:** `PUT /api/orders/:id/additional-charges`

```javascript
{
  amount: Number,
  reason: String
}
```

**Updates:**
```javascript
additionalCharges: {
  amount: Number,
  reason: String,
  appliedAt: Date,
  appliedBy: ObjectId
}
chargesAmount: Number // Auto-calculated
totalWithCharges: Number // Auto-calculated
```

### Fines
**When to issue:**
- Fraudulent claims
- Abusive behavior
- Serious policy violations
- Repeat issues

**Effects:**
- Added to order payment
- Reduces buyer's account rating
- Permanently affects buyer profile
- Creates record in system

**API:** `PUT /api/orders/:id/issue-fine`

```javascript
{
  amount: Number,
  reason: String,
  ratingReduction: Number (0-5)
}
```

**Updates:**
```javascript
issueFine: {
  amount: Number,
  reason: String,
  ratingReduction: Number,
  appliedAt: Date,
  appliedBy: ObjectId
}
fineAmount: Number // Auto-calculated
totalWithCharges: Number // Auto-calculated

// Buyer's rating is also updated:
user.rating = max(0, user.rating - ratingReduction)
```

---

## Frontend Components

### Checkout.jsx (NEW)
**Changes:**
- Removed payment method selection step
- Now 2-step checkout (Address → Delivery → Review)
- Displays COD workflow information upfront
- Shows warning about additional charges/fines
- Better designed for COD process

**Steps:**
1. Address Entry
2. Delivery Option Selection
3. Order Review & Confirmation

### OrderStatusTracker.jsx (NEW)
**Displays to buyers:**
- Current order status
- All workflow stages
- Verification status
- Admin approval status
- Payment status
- Timeline with dates/notes
- Amount breakdown with charges/fines

**Features:**
- Visual timeline with icons
- Color-coded status (completed, pending, rejected, hold)
- Expandable details for each stage
- Amount breakdown

### AdminOrderManagement.jsx (NEW)
**Admin dashboard tabs:**

1. **📞 Verification Tab**
   - Mark verification complete/rejected
   - Add call notes
   - Track call attempts

2. **✓ Approval Tab**
   - Approve/Reject/Hold order
   - Add rejection reason
   - Internal notes

3. **+ Charges Tab**
   - Add additional charges
   - Specify reason
   - View current charges

4. **⚠ Fine Tab**
   - Issue fines to buyers
   - Reduce buyer rating
   - Specify fine reason
   - Warning system for serious violations

5. **💰 Payment Tab**
   - Record COD payment received
   - Add payment notes
   - Track amount collected

---

## Backend API Endpoints

### Create Order
**Endpoint:** `POST /api/orders`
```javascript
Request Body: {
  items: [
    {
      cropId: String,
      quantity: Number
    }
  ],
  deliveryAddress: {
    streetAddress: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number
  },
  deliveryCharges: Number (optional)
}

Response: {
  message: String,
  order: Order
}
```

**Status Set To:** `verification_pending`
**Payment Method:** `cod` (automatically set)

### Complete Verification Call
**Endpoint:** `PUT /api/orders/:id/verification-call`
```javascript
Request Body: {
  status: 'completed' | 'rejected',
  verificationNotes: String
}

Response: {
  message: String,
  order: Order
}
```

### Admin Approval
**Endpoint:** `PUT /api/orders/:id/admin-approval`
```javascript
Request Body: {
  status: 'approved' | 'rejected' | 'hold',
  rejectionReason: String (if rejected),
  notes: String
}

Response: {
  message: String,
  order: Order
}
```

### Add Additional Charges
**Endpoint:** `PUT /api/orders/:id/additional-charges`
```javascript
Request Body: {
  amount: Number,
  reason: String
}

Response: {
  message: String,
  order: Order,
  newTotal: Number
}
```

### Issue Fine
**Endpoint:** `PUT /api/orders/:id/issue-fine`
```javascript
Request Body: {
  amount: Number,
  reason: String,
  ratingReduction: Number (0-5)
}

Response: {
  message: String,
  order: Order,
  buyerNewRating: Number,
  newTotal: Number
}
```

### Mark Payment Received
**Endpoint:** `PUT /api/orders/:id/payment-received`
```javascript
Request Body: {
  amount: Number,
  notes: String
}

Response: {
  message: String,
  order: Order
}
```

---

## Database Model Changes

### Order Schema Updates

```javascript
// Order Status Enum - EXPANDED
orderStatus: ['pending', 'verification_pending', 'verification_completed', 
              'admin_approval_pending', 'admin_approved', 'ready_for_delivery', 
              'shipped', 'delivered', 'cancelled', 'returned']

// Payment Method - RESTRICTED TO COD ONLY
paymentMethod: {
  enum: ['cod'],
  default: 'cod'
}

// NEW: Verification Call Details
verificationCall: {
  status: 'pending' | 'completed' | 'rejected',
  callInitiatedAt: Date,
  verifiedAt: Date,
  verificationNotes: String,
  verifiedBy: ObjectId,
  attempts: Number
}

// NEW: Admin Approval Details
adminApproval: {
  status: 'pending' | 'approved' | 'rejected' | 'hold',
  approvedAt: Date,
  approvedBy: ObjectId,
  rejectionReason: String,
  notes: String
}

// NEW: Additional Charges (for damages, returns, etc.)
additionalCharges: {
  amount: Number,
  reason: String,
  appliedAt: Date,
  appliedBy: ObjectId
}

// NEW: Fines (serious violations - reduces rating)
issueFine: {
  amount: Number,
  reason: String,
  ratingReduction: Number (0-5),
  appliedAt: Date,
  appliedBy: ObjectId
}

// NEW: Calculated Fields
chargesAmount: Number // Auto-calculated
fineAmount: Number    // Auto-calculated
totalWithCharges: Number // Auto-calculated = totalAmount + chargesAmount + fineAmount

// NEW: Payment Tracking
paymentReceived: {
  amount: Number,
  receivedAt: Date,
  notes: String
}
```

---

## Timeline Events

All events are automatically logged in the `timeline` array:

- `ORDER_PLACED` - Order created
- `VERIFICATION_PENDING` - Waiting for call
- `VERIFICATION_COMPLETED` - Call completed successfully
- `VERIFICATION_REJECTED` - Call rejected with reason
- `ADMIN_APPROVED` - Admin approved order
- `ADMIN_REJECTED` - Admin rejected with reason
- `ADMIN_HOLD` - Order placed on hold
- `ADDITIONAL_CHARGES` - Charges applied
- `FINE_ISSUED` - Fine added (with rating reduction)
- `PAYMENT_RECEIVED` - COD payment collected
- `SHIPPED` - Order dispatched
- `DELIVERED` - Order delivered

---

## Authorization

### Who Can Do What?

| Action | Buyer | Farmer | Admin |
|--------|-------|--------|-------|
| Place Order | ✓ | ✗ | ✗ |
| View Order | ✓ (own) | ✓ (their sales) | ✓ |
| Complete Verification | ✗ | ✗ | ✓ |
| Approve/Reject Order | ✗ | ✗ | ✓ |
| Add Charges | ✗ | ✗ | ✓ |
| Issue Fine | ✗ | ✗ | ✓ |
| Mark Payment Received | ✗ | ✗ | ✓ |
| Update Order Status | ✓ (partial) | ✓ | ✓ |

---

## Security & Validation

1. **Verification Protection:**
   - Attempt tracking prevents unlimited retries
   - Phone number validation required
   - Address verification mandatory

2. **Payment Safety:**
   - All transactions recorded in timeline
   - Admin approval required before delivery
   - Payment amount validation

3. **Anti-Fraud Measures:**
   - Fine system for repeated violations
   - Rating reduction to identify bad actors
   - Admin review for suspicious patterns

4. **Dispute Resolution:**
   - All charges/fines have documented reasons
   - Audit trail in timeline
   - Notes field for communication

---

## Usage Flow

### For Buyers:
1. Add items to cart
2. Go to checkout
3. Enter delivery address
4. Select delivery option
5. Review order (COD only)
6. Place order
7. **Wait for verification call** from admin
8. **Receive approval confirmation**
9. **Receive order delivery**
10. **Pay COD at doorstep**
11. Leave review (optional)

### For Admin:
1. View pending orders queue
2. Call buyer to verify order details
3. Mark verification complete
4. Review order and approve
5. Track delivery status
6. If issues occur:
   - Apply additional charges if product damaged
   - Issue fine for serious violations (reduces rating)
7. Record payment received
8. Close order

---

## Important Notes

⚠️ **Charges vs Fines:**
- **Charges:** Operational costs (damage, returns) - does NOT affect rating
- **Fines:** Behavioral penalties (fraud, abuse) - DOES reduce rating permanently

⚠️ **Rating Impact:**
- Fines permanently reduce buyer's rating
- Multiple fines can make buyer ineligible for premium features
- Rating is customer-facing metric affecting trust

⚠️ **Payment Collection:**
- Must be collected at doorstep (COD)
- Admin records payment in system
- Payment must match `totalWithCharges` amount

---

## Error Handling

```javascript
// Duplicate verification attempt
if (order.verificationCall.status !== 'pending') {
  return 'Already verified or rejected'
}

// Approval without verification
if (order.verificationCall.status !== 'completed') {
  return 'Verification must be completed first'
}

// Invalid amount
if (amount <= 0) {
  return 'Amount must be greater than 0'
}

// Invalid rating reduction
if (ratingReduction < 0 || ratingReduction > 5) {
  return 'Rating reduction must be 0-5'
}
```

---

## Testing Checklist

- [ ] Order created with COD only
- [ ] Verification status updates correctly
- [ ] Admin approval flow works
- [ ] Additional charges calculated correctly
- [ ] Fines reduce buyer rating
- [ ] Payment tracking works
- [ ] Timeline logs all events
- [ ] Authorization checks work
- [ ] Error handling for edge cases
- [ ] UI displays all statuses correctly
- [ ] Emails sent at each stage (optional integration)

---

## Future Enhancements

1. **Automatic Reminders:**
   - SMS/Email when verification is pending
   - Notification when order is approved
   - Delivery ETA updates

2. **Dispute Management:**
   - Buyer can contest fines
   - Admin can review and modify
   - Chat history logging

3. **Analytics:**
   - Verification completion rate
   - Order approval rate
   - Average time per stage
   - Fine issuance patterns

4. **Integrations:**
   - SMS notifications
   - Email confirmations
   - Call tracking system
   - Payment gateway (optional backup)

---

## Support & Troubleshooting

**Order Not Showing Verification Call Option?**
- Ensure admin user is logged in
- Check order status is `verification_pending`

**Charges Not Adding Up?**
- Check `chargesAmount` and `fineAmount` fields
- `totalWithCharges` auto-calculated on save

**Rating Not Updating?**
- Verify fine was issued successfully
- Check User model has rating field

**Timeline Not Showing Events?**
- Events auto-added on status change
- Check order.timeline array

---

**Last Updated:** April 2025
**Version:** 1.0
**Status:** Production Ready
