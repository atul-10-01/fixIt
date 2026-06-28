# FixIt: Your Friendly Neighborhood Hero
### Hyperlocal Civic Issue Reporting, Community Action & AI Resolution Platform
*Vibe2Ship Hackathon | Problem Statement 2*

---

## 📖 Product Overview

**FixIt** (tagline: *"Your Friendly Neighborhood Hero"*) is a next-generation civic empowerment platform that turns citizens into the city's nervous system. Existing municipal complaint portals fail because of **lack of accountability**, **no community-driven feedback loops**, **vulnerability to fake reports**, and **disjointed processes**.

FixIt bridges this gap by combining:
1. **Interactive, Live Map Views** featuring responsive severity-based pulse animations.
2. **AI-Powered Image Analysis & Classification** via Google Gemini 2.0 (image analysis + official letter formulation).
3. **Hyperlocal Neighborhood Engagement** (geofenced verification, adopting issues, and neighborhood-wide feeds).
4. **An Autonomous Escalation Engine** (The "Agent") that monitors neglected reports, identifies repeat-offender "Chronic Zones", and flags duplicates.
5. **Robust Gamification & Trust Metrics** (citizen helpfulness scores, levels, points, and badges) to incentivize active civic pride.
6. **Real GPS Location Awareness** — live device coordinates for true geofenced proximity verification.
7. **Enterprise-Grade Session Authentication** — opaque server-side sessions with instant revocation.

---

## 🎨 Visual Design System

The application adopts the **"Bold Typography"** aesthetic paired with high-contrast UI accents to evoke urgency and high-quality craftsmanship.

* **Palette:**
  * Background: `#0a0a0a` (Deep Onyx / Midnight Black)
  * Surface Container: `#18181b` (Zinc-900) / Border: `#27272a` (Zinc-800)
  * Primary Accent: `#ef4444` / `#dc2626` (Heroic Crimson Red)
  * Severity Colors:
    * `low`: `#10b981` (Emerald Green - Slow pulse)
    * `medium`: `#eab308` (Amber Gold - Moderate pulse)
    * `high`: `#f97316` (Warm Orange - Fast pulse)
    * `critical`: `#ef4444` (Critical Red - Rapid warning pulse)
* **Design Signature:** **The Pulse Indicator**. Issue pins on the map and card layouts utilize real-time CSS scale-ripple animations, varying in speed and hue based on the issue's severity score.
* **Typography:** Bold uppercase headers utilizing `'Plus Jakarta Sans'` and code/status displays in `'JetBrains Mono'`.

---

## 🏗️ Architecture & Tech Stack

```
                                 [ BROWSER CLIENT ]
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
[ Single Page App (React 19) ]                            [ Minimal LocalStorage ]
   - Multi-step report form (compress/capture)              - Offline Queue (mutations)
   - Interactive Map Canvas (Leaflet/SVG Map)               - GPS permission flag
   - Recharts Analytics Dashboard                           - Offline-first issue cache
   - Real GPS via Geolocation API
           │
           ▼
[ Express + Vite Dev Server ]
   - Static file server / Vite middleware in dev
   - All API routes secured via Session ID middleware
   - Zod request body validation on all mutating routes
   - Gemini API proxy (keeps key hidden server-side)
   - Google OAuth2 server-side callback handler
           │
           ▼
[ MongoDB (Mongoose) ]
   - issues      → civic reports, comments, verifications
   - users       → profiles, points, level, badges
   - sessions    → opaque session IDs with TTL auto-expiry
           │
           ▼
[ Google Gemini 2.0 Flash API ]
   - analyzeImage → AI categorization, severity 1-10, impact radius
   - writeComplaint → Municipal Complaint Letter Generator
```

---

## 🔐 Authentication Architecture (Session-Based)

FixIt uses **industry-standard opaque session IDs** stored in an `httpOnly` cookie — the same approach used by Google, GitHub, and Stripe.

| Attribute | Detail |
| :--- | :--- |
| **Cookie name** | `fixit_sid` |
| **Cookie value** | `crypto.randomUUID()` (256-bit random opaque ID) |
| **Cookie flags** | `httpOnly`, `Secure` (in production), `SameSite=Lax` |
| **Storage** | MongoDB `sessions` collection with TTL index (7-day expiry) |
| **Logout** | Deletes session record from DB → cookie cleared → token unplayable immediately |
| **Ban/Revoke** | Admin can delete session by UID → instant forced logout |

### Why This Beats JWT for a Presentation

| | JWT (Old) | Session ID (Current) |
| :--- | :--- | :--- |
| Logout works instantly? | ❌ No | ✅ Yes |
| Payload exposed? | ⚠️ Decodable (base64) | ✅ Opaque |
| Instant user ban? | ❌ Need a blacklist table | ✅ Delete session |
| MongoDB roundtrip per req? | ❌ None | ⚠️ 1 fast lookup |
| Industry use | Auth0, Firebase | **Google, GitHub, Stripe** |

