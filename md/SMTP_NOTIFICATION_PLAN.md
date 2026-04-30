# SMTP Email Notification Plan (Ticket Status Changes)

**Status:** Completed ✅
**Target Areas:** `server/server.js`, `server/notifications.js`, `prisma/schema.prisma`, `src/screens/Settings.tsx`

## 🎯 Objectives
Automatically send email notifications to users (Reporters) whenever the status of their IT support ticket changes (e.g., `Open` ➡️ `In Progress` ➡️ `Resolved`). This reduces user anxiety and the need for them to constantly check the dashboard.

---

## 📋 Implementation Steps

### 1. Database-driven SMTP Configuration [✅ COMPLETED]
Initially planned for `.env`, but upgraded to a Database-driven model for better Admin UX.
- Created `SystemSetting` model in `prisma/schema.prisma`.
- Implemented `GET /api/settings` and `POST /api/settings`.
- Added a dedicated "Email Server (SMTP)" UI form inside the **Settings** screen using a Vertical Sidebar Layout.

### 2. Create the Email Service (`server/notifications.js`) [✅ COMPLETED]
Created a new dedicated module to handle email sending logic.
- Implemented dynamic `transporter` creation that queries the `SystemSetting` table for SMTP credentials before sending.
- Falls back to `.env` if DB is empty.
- Designed HTML templates for ticket resolution.

### 3. Intercept Ticket Updates (`server/server.js`) [✅ COMPLETED]
Located the `app.patch('/api/tickets/:id')` endpoint in `server.js`.
- Included check to fire `notifyTicketStatusUpdate()` whenever the status is updated.
- Fire & Forget async logic implemented to not block the UI.

### 4. Incorporate Resolution Notes [✅ COMPLETED]
If the status changes to `Resolved`, the email template intelligently includes the `resolution` notes so the user immediately knows *how* it was fixed.

---

## 🛠 Required Technologies
- **nodemailer** (Already in `package.json`)
- **Prisma** (SystemSetting model)
- **Framer Motion** (For Settings UI transitions)

## ✅ Next Actions
- Ensure Admin configures the SMTP using a Gmail App Password via the Settings UI.
- Test actual email delivery in Production.
