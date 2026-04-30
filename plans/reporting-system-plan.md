# Implementation Plan: Asset Reporting & Export System

## 1. Objective
Enable Admin and Staff users to export precise data from the Primus Pro system for auditing, lifecycle analysis, and organizational record-keeping.

## 2. Functional Specifications
- **Format:** Export data as standard CSV (compatible with Excel/Google Sheets).
- **Report Scopes:**
  - **Inventory Report:** Name, ID, Type, Serial Number, Status, Owner, Department, Purchase Date.
  - **Maintenance Log:** Ticket ID, Asset Name, Subject, Priority, Status, Resolution Date.
  - **Audit Trail:** Activity description, Operator, Timestamp.
- **Filtered Exports:** The export should respect the current UI filters (e.g., if searching for "MacBook", the export should only contain MacBook results).

## 3. Technical Architecture
- **Backend:** 
  - Add specialized endpoints in `server/server.js`.
  - Use logic to flatten Prisma relations (e.g., merging `assignedUser.name` into the asset row).
- **Frontend:** 
  - Implement a `DownloadService` or helper function.
  - Connect existing "Export CSV" buttons to backend triggers.

## 4. Implementation Phases

### Phase 1: Export Logic (Backend)
- Create `/api/export/inventory` endpoint.
- Create `/api/export/tickets` endpoint.
- Implement data transformation logic (JSON to CSV String).

### Phase 2: User Interface (Frontend)
- Update `Inventory.tsx` export button.
- Update `CommandCenter.tsx` export button.
- Add "Export History" button to `AssetDetail.tsx`.

### Phase 3: Validation & Polish
- Ensure UTF-8 encoding (to support Thai language in CSV).
- Add success/error toast feedback for downloads.

## 5. Verification Items
- [x] Resolution Time Tracking (Resolved - Created) implemented.
- [ ] CSV opens correctly in Excel without character mangling.
- [ ] Retired assets appear in the Inventory report.
- [ ] Exported data matches the current database state.
