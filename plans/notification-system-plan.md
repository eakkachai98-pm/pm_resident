# Implementation Plan: Notification Center

## 1. Objective
Transform the static notification bell into a live system that alerts users about relevant activities (Ticket updates, new assignments, critical hardware issues) based on their organizational roles.

## 2. Functional Specifications
- **Indicators:** Visual cue (red dot) on the bell icon when unread notifications exist.
- **Role-based Alerts:**
  - **Admin/Staff:** Notifications for new urgent tickets or system-wide changes.
  - **User:** Notifications for updates on their specific tickets or new asset assignments.
- **Interactivity:**
  - Clicking the bell opens a scrollable popover with the latest 10 notifications.
  - Clicking a notification navigates the user to the specific Asset or Ticket detail.
  - "Mark as Read" functionality to clear indicators.

## 3. Technical Architecture

### 3.1 Database Schema (Prisma)
A new `Notification` model will be added:
```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String   // Recipient
  title       String
  message     String
  type        String   // 'ticket', 'asset', 'system'
  priority    String   // 'low', 'medium', 'high'
  isRead      boolean  @default(false)
  createdAt   DateTime @default(now())
  link        String?  // Deep link (e.g. '/asset/MBP-01')
}
```

### 3.2 Backend API (Express)
- `GET /api/notifications`: Fetches unread notifications for the logged-in user.
- `PATCH /api/notifications/:id/read`: Marks a specific notification as read.
- **Trigger Logic:** Hooks within existing routes (e.g., `POST /api/tickets`) will automatically create notifications for relevant parties.

### 3.3 Frontend (React)
- **State:** Use a poll or manual refresh (initial phase) to fetch notifications.
- **UI:** A floating `AnimatePresence` popover in the `Header` component.

## 4. Implementation Phases

### Phase 1: Persistence Layer [DONE]
- Update `schema.prisma` and run migrations.
- Update `seed.js` with sample notifications.

### Phase 2: System Triggers [DONE]
- Modify `server/server.js` and `server/notifications.js` to generate notifications during:
  - Ticket creation (Alert Admin/Staff).
  - Ticket status updates (Alert Reporter).
  - Asset reassignments (Alert New Owner).
- **SMTP Integration:** Added email support via Nodemailer/Mailtrap for status updates and assignments.

### Phase 3: The Popover UI [DONE]
- Build `NotificationPopover.tsx`.
- Update `Header` in `App.tsx` to handle popover toggle and unread counts.

### Phase 4: Polish [DONE]
- **Real-time Sync:** Implemented a reactive auto-refresh mechanism using `refreshKey` to sync data (e.g., Ticket status) across components when notifications arrive.
- **UI Refinement:** Added unread count badges and smooth `framer-motion` transitions for the popover.

## 5. Verification Items
- [x] Red dot appears only when unread notifications exist.
- [x] Clicking a notification navigates to the correct detail page.
- [x] Notifications are filtered correctly by User ID.
- [x] Emails are triggered for status updates.
- [x] UI automatically refreshes data when a new notification is received (No F5 needed).
