# Contact Form System - Implementation Guide

## Overview
A complete contact form system has been implemented allowing visitors to submit inquiries and admins to manage, view, and respond to all queries.

---

## System Architecture

### Data Flow Diagram
```
User -> Contact Form -> Backend API -> Database -> Email Service
                          ↓
                      Admin Dashboard -> Admin Response -> Email to User
```

### Components Breakdown

#### 1. Frontend - Contact Page (`/contact`)
- **File**: `F_1/src/pages/Contact.jsx`
- **Features**:
  - Form with fields: Name, Email, Phone, Inquiry Type, Message
  - 5 Inquiry Types: General, Support, Partnership, Farmer Partnership, Feedback
  - Form validation with error messages
  - Loading state during submission
  - Success confirmation displayed for 3 seconds
  - Automatic error clearing when user starts typing

#### 2. Frontend - Admin Queries Dashboard (`/admin/queries`)
- **File**: `F_1/src/pages/admin/AdminQueries.jsx`
- **Features**:
  - Real-time statistics: Total, New, Resolved, Pending
  - Advanced filtering by Status and Inquiry Type
  - Full-text search by name, email, message
  - Paginated list view (10 items per page)
  - Detail view with all query information
  - Response form with status selection
  - Email notification sent when responding
  - Soft delete support
  - Color-coded status badges
  - Color-coded inquiry type indicators

#### 3. Backend - Contact Query Model
- **File**: `backend/models/ContactQuery.js`
- **Database Schema**:
  ```javascript
  {
    name: String (required, 2-100 chars)
    email: String (required, valid email format)
    phone: String (optional, validated format)
    inquiryType: Enum (General|Support|Partnership|Farmer Partnership|Feedback)
    message: String (required, 10-5000 chars)
    status: Enum (New|Read|In Progress|Resolved|Closed) - default: New
    priority: Enum (Low|Medium|High|Urgent) - default: Medium
    adminResponse: {
      respondedBy: ObjectId(User)
      responseMessage: String
      respondedAt: Date
    }
    internalNotes: String (admin only)
    isDeleted: Boolean - default: false
    createdAt: Date (auto)
    updatedAt: Date (auto)
  }
  ```

#### 4. Backend - Controller Functions
- **File**: `backend/controllers/contactController.js`

**Public Endpoints:**
- `POST /api/contact/submit` - Submit new contact query
  - Validates required fields
  - Sets priority based on inquiry type
  - Sends confirmation email to user
  - Sends admin notification email
  - Returns: { success, message, data: { id, status } }

**Admin-Only Endpoints:**
- `GET /api/contact` - List all queries with pagination and filters
  - Query params: status, inquiryType, sortBy, order, page, limit
  - Returns: { success, data: [...], pagination: {...} }

- `GET /api/contact/:id` - Get single query detail
  - Auto marks as "Read" if status is "New"
  - Returns: { success, data: {...} }

- `PATCH /api/contact/:id` - Update query with admin response
  - Sends response email to user
  - Updates status automatically to "Resolved" if response provided
  - Returns: { success, message, data: {...} }

- `DELETE /api/contact/:id` - Soft delete query
  - Returns: { success, message }

- `GET /api/contact/search` - Full-text search
  - Query params: q (search term), type (optional inquiry type)
  - Returns: { success, data: [...], count }

- `GET /api/contact/stats` - Get statistics
  - Returns: { success, data: { total, newQueries, resolved, statusCounts, typeCounts } }

#### 5. Frontend - Service Layer
- **File**: `F_1/src/services/contactService.js`
- **Methods**:
  - `submitQuery(data)` - Submit form
  - `getAllQueries(params)` - Fetch with filters
  - `getQuery(id)` - Get details
  - `updateQuery(id, data)` - Send response
  - `deleteQuery(id)` - Delete
  - `searchQueries(q, type)` - Search
  - `getStats()` - Get statistics

#### 6. Routes
- **File**: `backend/routes/contactRoutes.js`
- Public submission route
- Admin-protected routes using `authenticate` and `authorize('Admin')`

---

## Workflow

### User Submits Form
1. User navigates to `/contact`
2. Fills form with:
   - Full name (required)
   - Email address (required)
   - Phone number (optional)
   - Inquiry type (required)
   - Message (required, min 10 chars)
3. Clicks "Send Message"
4. **Frontend validation**:
   - Checks all required fields
   - Validates message length
   - Displays error messages if invalid
5. **Form submitted to backend**: `POST /api/contact/submit`
6. **Backend processing**:
   - Saves to ContactQuery model
   - Sets status to "New"
   - Automatically sets priority based on inquiry type
7. **Emails sent**:
   - Confirmation email to user (HTML formatted)
   - Admin notification to ADMIN_EMAIL env variable
   - Admin email includes direct link to dashboard
8. **User feedback**: Success message displayed for 3 seconds

### Admin Views & Responds to Query
1. Admin logs in and navigates to Dashboard
2. Clicks "Queries" tab or "View Contact Queries" button
3. **AdminQueries page loads with**:
   - Statistics cards (Total, New, Resolved, Pending)
   - Filter options (Status, Inquiry Type)
   - Search box (searches name, email, message)
   - Paginated list of all queries