---

## 🔒 Security, Privacy & Integrity Guardrails

To protect user identities and prevent exploitation of gamified systems, FixIt includes four core backend protections:

1. **Leaderboard Profile Sanitization**:
   - **Risk**: Exposing private database keys, password hashes, or email addresses through public rank lists.
   - **Protection**: The `/api/users` endpoint uses a whitelisting projection query (`PUBLIC_USER_FIELDS`), completely stripping out the user's `email`, internal `_id`, and `__v` fields before returning payload objects. Only public display stats, level, and badges are visible.

2. **Anonymous Report Isolation**:
   - **Risk**: Cross-referencing anonymous reports with database user tables through front-end network calls to identify whistleblowers.
   - **Protection**:
     - On creation, anonymous reports write public placeholder strings (`'Anonymous'` for reporter name, `null` for avatar).
     - The real reporter's UID is kept privately in the database for backend checks.
     - On retrieval, `GET /api/issues` sanitizes issues server-side, stripping the `reportedBy` UID entirely on anonymous items before the payload leaves the server.

3. **Self-Verification Block on Anonymous Submissions**:
   - **Risk**: Users bypass self-verification rules by marking their own issues anonymous, then validating them to gain points.
   - **Protection**: Proximity verification checks the real authenticated user session against the hidden private `reportedBy` field directly on the server database, blocking self-verification regardless of the public anonymous flag.

4. **Minimized Storage Footprint**:
   - **Risk**: Local storage caching vulnerable to XSS inspection.
   - **Protection**: Purged all active cache files for user accounts, leaderboard profiles, and session states from `localStorage`. A boot migration script auto-wipes legacy cache strings on page refresh.

5. **Multi-Dimensional Spam & Rate Limiting**:
   - **Risk**: Automated spam bots creating thousands of fake reports, or users spamming requests to drain the Google Gemini API key quota.
   - **Protection**: 
     - **General API Limiting**: A custom MongoDB-backed sliding limiter limits all endpoints to `100 requests per 15 minutes` per User ID or IP address.
     - **Incident Submission Quota**: A specific `incidentUploadSpamLimiter` limits incident reports (`POST /api/issues`) to a maximum of `5 reports per week`. The check queries past issues for BOTH the authenticated `reportedBy` user UID AND the `reporterIp` address, preventing attempts to bypass limits by creating duplicate accounts on the same connection or changing IP addresses under the same account.

---

## 🌍 Real GPS Location

FixIt now uses the browser **Geolocation API** for true geofenced proximity verification instead of hardcoded coordinates.

- On first load, a **Location Permission Modal** explains *why* GPS is needed before triggering the browser prompt.
- If the user **allows**, `watchPosition()` continuously tracks their coordinates.
- If the user **denies**, they pick from a **city selector** (Bengaluru / Mumbai / Delhi / Gurgaon / Noida) for approximate coordinates.
- The **Header Navbar** shows a live `🟢 GPS Live` / `🔴 GPS Off` badge reflecting the current state.
- GPS status is preserved: the `fixit_gps_asked` flag in localStorage prevents re-asking on every visit.

---

## 🗄️ Database (MongoDB)

All civic data is persisted in MongoDB via Mongoose ODM.

| Collection | Schema | Purpose |
| :--- | :--- | :--- |
| `issues` | `issue.model.ts` | All civic reports |
| `users` | `user.model.ts` | Citizen profiles, points, levels |
| `sessions` | `session.model.ts` | Server-side session records (TTL auto-expiry) |

**Seed Data Coverage** (57 high-fidelity issues across 5 cities):

| City | Areas Covered | Issues |
| :--- | :--- | :--- |
| Bengaluru | Koramangala, HSR, Indiranagar | 7 |
| Mumbai | Bandra, Carter Road, Linking Road | 4 |
| Delhi | Saket, Vasant Kunj, Connaught Place | 3 |
| **Gurgaon** | **Cyber City, Golf Course Road, Sector 29, MG Road, Sohna Road** | **5** |
| **Noida** | **Sector 18, Sector 62, Film City Road, Kalindi Kunj, Amity Road** | **5** |

---

## ✅ Backend Request Validation (Zod)

All mutating API routes validate their request body using **Zod schemas** before any database writes.

| Route | Zod Schema |
| :--- | :--- |
| `POST /api/issues` | `CreateIssueSchema` |
| `PUT /api/issues/:id/verify` | `VerifyIssueSchema` |
| `POST /api/issues/:id/comments` | `CommentSchema` |
| `PUT /api/issues/:id/resolve` | `ResolveIssueSchema` |
| `PUT /api/issues/:id/adopt` | `AdoptIssueSchema` |

Invalid payloads receive `400 Bad Request` with structured field-level Zod error messages — never a silent write or crash.

---

