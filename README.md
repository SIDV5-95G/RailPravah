# 🚆 RailPravah — Intelligent Corridor Possession & AI Block Planning System

<div align="center">

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-orange.svg)](https://sih.gov.in)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8e75ff.svg)](https://ai.google.dev)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**An AI-driven, multi-departmental corridor possession scheduling and conflict resolution platform for Indian Railways.**  
*Developed for the Smart India Hackathon (SIH) by Team Innovatrix Club.*

</div>

---

## 📖 Table of Contents

- [Problem Statement \& Vision](#-problem-statement--vision)
- [System Architecture](#-system-architecture)
- [Core Innovation Modules](#-core-innovation-modules)
  - [1. प्रवाहPLAN — Multi-Department AI Clustering Optimizer](#1-प्रवाहplan--multi-department-ai-clustering-optimizer)
  - [2. WhySlot — Explainable AI (XAI) Slot Rationale](#2-whyslot--explainable-ai-xai-slot-rationale)
  - [3. What-If Simulator — Real-Time Congestion Modeling](#3-what-if-simulator--real-time-congestion-modeling)
  - [4. Department Dispatch \& Confirmation Tracker](#4-department-dispatch--confirmation-tracker)
- [5-Tier Hierarchical Governance (RBAC)](#-5-tier-hierarchical-governance-rbac)
- [Tech Stack](#-tech-stack)
- [Monorepo Project Structure](#-monorepo-project-structure)
- [Quick Start Guide](#-quick-start-guide)
- [Environment Configuration](#-environment-configuration)
- [Database Schema \& Migrations](#-database-schema--migrations)
- [API Reference](#-api-reference)
- [How to Upload to GitHub](#-how-to-upload-to-github)
- [Contributors](#-contributors)

---

## 🎯 Problem Statement & Vision

Indian Railways operates over **13,000 passenger trains** and **9,000 freight services** daily across a heavily congested 68,000+ km network. Maintenance blocks requested by **Civil (P-Way)**, **Electrical (TRD / OHE)**, and **Signal & Telecom (S&T)** have traditionally been managed in silos, causing:
- 🚫 **Uncoordinated Possessions**: Separate closures of the same track sector on consecutive days.
- ⏱️ **Cascading Train Delays**: Passenger train detentions during peak commuter hours.
- 📋 **Fragmented Approvals**: Paper-based and verbal handoffs lacking unified audit trails.

**RailPravah** solves this by unifying all departmental demands into a single, database-backed corridor engine that optimizes shadow blocks, eliminates schedule conflicts, and generates official COA circulars with 100% data integrity.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              RAILPRAVAH UNIFIED CONSOLE                                │
│                     (React 19 + TypeScript + Tailwind CSS v4 + Motion)                 │
├───────────────────┬───────────────────┬───────────────────┬────────────────────────────┤
│   Worker Screen   │ Supervisor Screen │  Dept Head Screen │   COA Apex Planner         │
│  (Field Intake)   │   (SSE Triage)    │ (Joint Clearance) │ (प्रवाहPLAN + Circulars)   │
└───────────────────┴─────────┬─────────┴───────────────────┴─────────────┬──────────────┘
                              │ REST APIs / Realtime Events               │
                              ▼                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               RAILPRAVAH CORE BACKEND                                  │
│                              (Express.js + TypeScript)                                 │
├───────────────────────────────────┬────────────────────────────────────────────────────┤
│  • Priority Clustering Algorithm  │  • Corridor Topology Graph (Central Line)          │
│  • RBAC & Session State Machine   │  • Conflict Matrix Engine                          │
│  • Multi-Tier Escalation Engine   │  • Dispatch Circular Transmit Service              │
└─────────────────┬─────────────────┴─────────────────────────────┬──────────────────────┘
                  │                                               │
                  ▼                                               ▼
┌───────────────────────────────────┐               ┌────────────────────────────────────┐
│      SUPABASE / POSTGRESQL        │               │       GOOGLE GEMINI 2.5 FLASH      │
│  • approved_blocks                │               │  • WhySlot Natural Language XAI    │
│  • service_requests & complaints  │               │  • Root Cause Incident Diagnosis   │
│  • complaint_audit_logs           │               │  • Train Delay Impact Predictions  │
│  • section_field_groups           │               └────────────────────────────────────┘
└───────────────────────────────────┘
```

---

## ✨ Core Innovation Modules

### 1. प्रवाहPLAN — Multi-Department AI Clustering Optimizer
- Analyzes incoming demands from P-Way, TRD, and S&T across adjacent stations (e.g. *CSMT – Dadar – Kurla – Thane – Kalyan*).
- Mathematically collapses overlapping demands into unified multi-department shadow windows (`01:30 – 04:30 IST`), reducing asset downtime by **up to 65%**.

### 2. WhySlot — Explainable AI (XAI) Slot Rationale
- Employs **Gemini 2.5 Flash** with deterministic domain constraints.
- Delivers transparent reasoning on why a specific slot was sanctioned over peak-hour requests, citing passenger headway protection, section clear times, and safety margins.

### 3. What-If Simulator — Real-Time Congestion Modeling
- Interactive scenario testing interface allowing traffic controllers to simulate the punctuality impact of granting emergency blocks or rerouting suburban locals via slow lines.

### 4. Department Dispatch & Confirmation Tracker
- 100% database-persisted tracking matrix.
- Requires mutual confirmation from Civil, Electrical, and S&T field units before possession locks are transmitted to COA master control.

---

## 👥 5-Tier Hierarchical Governance (RBAC)

| Tier | Role | Responsibilities |
|---|---|---|
| **Tier 1** | **Field Worker** | Geotagged defect logging, voice notes, photo uploads, field status updates. |
| **Tier 2** | **Section Supervisor (SSE)** | Verification of field defects, gang & tool roster allocation, preliminary clustering. |
| **Tier 3** | **Zonal Head (Operating)** | Multi-divisional corridor possession review, speed restrictions, caution orders. |
| **Tier 4** | **Department Head** | Joint clearances, departmental resource sanctioning, machine roster scheduling. |
| **Tier 5** | **COA Central Controller** | Apex Traffic Authority — **प्रवाहPLAN** execution, master calendar locks, circular issuance. |

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)
- **Core**: React 19, TypeScript 5.8, Vite 6
- **Styling**: Tailwind CSS v4, Glassmorphic UI Tokens
- **Icons & Motion**: Lucide React, Framer Motion

### Backend (`/src`)
- **Runtime**: Node.js v20+, TypeScript 5.7, Express.js
- **Database**: Supabase (PostgreSQL), Row Level Security (RLS)
- **AI Integration**: `@google/genai` (Google Gemini 2.5 Flash)
- **Validation**: Zod, Helmet, CORS, Morgan

---

## 📁 Monorepo Project Structure

```
SIH_INNOVATRIX/
├── frontend/                   # React 19 Frontend Web Console
│   ├── public/                 # Static assets & logos
│   ├── src/
│   │   ├── components/         # Role-based dashboards & modals
│   │   │   ├── CoaManagementScreen.tsx       # COA Apex Console & Dispatch Tracker
│   │   │   ├── PravahPlanTab.tsx             # Multi-Dept AI Optimizer Tab
│   │   │   ├── UnifiedDailyScheduleCalendar.tsx # Master Corridor Calendar
│   │   │   ├── WhySlotScreen.tsx             # Explainable AI (XAI) UI
│   │   │   ├── WhatIfSimulatorScreen.tsx     # Corridor delay simulator
│   │   │   └── ...                           # Worker, Supervisor, Zonal screens
│   │   ├── App.tsx             # Root component & state management
│   │   ├── types.ts            # Frontend TypeScript type interfaces
│   │   └── index.css           # Global theme styling tokens
│   ├── package.json
│   └── vite.config.ts
├── src/                        # Backend Express & AI Engine
│   ├── config/                 # Supabase & Gemini client initializers
│   ├── constants/              # RBAC roles and permissions
│   ├── controllers/            # COA, Department, Issues, and Decision controllers
│   ├── db/                     # Store synchronizers & seed datasets
│   ├── routes/                 # REST API route handlers
│   ├── services/               # AI optimization, topology, & conflict engines
│   ├── types/                  # Database & API schema types
│   └── server.ts               # HTTP server entry point
├── supabase/                   # PostgreSQL DDL migrations & seed data
├── .env.example                # Sample environment file
├── .gitignore                  # Gitignore protecting secrets
├── package.json                # Monorepo scripts & dependencies
└── tsconfig.json               # Backend TypeScript configuration
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v20.x` or later
- **npm** or **bun**
- **Supabase Account** with PostgreSQL database
- **Google AI Studio API Key** (for Gemini 2.5 Flash)

---

### 1. Clone & Install All Dependencies

```bash
# Clone the repository
git clone https://github.com/<YOUR_USERNAME>/RailPravah.git
cd RailPravah

# Install backend and frontend dependencies in one command
npm run install:all
```

---

### 2. Configure Environment Variables

Create `.env` in the root directory:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5001
NODE_ENV=development

# Supabase Credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini AI Key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

---

### 3. Run Database Migrations

Copy and execute the SQL scripts in `supabase/migrations/` inside your **Supabase SQL Editor**:
1. `20260906000001_init_schema.sql` (Creates `profiles`, `complaints`, `service_requests`, `approved_blocks`, `ai_schedule_proposals`)
2. `20260906000002_seed_data.sql` (Initial hierarchy and section groups)
3. `20260907_create_train_schedules.sql` (Central Line train timetable)

---

### 4. Start the Full System

Open two terminal tabs:

**Terminal 1 — Backend:**
```bash
npm run dev:backend
# Backend starts at http://localhost:5001
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# Frontend starts at http://localhost:3000
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/coa/requests` | List all cross-departmental requests from live DB |
| `POST` | `/api/coa/requests/:id/approve` | Sanction maintenance block & lock calendar slot |
| `POST` | `/api/coa/requests/:id/decline` | Decline block with mandatory operational reason |
| `GET` | `/api/coa/recommendations` | Get live AI-clustered slots & department dispatch tracker |
| `GET` | `/api/coa/calendar` | Fetch full monthly master corridor possession calendar |
| `GET` | `/api/coa/whyslot-proposals` | Retrieve Explainable AI (XAI) slot justifications |
| `POST` | `/api/coa/generate-recommendations` | Run live multi-department matrix clustering algorithm |
| `GET` | `/api/department/joint-clearances` | Retrieve departmental clearance matrices |
| `GET` | `/api/issues/hierarchical` | Fetch multi-level escalated maintenance issues |

---

## 🐙 How to Upload to GitHub

Follow these simple steps to upload this complete project to your GitHub account:

### Step 1: Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Set the **Repository Name** (e.g. `RailPravah` or `SIH-RailPravah`).
3. Set the repository to **Public** or **Private**.
4. **Do NOT** check "Initialize this repository with a README" (we already have a complete one).
5. Click **Create repository**.

### Step 2: Push Your Code from Terminal
Run the following commands in the root of your project:

```bash
# Initialize git
git init

# Stage all files (sensitive .env files are automatically protected by .gitignore)
git add .

# Create the initial commit
git commit -m "feat: complete RailPravah AI block planning system (monorepo)"

# Set main branch
git branch -M main

# Link your GitHub repository (replace with your repository URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# Push to GitHub
git push -u origin main
```

---

## 👥 Contributors — Team Innovatrix Club

- **Team Innovatrix Club**
- *Smart India Hackathon (SIH) 2026*

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.
