# FixIt: Your Friendly Neighborhood Hero
### Hyperlocal Civic Issue Reporting, Community Action & AI Resolution Platform
**Vibe2Ship Hackathon | Problem Statement 2: Community Hero**

---

## 📖 Product Overview

**FixIt** (tagline: *"Your Friendly Neighborhood Hero"*) is a next-generation civic empowerment platform that turns citizens into the city's nervous system. Traditional municipal portals often fail due to a lack of transparency, lack of community verification mechanisms, vulnerability to spam/CGI reports, and passive communication structures.

FixIt bridges this gap by combining:
1. **Interactive Live Map Canvas:** Responsive mapping featuring real-time severity-based CSS pulse animations.
2. **AI-Powered Image Diagnostics:** Google Gemini 2.5 Flash vision scanner automatically extracts categories, severity scores, impact radius, and authenticity reasoning.
3. **Hyperlocal Neighborhood Engagement:** GPS-based geofenced peer verification (<500m proximity) and organization adoption.
4. **Autonomous Backend Sweeper:** The backend engine automatically flags duplicate proximity reports, tags chronic incident zones, and auto-escalates neglected public hazards.
5. **Twitter/X Social Pressure Pipeline:** Automatically pre-formats tweets targeting city-specific municipal handles (like `@BBMPCOMM` or `@mybmc`) to bypass traditional administrative blackholes.
6. **Gamification & Trust Metrics:** Citizen points, helper level-ups, badge credentials, and a live, security-sanitized neighborhood leaderboard.

---

## 🏆 Why Existing Platforms Fail (And How FixIt Solves It)

* **Official Grievance Portals (MyGov, local municipal apps):**
  * *Why they fail:* Black hole of data. No progress updates, zero public accountability, no civic community support, and clunky, slow user experiences.
  * *FixIt Solution:* Public status pipeline timelines, autonomous AI agents escalating neglected cases, and an automated municipal complaint letter generator to give teeth to reports.
* **Traditional Citizen Mapping Apps (SeeClickFix, FixMyStreet):**
  * *Why they fail:* No automated validation leads to spam, lacks social media amplification mechanisms, and has no personal reward/gamification engine to sustain long-term engagement.
  * *FixIt Solution:* AI-powered metadata analysis, geofenced GPS verification, Twitter auto-amplification, and rich local gamification metrics.

---

## 🎬 Application Page Highlights & Screenshot Placeholders

*Below are the core interfaces that showcase the complete civic reporting and resolution pipeline:*

### 1. The Interactive Dashboard & Live Feed
*Displays the split hero visual, real-time statistics, and the hyperlocal live feeds calculated relative to the citizen's GPS coordinates.*
<!-- [SCREENSHOT: Landing Page & Live Activity Feed] -->
`[Insert Screenshot: Landing Page showing main Hero, Mission Blueprint, and Live Activity Feed]`

### 2. Multi-Step AI Reporting Wizard
*Allows users to upload photos, trigger Gemini-powered analysis, view diagnostic metadata, and submit reports bound directly to device coordinates.*
<!-- [SCREENSHOT: AI Image Scanner & Report Form] -->
`[Insert Screenshot: AI Reporting Wizard displaying image upload, severity score, and automated tags]`

### 3. Interactive Map Explorer
*A detailed view of the community with color-coded incident pins pulsing in real time. Hotspots and chronic zone bounds are highlighted.*
<!-- [SCREENSHOT: Map Explorer page] -->
`[Insert Screenshot: Map Explorer displaying active incident pins, search filters, and chronic zones]`

### 4. Admin Command Panel & Agent Sweeps
*The command center where administrators can inspect active logs, trigger automated sweeps, and reset the demo database.*
<!-- [SCREENSHOT: Admin Panel with sweep logs] -->
`[Insert Screenshot: Admin Command Panel showing execution logs, duplicate merges, and auto-escalations]`

### 5. Gamified Citizen Leaderboard
*Displays the top-performing civic helpers in the community, sanitizing all sensitive details like email addresses before listing profiles.*
<!-- [SCREENSHOT: Leaderboard ranks] -->
`[Insert Screenshot: Leaderboard page showing points, level titles, and Pioneer badges]`

---

## 💡 Google Technologies Utilized (15% Weightage)

FixIt leverages a multi-dimensional Google stack across its development lifecycle and runtime operations:

