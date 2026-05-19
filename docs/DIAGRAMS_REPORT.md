# Rural Farmer Marketplace — Diagrams Report

> **All diagrams use white background styling for clear visibility in printed reports and presentations.**

---

## Table of Contents

1. [System Architecture Diagram](#1-system-architecture-diagram)
2. [DFD Level 0 — Context Diagram](#2-dfd-level-0--context-diagram)
3. [DFD Level 1 — Major Processes](#3-dfd-level-1--major-processes)
4. [DFD Level 2 — Detailed Sub-Processes](#4-dfd-level-2--detailed-sub-processes)
   - [4.1 User Authentication (Process 1)](#41-user-authentication-process-1)
   - [4.2 Crop Marketplace (Process 2)](#42-crop-marketplace-process-2)
   - [4.3 Order Management (Process 3)](#43-order-management-process-3)
   - [4.4 Admin Moderation (Process 4)](#44-admin-moderation-process-4)
   - [4.5 Combined DFD Level 2 (Simplified)](#45-combined-dfd-level-2--all-sub-processes-simplified)
5. [Use Case Diagram](#5-use-case-diagram)
6. [Full System Test Cases](#6-full-system-test-cases)
   - [6.1 P1 — Auth & Profile](#61-p1--user-authentication--profile-management)
   - [6.2 P2 — Marketplace & Inventory](#62-p2--crop-marketplace--inventory)
   - [6.3 P3 — Order Management](#63-p3--order-management--fulfillment)
   - [6.4 P5 — Admin Moderation](#64-p5--admin-moderation--analytics)
   - [6.5 Cross-Process Integration](#65-cross-process-integration-tests)
7. [Summary of Diagrams](#summary-of-diagrams)

---

## 1. System Architecture Diagram

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'background': '#FFFFFF', 'primaryColor': '#E8F5E9', 'primaryTextColor': '#1B5E20', 'primaryBorderColor': '#4CAF50', 'lineColor': '#2E7D32', 'fontSize': '14px'}}}%%
graph TB
    FARMER["🌾 Farmer"] --> CLIENT
    BUYER["🛒 Buyer"] --> CLIENT
    ADMIN["⚙️ Admin"] --> CLIENT

    CLIENT["🖥️ React SPA (Vite)<br/>Pages | Components | Context API | Hooks"]

    CLIENT -->|"REST API"| GATEWAY

    GATEWAY["🔐 Middleware<br/>JWT Auth | CORS | RBAC | Validation"]

    GATEWAY --> BACKEND

    BACKEND["⚡ Node.js + Express.js<br/>Routes | Controllers | Models | Socket.io"]

    BACKEND -->|"Mongoose"| MONGODB
    BACKEND --> STORAGE
    BACKEND --> EMAIL

    MONGODB[("🍃 MongoDB Atlas")]
    STORAGE["🗄️ DigitalOcean Spaces"]
    EMAIL["📧 Email Service"]

    style FARMER fill:#FFFFFF,stroke:#4CAF50,stroke-width:2px,color:#1B5E20
    style BUYER fill:#FFFFFF,stroke:#FF9800,stroke-width:2px,color:#E65100
    style ADMIN fill:#FFFFFF,stroke:#9C27B0,stroke-width:2px,color:#4A148C
    style CLIENT fill:#E8F5E9,stroke:#4CAF50,stroke-width:2px,color:#1B5E20
    style GATEWAY fill:#FFF3E0,stroke:#FF9800,stroke-width:2px,color:#E65100
    style BACKEND fill:#E3F2FD,stroke:#2196F3,stroke-width:2px,color:#0D47A1
    style MONGODB fill:#F3E5F5,stroke:#9C27B0,stroke-width:2px,color:#4A148C
    style STORAGE fill:#FCE4EC,stroke:#E91E63,stroke-width:2px,color:#880E4F
    style EMAIL fill:#FCE4EC,stroke:#E91E63,stroke-width:2px,color:#880E4F
```

---

## 2. DFD Level 0 — Context Diagram

**The entire "Rural Farmer Marketplace" system as a single process, showing all external entities and data flows.**

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'background': '#FFFFFF', 'primaryColor': '#E3F2FD', 'primaryTextColor': '#0D47A1', 'primaryBorderColor': '#1565C0', 'lineColor': '#1565C0', 'fontSize': '14px'}}}%%
graph LR
    FARMER["🌾 Farmer<br/><i>External Entity</i>"]
    BUYER["🛒 Buyer<br/><i>External Entity</i>"]
    ADMIN["⚙️ Admin<br/><i>External Entity</i>"]

    SYSTEM["🏪 Rural Farmer Marketplace<br/>━━━━━━━━━━━━━━━━━━━━━<br/>MERN Stack Platform<br/>Process: 0<br/>━━━━━━━━━━━━━━━━━━━━━"]

    FARMER -->|"📋 Crop Listings, Farm Details<br/>✅ Accept/Reject Orders<br/>📊 View Analytics"| SYSTEM
    SYSTEM -->|"📦 Order Notifications<br/>💰 Earnings Reports<br/>📈 Performance Data"| FARMER

    BUYER -->|"🔍 Search & Browse Crops<br/>🛒 Place Orders, Reviews<br/>❤️ Wishlist Actions"| SYSTEM
    SYSTEM -->|"🌾 Crop Listings & Prices<br/>📦 Order Status Updates<br/>⭐ Review Confirmations"| BUYER

    ADMIN -->|"👥 User Management<br/>📋 Listing Moderation<br/>📊 Report Requests"| SYSTEM
    SYSTEM -->|"📈 Analytics & Reports<br/>⚠️ Dispute Alerts<br/>📋 Pending Approvals"| ADMIN

    style FARMER fill:#FFFFFF,stroke:#4CAF50,stroke-width:2px,color:#1B5E20
    style BUYER fill:#FFFFFF,stroke:#FF9800,stroke-width:2px,color:#E65100
    style ADMIN fill:#FFFFFF,stroke:#9C27B0,stroke-width:2px,color:#4A148C
    style SYSTEM fill:#E3F2FD,stroke:#1565C0,stroke-width:3px,color:#0D47A1
```

---

## 3. DFD Level 1 — Major Processes

**Decomposition of the system into 5 major processes with data stores.**

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'background': '#FFFFFF', 'primaryColor': '#E8F5E9', 'primaryTextColor': '#1B5E20', 'primaryBorderColor': '#4CAF50', 'lineColor': '#2E7D32', 'fontSize': '13px'}}}%%
graph TB
    FARMER["🌾 Farmer"]
    BUYER["🛒 Buyer"]
    ADMIN["⚙️ Admin"]

    subgraph SYSTEM["Rural Farmer Marketplace — Level 1 DFD"]
        direction TB

        P1["P1<br/>🔐 User Authentication<br/>& Profile Management"]
        P2["P2<br/>🌾 Crop Marketplace<br/>& Inventory"]
        P3["P3<br/>📦 Order Management<br/>& Fulfillment"]
        P4["P4<br/>⭐ Review & Rating<br/>System"]
        P5["P5<br/>⚙️ Admin Moderation<br/>& Analytics"]

        D1[("🗄️ D1<br/>Users Store")]
        D2[("🗄️ D2<br/>Crops Store")]
        D3[("🗄️ D3<br/>Orders Store")]
        D4[("🗄️ D4<br/>Reviews Store")]
        D5[("🗄️ D5<br/>Notifications<br/>Store")]
    end

    FARMER -->|"Register/Login, Farm Details"| P1
    BUYER -->|"Register/Login, Profile"| P1
    ADMIN -->|"Login, Manage Users"| P1
    P1 --> D1

    FARMER -->|"Add/Edit/Delete Crops"| P2
    BUYER -->|"Browse, Search, Filter"| P2
    P2 --> D2
    P2 --> D1

    BUYER -->|"Place Order, Track"| P3
    FARMER -->|"Accept/Reject, Fulfill"| P3
    P3 --> D3
    P3 --> D2
    P3 --> D5

    BUYER -->|"Submit Review"| P4
    P4 --> D4
    P4 --> D3

    ADMIN -->|"Moderate Listings, Users"| P5
    ADMIN -->|"View Analytics, Reports"| P5
    P5 --> D1
    P5 --> D2
    P5 --> D3
    P5 --> D4

    P1 -.->|"Notify"| D5
    P2 -.->|"Notify"| D5
    P3 -.->|"Notify"| D5
    P4 -.->|"Notify"| D5

    style FARMER fill:#FFFFFF,stroke:#4CAF50,stroke-width:2px,color:#1B5E20
    style BUYER fill:#FFFFFF,stroke:#FF9800,stroke-width:2px,color:#E65100
    style ADMIN fill:#FFFFFF,stroke:#9C27B0,stroke-width:2px,color:#4A148C
    style SYSTEM fill:#FAFAFA,stroke:#333,stroke-width:1px,color:#000
    style P1 fill:#E8F5E9,stroke:#4CAF50,stroke-width:2px,color:#1B5E20
    style P2 fill:#FFF3E0,stroke:#FF9800,stroke-width:2px,color:#E65100
    style P3 fill:#E3F2FD,stroke:#2196F3,stroke-width:2px,color:#0D47A1
    style P4 fill:#F3E5F5,stroke:#9C27B0,stroke-width:2px,color:#4A148C
    style P5 fill:#FCE4EC,stroke:#E91E63,stroke-width:2px,color:#880E4F
    style D1 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D2 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D3 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D4 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D5 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
```

---

## 4. DFD Level 2 — Detailed Sub-Processes

### 4.1 User Authentication (Process 1)

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'background': '#FFFFFF', 'primaryColor': '#E8F5E9', 'primaryTextColor': '#1B5E20', 'primaryBorderColor': '#4CAF50', 'lineColor': '#2E7D32', 'fontSize': '12px'}}}%%
graph TB
    FARMER["🌾 Farmer"]
    BUYER["🛒 Buyer"]
    ADMIN["⚙️ Admin"]

    subgraph P1_DECOMP["P1 — User Authentication & Profile Management"]
        P1_1["P1.1<br/>📝 Register<br/>Account"]
        P1_2["P1.2<br/>🔑 Login /<br/>JWT Issue"]
        P1_3["P1.3<br/>📧 Email<br/>Verification"]
        P1_4["P1.4<br/>👤 Profile<br/>Management"]
        P1_5["P1.5<br/>🔄 Password<br/>Reset"]
        P1_6["P1.6<br/>🛡️ KYC<br/>Verification"]
    end

    D1[("🗄️ D1 — Users Store")]
    D5[("🗄️ D5 — Notifications Store")]

    FARMER -->|"Registration Data"| P1_1
    BUYER -->|"Registration Data"| P1_1
    P1_1 -->|"Create User"| D1
    P1_1 -->|"Send Verification"| P1_3

    FARMER -->|"Email + Password"| P1_2
    BUYER -->|"Email + Password"| P1_2
    ADMIN -->|"Email + Password"| P1_2
    P1_2 -->|"Verify Credentials"| D1
    P1_2 -->|"Issue JWT Token"| D1

    P1_3 -->|"Verify Email Token"| D1
    P1_3 -->|"Confirmation"| D5

    FARMER -->|"Update Farm Profile"| P1_4
    BUYER -->|"Update Profile, Addresses"| P1_4
    P1_4 -->|"Save Changes"| D1

    FARMER -->|"Forgot Password"| P1_5
    BUYER -->|"Forgot Password"| P1_5
    P1_5 -->|"Reset Token"| D1
    P1_5 -->|"Send Reset Email"| D5

    FARMER -->|"Upload KYC Docs"| P1_6
    ADMIN -->|"Approve/Reject KYC"| P1_6
    P1_6 -->|"Update KYC Status"| D1
    P1_6 -->|"Notify Result"| D5

    style FARMER fill:#FFFFFF,stroke:#4CAF50,stroke-width:2px,color:#1B5E20
    style BUYER fill:#FFFFFF,stroke:#FF9800,stroke-width:2px,color:#E65100
    style ADMIN fill:#FFFFFF,stroke:#9C27B0,stroke-width:2px,color:#4A148C
    style P1_DECOMP fill:#FAFAFA,stroke:#333,stroke-width:1px,color:#000
    style P1_1 fill:#E8F5E9,stroke:#4CAF50,stroke-width:1.5px,color:#1B5E20
    style P1_2 fill:#E8F5E9,stroke:#4CAF50,stroke-width:1.5px,color:#1B5E20
    style P1_3 fill:#E8F5E9,stroke:#4CAF50,stroke-width:1.5px,color:#1B5E20
    style P1_4 fill:#E8F5E9,stroke:#4CAF50,stroke-width:1.5px,color:#1B5E20
    style P1_5 fill:#E8F5E9,stroke:#4CAF50,stroke-width:1.5px,color:#1B5E20
    style P1_6 fill:#E8F5E9,stroke:#4CAF50,stroke-width:1.5px,color:#1B5E20
    style D1 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D5 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
```

### 4.2 Crop Marketplace (Process 2)

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'background': '#FFFFFF', 'primaryColor': '#FFF3E0', 'primaryTextColor': '#E65100', 'primaryBorderColor': '#FF9800', 'lineColor': '#E65100', 'fontSize': '12px'}}}%%
graph TB
    FARMER["🌾 Farmer"]
    BUYER["🛒 Buyer"]

    subgraph P2_DECOMP["P2 — Crop Marketplace & Inventory"]
        P2_1["P2.1<br/>➕ Add New<br/>Crop Listing"]
        P2_2["P2.2<br/>✏️ Edit /<br/>Delete Crop"]
        P2_3["P2.3<br/>🔍 Search &<br/>Filter Crops"]
        P2_4["P2.4<br/>📋 View Crop<br/>Details"]
        P2_5["P2.5<br/>❤️ Wishlist<br/>Management"]
        P2_6["P2.6<br/>📊 Inventory<br/>Tracking"]
    end

    D1[("🗄️ D1 — Users Store")]
    D2[("🗄️ D2 — Crops Store")]
    D5[("🗄️ D5 — Notifications Store")]

    FARMER -->|"Crop Name, Price, Qty, Images"| P2_1
    P2_1 -->|"Save Listing"| D2
    P2_1 -->|"Link to Farmer"| D1

    FARMER -->|"Update/Delete Crop"| P2_2
    P2_2 -->|"Modify/Remove"| D2
    P2_2 -->|"Check Active Orders"| D2

    BUYER -->|"Search Keywords, Filters"| P2_3
    P2_3 -->|"Query Crops"| D2
    P2_3 -->|"Return Results"| BUYER

    BUYER -->|"Select Crop"| P2_4
    P2_4 -->|"Fetch Crop + Farmer"| D2
    P2_4 -->|"Fetch Reviews"| D1

    BUYER -->|"Add/Remove Wishlist"| P2_5
    P2_5 -->|"Update Wishlist"| D1

    FARMER -->|"View Stock Levels"| P2_6
    P2_6 -->|"Query Inventory"| D2
    P2_6 -->|"Low Stock Alert"| D5

    style FARMER fill:#FFFFFF,stroke:#4CAF50,stroke-width:2px,color:#1B5E20
    style BUYER fill:#FFFFFF,stroke:#FF9800,stroke-width:2px,color:#E65100
    style P2_DECOMP fill:#FAFAFA,stroke:#333,stroke-width:1px,color:#000
    style P2_1 fill:#FFF3E0,stroke:#FF9800,stroke-width:1.5px,color:#E65100
    style P2_2 fill:#FFF3E0,stroke:#FF9800,stroke-width:1.5px,color:#E65100
    style P2_3 fill:#FFF3E0,stroke:#FF9800,stroke-width:1.5px,color:#E65100
    style P2_4 fill:#FFF3E0,stroke:#FF9800,stroke-width:1.5px,color:#E65100
    style P2_5 fill:#FFF3E0,stroke:#FF9800,stroke-width:1.5px,color:#E65100
    style P2_6 fill:#FFF3E0,stroke:#FF9800,stroke-width:1.5px,color:#E65100
    style D1 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D2 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D5 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
```

### 4.3 Order Management (Process 3)

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'background': '#FFFFFF', 'primaryColor': '#E3F2FD', 'primaryTextColor': '#0D47A1', 'primaryBorderColor': '#2196F3', 'lineColor': '#1565C0', 'fontSize': '12px'}}}%%
graph TB
    FARMER["🌾 Farmer"]
    BUYER["🛒 Buyer"]

    subgraph P3_DECOMP["P3 — Order Management & Fulfillment"]
        P3_1["P3.1<br/>🛒 Cart &<br/>Checkout"]
        P3_2["P3.2<br/>💳 Payment<br/>Processing"]
        P3_3["P3.3<br/>✅ Order<br/>Accept/Reject"]
        P3_4["P3.4<br/>🚚 Order<br/>Fulfillment"]
        P3_5["P3.5<br/>📦 Delivery<br/>Tracking"]
        P3_6["P3.6<br/>↩️ Cancel /<br/>Refund"]
    end

    D2[("🗄️ D2 — Crops Store")]
    D3[("🗄️ D3 — Orders Store")]
    D5[("🗄️ D5 — Notifications Store")]

    BUYER -->|"Select Items, Qty, Address"| P3_1
    P3_1 -->|"Validate Stock"| D2
    P3_1 -->|"Create Order"| P3_2

    P3_2 -->|"Process Payment (COD/Online)"| P3_3
    P3_2 -->|"Save Order"| D3

    FARMER -->|"Accept or Reject"| P3_3
    P3_3 -->|"Update Status"| D3
    P3_3 -->|"Notify Buyer"| D5
    P3_3 -->|"Decrement Stock"| D2

    FARMER -->|"Mark Ready/Shipped"| P3_4
    P3_4 -->|"Update Status"| D3
    P3_4 -->|"Notify Buyer"| D5

    BUYER -->|"Track Order"| P3_5
    FARMER -->|"Update Location"| P3_5
    P3_5 -->|"Fetch Status"| D3

    BUYER -->|"Cancel Request"| P3_6
    FARMER -->|"Cancel Request"| P3_6
    P3_6 -->|"Update Status"| D3
    P3_6 -->|"Restore Stock"| D2
    P3_6 -->|"Notify"| D5

    style FARMER fill:#FFFFFF,stroke:#4CAF50,stroke-width:2px,color:#1B5E20
    style BUYER fill:#FFFFFF,stroke:#FF9800,stroke-width:2px,color:#E65100
    style P3_DECOMP fill:#FAFAFA,stroke:#333,stroke-width:1px,color:#000
    style P3_1 fill:#E3F2FD,stroke:#2196F3,stroke-width:1.5px,color:#0D47A1
    style P3_2 fill:#E3F2FD,stroke:#2196F3,stroke-width:1.5px,color:#0D47A1
    style P3_3 fill:#E3F2FD,stroke:#2196F3,stroke-width:1.5px,color:#0D47A1
    style P3_4 fill:#E3F2FD,stroke:#2196F3,stroke-width:1.5px,color:#0D47A1
    style P3_5 fill:#E3F2FD,stroke:#2196F3,stroke-width:1.5px,color:#0D47A1
    style P3_6 fill:#E3F2FD,stroke:#2196F3,stroke-width:1.5px,color:#0D47A1
    style D2 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D3 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D5 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
```

### 4.4 Admin Moderation (Process 5)

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'background': '#FFFFFF', 'primaryColor': '#FCE4EC', 'primaryTextColor': '#880E4F', 'primaryBorderColor': '#E91E63', 'lineColor': '#AD1457', 'fontSize': '12px'}}}%%
graph TB
    ADMIN["⚙️ Admin"]

    subgraph P5_DECOMP["P5 — Admin Moderation & Analytics"]
        P5_1["P5.1<br/>👥 User<br/>Management"]
        P5_2["P5.2<br/>📋 Listing<br/>Moderation"]
        P5_3["P5.3<br/>📦 Order<br/>Monitoring"]
        P5_4["P5.4<br/>⚠️ Dispute<br/>Resolution"]
        P5_5["P5.5<br/>📊 Analytics &<br/>Reporting"]
        P5_6["P5.6<br/>🔧 System<br/>Settings"]
    end

    D1[("🗄️ D1 — Users Store")]
    D2[("🗄️ D2 — Crops Store")]
    D3[("🗄️ D3 — Orders Store")]
    D4[("🗄️ D4 — Reviews Store")]
    D5[("🗄️ D5 — Notifications Store")]

    ADMIN -->|"View/Edit/Suspend Users"| P5_1
    P5_1 -->|"CRUD Users"| D1
    P5_1 -->|"Notify User"| D5

    ADMIN -->|"Approve/Reject Listings"| P5_2
    P5_2 -->|"Update Crop Status"| D2
    P5_2 -->|"Notify Farmer"| D5

    ADMIN -->|"Monitor All Orders"| P5_3
    P5_3 -->|"Query Orders"| D3
    P5_3 -->|"Send Reminders"| D5

    ADMIN -->|"Resolve Disputes"| P5_4
    P5_4 -->|"Review Evidence"| D3
    P5_4 -->|"Process Refund"| D3
    P5_4 -->|"Notify Parties"| D5

    ADMIN -->|"Generate Reports"| P5_5
    P5_5 -->|"Aggregate Data"| D1
    P5_5 -->|"Aggregate Data"| D2
    P5_5 -->|"Aggregate Data"| D3
    P5_5 -->|"Aggregate Data"| D4

    ADMIN -->|"Configure Platform"| P5_6
    P5_6 -->|"Update Settings"| D1

    style ADMIN fill:#FFFFFF,stroke:#9C27B0,stroke-width:2px,color:#4A148C
    style P5_DECOMP fill:#FAFAFA,stroke:#333,stroke-width:1px,color:#000
    style P5_1 fill:#FCE4EC,stroke:#E91E63,stroke-width:1.5px,color:#880E4F
    style P5_2 fill:#FCE4EC,stroke:#E91E63,stroke-width:1.5px,color:#880E4F
    style P5_3 fill:#FCE4EC,stroke:#E91E63,stroke-width:1.5px,color:#880E4F
    style P5_4 fill:#FCE4EC,stroke:#E91E63,stroke-width:1.5px,color:#880E4F
    style P5_5 fill:#FCE4EC,stroke:#E91E63,stroke-width:1.5px,color:#880E4F
    style P5_6 fill:#FCE4EC,stroke:#E91E63,stroke-width:1.5px,color:#880E4F
    style D1 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D2 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D3 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D4 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D5 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
```

---

## 4.5 Combined DFD Level 2 — All Sub-Processes (Simplified)

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'background': '#FFFFFF', 'primaryColor': '#E8F5E9', 'primaryTextColor': '#1B5E20', 'primaryBorderColor': '#4CAF50', 'lineColor': '#2E7D32', 'fontSize': '11px'}}}%%
graph TB
    FARMER["🌾 Farmer"]
    BUYER["🛒 Buyer"]
    ADMIN["⚙️ Admin"]

    subgraph P1["P1 — Auth & Profile"]
        P1_1["Register"]
        P1_2["Login / JWT"]
        P1_3["Email Verify"]
        P1_4["Profile Mgmt"]
        P1_5["Password Reset"]
        P1_6["KYC Verify"]
    end

    subgraph P2["P2 — Marketplace"]
        P2_1["Add Crop"]
        P2_2["Edit/Delete"]
        P2_3["Search & Filter"]
        P2_4["View Details"]
        P2_5["Wishlist"]
        P2_6["Inventory"]
    end

    subgraph P3["P3 — Orders"]
        P3_1["Cart/Checkout"]
        P3_2["Payment"]
        P3_3["Accept/Reject"]
        P3_4["Fulfillment"]
        P3_5["Tracking"]
        P3_6["Cancel/Refund"]
    end

    subgraph P5["P5 — Admin"]
        P5_1["User Mgmt"]
        P5_2["Listing Mod"]
        P5_3["Order Monitor"]
        P5_4["Disputes"]
        P5_5["Analytics"]
        P5_6["Settings"]
    end

    D1[("🗄️ D1 — Users")]
    D2[("🗄️ D2 — Crops")]
    D3[("🗄️ D3 — Orders")]
    D4[("🗄️ D4 — Reviews")]
    D5[("🗄️ D5 — Notifications")]

    FARMER --> P1_1 & P1_2 & P1_4 & P1_5 & P1_6
    BUYER --> P1_1 & P1_2 & P1_4 & P1_5
    ADMIN --> P1_2 & P1_6 & P5_1 & P5_2 & P5_3 & P5_4 & P5_5 & P5_6

    FARMER --> P2_1 & P2_2 & P2_6
    BUYER --> P2_3 & P2_4 & P2_5

    BUYER --> P3_1 & P3_5 & P3_6
    FARMER --> P3_3 & P3_4 & P3_6

    P1_1 & P1_2 & P1_3 & P1_4 & P1_5 & P1_6 --> D1
    P1_3 & P1_5 & P1_6 --> D5

    P2_1 & P2_2 & P2_3 & P2_4 & P2_6 --> D2
    P2_1 & P2_5 --> D1
    P2_6 --> D5

    P3_1 --> D2
    P3_2 & P3_3 & P3_4 & P3_5 & P3_6 --> D3
    P3_3 & P3_4 & P3_6 --> D5
    P3_3 & P3_6 --> D2

    P5_1 --> D1
    P5_2 --> D2
    P5_3 & P5_4 --> D3
    P5_4 --> D4
    P5_5 --> D1 & D2 & D3 & D4
    P5_6 --> D1
    P5_1 & P5_2 & P5_3 & P5_4 --> D5

    style FARMER fill:#FFFFFF,stroke:#4CAF50,stroke-width:2px,color:#1B5E20
    style BUYER fill:#FFFFFF,stroke:#FF9800,stroke-width:2px,color:#E65100
    style ADMIN fill:#FFFFFF,stroke:#9C27B0,stroke-width:2px,color:#4A148C
    style P1 fill:#E8F5E9,stroke:#4CAF50,stroke-width:1.5px,color:#1B5E20
    style P2 fill:#FFF3E0,stroke:#FF9800,stroke-width:1.5px,color:#E65100
    style P3 fill:#E3F2FD,stroke:#2196F3,stroke-width:1.5px,color:#0D47A1
    style P5 fill:#FCE4EC,stroke:#E91E63,stroke-width:1.5px,color:#880E4F
    style D1 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D2 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D3 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D4 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
    style D5 fill:#ECEFF1,stroke:#607D8B,stroke-width:2px,color:#263238
```

---

## 5. Use Case Diagram

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'background': '#FFFFFF', 'primaryColor': '#E8F5E9', 'primaryTextColor': '#1B5E20', 'primaryBorderColor': '#4CAF50', 'lineColor': '#2E7D32', 'fontSize': '14px'}}}%%
graph LR
    GUEST["👤 Guest"] -->|"Register"| SYSTEM
    GUEST -->|"Browse Crops"| SYSTEM

    FARMER["🌾 Farmer"] -->|"Manage Crops, Accept Orders, KYC"| SYSTEM
    BUYER["🛒 Buyer"] -->|"Search, Order, Review, Wishlist"| SYSTEM
    ADMIN["⚙️ Admin"] -->|"Moderate, Analytics, Manage Users"| SYSTEM

    SYSTEM["🏪 Rural Farmer Marketplace<br/>━━━━━━━━━━━━━━━━━━━━━━━<br/>Use Cases:<br/>Register | Login | Browse | Search | Order<br/>Accept/Reject | Fulfill | Track | Review<br/>Wishlist | Chat | Notifications<br/>KYC | Moderate | Analytics | Reports"]

    style GUEST fill:#FFFFFF,stroke:#607D8B,stroke-width:2px,color:#455A64
    style FARMER fill:#FFFFFF,stroke:#4CAF50,stroke-width:2px,color:#1B5E20
    style BUYER fill:#FFFFFF,stroke:#FF9800,stroke-width:2px,color:#E65100
    style ADMIN fill:#FFFFFF,stroke:#9C27B0,stroke-width:2px,color:#4A148C
    style SYSTEM fill:#E3F2FD,stroke:#1565C0,stroke-width:3px,color:#0D47A1
```

---

## Summary of Diagrams

| Diagram | Description | Section |
|---------|-------------|---------|
| **System Architecture** | 5-layer architecture: Users → Client → API Gateway → Backend → Database + External Services | §1 |
| **DFD Level 0** | Context diagram — entire system as one process with 3 external entities (Farmer, Buyer, Admin) | §2 |
| **DFD Level 1** | 5 major processes: Auth, Marketplace, Orders, Reviews, Admin + 5 data stores | §3 |
| **DFD Level 2** | Detailed decomposition of Auth (6 sub-processes), Marketplace (6), Orders (6), Admin (6) | §4 |
| **DFD Level 2 Combined** | Single simplified diagram merging all 4 DFD Level 2 sub-processes into one unified view | §4.5 |
| **Use Case Diagram** | 4 actors (Farmer, Buyer, Admin, Guest) with 30+ use cases across 8 functional groups | §5 |

---

> **Note:** All diagrams use Mermaid syntax with explicit white background (`#FFFFFF`) styling. To export as images, use the Mermaid Live Editor ([mermaid.live](https://mermaid.live)) or the VS Code "Markdown Preview Mermaid Support" extension. For PDF reports, render the markdown with a Mermaid-compatible tool like `mermaid-filter` (pandoc) or export each diagram as SVG/PNG from mermaid.live.

---

## 6. Full System Test Cases

### 6.1 P1 — User Authentication & Profile Management

| TC-ID | Sub-Process | Test Case | Actor | Precondition | Steps | Expected Result | Priority |
|-------|------------|-----------|-------|-------------|-------|-----------------|----------|
| TC-AUTH-01 | P1.1 Register | Farmer registration with valid data | 🌾 Farmer | Not logged in | 1. Navigate to Register<br/>2. Fill name, email, phone, password, farm details<br/>3. Submit | Account created; verification email sent; redirect to login | 🔴 High |
| TC-AUTH-02 | P1.1 Register | Buyer registration with valid data | 🛒 Buyer | Not logged in | 1. Navigate to Register<br/>2. Fill name, email, phone, password<br/>3. Submit | Account created; verification email sent; redirect to login | 🔴 High |
| TC-AUTH-03 | P1.1 Register | Duplicate email registration | 🌾 Farmer | Existing user with same email | 1. Register with already-used email<br/>2. Submit | Error: "Email already registered" | 🟡 Medium |
| TC-AUTH-04 | P1.1 Register | Registration with invalid phone format | 🛒 Buyer | Not logged in | 1. Enter invalid phone (e.g., "abc")<br/>2. Submit | Validation error: "Invalid phone number" | 🟡 Medium |
| TC-AUTH-05 | P1.2 Login | Valid farmer login | 🌾 Farmer | Registered & verified | 1. Enter email + password<br/>2. Click Login | JWT token issued; redirect to Farmer Dashboard | 🔴 High |
| TC-AUTH-06 | P1.2 Login | Valid buyer login | 🛒 Buyer | Registered & verified | 1. Enter email + password<br/>2. Click Login | JWT token issued; redirect to Marketplace | 🔴 High |
| TC-AUTH-07 | P1.2 Login | Valid admin login | ⚙️ Admin | Admin account exists | 1. Enter admin email + password<br/>2. Click Login | JWT token issued; redirect to Admin Panel | 🔴 High |
| TC-AUTH-08 | P1.2 Login | Invalid password | 🛒 Buyer | Registered | 1. Enter correct email + wrong password<br/>2. Click Login | Error: "Invalid credentials" | 🔴 High |
| TC-AUTH-09 | P1.2 Login | Unverified account login | 🌾 Farmer | Registered but email not verified | 1. Enter email + password<br/>2. Click Login | Error: "Please verify your email first" | 🟡 Medium |
| TC-AUTH-10 | P1.3 Email Verify | Click valid verification link | 🌾 Farmer | Registered, token not expired | 1. Open email<br/>2. Click verification link | Account verified; confirmation notification shown | 🔴 High |
| TC-AUTH-11 | P1.3 Email Verify | Expired verification token | 🛒 Buyer | Registered, token expired | 1. Click expired verification link | Error: "Token expired. Request new verification" | 🟡 Medium |
| TC-AUTH-12 | P1.4 Profile Mgmt | Farmer updates farm profile | 🌾 Farmer | Logged in as farmer | 1. Go to Profile<br/>2. Update farm name, address, description<br/>3. Save | Profile updated; success toast shown | 🟡 Medium |
| TC-AUTH-13 | P1.4 Profile Mgmt | Buyer adds delivery address | 🛒 Buyer | Logged in as buyer | 1. Go to Profile → Addresses<br/>2. Add new address<br/>3. Save | Address saved; appears in address list | 🟡 Medium |
| TC-AUTH-14 | P1.4 Profile Mgmt | Upload profile photo | 🛒 Buyer | Logged in | 1. Go to Profile<br/>2. Upload photo (JPG, <5MB)<br/>3. Save | Photo uploaded; displayed on profile | 🟢 Low |
| TC-AUTH-15 | P1.5 Password Reset | Request password reset | 🌾 Farmer | Registered, not logged in | 1. Click "Forgot Password"<br/>2. Enter registered email<br/>3. Submit | Reset email sent with token link | 🔴 High |
| TC-AUTH-16 | P1.5 Password Reset | Reset with valid token | 🛒 Buyer | Received reset email | 1. Click reset link<br/>2. Enter new password<br/>3. Submit | Password updated; redirect to login | 🔴 High |
| TC-AUTH-17 | P1.5 Password Reset | Reset with expired token | 🌾 Farmer | Token expired | 1. Click expired reset link<br/>2. Enter new password | Error: "Token expired. Request again" | 🟡 Medium |
| TC-AUTH-18 | P1.6 KYC Verify | Farmer uploads KYC documents | 🌾 Farmer | Logged in, KYC not submitted | 1. Go to KYC section<br/>2. Upload Aadhaar + farm proof<br/>3. Submit | Documents uploaded; status = "Pending" | 🔴 High |
| TC-AUTH-19 | P1.6 KYC Verify | Admin approves KYC | ⚙️ Admin | KYC pending in queue | 1. Open Admin → KYC Queue<br/>2. Review documents<br/>3. Click Approve | Farmer KYC status = "Verified"; notification sent | 🔴 High |
| TC-AUTH-20 | P1.6 KYC Verify | Admin rejects KYC with reason | ⚙️ Admin | KYC pending in queue | 1. Open Admin → KYC Queue<br/>2. Review documents<br/>3. Click Reject + enter reason | Farmer KYC status = "Rejected"; notification with reason sent | 🟡 Medium |

### 6.2 P2 — Crop Marketplace & Inventory

| TC-ID | Sub-Process | Test Case | Actor | Precondition | Steps | Expected Result | Priority |
|-------|------------|-----------|-------|-------------|-------|-----------------|----------|
| TC-MKT-01 | P2.1 Add Crop | Farmer adds crop with images | 🌾 Farmer | Logged in, KYC verified | 1. Go to "Add Crop"<br/>2. Fill name, category, price, quantity, unit<br/>3. Upload 2–5 images<br/>4. Submit | Crop listing created; appears in marketplace | 🔴 High |
| TC-MKT-02 | P2.1 Add Crop | Add crop with missing required fields | 🌾 Farmer | Logged in, KYC verified | 1. Go to "Add Crop"<br/>2. Leave price empty<br/>3. Submit | Validation error: "Price is required" | 🟡 Medium |
| TC-MKT-03 | P2.1 Add Crop | Add crop without KYC verification | 🌾 Farmer | Logged in, KYC not verified | 1. Try to add crop | Error: "KYC verification required to list crops" | 🔴 High |
| TC-MKT-04 | P2.2 Edit Crop | Farmer edits crop price & quantity | 🌾 Farmer | Owns an active listing | 1. Go to My Listings<br/>2. Edit price from ₹50 → ₹45<br/>3. Save | Listing updated; new price reflected | 🟡 Medium |
| TC-MKT-05 | P2.2 Edit Crop | Farmer deletes a crop with no active orders | 🌾 Farmer | Owns listing with no orders | 1. Go to My Listings<br/>2. Click Delete on a crop<br/>3. Confirm | Listing removed from marketplace | 🟡 Medium |
| TC-MKT-06 | P2.2 Edit Crop | Farmer tries to delete crop with active orders | 🌾 Farmer | Owns listing with pending orders | 1. Try to delete crop | Error: "Cannot delete — active orders exist" | 🔴 High |
| TC-MKT-07 | P2.3 Search | Buyer searches by crop name | 🛒 Buyer | On marketplace page | 1. Type "Wheat" in search bar<br/>2. Press Enter | Results show only wheat listings | 🔴 High |
| TC-MKT-08 | P2.3 Search | Buyer filters by price range | 🛒 Buyer | On marketplace page | 1. Set price filter: ₹20–₹50<br/>2. Apply | Only crops in ₹20–₹50 range shown | 🟡 Medium |
| TC-MKT-09 | P2.3 Search | Buyer filters by category | 🛒 Buyer | On marketplace page | 1. Select category "Vegetables"<br/>2. Apply | Only vegetable listings shown | 🟡 Medium |
| TC-MKT-10 | P2.3 Search | Combined search + filter | 🛒 Buyer | On marketplace page | 1. Search "Tomato"<br/>2. Filter by location<br/>3. Apply | Tomatoes from selected location only | 🟢 Low |
| TC-MKT-11 | P2.3 Search | Search with no results | 🛒 Buyer | On marketplace page | 1. Search "xyzabc123" | "No crops found" message displayed | 🟢 Low |
| TC-MKT-12 | P2.4 View Details | Buyer views crop detail page | 🛒 Buyer | Crop listing exists | 1. Click on a crop card<br/>2. View detail page | Full details: images, price, farmer info, reviews shown | 🔴 High |
| TC-MKT-13 | P2.4 View Details | View crop with farmer contact | 🛒 Buyer | Crop detail page open | 1. Scroll to farmer section | Farmer name, rating, location, contact option visible | 🟡 Medium |
| TC-MKT-14 | P2.5 Wishlist | Buyer adds crop to wishlist | 🛒 Buyer | Logged in, viewing crop | 1. Click ❤️ (heart) icon on crop<br/>2. Confirm | Crop added to wishlist; heart turns filled | 🟡 Medium |
| TC-MKT-15 | P2.5 Wishlist | Buyer removes crop from wishlist | 🛒 Buyer | Crop already in wishlist | 1. Click ❤️ again on wishlisted crop | Crop removed from wishlist; heart turns outline | 🟢 Low |
| TC-MKT-16 | P2.5 Wishlist | Guest tries to add to wishlist | 👤 Guest | Not logged in | 1. Click ❤️ on crop | Login prompt shown | 🟡 Medium |
| TC-MKT-17 | P2.6 Inventory | Farmer views stock levels | 🌾 Farmer | Has active listings | 1. Go to Dashboard → Inventory | All listings with current stock quantities shown | 🟡 Medium |
| TC-MKT-18 | P2.6 Inventory | Low stock alert triggered | 🌾 Farmer | Crop quantity drops below threshold | 1. Orders reduce stock to <10% | Low stock notification sent to farmer | 🟡 Medium |
| TC-MKT-19 | P2.6 Inventory | Out of stock auto-hide | 🌾 Farmer | Crop quantity reaches 0 | 1. Last unit ordered | Listing hidden from marketplace; farmer notified | 🔴 High |

### 6.3 P3 — Order Management & Fulfillment

| TC-ID | Sub-Process | Test Case | Actor | Precondition | Steps | Expected Result | Priority |
|-------|------------|-----------|-------|-------------|-------|-----------------|----------|
| TC-ORD-01 | P3.1 Cart | Buyer adds item to cart | 🛒 Buyer | Logged in, crop in stock | 1. View crop detail<br/>2. Select quantity: 5 kg<br/>3. Click "Add to Cart" | Item added; cart badge updates; mini-cart shows item | 🔴 High |
| TC-ORD-02 | P3.1 Cart | Buyer updates quantity in cart | 🛒 Buyer | Item in cart | 1. Open cart<br/>2. Change qty from 5 → 10 kg<br/>3. Update | Cart total recalculated; stock validation passes | 🟡 Medium |
| TC-ORD-03 | P3.1 Cart | Quantity exceeds available stock | 🛒 Buyer | Item in cart, stock = 8 kg | 1. Try to set qty to 15 kg | Error: "Only 8 kg available" | 🟡 Medium |
| TC-ORD-04 | P3.1 Checkout | Complete checkout with delivery address | 🛒 Buyer | Items in cart, address saved | 1. Go to Cart → Checkout<br/>2. Select delivery address<br/>3. Choose payment method<br/>4. Place Order | Order created; order confirmation page shown | 🔴 High |
| TC-ORD-05 | P3.1 Checkout | Checkout with empty cart | 🛒 Buyer | Cart is empty | 1. Try to checkout | Redirected to marketplace with "Cart is empty" message | 🟡 Medium |
| TC-ORD-06 | P3.2 Payment | COD (Cash on Delivery) order | 🛒 Buyer | At checkout | 1. Select "Cash on Delivery"<br/>2. Place order | Order created with status "Pending Confirmation"; no online payment | 🔴 High |
| TC-ORD-07 | P3.2 Payment | Online payment simulation | 🛒 Buyer | At checkout | 1. Select "Online Payment"<br/>2. Complete mock payment gateway<br/>3. Return to app | Order created with status "Payment Confirmed" | 🔴 High |
| TC-ORD-08 | P3.2 Payment | Payment failure handling | 🛒 Buyer | At checkout, online payment | 1. Select online payment<br/>2. Payment fails | Order saved as "Payment Failed"; user can retry | 🟡 Medium |
| TC-ORD-09 | P3.3 Accept/Reject | Farmer accepts order | 🌾 Farmer | New order received | 1. Open Orders → Pending<br/>2. Click "Accept" on order<br/>3. Confirm | Order status = "Accepted"; buyer notified; stock decremented | 🔴 High |
| TC-ORD-10 | P3.3 Accept/Reject | Farmer rejects order with reason | 🌾 Farmer | New order received | 1. Open Orders → Pending<br/>2. Click "Reject"<br/>3. Enter reason: "Stock damaged"<br/>4. Confirm | Order status = "Rejected"; buyer notified with reason | 🔴 High |
| TC-ORD-11 | P3.3 Accept/Reject | Auto-reject after timeout | System | Order pending > 48 hours | 1. No farmer action for 48h | Order auto-rejected; both parties notified | 🟡 Medium |
| TC-ORD-12 | P3.4 Fulfillment | Farmer marks order as ready | 🌾 Farmer | Order accepted | 1. Open accepted order<br/>2. Click "Mark Ready" | Order status = "Ready for Pickup"; buyer notified | 🟡 Medium |
| TC-ORD-13 | P3.4 Fulfillment | Farmer marks order as shipped | 🌾 Farmer | Order ready | 1. Open ready order<br/>2. Click "Mark Shipped"<br/>3. Enter dispatch details | Order status = "Shipped"; tracking available; buyer notified | 🔴 High |
| TC-ORD-14 | P3.5 Tracking | Buyer tracks order status | 🛒 Buyer | Order placed & accepted | 1. Go to My Orders<br/>2. Click "Track" on order | Status timeline: Placed → Accepted → Ready → Shipped → Delivered | 🔴 High |
| TC-ORD-15 | P3.5 Tracking | Farmer updates delivery location | 🌾 Farmer | Order shipped | 1. Update current location<br/>2. Save | Location updated on tracking map for buyer | 🟢 Low |
| TC-ORD-16 | P3.5 Tracking | Order delivered confirmation | 🛒 Buyer | Order shipped | 1. Receive delivery<br/>2. Click "Confirm Delivery" | Order status = "Delivered"; farmer notified | 🔴 High |
| TC-ORD-17 | P3.6 Cancel | Buyer cancels before acceptance | 🛒 Buyer | Order pending (not yet accepted) | 1. Open order<br/>2. Click "Cancel Order"<br/>3. Confirm | Order cancelled; farmer notified | 🟡 Medium |
| TC-ORD-18 | P3.6 Cancel | Buyer cancels after acceptance | 🛒 Buyer | Order accepted, not shipped | 1. Request cancellation<br/>2. Enter reason | Cancellation request sent to farmer for approval | 🟡 Medium |
| TC-ORD-19 | P3.6 Cancel | Farmer cancels due to stock issue | 🌾 Farmer | Order accepted | 1. Open order<br/>2. Click "Cancel"<br/>3. Reason: "Crop damaged" | Order cancelled; stock restored; buyer notified + refund initiated | 🔴 High |
| TC-ORD-20 | P3.6 Refund | Refund processed after cancellation | System | Order cancelled after payment | 1. Cancellation confirmed | Refund initiated; amount returned to buyer; both notified | 🔴 High |

### 6.4 P5 — Admin Moderation & Analytics

| TC-ID | Sub-Process | Test Case | Actor | Precondition | Steps | Expected Result | Priority |
|-------|------------|-----------|-------|-------------|-------|-----------------|----------|
| TC-ADM-01 | P5.1 User Mgmt | Admin views all users | ⚙️ Admin | Logged in as admin | 1. Go to Admin → Users<br/>2. Browse user list | All users listed with role, status, join date | 🔴 High |
| TC-ADM-02 | P5.1 User Mgmt | Admin suspends a user | ⚙️ Admin | Active user exists | 1. Find user<br/>2. Click "Suspend"<br/>3. Enter reason<br/>4. Confirm | User suspended; cannot login; notification sent | 🔴 High |
| TC-ADM-03 | P5.1 User Mgmt | Admin reactivates suspended user | ⚙️ Admin | Suspended user exists | 1. Find suspended user<br/>2. Click "Reactivate" | User can login again; notification sent | 🟡 Medium |
| TC-ADM-04 | P5.1 User Mgmt | Admin edits user role | ⚙️ Admin | User exists | 1. Change role from Buyer → Farmer<br/>2. Save | Role updated; user gets farmer permissions | 🟡 Medium |
| TC-ADM-05 | P5.2 Listing Mod | Admin approves a new crop listing | ⚙️ Admin | New listing pending review | 1. Go to Admin → Listings<br/>2. Review crop details<br/>3. Click "Approve" | Listing visible in marketplace; farmer notified | 🔴 High |
| TC-ADM-06 | P5.2 Listing Mod | Admin rejects inappropriate listing | ⚙️ Admin | Listing pending review | 1. Review listing<br/>2. Click "Reject"<br/>3. Reason: "Inappropriate content" | Listing hidden; farmer notified with reason | 🟡 Medium |
| TC-ADM-07 | P5.2 Listing Mod | Admin flags listing for revision | ⚙️ Admin | Listing pending review | 1. Click "Request Changes"<br/>2. Enter feedback | Listing status = "Revision Needed"; farmer can edit & resubmit | 🟢 Low |
| TC-ADM-08 | P5.3 Order Monitor | Admin views all orders | ⚙️ Admin | Orders exist in system | 1. Go to Admin → Orders<br/>2. Filter by status | All orders with status, buyer, farmer, amount visible | 🔴 High |
| TC-ADM-09 | P5.3 Order Monitor | Admin sends reminder for stale order | ⚙️ Admin | Order pending > 24h | 1. Find stale order<br/>2. Click "Send Reminder" | Reminder notification sent to farmer | 🟡 Medium |
| TC-ADM-10 | P5.3 Order Monitor | Admin force-cancels fraudulent order | ⚙️ Admin | Suspicious order detected | 1. Open order<br/>2. Click "Force Cancel"<br/>3. Enter reason | Order cancelled; both parties notified; funds held/reversed | 🔴 High |
| TC-ADM-11 | P5.4 Disputes | Admin reviews dispute evidence | ⚙️ Admin | Dispute raised by buyer/farmer | 1. Go to Admin → Disputes<br/>2. Open dispute<br/>3. Review chat, order history, evidence | Full dispute context visible | 🔴 High |
| TC-ADM-12 | P5.4 Disputes | Admin resolves dispute in buyer's favor | ⚙️ Admin | Dispute under review | 1. Review evidence<br/>2. Rule in favor of buyer<br/>3. Process refund | Refund issued; order closed; both notified | 🔴 High |
| TC-ADM-13 | P5.4 Disputes | Admin resolves dispute in farmer's favor | ⚙️ Admin | Dispute under review | 1. Review evidence<br/>2. Rule in favor of farmer<br/>3. Release payment | Payment released to farmer; order closed; both notified | 🟡 Medium |
| TC-ADM-14 | P5.5 Analytics | Admin views dashboard overview | ⚙️ Admin | Data exists | 1. Go to Admin → Dashboard | Charts: total users, orders, revenue, top crops, active farmers | 🔴 High |
| TC-ADM-15 | P5.5 Analytics | Admin generates sales report | ⚙️ Admin | Orders data exists | 1. Go to Analytics → Reports<br/>2. Select date range<br/>3. Click "Generate" | Report with total sales, orders, commission, top sellers | 🟡 Medium |
| TC-ADM-16 | P5.5 Analytics | Admin exports report as CSV | ⚙️ Admin | Report generated | 1. Click "Export CSV" | CSV file downloaded with report data | 🟢 Low |
| TC-ADM-17 | P5.5 Analytics | Admin views farmer performance | ⚙️ Admin | Multiple farmers with orders | 1. Go to Analytics → Farmers<br/>2. Sort by rating/sales | Farmers ranked by performance metrics | 🟢 Low |
| TC-ADM-18 | P5.6 Settings | Admin updates platform commission rate | ⚙️ Admin | Logged in as admin | 1. Go to Settings<br/>2. Change commission from 5% → 7%<br/>3. Save | New rate applied to future orders; existing orders unaffected | 🟡 Medium |
| TC-ADM-19 | P5.6 Settings | Admin configures notification templates | ⚙️ Admin | Logged in as admin | 1. Go to Settings → Notifications<br/>2. Edit order confirmation template<br/>3. Save | Updated template used for new notifications | 🟢 Low |
| TC-ADM-20 | P5.6 Settings | Admin manages banned keywords | ⚙️ Admin | Logged in as admin | 1. Go to Settings → Moderation<br/>2. Add banned keyword<br/>3. Save | Listings with banned keywords auto-flagged | 🟡 Medium |

### 6.5 Cross-Process Integration Tests

| TC-ID | Sub-Process | Test Case | Actor | Precondition | Steps | Expected Result | Priority |
|-------|------------|-----------|-------|-------------|-------|-----------------|----------|
| TC-INT-01 | P1→P2 | Farmer registers, verifies KYC, lists crop | 🌾 Farmer | New user | 1. Register (P1.1)<br/>2. Verify email (P1.3)<br/>3. Upload KYC (P1.6)<br/>4. Admin approves KYC (P1.6)<br/>5. Add crop (P2.1) | Full flow: registration → KYC → listing live | 🔴 High |
| TC-INT-02 | P2→P3 | Buyer searches, adds to cart, orders | 🛒 Buyer | Logged in, crops available | 1. Search crop (P2.3)<br/>2. View details (P2.4)<br/>3. Add to cart (P3.1)<br/>4. Checkout + pay (P3.1, P3.2) | End-to-end purchase flow complete | 🔴 High |
| TC-INT-03 | P3→P5 | Order dispute escalation to admin | 🛒 Buyer → ⚙️ Admin | Order delivered, buyer unhappy | 1. Buyer raises dispute (P3.6)<br/>2. Admin reviews (P5.4)<br/>3. Admin resolves + refunds (P5.4) | Dispute resolved; refund processed | 🔴 High |
| TC-INT-04 | P1→P3→P5 | Full order lifecycle with admin oversight | All | System operational | 1. Buyer orders (P3.1)<br/>2. Farmer accepts (P3.3)<br/>3. Farmer ships (P3.4)<br/>4. Buyer tracks (P3.5)<br/>5. Delivery confirmed (P3.5)<br/>6. Admin monitors (P5.3) | Complete order lifecycle tracked end-to-end | 🔴 High |
| TC-INT-05 | P2→P5 | Admin moderates listing, farmer resubmits | 🌾 Farmer → ⚙️ Admin | Farmer listed crop | 1. Farmer adds crop (P2.1)<br/>2. Admin rejects with feedback (P5.2)<br/>3. Farmer edits & resubmits (P2.2)<br/>4. Admin approves (P5.2) | Listing approved after revision cycle | 🟡 Medium |
| TC-INT-06 | All | Concurrent users — load test | 50 Farmers + 200 Buyers | System operational | 1. Multiple farmers list crops<br/>2. Multiple buyers search & order<br/>3. Admin monitors | System handles concurrent operations without data corruption | 🔴 High |

---

> **Test Case Summary:** 80 total test cases — 20 Auth, 19 Marketplace, 20 Orders, 20 Admin, 6 Integration | Priority: 🔴 38 High · 🟡 30 Medium · 🟢 12 Low