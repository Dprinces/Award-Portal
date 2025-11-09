# Sandwich Award Platform — Administrative Overview & Pitch

This document is tailored for administrators, sponsors, and decision‑makers evaluating or operating the Sandwich Award (EKSU Student Voting) platform. It highlights the value proposition, governance workflows, technical design, security posture, and operational practices.

## Executive Summary

- Purpose: Recognize outstanding undergraduate students through a secure, transparent voting platform.
- Vision: Fair nomination, verified participation, paid voting to reduce fraud, and real‑time results.
- Outcome: Increased engagement, credible awards, and actionable insights for organizers.

## Key Benefits

- Trusted process with verification, rate limiting, and audit logs.
- Streamlined admin workflows for nominees, users, categories, payments, and system settings.
- Real‑time analytics and dashboards to monitor activity and financials.
- Scalable architecture (React SPA on Vercel, Node/Express API, MongoDB).

## Admin Capabilities

- Users
  - View, search, filter by role/status.
  - Block/Unblock users via `PUT /api/admin/users/:id/status` with `{ isActive: false|true }`.
- Nominees
  - Review submissions, approve or reject with reasons.
  - Endpoints:
    - Approve: `PATCH /api/admin/nominees/:id/approve`
    - Reject: `PATCH /api/admin/nominees/:id/reject`
- Categories
  - Create and manage award categories (name, description, icon/color).
- Payments
  - View payments, export reports, and track revenue and conversion.
- System Settings
  - Manage platform configuration (e.g., branding, policies, operational toggles).
- API Keys
  - Manage external integrations (e.g., payment provider keys).
- Analytics & Alerts
  - Access dashboards and generated system alerts for proactive actions.

## Governance & Workflow

1. Registration: Students register and receive immediate feedback (registration result page).
2. Nomination: Students submit nominee applications; admins review and approve/reject.
3. Voting: Verified users cast votes; payments enforced per vote to ensure authenticity.
4. Monitoring: Admins track activity, payments, and system metrics.
5. Recognition: Winners and statistics published post‑event.

## Architecture Overview

- Frontend
  - React SPA hosted on Vercel.
  - SPA fallback routing (configured in `vercel.json`) to support client‑side routes.
  - Uses a `RegistrationResult` page to communicate post‑registration outcomes.
- Backend
  - Node.js + Express API.
  - MongoDB for persistence.
  - Routes organized under `/api/*` (auth, categories, nominees, votes, payments, admin).
  - Static assets served under `/uploads` for nominee images and related content.
- Payments
  - Paystack integration (network access configured for `https://api.paystack.co`).
- Security & Reliability
  - `helmet` for HTTP security headers.
  - `cors` with strict origin allowlist, credential support, and preflight handling.
  - Rate limiting for general, auth, and payment routes.
  - Centralized error handling and structured logging.

## Security Posture

- Authentication & Authorization
  - JWT‑based auth (with admin role checks via middleware `adminAuth`).
  - Protected admin routes (requires valid token and admin privileges).
- CORS
  - Allowed Origins: Local development (`localhost/127.0.0.1` ports 3000–3002) and production domain (`https://award-portal.vercel.app`).
  - Allowed Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
  - Allowed Headers: `Content-Type, Authorization, x-auth-token`.
- Rate Limits
  - General: 100 req/15m in production, higher in development.
  - Auth: 200 req/15m in production, much higher in development.
  - Payments: 5 req/min per IP.
- Data Protection
  - Passwords hashed via model hooks (pre‑save).
  - Minimal PII exposure in admin views (password excluded).

## Operations & Deployment

- Environments & Variables
  - Backend `.env`:
    - `PORT`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `PAYSTACK_SECRET` (and related payment keys).
  - Frontend `.env`:
    - `REACT_APP_API_BASE_URL` pointing to the backend `/api`.
- Development
  - Backend: `npm run dev` (nodemon) in `backend/`.
  - Frontend: `npm start` in `frontend/`.
- Production
  - Frontend built and deployed via Vercel (`vercel.json` config):
    - Build: `cd frontend && CI=false npm run build`.
    - Install: `cd frontend && npm install`.
    - Output: `frontend/build`.
    - Routes: Filesystem pass‑through then SPA fallback to `index.html`.
  - Backend hosted on a Node server (ensure public base URL set in frontend and allowed in backend CORS).

## Admin Demo Guide

1. Seed Admin User
   - Script: `backend/scripts/createAdmin.js` creates/ensures an admin account.
   - Verify the admin’s email and password in a secure channel before sharing.
2. Admin Login
   - Endpoint: `POST /api/auth/login` with email and password.
   - On success, obtain token; admin UI should reflect elevated privileges.
3. Moderate Nominees
   - Approve or reject submissions; track reasons and audit trail.
4. Manage Users
   - Block/unblock with `PUT /api/admin/users/:id/status`.
5. Review Payments
   - Use analytics and exports for reconciliation.
6. Update Settings
   - Apply platform changes under admin settings.

## KPIs & Reporting

- Engagement: Registrations, active users, session counts.
- Nomination funnel: Submissions, approvals, rejections, turnaround time.
- Voting: Votes cast, conversion rates, peak concurrency.
- Financials: Payment success rate, revenue, refunds.
- System Health: Error rates, latency, uptime, rate‑limit incidents.

## Roadmap (Suggested)

- Multi‑factor authentication for admins.
- Enhanced fraud detection (device fingerprinting, anomaly detection).
- Role‑based permissions beyond admin (moderators, finance, analytics).
- Event‑driven notifications (emails for status changes, reminders).
- Audit log UI and export.
- Internationalization and accessibility improvements.

## Risks & Mitigations

- CORS/Preflight issues: Strictly maintain allowlists and permitted methods; monitor logs.
- Payment gateway downtime: Implement retries and operational alerts.
- Data consistency: Use indexes and validation; monitor MongoDB health.
- Abuse: Rate limiting and admin workflows to block suspicious users.

## Contact & Ownership

- Technical Owner: DprinceDeveloper.
- Operations Owner: Awards Committee Administrators.
- Security/Compliance: Coordinated with university policies.

---

This platform is designed to deliver fairness, transparency, and operational efficiency for student awards, with a solid technical foundation and clear admin workflows to support credible outcomes.