# System Security & Authentication Plan

**Status:** Completed
**Target Areas:** `schema.prisma`, `server/server.js`, `src/screens/Login.tsx`

## 🎯 Objectives
Upgrade the system's authentication mechanism from basic plain-text to a secure, encrypted setup. Support login via both Email and Username.

---

## 📋 Implemented Features

### 1. User Identification (Username Support) [✅ COMPLETED]
- **Issue:** Users could only log in using their email addresses, which might be long or hard to type.
- **Solution:** 
  - Added a `username` field to the `Personnel` model in `schema.prisma` (`String? @unique`).
  - Updated the backend `/api/login` endpoint to allow logging in with either `email` or `username` using Prisma's `OR` query.
  - Updated the `Login.tsx` frontend to label the input field as "Username or Email".

### 2. Password Encryption (Hashing) [✅ COMPLETED]
- **Issue:** Passwords were stored and compared as plain-text, posing a massive security risk.
- **Solution:**
  - Installed and integrated the `bcrypt` library.
  - Intercepted user creation (`POST /api/personnel`) and user update (`PUT /api/personnel/:id`) endpoints to automatically salt and hash passwords using `bcrypt.hash(..., 10)`.
  - Updated the `/api/login` endpoint to use `bcrypt.compare()` for verifying passwords.
  - Built-in fallback logic: If an old user logs in with a plain-text password that matches the DB, the system auto-upgrades and hashes their password seamlessly without disruption.

---

## 🚀 Next Steps (Phase 2 Security)
- **JWT Implementation:** Transition from stateful/local mock auth to secure JSON Web Tokens (JWT) for stateless session management.
- **Role-Based Access Control (RBAC):** Ensure API routes check `userRole` before allowing destructive actions (e.g., Delete Asset).
