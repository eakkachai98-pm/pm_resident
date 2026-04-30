# User Profile & Settings Feature Plan

**Status:** Completed (Profile, Security, Avatar Upload implemented)  
**Target Areas:** `Header` Component, New Modals

## 🎯 Objectives
Implement a modern, accessible User Profile Dropdown menu and a dedicated Settings Modal. This empowers users to manage their own information, reducing dependency on system administrators, while keeping the UI clean and premium.

---

## 📋 Features to Implement

### 1. Profile Dropdown Menu (Top-Right Header) [✅ COMPLETED]
- **Trigger:** Clicking the user's Avatar in the top-right corner.
- **UI & Animation:** 
  - Smooth slide-down effect using Framer Motion (`AnimatePresence`).
  - Dropdown header showing User's Name, Role, and Email.
- **Menu Items:**
  - 👤 **My Profile:** Opens the Edit Profile Modal (Implemented).
  - 🚪 **Sign Out:** Quick action to log out (Implemented).
  - 🔔 **Preferences:** Opens notification and system settings (Pending).
  - 🔒 **Security:** Opens change password screen (Implemented).

### 2. Edit Profile Modal [✅ COMPLETED]
- **Purpose:** Allow users to update their personal contact information.
- **Editable Fields:**
  - Avatar URL / Upload.
  - Full Name.
  - Phone Number.
- **Read-only Fields (Managed by Admin/HR):**
  - Email Address.
  - Role / Department.
- **UX Requirement:** "Save Changes" button with loading state. Must show an Emerald success Toast upon completion.

### 3. Notification & System Preferences
- **Purpose:** Give users control over notification verbosity (Supports Roadmap).
- **Toggles:**
  - Email Notifications (On/Off).
  - In-App Alerts (On/Off).
  - Ticket Status Updates.
  - Asset Assignment Alerts.

### 4. Security Settings [✅ COMPLETED]
- **Purpose:** Allow self-service password changes.
- **Fields:** Current Password, New Password, Confirm New Password.
- **Validation:** Basic length and match checking.

---

## 🛠 Implementation Steps

1. **Step 1: Component Scaffold**
   - Create `src/components/ProfileDropdown.tsx` for the floating menu.
   - Create `src/components/UserProfileSettings.tsx` for the tabbed modal (Profile, Preferences, Security).

2. **Step 2: Integration with Header**
   - Modify the existing `Header` in `App.tsx`.
   - Wrap the Avatar image in a clickable area with `ref` to handle clicking outside to close.

3. **Step 3: State Management & Navigation**
   - Manage the open/close state of the dropdown.
   - When a dropdown item is clicked, open the global settings modal to the correct tab.

4. **Step 4: API Connectivity (Mock / Backend)**
   - Update `src/services/api.ts` to simulate updating user details.
   - Ensure `currentUser` state in `App.tsx` updates immediately after saving profile changes so the Avatar/Name reflects globally without a hard refresh.

---

## ✅ Adherence to Mandates (`GEMINI.md` & `AGENTS.md`)
- **System Feedback:** All update operations MUST trigger the `useToast` hook. No `alert()` allowed.
- **UI/UX Polish:** Modals must reuse the `AnimatePresence` and `motion.div` patterns.
- **Layout Optimization:** The dropdown should be styled with a glassmorphism effect (`backdrop-blur`) and subtle borders (`border-white/5` or `border-gray-200`) to match the premium design system.
