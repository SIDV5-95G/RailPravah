# 🚆 RailPravah Frontend — AI-Powered Corridor Block Planning & Traffic Management Console

> **Modern, High-Aesthetic Operating Console for Indian Railways Traffic Optimization**  
> *Developed for Smart India Hackathon (SIH) • Team Innovatrix*

---

## 📸 Overview

The **RailPravah Web Console** is an enterprise-grade, real-time operating dashboard built for Indian Railways personnel across all administrative and field tiers. It coordinates corridor maintenance blocks, provides explainable AI slot optimizations, and tracks cross-departmental clearances between **Civil (P-Way)**, **Electrical (TRD / OHE)**, and **Signal & Telecom (S&T)**.

---

## 🎯 Key Interfaces & Roles

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                RAILPRAVAH UNIFIED CONSOLE                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [1] 👷 Field Worker Screen        - Quick Defect Logging & Geotagged Incident Intake  │
│  [2] 🔍 Section Supervisor (SSE)   - Verification, Gang Assignment & First-Level Triage│
│  [3] 🏢 Department Head Console    - Joint Clearances, Machine Roster & Approvals      │
│  [4] 🗺️ Zonal Head Console         - Multi-Divisional Corridor Oversight & Dispatch    │
│  [5] ⚡ COA Apex Operations        - प्रवाहPLAN AI Optimizer, Calendar & Block Bulletin │
│  [6] 🧠 WhySlot Engine (XAI)       - Natural Language Explainability for Slot Choices  │
│  [7] 🔮 What-If Simulator          - Real-Time Train Detention & Congestion Modeling   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Feature Highlights

### ⚡ COA Central Management Screen
- **प्रवाहPLAN (AI Optimization Matrix)**: Clusters concurrent departmental possession demands into unified shadow windows to prevent cascading suburban passenger train delays.
- **Cross-Departmental Service Requests Tab**: 100% database-driven queue to inspect, filter, sanction, or decline field requests with full audit history.
- **Unified Master Calendar View**: Interactive month and day timelines displaying all sanctioned corridor blocks.
- **Department Dispatch & Confirmation Tracker**: Multi-department live tracking matrix showing real-time acknowledgments from P-Way, TRD, and S&T.
- **Official Block Bulletin Generator**: Transmits formatted Indian Railways Central Line circulars directly to operating divisions.

### 🧠 WhySlot — Explainable AI (XAI)
- Transparent slot reasoning cards breaking down:
  - Safety margins & conflict avoidance.
  - Headway preservation for express services.
  - Cumulative passenger train hours saved.

### 🔮 What-If Corridor Simulator
- Interactive timeline manipulation to simulate the effect of adding, shifting, or extending a block on suburban express schedules.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | React 19, TypeScript 5.8+, Vite 6 |
| **Styling** | Tailwind CSS v4, Custom Design Tokens, CSS Glassmorphism |
| **Icons & Motion** | `lucide-react`, `motion` (Framer Motion) |
| **Data Fetching** | Real-time REST API integration with RailPravah Backend & Supabase |

---

## 📁 Project Structure

```
RAIL_PRAVAH_FRONTEND/
├── src/
│   ├── App.tsx                              # Main root application component
│   ├── main.tsx                             # React 19 entry point
│   ├── index.css                            # Global CSS & theme tokens
│   ├── types.ts                             # Global TypeScript definitions
│   ├── mockData.ts                          # Topology & fallback reference datasets
│   └── components/
│       ├── Navigation.tsx                   # Role-aware responsive sidebar & top bar
│       ├── HierarchyTabBar.tsx              # Quick role-switching breadcrumb bar
│       ├── CoaManagementScreen.tsx          # Apex COA corridor planning console
│       ├── PravahPlanTab.tsx                # Multi-department AI optimizer tab
│       ├── UnifiedDailyScheduleCalendar.tsx # Master interactive calendar
│       ├── WhySlotExplainabilityScreen.tsx  # Explainable AI (XAI) rationale view
│       ├── WhatIfSimulationScreen.tsx       # Live delay & bottleneck simulator
│       ├── WorkerScreen.tsx                 # Field incident submission screen
│       ├── SupervisorScreen.tsx             # Section supervisor verification screen
│       ├── DepartmentHeadDashboardScreen.tsx# Department-level clearance console
│       ├── ZonalHeadDashboardScreen.tsx     # Zonal operations dashboard
│       └── CoaProvidePlanModal.tsx          # Multi-slot maintenance plan modal
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Backend**: RailPravah Backend running on `http://localhost:5001`

---

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/RailPravah-Frontend.git
   cd RailPravah-Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Local Proxy / Environment:**
   Ensure `vite.config.ts` proxies `/api` requests to backend at `http://localhost:5001`.

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   *Open `http://localhost:3000` (or the URL displayed in the terminal) in your browser.*

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🎨 Design Philosophy & UX Standards

- **Indian Railways Operational Aesthetics**: Tailored color-coded badges for departments (Civil/P-Way: Emerald, Electrical/TRD: Amber, S&T: Indigo).
- **High-Density Data Views**: Clean, compact typography optimized for traffic controllers managing dense suburban sections (e.g. *CSMT – Kalyan – Kasara/Khopoli*).
- **Zero Mock / 100% Live DB**: All tables, forms, and calendars pull directly from Supabase and Express APIs.

---

## 👥 Contributors — Team Innovatrix Club

- **Team Innovatrix Club**
- *Smart India Hackathon (SIH) 2026*

---

## 📄 License

This project is licensed under the **ISC License**.
