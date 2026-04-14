# Order Lifecycle & Management

## 1. Complete Order State Machine

```
                          ┌─────────────────────────┐
                          │      ORDER CREATED      │
                          │  (Payment Processing)   │
                          └────────────┬────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
            Payment Success                      Payment Failed
                    │                                     │
                    ▼                                     ▼
          ┌──────────────────┐               ┌─────────────────────┐
          │   PENDING        │               │  PAYMENT_FAILED     │
          │ (Farmer Review)  │               │  (Awaiting Retry)   │
          └────────┬─────────┘               └──────┬──────────────┘
                   │                                │
        ┌──────────┴──────────┐          ┌──────────▼──────────┐
        │                     │          │  RETRY / TIMEOUT    │
        │              Farmer │          │  (After 24 hours)   │
        │              Reviews│          └─────────┬───────────┘
        │                     │                     │
    ACCEPTED          REJECTED              (CANCELLED)
        │                 │
        ▼                 ▼
  ┌──────────┐      ┌──────────────┐
  │ACCEPTED  │      │  REJECTED    │
  │(Preparing)│     │ (Refund Init)│
  └────┬─────┘      └──────┬───────┘
       │                   │
       │            Refund Processed
       │                   │
       │                   ▼
       │            ┌────────────────┐
       │            │    CANCELLED   │
       │            │   (Final State)│
       │            └────────────────┘
       │
       ▼
  ┌──────────────┐
  │   SHIPPED    │
  │ (In Transit) │
  └────┬─────────┘
       │
       ▼
  ┌──────────────┐     Buyer Claims Issue
  │ DELIVERED    │◄────────────────┐
  │ (At Buyer)   │                 │
  └────┬─────────┘          ┌──────┴────────┐
       │                    │               │
       │            DISPUTED          RESOLVED
       │         (Under Review)
       ▼
  ┌──────────────┐
  │ COMPLETED    │
  │ (Final State)│
  └──────────────┘
```

---

## 2. Order Status Definitions

### CREATED (Initial)
- **Duration:** 0-5 minutes
- **Description:** Order created, payment processing initiated
- **Buyer Visibility:** "Processing payment..."
- **Farmer Visibility:** Not visible yet
- **Actions Available:** Cancel (with refund)
- **Auto-Transition:** To PENDING (if payment success) or PAYMENT_FAILED (if payment failed)

### PAYMENT_FAILED (Transient)
- **Duration:** Variable
- **Description:** Payment gateway returned failure
- **Buyer Visibility:** "Payment failed. Retry?"
- **Actions Available:** Retry payment (once), Cancel (no refund needed)
- **Auto-Transition:** To CANCELLED (after 24 hours if not retried)

### PENDING (Active)
- **Duration:** Variable (typically 2-24 hours)
- **Description:** Order awaiting farmer's response
- **Farmer Visibility:** "New Order Request" badge
- **Next Status:** ACCEPTED or REJECTED
- **Notification:** SMS + Email to farmer
- **Actions Available:** Accept, Reject
- **Auto-Expire:** After 72 hours → CANCELLED + Refund

### ACCEPTED (Fulfillment Phase)
- **Duration:** 1-7 days
- **Description:** Farmer accepted order, preparing for shipment
- **Farmer Actions:** Update readiness, add tracking (when ready)
- **Buyer Visibility:** "Order confirmed, preparing..."
- **Notifications:** Email confirmation sent to buyer
- **Sub-states:**
  - Ready for Pickup/Delivery (farmer set)
  - Shipped (tracking added)
- **Auto-Transition:** To SHIPPED (when farmer updates)

### SHIPPED (In Transit)
- **Duration:** 1-7 days (depends on delivery mode)
- **Description:** Order in transit to buyer
- **Tracking Info:** Live location updates (if logistics integration)
- **Buyer Visibility:** "Order on the way" with tracking
- **Notifications:** Real-time location updates
- **Auto-Transition:** To DELIVERED (when delivery confirmation)

