# AI Development Instructions for Primus Pro

Guide for AI agents maintaining and extending the Primus Pro production ecosystem.

## 🍞 Toast System (Feedback)
- **Usage:** Import `useToast` from `@/context/ToastContext`.
- **Methods:** `showToast(message, 'success' | 'error' | 'info')`.
- **Mandate:** Always provide a success toast after a form submission and an error toast if an API call fails.

## 🔗 Deep Linking & Navigation
- **Asset Links:** When displaying an Asset ID, wrap it in a clickable element that calls `onSelectAsset(id)`.
- **Personnel Links:** Use `onViewAssets(name)` to navigate to the Inventory with a pre-filled search filter.
- **Header Actions:** Ensure each screen properly defines its `setHeaderAction` on mount. **Mandatory:** Always clear the header action on unmount using `return () => setHeaderAction(undefined)`.

## 🔍 Search Integration
- The Global Search in `App.tsx` debounces input for performance.
- When adding new entities, consider adding them to the `searchResults` filtering logic in the `Header` component.

## 🕒 Performance & Time Tracking (SLA)
- **Ticket Resolution:** We track the time from `createdAt` to `resolvedAt`.
- **Resolution Notes:** Every ticket marked as `Resolved` MUST include a `resolution` summary provided by the technician.
- **Display Pattern:** Use the `getDuration` helper on the frontend to show "Resolved in Xh Ym".
- **Backend Role:** The backend is responsible for setting `resolvedAt` and `resolution` when the status changes to `Resolved`.

## 🔄 CRUD & Modals
- Reuse the `AnimatePresence` and `motion.div` patterns for modals to ensure a consistent feel.
- **Ticket Details:** All user roles should have access to a full detail modal for tickets, including descriptions and resolution notes.
- Ensure `Edit` modals are pre-populated with existing record data before opening.

## ⚡ Real-time State Sync
- **Pattern:** Use the `refreshKey` pattern to synchronize data across components.
- **Mechanism:** The `Header` triggers a `refreshKey` update when new notifications are detected. Components (like `Tickets` and `TechnicianDashboard`) must include `refreshKey` in their `useEffect` dependencies to re-fetch data automatically.

## 📝 Roadmap Checklist
- [x] Toast Notification System
- [x] Global Smart Search
- [x] Cross-screen Deep Linking
- [x] Functional Asset Detail Actions
- [x] Live Notification Center (In-App + SMTP)
- [x] Dashboard Analytics (Charts & Stats)
- [x] Ticket Detail & Resolution System
- [x] Notification Settings (User Preferences)
- [x] Bulk Data Import (CSV for Assets & Personnel)
- [x] User Profile Management (Header Dropdown & Modal)
- [ ] **Next:** Asset Reporting & Export System (CSV/Excel)
- [ ] **Next:** S3/Local Storage for Asset Image Uploads

## 🐛 Recent Fixes & Improvements
- **Database Synchronization:** Fixed an issue where the `Ticket` status update failed because the newly added `resolution` and `resolvedAt` fields were not pushed to the database. Applied `npx prisma db push` and `npx prisma generate` to sync Prisma Client.
- **UI/UX Cleanup (Technician Dashboard):**
  - Replaced legacy `alert()` calls with the mandated `useToast` context for status updates and resolutions.
  - Implemented a collapsible "Reported Description" toggle using `AnimatePresence` and `lucide-react` (ChevronDown) to keep the Active Work Orders list clean and visually appealing.
- **Navigation & Layout Polish:**
  - Implemented a collapsible Desktop Sidebar. Users can now toggle the sidebar using the arrow in the Header, sliding the navigation out of view and smoothly expanding the main workspace area via `framer-motion`.