4. Admin can:
   - **Filter** by status and inquiry type
   - **Search** by keywords
   - **View details** by clicking View button
5. **In detail view**, admin can:
   - See full query information
   - Change status (Read, In Progress, Resolved, Closed)
   - Type response message
   - Click "Send Response"
6. **Backend updates query**:
   - Updates with admin response
   - Sets status to "Resolved"
   - Records respondedBy and respondedAt
   - Sends response email to user
7. **User receives email** with admin's response

---

## Email Templates

### User Confirmation Email
- Subject: "We've received your [Type] inquiry - FaRm"
- Contains: User name, Inquiry details, Next steps

### Admin Notification Email
- Subject: "New [Type] Inquiry - [Name] (FaRm)"
- Contains: Sender details, Full message, Link to admin dashboard

### Admin Response Email (to User)
- Subject: "Re: Your [Type] Inquiry - FaRm Team Response"
- Contains: Admin's response message, Professional sign-off

---

## Database Queries Performance

### Indexes Created
1. `{ email: 1, createdAt: -1 }` - Fast email lookups with time sorting
2. `{ status: 1, createdAt: -1 }` - Status filtering with time sort
3. `{ inquiryType: 1, createdAt: -1 }` - Type filtering with time sort
4. Text index on `name`, `email`, `message` for full-text search

### Virtuals Calculated
- `daysOld` - Days since query submission

---

## Error Handling

### Validation Errors
- Missing required fields
- Invalid email format
- Message too short (<10 chars)
- Phone format validation

### API Errors
- 400: Bad request (validation failed)
- 404: Query not found
- 500: Server error

### Frontend Error Display
- Red alert box with icon
- Clear error messages
- Automatic clearing on user input

---

## Testing Checklist

### Frontend Testing
- [ ] Contact form loads correctly
- [ ] Form validation works for all fields
- [ ] Loading spinner shows during submission
- [ ] Success message displays after submission
- [ ] Email field rejects invalid emails
- [ ] Message field rejects messages <10 chars
- [ ] Form clears after 3 seconds on success
- [ ] Admin Dashboard loads queries
- [ ] Filters work (Status, Inquiry Type)
- [ ] Search functionality works
- [ ] View Details opens detail panel
- [ ] Response form submits correctly
- [ ] Response email sent to user

### Backend Testing
- [ ] POST /api/contact/submit creates record
- [ ] GET /api/contact requires auth
- [ ] GET /api/contact requires Admin role
- [ ] Admin can filter by status
- [ ] Admin can filter by inquiry type
- [ ] Admin can search queries
- [ ] Admin can view single query
- [ ] Admin can update with response
- [ ] Query marked as Read on view
- [ ] Status auto-set to Resolved on response
- [ ] Emails sent on submission
- [ ] Emails sent on response
- [ ] Stats endpoint returns correct counts

### Database Testing
- [ ] ContactQuery documents created
- [ ] Indexes created and working
- [ ] Soft delete working (isDeleted flag)
- [ ] Timestamps updated correctly
- [ ] Text search indexes working

---

## Configuration

### Environment Variables
```bash
# Email Service
ADMIN_EMAIL=admin@farm.local
ADMIN_DASHBOARD_URL=http://localhost:3000

# Frontend API
VITE_API_URL=http://localhost:5000/api
```

### Permissions
- **Public**: Can submit contact form
- **Admin Only**: Can view, filter, search, and respond to queries

---

## Future Enhancements
- Email templates customization
- Auto-response templates for common inquiries
- Priority-based notification system
- Query categorization and tagging
- Bulk actions (mark as resolved, assign to admin)
- Query analytics and reporting
- ChatBot integration for instant responses
- Attachment support for queries and responses

---

## File Locations Summary

### Backend Files
- Model: `backend/models/ContactQuery.js`
- Controller: `backend/controllers/contactController.js`
- Routes: `backend/routes/contactRoutes.js`
- Server: `backend/server.js` (updated)

### Frontend Files
- Service: `F_1/src/services/contactService.js`
- Contact Page: `F_1/src/pages/Contact.jsx` (updated)
- Admin Page: `F_1/src/pages/admin/AdminQueries.jsx`
- Admin Dashboard: `F_1/src/pages/AdminDashboard.jsx` (updated)
- App Router: `F_1/src/App.jsx` (updated)

### Routes Added
- `POST /api/contact/submit` - Public submission
- `GET /api/contact` - Admin list
- `GET /api/contact/stats` - Admin stats
- `GET /api/contact/:id` - Admin detail
- `GET /api/contact/search` - Admin search
- `PATCH /api/contact/:id` - Admin response
- `DELETE /api/contact/:id` - Admin delete
- `/admin/queries` - Admin dashboard page

---

## Support
For issues or questions about this implementation, refer to:
- ContactQuery Model for data structure
- contactController.js for business logic
- contactService.js for frontend API calls
- AdminQueries.jsx for UI implementation