### DELIVERED (Completion Phase)
- **Duration:** 48-72 hours (review window)
- **Description:** Order reached buyer
- **Buyer Actions:** Confirm received, leave review
- **Farmer Visibility:** "Awaiting buyer confirmation"
- **Notifications:** "Your order has arrived"
- **Auto-Transition:** To COMPLETED (after buyer confirms or 72 hours)

### REJECTED (Cancellation Path)
- **Duration:** Immediate
- **Description:** Farmer rejected the order
- **Refund Process:** Initiated immediately
- **Notifications:** "Order rejected" email to buyer with reason
- **Transition:** To CANCELLED (after refund processing)

### DISPUTED (Issue Handling)
- **Duration:** 5-30 days
- **Description:** Buyer reported issue (quality, damage, incomplete)
- **Admin Involvement:** Required
- **Investigation:** Photos/evidence reviewed
- **Resolution Options:**
  - REFUNDED (full or partial)
  - Issue acknowledged, order accepted as-is
- **Transition:** To RESOLVED

### CANCELLED (Final)
- **Duration:** Final state
- **Description:** Order cancelled (buyer, farmer, or system)
- **Refund Status:** Completed or Not applicable
- **No Further Actions:** Cannot reopen

### COMPLETED (Final)
- **Duration:** Final state
- **Description:** Order successfully delivered and accepted
- **Review Status:** Can leave review
- **Archival:** Stored in order history

---

## 3. Order Lifecycle Detailed Flowchart

```
STEP 1: ORDER CREATION
├─ Buyer selects crops and quantities
├─ Adds delivery address
├─ Selects payment method
├─ Reviews order summary
├─ Initiates payment
└─ → CREATED state

STEP 2: PAYMENT PROCESSING
├─ Payment Gateway Validation
├─ Card/UPI Authorization
├─ If Success:
│  ├─ Payment confirmed
│  ├─ Transaction ID recorded
│  └─ → PENDING state (shown to farmer)
└─ If Failed:
   ├─ Refund reversal (if partial deduction)
   └─ → PAYMENT_FAILED state

STEP 3: FARMER NOTIFICATION & REVIEW
├─ Farmer receives "New Order Request" notification
├─ Farmer reviews:
│  ├─ Crop details
│  ├─ Quantity requested
│  ├─ Buyer details
│  ├─ Delivery address
│  └─ Total price
├─ Farmer Decision:
│  ├─ ACCEPT → ACCEPTED state
│  │  ├─ Order marked as accepted
│  │  ├─ Buyer notified
│  │  ├─ Crop quantity reserved
│  │  └─ Estimated ready date set
│  │
│  └─ REJECT → REJECTED state
│     ├─ Order marked as rejected
│     ├─ Refund initiated
│     ├─ Buyer notified with reason
│     └─ After refund → CANCELLED

STEP 4: FULFILLMENT (After Farmer Accepts)
├─ Farmer prepares order (packing, quality check)
├─ Once ready:
│  ├─ Marks "Ready for Pickup/Delivery"
│  ├─ Prepares shipping label
│  ├─ Chooses logistics partner
│  ├─ Creates shipment
│  └─ → SHIPPED state
│
└─ Buyer sees status update

STEP 5: DELIVERY TRACKING
├─ If Home Delivery:
│  ├─ Logistics partner picks up
│  ├─ Order scanned at various hubs
│  ├─ Real-time tracking available
│  ├─ Estimated delivery date shown
│  └─ Delivery partner notified
│
└─ If Pickup:
   ├─ Buyer notified order is ready
   ├─ Provided with pickup code
   ├─ Can pick up at farm/location
   └─ Farmer confirms pickup

STEP 6: DELIVERY COMPLETION
├─ Order delivered to buyer
├─ Buyer receives notification
├─ Buyer actions:
│  ├─ Confirm received (mandatory for review)
│  ├─ Add to cart immediately (quality check window)
│  └─ → DELIVERED state
│
├─ If Damaged/Incomplete:
│  ├─ Buyer reports issue
│  ├─ Provides photographic evidence
│  └─ → DISPUTED state
│
└─ Auto-complete after 72 hours if no action

STEP 7: REVIEW & RATING
├─ After buyer confirms delivery
├─ Buyer leaves review:
│  ├─ Crop quality rating (1-5)
│  ├─ Farmer behavior rating (1-5)
│  ├─ Written feedback
│  └─ Optional photos
│
├─ Farmer can respond to review
└─ → COMPLETED state

STEP 8: ISSUE RESOLUTION (If Disputed)
├─ Admin investigates
├─ Reviews buyer's evidence (photos)
├─ Contacts farmer for explanation
├─ Makes decision:
│  ├─ Refund Approved:
│  │  ├─ Calculate refund amount
│  │  ├─ Initiate refund to buyer
│  │  └─ Reduce farmer's earnings
│  │
│  └─ Refund Rejected:
│     ├─ Explain reason to buyer
│     └─ Close dispute
│
└─ → RESOLVED state

STEP 9: ARCHIVAL
├─ Order moved to history
├─ Financials settled
├─ Ratings and reviews finalized
└─ Analytics aggregated
```

