# Primus Pro: Gemini Mandates

Foundation instructions for the Primus Pro production ecosystem.

## 🛠 Tech Stack
- **Core:** React 19, TypeScript, Tailwind CSS v4.
- **Feedback:** Custom `ToastProvider` via React Context.

## 🏗 Architectural Mandates
- **System Feedback:**
  - NEVER use `alert()` or `confirm()` for user notifications (excluding critical deletions).
  - Use the `useToast` hook for all success, error, and info feedback.
- **Search & Discovery:**
  - The `Header` component MUST maintain global search logic.
  - Search results MUST be categorized (Assets, Personnel) and provide instant navigation.
- **Link Connectivity:**
  - Every asset identifier displayed in the UI MUST be clickable and invoke the `onSelectAsset` callback.
  - This ensures a "circular" UI where every piece of data is discoverable.
- **Database Consistency:**
  - All state-changing operations in `AssetDetail` (Edit/Retire) MUST be mirrored in the `Inventory` state via a fresh fetch.
  - Every Ticket marked as 'Resolved' MUST have its `resolvedAt` timestamp set.

## 🎨 UI/UX Mandates
- **Polish:** Every action must have an equivalent motion transition or feedback loop.
- **Toasts:** Success toasts should be emerald, Error toasts red, and Info toasts blue.
- **Layout Optimization:** Use collapsible components (e.g., toggle buttons with `AnimatePresence`) for long text blocks (like descriptions) to maintain a clean, premium layout without overwhelming the user.
- **Navigation:**
  - Clicking the application logo MUST always return the user to the Dashboard.
  - Components using `setHeaderAction` MUST clear it (`undefined`) in their `useEffect` cleanup to prevent UI leaks across screens.
