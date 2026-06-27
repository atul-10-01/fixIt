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
[ Single Page App (React 19) ]                              [ Local Data Storage ]
   - Multi-step report form (compress/capture)                 - Offline Queue
   - Interactive Map Canvas (Leaflet/SVG Map)                  - Hashed Anon Tokens
   - Recharts Analytics Dashboard                              - User session settings
           │
           ▼
[ Express + Vite Server proxying API ]
   - Static file server
   - Proxy handler to Gemini API (keeps secret key hidden server-side)
   - Real-time Firestore local simulation / persistence engine
           │
           ▼
[ Google Gemini API SDK ]
   - analyzeImage (Gemini 2.0 Flash) -> AI categorization, severity, reasoning, impact
   - writeComplaint (Gemini 2.0 Flash) -> Municipal Complaint Letter Generator
```

---

## 💡 Feature Implementation Strategy (Real vs. Simulated)

To make a **flawless, highly reliable, and stunning demo** for the hackathon judges within our runtime container, we will employ a hybrid strategy of fully functioning production integrations and smart, realistic simulation environments:

| Feature | Scope Type | Implementation / Demonstration Approach |
| :--- | :--- | :--- |
| **Full Map View & Hotspots** | **Fully Implemented** | A fully interactive geographic simulation canvas. Since standard Google Maps API keys are not pre-configured, we'll build a highly functional custom-designed map overlay. It will display the active issue pins, density heatmaps, predictive hotspot zones, search filtering, and user distance calculators in a beautifully styled, high-fidelity custom SVG/Canvas coordinate layer representing key Indian city quadrants. |
| **AI Multi-Step Report** | **Fully Implemented** | Real client-side image compression. The upload immediately calls our secure backend, which invokes the official Google Gemini API to analyze the image, classify category, calculate severity (1-10), estimate impact radius, and suggest municipal authorities. |
| **Anonymity & Safety** | **Fully Implemented** | A toggle on the report form. Calculates SHA-256 hash of user ID + salt on the client. Saves report without identifiable data, but stores the token locally so the user can still edit/track their own submissions. Floating Legal Aid widget. |
| **Before/After Slider** | **Fully Implemented** | Interactive CSS clip-path visual drag slider. Allows uploading a resolution proof photograph which enforces GPS proximity tolerance. |
| **Complaint Letter Gen** | **Fully Implemented** | Securely calls Gemini via backend, summarizing issue stats, and returns a perfectly drafted formal letter inside a copyable/downloadable modal. |
| **Social Amplification** | **Fully Implemented** | Custom Tweet Preview modal and pre-composed tweets targeting official municipal handles (e.g., `@BBMPCOMM`, `@mybmc`) based on a Indian city lookup database. |
| **Offline-First Queue** | **Fully Implemented** | Captures internet status using standard browser listeners. Queues failed reports into `localStorage`, automatically pushing them to the database once connection returns, complete with navbar badges. |
| **Autonomous Agent** | **Fully Implemented** | An interactive "Agent Control Panel" that lets judges trigger the agent loop manually or view its real-time autonomous log entries (resolving duplicates, upgrading chronic zones, flagging fake alerts). |
| **Gamification & Leaderboard** | **Fully Implemented** | Live citizen points calculation, profile levels, Pioneer badges, helpfulness scores, and a scrolling leaderboard. |

---

## 🛡️ Known Challenges & Future Roadmap

| Challenge | Current Approach in V1 | Planned Solution in V2 |
| :--- | :--- | :--- |
| **Anonymity & Personal Safety** | Client-side SHA-256 token hashing; persistent Legal Aid sidebar widget for quick recourse; Whistleblower warnings. | Complete zero-knowledge-proof (ZKP) verification integration to prevent any connection tracing. |
| **Fake Reports & AI Media** | EXIF camera metadata inspections, separate "Flag as Fake" button, 3 flags trigger Under Review, Gemini model authenticity verification. | Integration with standard Content Authenticity Initiative (C2PA) metadata specs and Google SynthID watermarking checks. |
| **Resolution Fraud** | Mandatory GPS-tagged resolution photo within 50m of original coordinate, verified by original reporter + 2 independent verifiers. | Multi-spectral analysis of before/after photos using advanced computer vision models to ensure structural differences match. |
| **Legal Liabilities & Threats** | Disclaimers built into UI, immediate emergency 112 routing, direct secure sharing with verified legal/press NGOs. | Legal insurance funds for citizen advocates, automated secure decentralized storage (IPFS) for raw evidence. |
| **No Official Municipal APIs** | Beautiful, pre-drafted legal municipal letter generator to let citizens easily forward claims directly via email/PDF. | Direct integrations with official national grievance APIs (such as CPGRAMS in India) once public endpoints open. |

---

## 🏆 Why Existing Platforms Fail (And How FixIt Solves It)

* **Official Grievance Portals (MyGov, municipal apps):**
  * *Why they fail:* Black hole of data. No progress updates, zero public accountability, no civic community support, and extremely clunky, slow user experiences.
  * *FixIt Solution:* Public status pipeline timelines, autonomous AI agents escalating neglected cases, and an automated municipal complaint letter generator to give teeth to reports.
* **Traditional Citizen Mapping Apps (SeeClickFix, FixMyStreet):**
  * *Why they fail:* No automated validation leads to spam, lacks social media amplification mechanisms, and has no personal reward/gamification engine to sustain long-term engagement.
  * *FixIt Solution:* AI-powered metadata analysis, geofenced verification, Twitter auto-amplification, and rich local gamification metrics.