---

## 4. Order Timeline Records

### Timeline Entry Structure

Each order maintains a timeline of status changes:

```javascript
{
  status: "accepted",
  timestamp: "2024-03-21T11:15:00Z",
  description: "Order accepted by farmer",
  updatedBy: {
    userId: "farmer_id",
    userType: "farmer",
    userName: "Rajesh Kumar"
  },
  metadata: {
    estimatedReadyDate: "2024-03-22T10:00:00Z",
    notes: "Will prepare early morning"
  }
}
```

### Full Timeline Example

```javascript
[
  {
    status: "pending",
    timestamp: "2024-03-21T10:30:00Z",
    description: "Order placed successfully",
    updatedBy: "system",
    metadata: { orderId: "ORD-2024-001234", amount: 1250 }
  },
  {
    status: "accepted",
    timestamp: "2024-03-21T11:15:00Z",
    description: "Order accepted by farmer",
    updatedBy: "farmer_rajesh",
    metadata: { estimatedReadyDate: "2024-03-22T10:00:00Z" }
  },
  {
    status: "shipped",
    timestamp: "2024-03-22T14:30:00Z",
    description: "Order shipped with Delhivery",
    updatedBy: "farmer_rajesh",
    metadata: { 
      trackingNumber: "DL123456789",
      provider: "Delhivery"
    }
  },
  {
    status: "delivered",
    timestamp: "2024-03-23T18:45:00Z",
    description: "Order delivered to buyer",
    updatedBy: "system",
    metadata: { deliveryTime: "18:45" }
  },
  {
    status: "completed",
    timestamp: "2024-03-24T10:00:00Z",
    description: "Order confirmed by buyer",
    updatedBy: "buyer_john",
    metadata: { reviewGiven: true }
  }
]
```

---

## 5. Order Lifecycle Timings

| State | Min Duration | Max Duration | Auto-transition |
|-------|---|---|---|
| CREATED | Immediate | 5 min | Yes (if payment resolves) |
| PAYMENT_FAILED | Immediate | 24 hours | Yes (to CANCELLED) |
| PENDING | Immediate | 72 hours | Yes (to CANCELLED with refund) |
| ACCEPTED | 1 hour | 7 days | No (manual transition to SHIPPED) |
| SHIPPED | 1 hour | 7 days | Auto-transition after delivery confirmation |
| DELIVERED | 1 second | 72 hours | Auto-transition to COMPLETED |
| DISPUTED | Immediate | 30 days | Manual (admin resolution) |
| CANCELLED/COMPLETED | - | - | Final state (no transition) |

---

## 6. Inventory Management During Order Lifecycle

```
WHEN ORDER STATUS CHANGES:

PENDING → No inventory change
         (Reservation happens but stock visible as sold)

ACCEPTED → Inventory decremented
          Quantity: Crop.quantity - Order.quantity
          ⚠️ Important: Only now is stock officially "sold"

REJECTED → Inventory incremented back
          Quantity: Crop.quantity + Order.quantity

CANCELLED → Inventory incremented back
           Quantity: Crop.quantity + Order.quantity

DELIVERED → No change (already decremented at ACCEPTED)

COMPLETED → No change (permanent sale)
```

