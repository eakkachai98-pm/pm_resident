# Technician Dashboard Feature Plan

**Status:** Completed
**Target File:** `src/screens/TechnicianDashboard.tsx`

## 🎯 Objectives
Transform the current Technician Dashboard into a highly functional workspace tailored for a single-technician workflow. The goal is to provide immediate visibility into active tasks, urgent queue, and streamline the repair process.

---

## 🧐 Current State Analysis (What's there today)
- **Stats Cards:** Shows total pending repairs, overdue tasks, and weekly completed tasks (Global stats).
- **Active Work Orders:** A list of all unresolved tickets across the system. Allows starting tasks and resolving them (with a simple text note).
- **Device Search:** A text input to search for Asset IDs.
- **Maintenance Pool:** Shows a list of assets currently marked as "In Maintenance".

---

## 🚀 Features to Implement (What is missing)

### 1. Active Work vs Pending Queue (Workflow-based) - **[COMPLETED]**
- **Issue:** The dashboard treats all pending tickets equally, making it hard to see what is currently being worked on.
- **Solution:** 
  - Create a distinct section for **"My Assigned Tasks"** (tickets that have been claimed and are "In Progress") at the top.
  - Create a **"Unassigned Pool"** section below it for new tickets that are "Open" and waiting to be claimed.

### 2. Priority & SLA Sorting
- **Issue:** Work orders in the queue are not sorted by urgency.
- **Solution:** Automatically sort the **"Pending Queue"** so that `Urgent` and `High` priority tickets always appear at the top.

### 3. Functional QR / Barcode Scanner
- **Issue:** The UI has a scanner icon but functions only as a text search.
- **Solution:** Integrate a QR/Barcode scanner library or API (if on mobile/tablet) that allows quick scanning of asset tags to instantly open the Asset Detail modal.

### 4. Technician-Specific Metrics & History - **[COMPLETED]**
- **Issue:** The "Completed (Week)" stat is global for the whole company, and once resolved, tickets vanish from the UI.
- **Solution:** 
  - Update the stat cards to show personal metrics (e.g., "My Completed", "My Active Tasks").
  - Make the "Completed" stat card clickable to open a **"Completed Tasks History"** modal to review resolved work.

---

## 🛠 Implementation Steps

1. **Step 1: Dashboard UI Refactor**
   - Implement distinct sections or visual separation for "Active Tasks" and "Pending Queue" based on ticket status.
   - Apply `sort()` logic based on `priority` for the Pending Queue.

2. **Step 2: Testing & Feedback**
   - Ensure "Start Task" moves the ticket to the Active section immediately.
   - Ensure all actions trigger the `useToast` feedback properly (no `alert()`).
