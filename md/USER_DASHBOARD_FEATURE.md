# User Dashboard Feature Plan

**Status:** Planning / Analysis
**Target File:** `src/screens/UserDashboard.tsx`

## 🎯 Objectives
Empower end-users with a self-service hub that makes reporting issues, checking statuses, and accessing knowledge base articles seamless and intuitive.

---

## 🧐 Current State Analysis (What's there today)
- **My Assigned Assets:** Shows equipment assigned to the user.
- **Recent Tickets:** Displays the 3 most recent tickets and their resolution time.
- **Quick Actions:** A "Knowledge Base" button (now correctly using Toast) and a link to the main "Tickets" screen.

---

## 🚀 Features to Implement (What is missing)

### 1. Quick "Report Issue" from Assets [✅ COMPLETED]
- **Issue:** Users must navigate to the Tickets screen and manually select/type their asset ID to report an issue.
- **Solution:** 
  - Add a "Report Issue" (warning icon) button directly on each Asset card in the "My Assigned Assets" section.
  - Clicking this button opens a modal or navigates to the ticket creation form with the `assetId` already pre-filled.

### 2. Remove Redundant "Contact IT" Button [✅ COMPLETED]
- **Issue:** The "Contact IT" button under Quick Actions is redundant since users can use "Report Issue" directly from their assigned assets.
- **Solution:** Remove the "Need Help? / Contact IT" block entirely to clean up the dashboard UI and promote the asset-specific "Report Issue" workflow.

### 3. System Announcements & Alerts [✅ COMPLETED]
- **Issue:** No centralized way for IT to broadcast system-wide issues (e.g., "Network outage on Floor 3").
- **Solution:** 
  - Added a collapsible banner at the top of the dashboard to display global IT announcements.
  - Implemented an `AnnouncementModal` for Admin and Staff to dynamically update the message from their Profile Menu.
  - Message persists to the database via `SystemSetting` model.
  - Added full multi-language (i18n) support for the announcement interface.
  - Implemented Session-based UX: dismissals are remembered per session so users are reminded on their next login without being annoyed during active work.

### 4. Interactive Knowledge Base (Self-Service)
- **Issue:** The Knowledge Base button is just a placeholder.
- **Solution:** Develop a slide-out drawer or a new screen listing common FAQs (e.g., "How to reset password", "Printer offline") to deflect easy tickets from the IT helpdesk.

### 5. Profile Completeness Indicator
- **Issue:** IT often lacks user phone numbers or updated info.
- **Solution:** Add a subtle warning on the dashboard if the user's profile is missing a phone number, prompting them to update it via the Profile Modal.

### 6. Quick Ticket Preview [✅ COMPLETED]
- **Issue:** Users have to leave the dashboard to view details of recent tickets.
- **Solution:** Add a `TicketDetailModal` to show the details of the selected ticket immediately over the dashboard.

### 7. Post-Resolution Rating (CSAT) [✅ COMPLETED]
- **Issue:** IT cannot measure user satisfaction on resolved tickets.
- **Solution:** Add a 5-star rating UI and feedback field inside the `TicketDetailModal` for tickets with "Resolved" status.

### 8. User-Defined Ticket Priority [✅ COMPLETED]
- **Issue:** Tickets created via "Report Issue" were automatically assigned a "Medium" priority without user input.
- **Solution:** Added a Priority dropdown (Low, Medium, High, Urgent) to the `TicketCreationModal` so users can self-triage their issues.

---

## 🛠 Implementation Steps

1. **Step 1: Dashboard UI Refactor**
   - Add the "Report Issue" action to the Asset cards.
   - Build the `TicketCreationModal` component and integrate it into the dashboard.

2. **Step 2: State Management**
   - Manage modal open/close states.
   - Pass the pre-filled `assetId` to the modal when triggered from an asset card.

3. **Step 3: Component Integration**
   - Create a static `SystemAnnouncements` component.
   - Update the Knowledge Base action to navigate to a new `/knowledge-base` screen or open a modal.