### Stock Update Logic

```javascript
// When farmer accepts order
async acceptOrder(orderId) {
  const order = await Order.findById(orderId);
  const crop = await Crop.findById(order.items[0].cropId);
  
  // Decrease inventory
  crop.quantity -= order.items[0].quantity;
  if (crop.quantity <= 0) {
    crop.status = "sold_out";
  }
  
  // Update order status
  order.status = "accepted";
  order.timeline.push(timelineEntry);
  
  await crop.save();
  await order.save();
  
  // Notify buyer
  await notificationService.sendOrderAccepted(order);
}

// When order is rejected or cancelled
async rejectOrder(orderId, reason) {
  const order = await Order.findById(orderId);
  const crop = await Crop.findById(order.items[0].cropId);
  
  // Restore inventory
  crop.quantity += order.items[0].quantity;
  crop.status = "available";
  
  // Update order
  order.status = "rejected";
  order.cancellationReason = reason;
  
  // Process refund
  await paymentService.processRefund(order);
  
  await crop.save();
  await order.save();
}
```

---

## 7. Refund Processing

### Refund Types

```
Full Refund:
  Reason: Payment failed, order rejected, dispute lost by farmer
  Amount: 100% of order value + delivery charges
  Timeline: 3-5 business days to appear in buyer's account

Partial Refund:
  Reason: Some items damaged, partial dispute settlement
  Amount: Per admin decision
  Timeline: 3-5 business days

No Refund:
  Reason: Buyer dispute rejected, order accepted by buyer
  Amount: 0
  Timeline: N/A
```

### Refund Workflow

```
REFUND TRIGGERED
    ↓
VALIDATE TRANSACTION
├─ Check if original payment successful
├─ Check if already refunded
└─ Verify refund amount
    ↓
PROCESS REFUND
├─ Call payment gateway API
├─ Provide transaction ID & refund amount
├─ Get refund confirmation ID
└─ Store in database
    ↓
RECORD TRANSACTION
├─ Create refund transaction record
├─ Mark original transaction as refunded
├─ Update order payment status
└─ Add timeline entry
    ↓
NOTIFY PARTIES
├─ Email to buyer with refund details
├─ Email to farmer with refund deduction
├─ SMS confirmation
└─ In-app notification
    ↓
SETTLEMENT
├─ Bank processes return within 3-5 days
├─ Money appears in buyer's account
└─ Refund complete
```

---

## 8. Payment-Related Order Workflows

### Card/UPI Payment

```
Create Order
    ↓
Initiate Payment (POST /payments/initiate)
    ├─ Generate payment ID
    ├─ Create payment record
    └─ Redirect to payment page
    ↓
Customer Completes Payment
    ├─ Enters card details / Scans QR / UPI ID
    ├─ Confirms OTP
    └─ Payment gateway processes
    ↓
Payment Gateway Callback
    ├─ Return to our server webhook
    ├─ Verify signature
    ├─ Check transaction ID
    └─ Confirm payment status
    ↓
Order Status Update
    ├─ If Success: Order → PENDING
    ├─ If Failure: Order → PAYMENT_FAILED
    └─ If Pending: Order → CREATED (waiting)
    ↓
Send Confirmation
    ├─ Email to buyer
    ├─ Show order details
    └─ Redirect to order tracking page
```

### Wallet Payment

```
Buyer Initiates Order
    ↓
Check Wallet Balance
    ├─ If Sufficient: Deduct from wallet → PENDING
    └─ If Insufficient: Require top-up first
    ↓
Process Deduction
    ├─ Create wallet transaction
    ├─ Update wallet balance
    └─ Create order with payment_status: completed
    ↓
Order → PENDING
    └─ Show to farmer
```

---

## 9. Special Order Scenarios

### Bulk Orders (Multiple Crops from Same Farmer)