1. **Google Gemini 2.5 Flash (via AI Studio SDK):**
   * **Visual Scanner:** Analyzes base64 civic photos to identify category type, severity score (1-10), impact radius (in meters), and authenticity metrics.
   * **Complaint Generator:** Automatically compiles professional, legal-formatted markdown complaint letters addressed to local municipal officials.
2. **Google Gemini Nano:** Used to generate the high-fidelity branding logo (`assets/logo.png`) representing the platform across the favicon, headers, and Twitter cards.
3. **Google AI Studio:** Used as the environment to test, refine, and structure the vision prompts and schema structures before porting to code.
4. **Antigravity IDE (Google DeepMind):** Used as the agentic programming companion to refactor the monolithic server, construct the MVC file structure, implement Zod validation guards, and verify the backend sweeper logic.

---

## 🔐 Session-Based Authentication Architecture

FixIt uses **industry-standard opaque session tokens** transmitted via the `Authorization: Bearer <token>` header — the same secure approach used by Google APIs, GitHub, and Stripe.

| Attribute | Detail |
| :--- | :--- |
| **Header Name** | `Authorization` |
| **Token Type** | `Bearer <session_id>` (crypto-generated 256-bit random UUID) |
| **Client Storage** | Securely in `localStorage` and cleaned from URL query strings on launch |
| **Server Storage** | MongoDB `sessions` collection with TTL index (7-day auto-expiry) |
| **Logout** | Deletes session record from DB → token invalidated instantly on server |

### Why This Beats JWT for a Presentation

| Feature | JWT (Old Way) | Session ID (FixIt Approach) |
| :--- | :--- | :--- |
| **Instant Logout** | ❌ No (stays valid until expiration) | ✅ Yes (wiped immediately from database) |
| **Payload Security** | ⚠️ Decodable (Base64 is public) | ✅ Opaque (UUID carries no metadata) |
| **Instant User Ban** | ❌ Requires complex blacklist | ✅ Immediate (delete session record) |
| **Industry Use** | Auth0, Firebase | **Google, GitHub, Stripe** |

---

## 🔒 Security, Privacy & Integrity Guardrails

To protect user identities and prevent exploitation of gamified systems, FixIt includes six core backend protections:

1. **Leaderboard Profile Sanitization**:
   * **Risk**: Exposing private database keys, password hashes, or email addresses through public rank lists.
   * **Protection**: The `/api/users` endpoint uses a whitelisting projection query (`PUBLIC_USER_FIELDS`), completely stripping out the user's `email`, internal `_id`, and `__v` fields. Only public display stats, level, and badges are visible.

2. **Anonymous Report Isolation**:
   * **Risk**: Cross-referencing anonymous reports with database user tables through front-end network calls to identify whistleblowers.
   * **Protection**:
     * On creation, anonymous reports write public placeholder strings (`'Anonymous'` for reporter name, `null` for avatar).
     * The real reporter's UID is kept privately in the database for backend checks.
     * On retrieval, `GET /api/issues` sanitizes issues server-side, stripping the `reportedBy` UID entirely on anonymous items before the payload leaves the server.

3. **Self-Verification Block on Anonymous Submissions**:
   * **Risk**: Users bypass self-verification rules by marking their own issues anonymous, then validating them to gain points.
   * **Protection**: Proximity verification checks the real authenticated user session against the hidden private `reportedBy` field directly on the server database, blocking self-verification regardless of the public anonymous flag.

4. **Minimized Storage Footprint**:
   * **Risk**: Local storage caching vulnerable to XSS inspection.
   * **Protection**: Purged all active cache files for user accounts, leaderboard profiles, and session states from `localStorage`. A boot migration script auto-wipes legacy cache strings on page refresh.

5. **Multi-Dimensional Spam & Rate Limiting**:
   * **Risk**: Automated spam bots creating thousands of fake reports, or users spamming requests to drain the Google Gemini API key quota.
   * **Protection**: 
     * **General API Limiting**: A custom MongoDB-backed sliding limiter limits all endpoints to `100 requests per 15 minutes` per User ID or IP address.
     * **Incident Submission Quota**: A specific `incidentUploadSpamLimiter` limits incident reports (`POST /api/issues`) to a maximum of `5 reports per week`. The check queries past issues for BOTH the authenticated `reportedBy` user UID AND the `reporterIp` address, preventing attempts to bypass limits by creating duplicate accounts on the same connection.

