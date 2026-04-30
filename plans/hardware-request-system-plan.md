# Implementation Plan: Hardware Request System

## 1. Objective
Enable users to request new hardware or replacements directly through the platform, streamlining the procurement and assignment process for the IT department.

## 2. Functional Specifications
- **Catalog Browsing:** Users can view a catalog of available hardware types (e.g., Laptops, Monitors, Peripherals).
- **Request Submission:**
  - Select item type from catalog.
  - Provide justification for the request.
  - Specify urgency level.
- **Approval Workflow:**
  - Requests appear in the Admin/Staff "Command Center" or a dedicated "Requests" tab.
  - Admin/Staff can Approve, Deny, or ask for more Information.
- **Status Tracking:** Users can track the status of their requests (Pending, Approved, Preparing, Delivered, Denied).
- **Auto-Assignment:** Once a request is marked as "Delivered", the system should prompt or automatically create an Asset record assigned to the user.

## 3. Technical Architecture

### 3.1 Database Schema (Prisma)
New models to support requests and catalog:
```prisma
model HardwareCatalog {
  id          String   @id @default(cuid())
  name        String   // e.g., "MacBook Pro M3"
  category    String   // e.g., "Laptop"
  description String?
  imageUrl    String?
  specifications Json?
  isActive    Boolean  @default(true)
  requests    HardwareRequest[]
}

model HardwareRequest {
  id            String   @id @default(cuid())
  userId        String   // Requester
  catalogId     String
  justification String
  urgency       String   // 'Low', 'Medium', 'High'
  status        String   @default("Pending") // 'Pending', 'Approved', 'Preparing', 'Delivered', 'Denied'
  adminNotes    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])
  catalogItem   HardwareCatalog @relation(fields: [catalogId], references: [id])
}
```

### 3.2 Backend API (Express)
- `GET /api/catalog`: Fetch available items for users.
- `POST /api/requests`: Submit a new request.
- `GET /api/requests/my`: Fetch requests for the logged-in user.
- `GET /api/admin/requests`: Fetch all requests (Admin/Staff only).
- `PATCH /api/admin/requests/:id`: Update request status and notes.

### 3.3 Frontend (React)
- **Request Modal/Screen:** A UI to browse the catalog and fill out the request form.
- **User Dashboard Update:** Add a "My Requests" section or tab.
- **Admin Dashboard Update:** Add a "Hardware Requests" management interface in the CommandCenter.

## 4. Implementation Phases

### Phase 1: Foundation
- Update `schema.prisma` with `HardwareCatalog` and `HardwareRequest`.
- Seed the database with initial catalog items.
- Implement basic CRUD for Catalog (Admin).

### Phase 2: User Submission
- Create the "Request Hardware" UI (previously removed from UserDashboard).
- Implement the submission API and frontend form.
- Add "My Requests" list to User Dashboard.

### Phase 3: Admin Management
- Create the request management table for Admin/Staff.
- Implement status update logic (Approval/Denial).
- Integrate with Notification System to alert users of status changes.

### Phase 4: Integration & Automation
- Link approved/delivered requests to the Inventory system.
- Implement "One-click Asset Creation" from an approved request.

## 5. Verification Items
- [ ] Users can only see and request active catalog items.
- [ ] Users receive notifications when their request status changes.
- [ ] Admin can filter requests by status and urgency.
- [ ] Data integrity: Deleting a catalog item should be prevented if active requests exist (or use soft-delete).