```
Buyer Scenario:
  - Selects crop A (qty: 5)
  - Adds crop B (qty: 3)
  - Both from Farmer X
  - Checkout → SINGLE ORDER with multiple items

Order Structure:
{
  items: [
    { cropId: A, quantity: 5, price: X },
    { cropId: B, quantity: 3, price: Y }
  ],
  farmerId: X,
  totalAmount: X + Y
}

Farmer Actions:
  - Accept/Reject entire order
  - Not individual crops
  - Mark entire order as shipped
  - One shipment with multiple crops
```

### Orders from Multiple Farmers

```
Buyer Scenario:
  - Cart has crops from Farmer A, B, C
  - Checkout

System Result:
  - System creates 3 SEPARATE orders
  Order 1: Items from Farmer A → PENDING
  Order 2: Items from Farmer B → PENDING
  Order 3: Items from Farmer C → PENDING
  
  - Single payment for total
  - Multiple farmer notifications
  - Track 3 orders separately

Benefits:
  - Farmers don't know about other orders
  - Can accept/reject independently
  - Separate shipping logistics
```

### Seasonal/Pre-order Orders

```
Regular Order: IMMEDIATE availability

Pre-order:
  - Buyer orders in advance (e.g., April availability)
  - Order → CREATED (payment authorized but not charged)
  - Hold for 30 days
  - 15 days before delivery:
    ├─ Charge payment card
    ├─ Notify farmer
    └─ Transition to PENDING
  - Continue normal flow

Seasonal Order:
  - Specific crop in specific season
  - Auto-listing when season starts
  - Buyer adds to cart
  - Regular order flow applies
```

---

## 10. Order Analytics & Metrics

### Order Status Distribution

```
Total Orders: 10,000
├─ Completed: 8,500 (85%) ✅
├─ Pending: 300 (3%)    (Awaiting farmer)
├─ Shipped: 800 (8%)    (In transit)
├─ Cancelled: 300 (3%)  (Refunded)
├─ Disputed: 100 (1%)   (Under review)
└─ Failed: 0 (0%)
```

### Order Conversion Metrics

```
Orders Created   → 10,500 (all payment attempts)
Payment Success  → 10,200 (97.1% success rate)
Payment Failed   → 300 (2.9% failure rate)
Farmer Accepted  → 9,000 (88.2% of successful payments)
Farmer Rejected  → 1,200 (11.8% rejection rate)
Successfully Delivered → 8,500 (94.4% of accepted)
Disputes         → 150 (1.6% of delivered)
Completed        → 8,350 (98.2% of disputes resolved)
```

### Order Value Metrics

```
Average Order Value    → ₹850
Maximum Order Value    → ₹50,000
Minimum Order Value    → ₹50
Median Order Value     → ₹600
Total Revenue          → ₹85,000,000
Total Refunded         → ₹2,125,000 (2.5%)
Net Revenue            → ₹82,875,000
```

---

## 11. Order Notifications Sequence

### Buyer Notification Timeline

```
1. Payment Initiated
   "Payment authorization started"

2. Payment Successful
   "✓ Payment confirmed. Order #ORD-2024-001234 created"

3. Farmer Accepted
   "✓ Your order has been confirmed by Farmer Rajesh"
   "Expected delivery: March 25"

4. Order Shipped
   "📦 Your order is on the way!"
   "Tracking: DL123456789"

5. Order Delivered
   "✓ Your order has been delivered"
   "Confirm receipt to proceed"

6. Request for Review
   "Please rate your purchase and help us improve"

7. Order Completed
   "✓ Order complete. Thank you for shopping!"
```

### Farmer Notification Timeline

```
1. New Order Request
   "New Order! 📦 John ordered 5kg Tomatoes for ₹250"
   "Action needed within 72 hours"

2. Order Rejected (if)
   "Order ORD-2024-001234 was rejected by buyer"
   "Reason: [reason]"

3. Ready to Confirm
   Reminder: "Order ORD-2024-001234 marked ready?
   "Continue to shipping when prepared"

4. Order Traced
   "Order ORD-2024-001234 delivered to buyer"
   "Awaiting buyer confirmation..."

5. Review Received
   "4.5 ⭐ Review from John"
   "Great quality tomatoes, fresh and delivered on time!"
```

---

This comprehensive order lifecycle documentation ensures clear understanding of the entire order process from creation to completion.
