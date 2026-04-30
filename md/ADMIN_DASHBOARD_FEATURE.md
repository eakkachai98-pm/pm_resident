# Admin Command Center Feature Plan

**Status:** Planning / Analysis
**Target File:** `src/screens/CommandCenter.tsx`

## 🎯 Objectives
Enhance the Admin Command Center to provide actionable insights, proper data export capabilities, and quick management controls, transforming it from a static overview into a fully functional executive tool.

---

## 🧐 Current State Analysis (What's there today)
- **Top Stats:** Displays high-level metrics (Total Assets, Active Fleet, Pending Repairs, Total Tickets).
- **Visual Analytics:** Includes interactive Recharts (Pie Chart for Asset Categories, Bar Chart for Ticket Status).
- **Audit Trail:** A data table logging system-wide events (user actions, asset modifications) with clickable Asset IDs for deep linking.

---

## 🚀 Features to Implement (What is missing)

### 1. Data Export System (CSV/Excel) [✅ COMPLETED]
- **Issue:** The "Export Report" button above the Audit Trail is currently a non-functional UI element.
- **Solution:** 
  - Implement a CSV generation function (leveraging `papaparse`, which is already in the tech stack).
  - Allow Admins to download the Audit Trail and Inventory summaries directly to their local machines.

### 2. Global Date Range Filtering [✅ COMPLETED]
- **Issue:** All charts and statistics currently display "All-time" data.
- **Solution:** 
  - Add a Date Range Picker (e.g., "Last 7 Days", "This Month", "YTD") at the top right of the dashboard.
  - Dynamically re-fetch and filter the `analytics` and `activities` data based on the selected period.

### 3. Financial & Value Analytics
- **Issue:** The system perfectly tracks the *quantity* of assets, but lacks visibility into their *monetary value*.
- **Solution:** 
  - Introduce a new stat card showing "Total Fleet Value".
  - (Optional) Add a chart illustrating budget allocation by department or asset depreciation over time.

### 4. Quick Actions Menu [✅ COMPLETED]
- **Issue:** Admins must navigate away to specific screens (Inventory, Personnel) to add new entries.
- **Solution:** Add prominent Quick Action buttons (e.g., `+ Add Asset`, `+ Add User`) directly to the Command Center to streamline data entry.

### 5. Ticket CSAT Visibility [✅ COMPLETED]
- **Issue:** Staff/Admins cannot see the ratings and feedback submitted by users on resolved tickets.
- **Solution:** Integrated the User Rating & Feedback display block into the Global `Tickets` screen details view.

---

## 🛠 Implementation Steps

1. **Step 1: Export Functionality (Highest Priority)**
   - Create a utility function `exportToCSV(data, filename)`.
   - Bind an `onClick` event to the Export button to trigger the browser download with a timestamped filename.
   - Use the `useToast` hook to show a "Download Started" notification.

2. **Step 2: Date Filtering State & UI**
   - Create a dropdown component for predefined date ranges.
   - Update `api.getAnalytics()` and `api.getActivities()` in the mock backend to accept and process date parameters.

3. **Step 3: Financial Metrics Integration**
   - Update the `Asset` type (if necessary) or the backend calculation to sum up asset purchase prices.
   - Render the new stat card next to the existing ones.
