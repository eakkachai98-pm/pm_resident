# Multilingual (i18n) Implementation Plan

**Status:** ✅ Completed
**Target Areas:** `src/context/LanguageContext.tsx`, `src/i18n/`, `src/components/Header.tsx`, `src/App.tsx`, `src/screens/*`

## 🎯 Objectives
Enable dual-language support (English / Thai) across the IT Fixit platform. Instead of relying on heavy external libraries like `react-i18next`, we will build a lightweight, performant Custom Context-based i18n system tailored to the app's current scale.

---

## 📋 Implementation Steps

### 1. Dictionary Setup (`src/i18n/`)
Create translation dictionaries to store localized strings.
- Create `src/i18n/en.ts` for English terminology.
- Create `src/i18n/th.ts` for Thai terminology.
- Ensure type safety so developers get autocomplete when typing translation keys.

### 2. Context Initialization (`src/context/LanguageContext.tsx`)
Build the engine that manages the active language.
- Create `LanguageProvider` to hold the state (`en` or `th`).
- Use `localStorage` to persist the user's language choice so it remembers their preference upon returning.
- Implement a `t(key)` function to retrieve the correct translation based on the active language.
- Provide a `useLanguage()` custom hook for easy access inside components.

### 3. Application Integration
Wrap the application to make the translations globally available.
- Inject `<LanguageProvider>` around the main components in `src/App.tsx`.

### 4. UI Language Switcher
Allow users to seamlessly toggle between languages.
- Update `src/components/Header.tsx` (or `Sidebar`) to include a "TH / EN" toggle button.
- Make the toggle visually distinct and responsive.

### 5. Incremental Refactoring
Begin converting hardcoded text into translated keys.
- **Phase 1:** ✅ Start with the Header, Sidebar, and Dashboard overviews.
- **Phase 2:** ✅ Translate Modals (e.g., Ticket Creation) and Form inputs.
- **Phase 3:** ✅ Translate the Settings area and Admin Dashboard (Command Center).
- **Phase 4:** ✅ Implement dynamic language-aware timestamp conversions for Notifications.

---

## 🛠 Required Technologies
- **React Context API** (Native)
- **TypeScript** (For strict key typing in translations)

## ✅ Completed Actions
- Built the lightweight Language Context and UI toggles using country flags (🇺🇸 / 🇹🇭).
- Translated all core screens (Dashboard, Command Center, Inventory, Tickets, Personnel).
- Dynamically handled translation of backend payloads (e.g., Ticket Priorities in Notifications).
- Evaluated and translated Time representations globally in Notifications.