6. **Role-Based Access Control (RBAC) & Presentation Mode Gating**:
   * **Risk**: Unauthorized users gaining access to administrative control tools (running sweeps, clearing data).
   * **Protection**: 
     * Added a `role` field (`'citizen' | 'admin'`) to the database User schema.
     * The `/admin` panel route checks `currentUser.role`. Non-admins are blocked with a detailed security-themed **403 Access Forbidden** screen.
     * Secure endpoints (like executing sweeps and resets) enforce backend verification.
     * To facilitate smooth hackathon demos, a **"Simulate Admin Role"** switch is integrated into the header. Toggling it updates the live database user record, enabling presenters to showcase both restricted citizen states and administrator powers.

---

## 📢 The Twitter/X Social Pressure Pipeline

Because municipal portals are notoriously slow, FixIt introduces direct public accountability. When an issue gathers **5+ verifications**, the **Twitter/X Auto-Amplifier** is unlocked:

1. **City-Specific Tagging:** The platform automatically maps coordinates to municipal official handles:
   * **Bengaluru** $\rightarrow$ `@BBMPCOMM`
   * **Mumbai** $\rightarrow$ `@mybmc`
   * **Delhi** $\rightarrow$ `@Official_SDMC`
2. **Context-Rich Templates:** Formulates automated templates with the exact location coordinates, verification count, hazard severity, and a link back to the FixIt Map Explorer to ensure officials cannot ignore the threat.

---

## 🤖 Autonomous Backend Sweeper Engine

`POST /api/agent/sweep` performs backend-level sweeps on reported issues to automate dispatching and validation:

1. **Auto-Escalation:** Scans all active issues. If an issue has a severity score $\ge 7$ (High/Critical) and remains unresolved for more than 48 hours, the agent automatically upgrades the status to `escalated` and generates a legal notification for the municipal ward commissioner.
2. **Duplicate Merging:** Checks for issues of the same category reported within a **100-meter radius**. The agent marks the duplicate as `rejected`, merges the comments and image files, and combines the unique user upvotes into the parent issue.
3. **Chronic Zone Sweep:** Scans for repeat issues of the same category reported within a **200-meter radius** in the last 90 days. If 3 or more issues are detected, the agent auto-tags the coordinate bounds as `🔴 Chronic Zone` and upgrades the severity to critical.

---

## 🛠️ Step-by-Step Feature Test Guide

Use these steps to test the application's core capabilities during evaluations:

### Step 1: Initialize the Local Environment
1. Clone the repository and configure your environment variables in `.env` (refer to `.env.example`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (runs Express + Vite concurrently on port 3000):
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:3000`.

### Step 2: Test AI Image Diagnostics & Reporting
1. Navigate to the **Report** tab in the navigation bar.
2. If prompted, grant location access (necessary to bind the report coordinates to your device).
3. Upload an image representing a civic hazard (e.g., a pothole or damaged streetlight).
4. Click **Analyze Image**. FixIt calls Gemini 2.5 Flash to automatically detect the issue title, category, severity, and suggested municipal authority.
5. Complete the rest of the form (choose to submit anonymously or publicly) and click **Report Hazard**.

### Step 3: Test Geofenced Proximity Verification
1. Navigate to the **Map** tab and click on an active issue pin, or select an issue from the live feed on the **Dashboard**.
2. If your simulated browser location is within 500 meters of the issue coordinate, the **Verify Proximity** button will unlock. 
3. Click it to cast a physical verification. This awards you **5 points** and increments the issue's community verification index.
4. Try to verify your own submitted issue — the server will flag the session ID match and block the operation.

### Step 4: Admin mode & Sweeper Execution
1. In the header bar, click the simulation button: **[CITIZEN MODE]**. It will switch your active DB record to **[ADMIN MODE]**.
2. Navigate to the newly unlocked **Admin** tab.
3. Observe the three core sweeper rules available to run:
   * **Duplicate Merges:** Detects same-category issues reported within 100 meters, merging comments/upvotes and rejecting the child report.
   * **Chronic Zone Escalations:** Flags repeat incident zones (3+ within 200m) as chronic and upgrades severity to critical.
   * **Auto-Escalation:** Escalates unresolved high-severity reports outstanding for >48 hours.
4. Click **Run Sweeper**. Review the audit trail log printed at the bottom of the page showing the changes made to the database.

### Step 5: Test the Session-Safe Reset
1. While still on the **Admin** panel, click **Reset Demo Database**.
2. This triggers a server-side wipe and re-seed of all collections (57 default issues across 5 major Indian cities) but preserves your current session cookie. 
3. Observe that you remain fully authenticated and your admin role state is maintained.