## 🗑️ LocalStorage Policy (Minimal Surface)

FixIt intentionally minimizes browser storage to reduce stale data risk and attack surface.

| Key | Kept? | Reason |
| :--- | :--- | :--- |
| `fixit_issues` | ✅ Keep | Offline-first fallback cache when server is unreachable |
| `fixit_offline_queue` | ✅ Keep | Critical for queued mutations when offline |
| `fixit_gps_asked` | ✅ Keep | Prevents GPS permission modal re-appearing every visit |
| `fixit_users` | ❌ Removed | Leaderboard always comes from DB |
| `fixit_current_user` | ❌ Removed | User comes from `/api/auth/me` via server session |
| `fixit_agent_logs` | ❌ Removed | Logs are in-memory only, not persisted |
| `fixit_war_room_active` | ❌ Removed | Transient UI state — resets per session by design |
| `fixit_war_room_area` | ❌ Removed | Same as above |

---

## 💡 Feature Implementation Matrix

| Feature | Status | Implementation |
| :--- | :--- | :--- |
| **Full Map View & Hotspots** | ✅ Fully Implemented | Custom SVG map with severity-based pulse animations, density heatmaps, chronic zone overlays |
| **AI Multi-Step Report** | ✅ Fully Implemented | Google Gemini 2.0 Flash analyzes images for severity, category, impact radius, authority |
| **Real GPS Proximity** | ✅ Fully Implemented | `navigator.geolocation.watchPosition` → geofenced 500m verify/resolve buttons |
| **Google OAuth (Server-Side)** | ✅ Fully Implemented | Express handles full code exchange; cookie set on server — React never sees the token |
| **Session Auth (Industry Grade)** | ✅ Fully Implemented | Opaque UUID in httpOnly cookie; MongoDB sessions with TTL auto-expiry |
| **Zod Request Validation** | ✅ Fully Implemented | All `POST`/`PUT` routes validated before DB write; 400 on bad payload |
| **MongoDB Persistence** | ✅ Fully Implemented | All issues, users, sessions in MongoDB Atlas / local |
| **Offline-First Queue** | ✅ Fully Implemented | Failed mutations queued in localStorage, auto-flushed when online |
| **Anonymity & Safety** | ✅ Fully Implemented | SHA-256 token hashing, legal aid widget, whistleblower warnings |
| **Before/After Slider** | ✅ Fully Implemented | CSS clip-path drag slider with GPS proximity-locked resolution |
| **Complaint Letter Gen** | ✅ Fully Implemented | Gemini 2.0 writes formal municipal letter downloadable as text |
| **Social Amplification** | ✅ Fully Implemented | Tweet preview modal targeting city-specific municipal handles |
| **Autonomous Agent** | ✅ Fully Implemented | AI agent panel with escalation, chronic zone flagging, duplicate merging |
| **Gamification & Leaderboard** | ✅ Fully Implemented | Points, levels, Pioneer badges, helpfulness scores, live leaderboard |
| **i18n (EN/HI)** | ✅ Fully Implemented | react-i18next with full English and Hindi locale files |

---

## 🛡️ Known Challenges & Future Roadmap

| Challenge | Current V1 Approach | Planned V2 Solution |
| :--- | :--- | :--- |
| **Anonymity & Personal Safety** | SHA-256 token hashing; Legal Aid sidebar | Zero-knowledge-proof (ZKP) verification |
| **Fake Reports & AI Media** | EXIF metadata check, Flag button, Gemini authenticity score | C2PA / Google SynthID watermark checks |
| **Resolution Fraud** | GPS-tagged resolution photo within 500m, verified by reporter + 2 citizens | Multi-spectral before/after photo analysis |
| **Legal Liabilities** | Disclaimers, 112 emergency routing, secure NGO share | Legal insurance for citizen advocates, IPFS evidence storage |
| **No Official Municipal APIs** | Pre-drafted formal complaint letter via Gemini | Direct CPGRAMS / municipal API integrations |
| **Session Scalability at Scale** | MongoDB session store (fine for <10k concurrent) | Redis session cluster for horizontal scaling |

---

## 🏆 Why Existing Platforms Fail (And How FixIt Solves It)

* **Official Grievance Portals (MyGov, municipal apps):**
  * *Why they fail:* Black hole of data. No progress updates, zero public accountability, no civic community support, and extremely clunky, slow user experiences.
  * *FixIt Solution:* Public status pipeline timelines, autonomous AI agents escalating neglected cases, and an automated municipal complaint letter generator to give teeth to reports.
* **Traditional Citizen Mapping Apps (SeeClickFix, FixMyStreet):**
  * *Why they fail:* No automated validation leads to spam, lacks social media amplification mechanisms, and has no personal reward/gamification engine to sustain long-term engagement.
  * *FixIt Solution:* AI-powered metadata analysis, geofenced GPS verification, Twitter auto-amplification, and rich local gamification metrics.
