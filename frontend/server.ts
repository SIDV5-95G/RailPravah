import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { HierarchicalIssue, IssueModificationRecord, IssueLifecycleStatus } from "./src/types";
import { INITIAL_HIERARCHICAL_ISSUES } from "./src/mockData";

dotenv.config();

const app = express();
const PORT = 3000;

// CORS headers for iframe environment
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-role, x-user-empid, x-user-station"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

// Forward all /api requests (auth, issues, complaints, worker, coa, notifications, gemini, etc.)
// directly to the authoritative Supabase backend in SIH_INNOVATRIX
app.use("/api", async (req, res, next) => {
  if (req.path === "/health-local") {
    return next();
  }
  try {
    const targetUrl = `${BACKEND_URL}/api${req.url}`;
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string" && k.toLowerCase() !== "host" && k.toLowerCase() !== "content-length") {
        headers[k] = v;
      }
    }
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
      headers["content-type"] = "application/json";
    }
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    res.status(response.status);
    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("content-type", contentType);
    }
    res.send(data);
  } catch (err: any) {
    console.warn(`[Backend Proxy Note] Request to ${req.url} falling back:`, err?.message);
    next();
  }
});

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// 1. What-If Delay Simulation Endpoint (Live Gemini AI)
app.post("/api/gemini/simulate-whatif", async (req, res) => {
  try {
    const { targetBlock, delayMinutes, trackSector } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Deterministic track-specific fallback response if no API key provided
      const numDelay = parseInt(delayMinutes, 10) || 45;
      const targetStr = (targetBlock || "").toLowerCase();

      let baseDelayed = 22;
      let baseRadius = 4;
      let stationList = "Ghatkopar, Vikhroli, Kurla, Vidyavihar";
      let lineType = "Down Slow Line (Adjacent to Platform #3)";
      let specificDelays = [
        { trainNo: "97089 (CSMT-TNA SLOW)", location: "Vikhroli Home Signal", scheduledTime: "16:40", simulatedTime: "17:25", delta: `+${numDelay}m`, severity: "high" },
        { trainNo: "97091 (CSMT-KYN SLOW)", location: "Ghatkopar PF #3 Approach", scheduledTime: "16:48", simulatedTime: "17:31", delta: `+${Math.max(5, numDelay - 2)}m`, severity: "high" },
        { trainNo: "97093 (CSMT-DI SLOW)", location: "Vidyavihar Outer", scheduledTime: "16:55", simulatedTime: "17:35", delta: `+${Math.max(5, numDelay - 5)}m`, severity: "high" },
        { trainNo: "97095 (CSMT-TNA SLOW)", location: "Kurla Junction Slow Line", scheduledTime: "17:03", simulatedTime: "17:39", delta: `+${Math.max(5, numDelay - 9)}m`, severity: "medium" },
        { trainNo: "11009 (SINHAGAD EXP)", location: "Adjacent Fast Line Caution", scheduledTime: "17:15", simulatedTime: "17:35", delta: `+${Math.max(5, numDelay - 25)}m`, severity: "medium" },
        { trainNo: "97097 (CSMT-KJT SLOW)", location: "Matunga Slow Line", scheduledTime: "17:22", simulatedTime: "17:42", delta: `+${Math.max(5, numDelay - 25)}m`, severity: "medium" },
      ];

      if (targetStr.includes("dadar") || targetStr.includes("matunga") || targetStr.includes("pf4")) {
        baseDelayed = 26;
        baseRadius = 6;
        stationList = "CSMT, Byculla, Dadar, Kurla, Ghatkopar, Thane";
        lineType = "Up Fast Line (Platform #4 Throat)";
        specificDelays = [
          { trainNo: "12859 (GITANJALI EXP)", location: "Dadar Throat Signal", scheduledTime: "06:15", simulatedTime: "07:00", delta: `+${numDelay}m`, severity: "high" },
          { trainNo: "95301 (CSMT-TNA FAST)", location: "Matunga Up Fast Line", scheduledTime: "06:22", simulatedTime: "07:04", delta: `+${Math.max(5, numDelay - 3)}m`, severity: "high" },
          { trainNo: "97045 (SLOW LOCAL)", location: "Kurla Junction Merging", scheduledTime: "06:30", simulatedTime: "07:10", delta: `+${Math.max(5, numDelay - 5)}m`, severity: "high" },
          { trainNo: "12051 (JAN SHATABDI)", location: "Ghatkopar Up Fast", scheduledTime: "06:40", simulatedTime: "07:18", delta: `+${Math.max(5, numDelay - 12)}m`, severity: "medium" },
          { trainNo: "11057 (AMRITSAR EXP)", location: "Vikhroli Fast Line", scheduledTime: "06:50", simulatedTime: "07:22", delta: `+${Math.max(5, numDelay - 18)}m`, severity: "medium" },
        ];
      } else if (targetStr.includes("kalyan") || targetStr.includes("thakurli") || targetStr.includes("pf5")) {
        baseDelayed = 19;
        baseRadius = 5;
        stationList = "Kalyan, Dombivli, Thakurli, Diva, Thane";
        lineType = "Down Fast Line (Platform #5 Crossover)";
        specificDelays = [
          { trainNo: "22221 (NZM RAJDHANI)", location: "Kalyan PF #5 Exit Crossover", scheduledTime: "16:40", simulatedTime: "17:25", delta: `+${numDelay}m`, severity: "high" },
          { trainNo: "12127 (INTERCITY EXP)", location: "Thakurli Advance Starter", scheduledTime: "16:52", simulatedTime: "17:34", delta: `+${Math.max(5, numDelay - 3)}m`, severity: "high" },
          { trainNo: "95123 (FAST LOCAL)", location: "Dombivli Fast Platform", scheduledTime: "17:05", simulatedTime: "17:37", delta: `+${Math.max(5, numDelay - 13)}m`, severity: "medium" },
          { trainNo: "11029 (KOYNA EXP)", location: "Diva Fast Bypass", scheduledTime: "17:15", simulatedTime: "17:40", delta: `+${Math.max(5, numDelay - 20)}m`, severity: "medium" },
        ];
      } else if (targetStr.includes("5th") || targetStr.includes("bypass") || targetStr.includes("vidyavihar")) {
        baseDelayed = 11;
        baseRadius = 3;
        stationList = "Kurla, Vidyavihar, Ghatkopar";
        lineType = "5th Line (Bypass Corridor)";
        specificDelays = [
          { trainNo: "12111 (AMRAVATI EXP)", location: "Kurla 5th Line Starter", scheduledTime: "19:55", simulatedTime: "20:40", delta: `+${numDelay}m`, severity: "high" },
          { trainNo: "12133 (MANGALURU SF)", location: "Kurla Loop Yard", scheduledTime: "20:05", simulatedTime: "20:45", delta: `+${Math.max(5, numDelay - 5)}m`, severity: "high" },
          { trainNo: "FREIGHT BTPN-41", location: "Vidyavihar Goods Loop", scheduledTime: "20:20", simulatedTime: "20:56", delta: `+${Math.max(5, numDelay - 9)}m`, severity: "medium" },
        ];
      } else if (targetStr.includes("thane") || targetStr.includes("mulund") || targetStr.includes("pf2")) {
        baseDelayed = 16;
        baseRadius = 4;
        stationList = "Thane, Mulund, Nahur, Bhandup";
        lineType = "Up Slow Track (Creek Bridge)";
        specificDelays = [
          { trainNo: "97045 (TNA-CSMT SLOW)", location: "Thane PF #2 Starter", scheduledTime: "15:05", simulatedTime: "15:50", delta: `+${numDelay}m`, severity: "high" },
          { trainNo: "97047 (KYN-CSMT SLOW)", location: "Mulund Creek Bridge", scheduledTime: "15:15", simulatedTime: "15:56", delta: `+${Math.max(5, numDelay - 4)}m`, severity: "high" },
          { trainNo: "96311 (ASANGAON SLOW)", location: "Nahur Up Slow Line", scheduledTime: "15:28", simulatedTime: "16:02", delta: `+${Math.max(5, numDelay - 11)}m`, severity: "medium" },
        ];
      } else if (targetStr.includes("csmt") || targetStr.includes("byculla") || targetStr.includes("pf1")) {
        baseDelayed = 25;
        baseRadius = 5;
        stationList = "CSMT, Masjid, Sandhurst Road, Byculla, Chinchpokli";
        lineType = "Down Suburban Line (CSMT Throat)";
        specificDelays = [
          { trainNo: "97001 (CSMT-KYN SLOW)", location: "CSMT PF #1 Departure", scheduledTime: "08:10", simulatedTime: "08:55", delta: `+${numDelay}m`, severity: "high" },
          { trainNo: "97003 (CSMT-TNA SLOW)", location: "Masjid Yard Throat", scheduledTime: "08:18", simulatedTime: "08:59", delta: `+${Math.max(5, numDelay - 4)}m`, severity: "high" },
          { trainNo: "95002 (CSMT-KJT FAST)", location: "Sandhurst Road Crossover", scheduledTime: "08:26", simulatedTime: "09:04", delta: `+${Math.max(5, numDelay - 7)}m`, severity: "high" },
        ];
      } else if (targetStr.includes("karjat") || targetStr.includes("palasdari") || targetStr.includes("ghat")) {
        baseDelayed = 8;
        baseRadius = 3;
        stationList = "Karjat, Palasdari, Neral";
        lineType = "Mountain Ghat Track (Banker Section)";
        specificDelays = [
          { trainNo: "12124 (DECCAN QUEEN)", location: "Karjat Banker Attachment Yard", scheduledTime: "10:15", simulatedTime: "11:00", delta: `+${numDelay}m`, severity: "high" },
          { trainNo: "11010 (SINHAGAD EXP)", location: "Palasdari Catch Siding", scheduledTime: "10:35", simulatedTime: "11:12", delta: `+${Math.max(5, numDelay - 8)}m`, severity: "high" },
          { trainNo: "12126 (PRAGATI EXP)", location: "Neral Up Main", scheduledTime: "10:50", simulatedTime: "11:22", delta: `+${Math.max(5, numDelay - 18)}m`, severity: "medium" },
        ];
      } else if (targetStr.includes("asangaon") || targetStr.includes("kasara")) {
        baseDelayed = 7;
        baseRadius = 2;
        stationList = "Asangaon, Kasara";
        lineType = "North Hill Track (Single Line Section)";
        specificDelays = [
          { trainNo: "93444 (KASARA LOCAL)", location: "Asangaon Single Line Token Block", scheduledTime: "12:30", simulatedTime: "13:15", delta: `+${numDelay}m`, severity: "high" },
          { trainNo: "12137 (PUNJAB MAIL)", location: "Atgaon Crossing Loop", scheduledTime: "12:45", simulatedTime: "13:24", delta: `+${Math.max(5, numDelay - 6)}m`, severity: "high" },
          { trainNo: "93446 (KASARA SLOW)", location: "Khardi Down Loop", scheduledTime: "13:00", simulatedTime: "13:30", delta: `+${Math.max(5, numDelay - 15)}m`, severity: "medium" },
        ];
      }

      const delayFactor = numDelay / 45;
      const cascaded = Math.max(1, Math.round(baseDelayed * delayFactor));
      const impactRadius = Math.max(1, Math.min(8, Math.round(baseRadius * Math.max(0.6, delayFactor))));
      const recHours = Math.floor(numDelay / 20);
      const recMins = (numDelay % 20) * 3;

      return res.json({
        success: true,
        source: "fallback",
        telemetry: {
          cascadingDelayTotal: cascaded,
          forcedCancellations: numDelay >= 45 ? 3 : 2,
          estSystemRecovery: `${recHours}h ${recMins}m`,
          impactRadiusStations: impactRadius,
        },
        cancellations: [],
        delays: specificDelays,
        aiAnalysis: `Track block of +${numDelay}m on ${targetBlock || "selected track"} (${lineType}) directly halts or diverts scheduled train traffic, causing ${cascaded} delayed train dependencies across ${impactRadius} stations (${stationList}).`,
      });
    }

    const prompt = `You are the AI railway dispatch engine (ConflictGuard & प्रवाहPlan) for the Central Line, Mumbai Division (Indian Railways).
Simulate injecting a maintenance track block with duration of ${delayMinutes} minutes on track section: "${targetBlock || "Vikhroli - Ghatkopar Track beside Platform No. 3 (Down Slow Line)"}".
Sector context: ${trackSector || "Central Line Mumbai (CSMT to Kalyan/Kasara/Karjat)"}.

Analyze which scheduled suburban local and express trains are held up, delayed, or forced onto adjacent lines due to the blocking of this specific track. Provide realistic Mumbai suburban and express train cascading impact metrics with accurate stations (CSMT, Dadar, Kurla, Ghatkopar, Vikhroli, Thane, Dombivli, Kalyan, Karjat, Kasara) and genuine train numbers/services (Rajdhani, Gitanjali, Deccan Queen, Sinhagad, Fast/Slow Locals).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            telemetry: {
              type: Type.OBJECT,
              properties: {
                cascadingDelayTotal: { type: Type.INTEGER, description: "Total number of delayed trains" },
                forcedCancellations: { type: Type.INTEGER, description: "Number of cancelled trains" },
                estSystemRecovery: { type: Type.STRING, description: "e.g., '2h 15m'" },
                impactRadiusStations: { type: Type.INTEGER, description: "Number of stations affected" },
              },
              required: ["cascadingDelayTotal", "forcedCancellations", "estSystemRecovery", "impactRadiusStations"],
            },
            cancellations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  trainNo: { type: Type.STRING, description: "e.g., '12111 (CSMT-AMI)'" },
                  depTime: { type: Type.STRING, description: "e.g., '19:55'" },
                  status: { type: Type.STRING, description: "e.g., 'CANCELLED'" },
                  reason: { type: Type.STRING, description: "Brief justification" },
                },
                required: ["trainNo", "depTime", "status", "reason"],
              },
            },
            delays: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  trainNo: { type: Type.STRING, description: "e.g. '22221 (RAJDHANI)'" },
                  location: { type: Type.STRING, description: "e.g. 'Kalyan Jn.'" },
                  scheduledTime: { type: Type.STRING, description: "e.g. '16:40'" },
                  simulatedTime: { type: Type.STRING, description: "e.g. '17:25'" },
                  delta: { type: Type.STRING, description: "e.g. '+45m'" },
                  severity: { type: Type.STRING, description: "high | medium | low" },
                },
                required: ["trainNo", "location", "scheduledTime", "simulatedTime", "delta", "severity"],
              },
            },
            aiAnalysis: {
              type: Type.STRING,
              description: "Concise summary of delay propagation and dispatch recommendation",
            },
          },
          required: ["telemetry", "cancellations", "delays", "aiAnalysis"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      source: "gemini-2.5-flash",
      ...parsedData,
    });
  } catch (error: any) {
    console.error("Gemini Simulation Error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Failed to simulate what-if scenario with Gemini",
    });
  }
});

// 2. AI Scheduler & Reasoning Optimization Endpoint (WhySlot / GapSense)
app.post("/api/gemini/optimize-schedule", async (req, res) => {
  try {
    const { slotId, section, requestedTime, department, conflictReason } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        source: "fallback",
        slotId: slotId || "SLOT-992A",
        optimizationScore: 94,
        confidence: "High",
        affectedTrainsCount: 3,
        trainsAffected: [
          { name: "12124 Deccan Qn", status: "Rescheduled", color: "secondary" },
          { name: "11009 Sinhagad Exp", status: "Regulated", color: "secondary" },
          { name: "Local 90432", status: "Cancelled", color: "error" },
        ],
        timeEfficiency: {
          savedMinutes: 45,
          wastedMinutes: 12,
          netGainMinutes: 33,
          efficiencyPercent: "+85%",
        },
        travelerImpact: {
          level: "Moderate",
          description:
            "Cancellation of Local 90432 will increase platform density at Dadar by an estimated 15% between 14:15 and 14:30. Surrounding services have capacity to absorb the overflow within 20 minutes.",
        },
        justification: [
          "The proposed maintenance slot leverages a historical lull in freight traffic on the down line between CSMT and DR. By shifting the block start time forward by 15 minutes, we avoid compounding delays on the 12124 Deccan Queen.",
          "Alternative scenarios (Slot-B, Slot-C) were evaluated. While they avoid cancelling the local service, they increase the overall track occupation time by 40 minutes due to necessary switching operations, leading to a cascading delay effect entering the evening peak hours.",
        ],
        recommendedSlot: {
          window: "Tomorrow, 01:30 - 04:30",
          efficiency: "+85% Efficiency",
          status: "Optimal",
        },
      });
    }

    const prompt = `You are Railप्रवाह AI, optimizing maintenance block scheduling and resolving track conflicts on Mumbai Central Railway Line.
Analyze slot "${slotId || "SLOT-992A"}" for section "${section || "CSMT - DR (Main)"}" requested by "${department || "Engineering"}".
Conflict details: "${conflictReason || "TR-Block requested at DR-GC (02:00-05:00) conflicts with scheduled freight passage."}".
Generate detailed AI slot optimization reasoning, train impact breakdown, net saved time, traveler congestion impact, and mathematical justification.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slotId: { type: Type.STRING },
            optimizationScore: { type: Type.INTEGER, description: "Score out of 100, e.g. 94" },
            confidence: { type: Type.STRING, description: "High | Very High | Moderate" },
            affectedTrainsCount: { type: Type.INTEGER },
            trainsAffected: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "e.g. '12124 Deccan Qn'" },
                  status: { type: Type.STRING, description: "Rescheduled | Regulated | Cancelled" },
                  color: { type: Type.STRING, description: "secondary | error | primary" },
                },
                required: ["name", "status", "color"],
              },
            },
            timeEfficiency: {
              type: Type.OBJECT,
              properties: {
                savedMinutes: { type: Type.INTEGER },
                wastedMinutes: { type: Type.INTEGER },
                netGainMinutes: { type: Type.INTEGER },
                efficiencyPercent: { type: Type.STRING, description: "e.g. '+85%'" },
              },
              required: ["savedMinutes", "wastedMinutes", "netGainMinutes", "efficiencyPercent"],
            },
            travelerImpact: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.STRING, description: "Low | Moderate | High | Critical" },
                description: { type: Type.STRING },
              },
              required: ["level", "description"],
            },
            justification: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 to 3 detailed analytical rationale paragraphs",
            },
            recommendedSlot: {
              type: Type.OBJECT,
              properties: {
                window: { type: Type.STRING, description: "e.g. 'Tomorrow, 01:30 - 04:30'" },
                efficiency: { type: Type.STRING, description: "e.g. '+85% Efficiency'" },
                status: { type: Type.STRING },
              },
              required: ["window", "efficiency", "status"],
            },
          },
          required: [
            "slotId",
            "optimizationScore",
            "confidence",
            "affectedTrainsCount",
            "trainsAffected",
            "timeEfficiency",
            "travelerImpact",
            "justification",
            "recommendedSlot",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      source: "gemini-2.5-flash",
      ...parsed,
    });
  } catch (error: any) {
    console.error("Gemini Optimization Error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Failed to optimize schedule with Gemini",
    });
  }
});

// ============================================================================
// COA MANAGEMENT BACKEND (Data Stores, Middleware, Algorithms & REST APIs)
// ============================================================================

// In-Memory Data Store for COA Application
interface CoaDbState {
  requests: Array<{
    id: string;
    department: string;
    trackArea: string;
    description: string;
    priority: "Low" | "Medium" | "High" | "Emergency";
    preferredSlot: string;
    status: "Pending" | "Scheduled" | "Rejected" | "In Progress" | "Completed" | "Approved" | "Declined";
    createdAt: string;
    cluster_id?: string | null;
    workType?: string;
    declineReason?: string;
    departmentActionStatus?: "awaiting" | "confirmed" | "flagged";
    flagReason?: string;
    assignedSlot?: string;
    submittedBy?: string;
  }>;
  calendarBlocks: Array<{
    id: string;
    title: string;
    station: string;
    department: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    priority: "Low" | "Medium" | "High" | "Emergency";
    status: "approved" | "pending" | "conflict" | "emergency";
    description: string;
    clusterId?: string;
    isClustered?: boolean;
    trainsAffected?: number;
  }>;
  recommendations: Array<{
    id: string;
    cluster_id?: string;
    isClustered: boolean;
    stations: string[];
    station_text: string;
    proposed_slot: string;
    slot_window: string;
    priority_tier: "Low" | "Medium" | "High" | "Emergency";
    trains_affected_clustered: number;
    trains_affected_individual_sum: number;
    trains_saved_count: number;
    status: "pending_review" | "approved" | "rejected" | "sent_to_departments" | "confirmed";
    coa_reviewer_id?: string;
    decision_notes?: string;
    departments: string[];
    request_ids: string[];
    plain_language_reason: string;
    safety_check_passed: boolean;
    safety_notes?: string;
    departmentConfirmations?: Record<
      string,
      { status: "confirmed" | "flagged" | "awaiting"; note?: string; time?: string }
    >;
    createdAt: string;
  }>;
}

const coaDb: CoaDbState = {
  requests: [
    {
      id: "req-101",
      department: "Engineering Department",
      trackArea: "Ghatkopar - Vikhroli",
      description: "Deep screening and sleeper replacement on Down Slow track (Beside PF #3)",
      priority: "High",
      preferredSlot: "2026-08-29 01:30 - 04:30",
      status: "Pending",
      createdAt: "2026-08-28 09:15",
      workType: "Track Renewal & Deep Screening",
      submittedBy: "P-Way Kurla Section",
    },
    {
      id: "req-102",
      department: "Traction Distribution Department",
      trackArea: "Ghatkopar - Vikhroli",
      description: "OHE Catenary contact wire dropper inspection & neutral section overhaul",
      priority: "High",
      preferredSlot: "2026-08-29 01:30 - 04:30",
      status: "Pending",
      createdAt: "2026-08-28 10:20",
      workType: "OHE Catenary Maintenance",
      submittedBy: "TRD Vidyavihar Depot",
    },
    {
      id: "req-103",
      department: "Signal and Telecommunication Department",
      trackArea: "Ghatkopar - Vikhroli",
      description: "Digital Axle Counter (DAC) track resonator calibration & signal head lamp replacement",
      priority: "High",
      preferredSlot: "2026-08-29 02:00 - 04:00",
      status: "Pending",
      createdAt: "2026-08-28 11:05",
      workType: "Signal & Interlocking",
      submittedBy: "S&T Ghatkopar Sub-Division",
    },
    {
      id: "req-104",
      department: "Signal and Telecommunication Department",
      trackArea: "Kasara - Khardi (Kasara Branch)",
      description: "Emergency Electronic Interlocking (EI) panel software firmware patching & fail-safe audit",
      priority: "High",
      preferredSlot: "2026-08-29 02:00 - 04:30",
      status: "Pending",
      createdAt: "2026-08-28 12:40",
      workType: "Electronic Interlocking Patch",
      submittedBy: "S&T North East Branch",
    },
    {
      id: "req-105",
      department: "Traction Distribution Department",
      trackArea: "Dadar - Matunga",
      description: "OHE Mast bracket tightening and insulator washing on Up Fast line",
      priority: "Medium",
      preferredSlot: "2026-08-29 11:30 - 13:30",
      status: "Pending",
      createdAt: "2026-08-28 14:10",
      workType: "OHE Insulator Washing",
      submittedBy: "TRD Dadar Depot",
    },
    {
      id: "req-106",
      department: "Engineering Department",
      trackArea: "Dadar - Matunga",
      description: "Diamond point crossover lubrication and check-rail clearance setting",
      priority: "Medium",
      preferredSlot: "2026-08-29 11:45 - 13:45",
      status: "Pending",
      createdAt: "2026-08-28 14:50",
      workType: "Point Crossover Maintenance",
      submittedBy: "P-Way Dadar Division",
    },
    {
      id: "req-107",
      department: "Engineering Department",
      trackArea: "Neral - Karjat - Khopoli (Khopoli Branch)",
      description: "Hill section boulder net fencing & mountain rail ultrasonic flaw detection (USFD)",
      priority: "Medium",
      preferredSlot: "2026-08-30 01:00 - 04:00",
      status: "Pending",
      createdAt: "2026-08-28 16:30",
      workType: "USFD Ultrasonic Testing",
      submittedBy: "P-Way Karjat Subdivision",
    },
    {
      id: "req-108",
      department: "Engineering Department",
      trackArea: "Thane - Mulund",
      description: "Creek Bridge #34 girder paint coating touchup and expansion joint clearance",
      priority: "Low",
      preferredSlot: "2026-08-30 13:00 - 15:00",
      status: "Pending",
      createdAt: "2026-08-28 17:00",
      workType: "Bridge Structure Care",
      submittedBy: "Bridge Inspector Thane",
    },
    {
      id: "req-109",
      department: "Signal and Telecommunication Department",
      trackArea: "Thane - Mulund",
      description: "Routine optical fiber cable (OFC) route marker verification on Up Slow track",
      priority: "Low",
      preferredSlot: "2026-08-30 13:15 - 14:45",
      status: "Pending",
      createdAt: "2026-08-28 17:30",
      workType: "Telecom OFC Maintenance",
      submittedBy: "Telecom Thane Unit",
    },
  ],
  calendarBlocks: [
    {
      id: "cal-1",
      title: "Cluster CL-89: Ghatkopar-Vikhroli Mega Shadow",
      station: "Ghatkopar - Vikhroli",
      department: "Engineering + TRD + S&T",
      date: "2026-08-29",
      startTime: "01:30",
      endTime: "04:30",
      priority: "High",
      status: "approved",
      description: "3-Department synchronized track renewal, catenary overhaul & axle counter calibration",
      clusterId: "CL-89",
      isClustered: true,
      trainsAffected: 4,
    },
    {
      id: "cal-2",
      title: "S&T Electronic Interlocking Firmware Upgrade",
      station: "Kasara - Khardi (Kasara Branch)",
      department: "Signal and Telecommunication Department",
      date: "2026-08-29",
      startTime: "02:00",
      endTime: "04:30",
      priority: "High",
      status: "approved",
      description: "Fail-safe dual redundancy testing in single line hill section",
      isClustered: false,
      trainsAffected: 2,
    },
    {
      id: "cal-3",
      title: "Cluster CL-92: Dadar Point & OHE Washing",
      station: "Dadar - Matunga",
      department: "Traction Distribution + Engineering",
      date: "2026-08-29",
      startTime: "11:30",
      endTime: "13:30",
      priority: "Medium",
      status: "pending",
      description: "Mid-day shadow window utilizing freight lull between peak services",
      clusterId: "CL-92",
      isClustered: true,
      trainsAffected: 3,
    },
    {
      id: "cal-4",
      title: "Emergency Rail Fracture Weld Restoration",
      station: "Kalyan - Thakurli",
      department: "Engineering Department",
      date: "2026-08-28",
      startTime: "16:00",
      endTime: "17:30",
      priority: "Emergency",
      status: "emergency",
      description: "Immediate ultrasonic fracture clamp and flash butt thermit weld",
      isClustered: false,
      trainsAffected: 6,
    },
    {
      id: "cal-5",
      title: "Bridge Girder Inspection & Telecom OFC",
      station: "Thane - Mulund",
      department: "Engineering + S&T",
      date: "2026-08-30",
      startTime: "13:00",
      endTime: "15:00",
      priority: "Low",
      status: "pending",
      description: "Creek Bridge non-intrusive girder scan & fiber optics line markers",
      clusterId: "CL-94",
      isClustered: true,
      trainsAffected: 1,
    },
  ],
  recommendations: [
    {
      id: "rec-clust-01",
      cluster_id: "CL-89",
      isClustered: true,
      stations: ["Ghatkopar", "Vikhroli"],
      station_text: "Ghatkopar - Vikhroli (Down Slow Line)",
      proposed_slot: "2026-08-29 01:30 - 04:30 (Tomorrow Night)",
      slot_window: "01:30 - 04:30 (3.0 hrs)",
      priority_tier: "High",
      trains_affected_clustered: 4,
      trains_affected_individual_sum: 21,
      trains_saved_count: 17,
      status: "pending_review",
      departments: [
        "Engineering Department",
        "Traction Distribution Department",
        "Signal and Telecommunication Department",
      ],
      request_ids: ["req-101", "req-102", "req-103"],
      plain_language_reason:
        "All 3 departments requested high-priority work on the same Ghatkopar-Vikhroli Down Slow segment. By merging P-Way deep screening, TRD catenary overhaul, and S&T axle counter calibration into a unified 3-hour night block (01:30 - 04:30), total train delays drop from 21 trains to only 4 regulated night freight rakes, saving 17 train delays.",
      safety_check_passed: true,
      safety_notes: "Safe work types: OHE power isolation permits ground P-Way tamping and non-electrified S&T signal calibration concurrently.",
      createdAt: "2026-08-28 20:00",
    },
    {
      id: "rec-indiv-02",
      isClustered: false,
      stations: ["Kasara", "Khardi"],
      station_text: "Kasara - Khardi (Kasara Branch Single Line)",
      proposed_slot: "2026-08-29 02:00 - 04:30 (Tomorrow Night)",
      slot_window: "02:00 - 04:30 (2.5 hrs)",
      priority_tier: "High",
      trains_affected_clustered: 2,
      trains_affected_individual_sum: 8,
      trains_saved_count: 6,
      status: "pending_review",
      departments: ["Signal and Telecommunication Department"],
      request_ids: ["req-104"],
      plain_language_reason:
        "High-priority S&T Electronic Interlocking request on Kasara Branch has no compatible partner in the hill corridor. Scheduled as an individual AI-optimized slot during the lowest traffic frequency window (02:00 - 04:30), granting immediate high-priority clearance while regulating only 2 night freight trains.",
      safety_check_passed: true,
      safety_notes: "Individual block with full station master interlocking protection.",
      createdAt: "2026-08-28 20:05",
    },
  ],
};

// Global in-memory notifications for role dispatches
const notificationsDb: any[] = [
  {
    id: "notif-init-01",
    slotId: "slot-prv-gkv-01",
    slotCode: "PRV-2026-0829-GKV",
    title: "COA Approved प्रवाहPlan Slot: PRV-2026-0829-GKV",
    message: "COA Master Traffic Controller approved and sanctioned unified corridor maintenance block at Ghatkopar – Vikhroli / Kurla Corridor on 2026-08-29 (01:30 – 04:30 IST). Zero regular train delays guaranteed. Dispatched to Department Head, Zonal Head, Supervisor, and Worker inboxes.",
    timing: "01:30 – 04:30 IST",
    startTime: "01:30",
    endTime: "04:30",
    date: "2026-08-29",
    location: "Ghatkopar – Vikhroli / Kurla Corridor (Km 19/20 to 23/15)",
    workName: "Joint Multi-Dept Possession: Deep Track Screening, 25kV Insulator Overhaul & Axle Counter Tuning",
    departments: ["Engineering (P-Way)", "TRD (Electrical)", "S&T (Signaling)"],
    recipientRoles: ["department_user", "zonal_head", "supervisor", "worker"],
    recipientDepts: ["Engineering (P-Way)", "TRD (Electrical)", "S&T (Signaling)"],
    createdAt: new Date().toISOString(),
    sanctionedBy: "COA Master Traffic Controller",
    status: "active",
  },
];

// Strict Role-Based Access Control Middlewares
const requireCoaAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const role = (req.headers["x-user-role"] || req.query.role || req.body?.userRole || "") as string;
  const isCoa = role === "coa_admin" || role.toLowerCase().includes("coa");
  if (!isCoa) {
    return res.status(403).json({
      success: false,
      error: "Access Denied (403 Forbidden): The COA Management section is strictly restricted to Control Office Application (COA) personnel only.",
    });
  }
  next();
};

// Corridor adjacency graph for Mumbai Central Line & branches
const CORRIDOR_SEGMENTS = [
  ["CSMT", "Masjid", "Sandhurst Road", "Byculla", "Chinchpokli", "Currey Road", "Parel", "Dadar"],
  ["Dadar", "Matunga", "Sion", "Kurla"],
  ["Kurla", "Vidyavihar", "Ghatkopar", "Vikhroli", "Kanjurmarg", "Bhandup"],
  ["Bhandup", "Nahur", "Mulund", "Thane"],
  ["Thane", "Kalva", "Mumbra", "Diva", "Kopar", "Dombivli", "Thakurli", "Kalyan"],
  ["Kalyan", "Shahad", "Ambivli", "Titwala", "Khadavli", "Vasind", "Asangaon", "Atgaon", "Khardi", "Kasara"],
  ["Kalyan", "Vithalwadi", "Ulhasnagar", "Ambernath", "Badlapur", "Vangani", "Shelu", "Neral", "Karjat", "Palasdari", "Khopoli"],
];

function areLocationsAdjacent(locA: string, locB: string): boolean {
  if (!locA || !locB) return false;
  const cleanA = locA.toLowerCase();
  const cleanB = locB.toLowerCase();
  if (cleanA === cleanB) return true;

  // Check if they share any word or station tokens
  const wordsA = cleanA.split(/[\s\-\/\(\)]+/).filter(Boolean);
  const wordsB = cleanB.split(/[\s\-\/\(\)]+/).filter(Boolean);
  const shared = wordsA.some((w) => w.length > 2 && wordsB.includes(w));
  if (shared) return true;

  // Check corridor adjacency segments
  for (const seg of CORRIDOR_SEGMENTS) {
    const hasA = seg.some((stn) => cleanA.includes(stn.toLowerCase()));
    const hasB = seg.some((stn) => cleanB.includes(stn.toLowerCase()));
    if (hasA && hasB) return true;
  }

  return false;
}

// Work Compatibility Safety Verification
function verifyWorkTypeSafety(
  typeA: string,
  typeB: string,
  deptA: string,
  deptB: string
): { safe: boolean; notes: string } {
  const text = `${typeA} ${typeB} ${deptA} ${deptB}`.toLowerCase();

  // Incompatible scenario: Heavy rail crane lifting in tight proximity to live catenary without TRD power block
  if (
    text.includes("heavy crane") &&
    text.includes("live wire") &&
    !text.includes("power block")
  ) {
    return {
      safe: false,
      notes: "SAFETY WARNING: Heavy crane movement incompatible with energized overhead wire.",
    };
  }

  return {
    safe: true,
    notes: "Safe work types: Concurrent possession allowable under standard Central Railway safety protocol.",
  };
}

// AI Slot Clustering Algorithm Implementation
function executePriorityClusteringAlgorithm(pendingList: CoaDbState["requests"]) {
  const priorityWeight: Record<string, number> = {
    Emergency: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  // 1. Filter pending items and sort by priority tier, then by submission time asc
  const candidates = [...pendingList]
    .filter((r) => r.status === "Pending")
    .sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
      if (pDiff !== 0) return pDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const slottedIds = new Set<string>();
  const newRecommendations: CoaDbState["recommendations"] = [];
  let clusterCounter = 95;

  // 2. Iterate in priority-first order
  for (const primary of candidates) {
    if (slottedIds.has(primary.id)) continue;

    // Search unslotted candidates for compatible cluster partners
    const clusterPartners = candidates.filter((candidate) => {
      if (candidate.id === primary.id || slottedIds.has(candidate.id)) return false;

      // a. Same priority level tier
      const samePriority = candidate.priority === primary.priority;
      if (!samePriority) return false;

      // b. Same or adjacent station/track section
      const adjacent = areLocationsAdjacent(primary.trackArea, candidate.trackArea);
      if (!adjacent) return false;

      // c. Compatible work types (no physical interference)
      const safety = verifyWorkTypeSafety(
        primary.workType || primary.description,
        candidate.workType || candidate.description,
        primary.department,
        candidate.department
      );
      if (!safety.safe) return false;

      return true;
    });

    if (clusterPartners.length > 0) {
      // CLUSTERED RECOMMENDATION
      const allCluster = [primary, ...clusterPartners];
      allCluster.forEach((item) => slottedIds.add(item.id));

      const clusterId = `CL-${clusterCounter++}`;
      const uniqueDepts = Array.from(new Set(allCluster.map((r) => r.department)));
      const uniqueStations = Array.from(
        new Set(
          allCluster.flatMap((r) =>
            r.trackArea
              .replace(/\(.*?\)/g, "")
              .split(/[\-\/]/)
              .map((s) => s.trim())
              .filter(Boolean)
          )
        )
      );

      // Determine shared time slot window based on priority
      let slotWindow = "01:30 - 04:30 (3.0 hrs)";
      let slotTimeDesc = "Tomorrow Night Window (01:30 - 04:30)";
      if (primary.priority === "Medium") {
        slotWindow = "11:30 - 13:30 (2.0 hrs)";
        slotTimeDesc = "Mid-Day Shadow Window (11:30 - 13:30)";
      } else if (primary.priority === "Low") {
        slotWindow = "13:00 - 15:00 (2.0 hrs)";
        slotTimeDesc = "Afternoon Off-Peak Window (13:00 - 15:00)";
      } else if (primary.priority === "Emergency") {
        slotWindow = "Immediate (Next Available Gap)";
        slotTimeDesc = "Nearest Workable Slot (Immediate Clearance)";
      }

      // Compute trains affected metrics & savings
      const basePerDept = primary.priority === "High" ? 7 : primary.priority === "Medium" ? 6 : 4;
      const trains_affected_individual_sum = allCluster.length * basePerDept;
      const trains_affected_clustered = primary.priority === "High" ? 4 : primary.priority === "Medium" ? 3 : 1;
      const trains_saved_count = Math.max(1, trains_affected_individual_sum - trains_affected_clustered);

      const deptsLabel = uniqueDepts.join(", ");
      const plain_language_reason = `Priority ${primary.priority} Clustered Block: Synchronized ${allCluster.length} departments (${deptsLabel}) across ${primary.trackArea}. Merging into one unified slot (${slotWindow}) prevents ${trains_saved_count} cascading train delays compared to separate single-department possessions.`;

      newRecommendations.push({
        id: `rec-clust-${Date.now()}-${clusterId}`,
        cluster_id: clusterId,
        isClustered: true,
        stations: uniqueStations,
        station_text: primary.trackArea,
        proposed_slot: `${slotTimeDesc}`,
        slot_window: slotWindow,
        priority_tier: primary.priority,
        trains_affected_clustered,
        trains_affected_individual_sum,
        trains_saved_count,
        status: "pending_review",
        departments: uniqueDepts,
        request_ids: allCluster.map((r) => r.id),
        plain_language_reason,
        safety_check_passed: true,
        safety_notes: `Validated multi-department coordination between ${deptsLabel}.`,
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      });
    } else {
      // INDIVIDUAL AI-OPTIMIZED SLOT FALLBACK (Rule 2: Never leave unscheduled)
      slottedIds.add(primary.id);

      let slotWindow = "02:00 - 04:30 (2.5 hrs)";
      let slotTimeDesc = "Night Gap Window (02:00 - 04:30)";
      if (primary.priority === "Emergency") {
        slotWindow = "Nearest Workable Window (Next 30 mins)";
        slotTimeDesc = "Nearest Priority Gap (ConflictGuard Immediate Slot)";
      } else if (primary.priority === "High") {
        slotWindow = "02:00 - 04:30 (2.5 hrs)";
        slotTimeDesc = "Tomorrow Night Window (02:00 - 04:30)";
      } else if (primary.priority === "Medium") {
        slotWindow = "01:00 - 04:00 (3.0 hrs)";
        slotTimeDesc = "Off-Peak Lull Window (01:00 - 04:00)";
      } else {
        slotWindow = "13:30 - 15:00 (1.5 hrs)";
        slotTimeDesc = "Afternoon Minor Shadow (13:30 - 15:00)";
      }

      const individualUnoptimized = primary.priority === "High" ? 8 : primary.priority === "Medium" ? 6 : 3;
      const individualOptimized = primary.priority === "High" ? 2 : primary.priority === "Medium" ? 1 : 0;
      const trains_saved_count = Math.max(1, individualUnoptimized - individualOptimized);

      const uniqueStations = primary.trackArea
        .replace(/\(.*?\)/g, "")
        .split(/[\-\/]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const plain_language_reason =
        primary.priority === "High" || primary.priority === "Emergency"
          ? `High-Priority Individual Slot: No cluster partner found in ${primary.trackArea}. Slot assigned in the nearest workable low-frequency gap (${slotWindow}) to clear critical track work immediately while minimizing delays to only ${individualOptimized} trains (saving ${trains_saved_count} trains vs peak-hour execution).`
          : `Individual AI Optimized Slot: No concurrent work requested in ${primary.trackArea}. Scheduled during low-frequency lull (${slotWindow}) with zero passenger service disruption.`;

      newRecommendations.push({
        id: `rec-indiv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        isClustered: false,
        stations: uniqueStations,
        station_text: primary.trackArea,
        proposed_slot: `${slotTimeDesc}`,
        slot_window: slotWindow,
        priority_tier: primary.priority,
        trains_affected_clustered: individualOptimized,
        trains_affected_individual_sum: individualUnoptimized,
        trains_saved_count,
        status: "pending_review",
        departments: [primary.department],
        request_ids: [primary.id],
        plain_language_reason,
        safety_check_passed: true,
        safety_notes: "Single-department block with standard signal and track protection.",
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      });
    }
  }

  return newRecommendations;
}

// 1. GET /api/coa/calendar?month=&year=
app.get("/api/coa/calendar", requireCoaAdmin, (req, res) => {
  const { month, year } = req.query;
  let blocks = [...coaDb.calendarBlocks];
  if (month && year) {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    blocks = blocks.filter((b) => b.date.startsWith(prefix));
  }
  return res.json({
    success: true,
    total: blocks.length,
    calendarBlocks: blocks,
  });
});

// 2. GET /api/coa/requests/pending
app.get("/api/coa/requests/pending", requireCoaAdmin, (req, res) => {
  const pending = coaDb.requests.filter((r) => r.status === "Pending");
  return res.json({
    success: true,
    total: pending.length,
    pendingRequests: pending,
  });
});

// 3. POST /api/coa/requests/:id/approve
app.post("/api/coa/requests/:id/approve", requireCoaAdmin, (req, res) => {
  const { id } = req.params;
  const request = coaDb.requests.find((r) => r.id === id);
  if (!request) {
    return res.status(404).json({ success: false, error: "Request not found" });
  }

  request.status = "Approved";
  request.assignedSlot = req.body.assignedSlot || request.preferredSlot;

  // Add to Calendar Blocks
  const newCalBlock = {
    id: `cal-${Date.now()}`,
    title: `${request.department}: ${request.workType || "Track Block"}`,
    station: request.trackArea,
    department: request.department,
    date: new Date().toISOString().substring(0, 10),
    startTime: "02:00",
    endTime: "04:30",
    priority: request.priority,
    status: "approved" as const,
    description: request.description,
    trainsAffected: 2,
  };
  coaDb.calendarBlocks.push(newCalBlock);

  return res.json({
    success: true,
    message: `Request ${id} approved and added to live dispatch calendar.`,
    request,
    calendarBlock: newCalBlock,
  });
});

// 4. POST /api/coa/requests/:id/decline
app.post("/api/coa/requests/:id/decline", requireCoaAdmin, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, error: "A decline reason is mandatory." });
  }

  const request = coaDb.requests.find((r) => r.id === id);
  if (!request) {
    return res.status(404).json({ success: false, error: "Request not found" });
  }

  request.status = "Declined";
  request.declineReason = reason.trim();

  return res.json({
    success: true,
    message: `Request ${id} declined. Reason logged and notification routed to department.`,
    request,
  });
});

// 5. POST /api/coa/generate-recommendations
app.post("/api/coa/generate-recommendations", requireCoaAdmin, (req, res) => {
  const generated = executePriorityClusteringAlgorithm(coaDb.requests);
  coaDb.recommendations = generated;

  return res.json({
    success: true,
    count: generated.length,
    recommendations: generated,
    summary: {
      totalRequestsEvaluated: coaDb.requests.filter((r) => r.status === "Pending").length,
      clusteredCount: generated.filter((r) => r.isClustered).length,
      individualCount: generated.filter((r) => !r.isClustered).length,
      totalTrainDelaysSaved: generated.reduce((sum, r) => sum + r.trains_saved_count, 0),
    },
  });
});

// 6. GET /api/coa/recommendations
app.get("/api/coa/recommendations", requireCoaAdmin, (req, res) => {
  return res.json({
    success: true,
    recommendations: coaDb.recommendations,
  });
});

// 7. POST /api/coa/recommendations/:id/approve
app.post("/api/coa/recommendations/:id/approve", requireCoaAdmin, (req, res) => {
  const { id } = req.params;
  const { adjustedSlot, notes } = req.body;
  const rec = coaDb.recommendations.find((r) => r.id === id);
  if (!rec) {
    return res.status(404).json({ success: false, error: "Recommendation not found" });
  }

  rec.status = "approved";
  rec.coa_reviewer_id = req.body.reviewerId || "EMP-CR-4891";
  if (adjustedSlot) {
    rec.proposed_slot = adjustedSlot;
  }
  if (notes) {
    rec.decision_notes = notes;
  }

  // Update underlying requests
  rec.request_ids.forEach((reqId) => {
    const reqItem = coaDb.requests.find((r) => r.id === reqId);
    if (reqItem) {
      reqItem.status = "Scheduled";
      reqItem.assignedSlot = rec.proposed_slot;
      reqItem.cluster_id = rec.cluster_id || null;
    }
  });

  return res.json({
    success: true,
    message: `Recommendation ${id} approved by COA. Ready to dispatch to departments.`,
    recommendation: rec,
  });
});

// 8. POST /api/coa/recommendations/:id/reject
app.post("/api/coa/recommendations/:id/reject", requireCoaAdmin, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const rec = coaDb.recommendations.find((r) => r.id === id);
  if (!rec) {
    return res.status(404).json({ success: false, error: "Recommendation not found" });
  }

  rec.status = "rejected";
  rec.decision_notes = reason || "Rejected by COA Reviewer";

  return res.json({
    success: true,
    message: `Recommendation ${id} rejected. Sent back for individual department rescheduling.`,
    recommendation: rec,
  });
});

// 9. POST /api/coa/recommendations/:id/send
app.post("/api/coa/recommendations/:id/send", requireCoaAdmin, (req, res) => {
  const { id } = req.params;
  const rec = coaDb.recommendations.find((r) => r.id === id);
  if (!rec) {
    return res.status(404).json({ success: false, error: "Recommendation not found" });
  }

  rec.status = "sent_to_departments";
  rec.departmentConfirmations = {};

  rec.departments.forEach((dept) => {
    rec.departmentConfirmations![dept] = {
      status: "awaiting",
      time: new Date().toISOString().replace("T", " ").substring(0, 16),
    };
  });

  // Mark requests department status as awaiting
  rec.request_ids.forEach((reqId) => {
    const reqItem = coaDb.requests.find((r) => r.id === reqId);
    if (reqItem) {
      reqItem.departmentActionStatus = "awaiting";
    }
  });

  return res.json({
    success: true,
    message: `Recommendation ${id} dispatched to ${rec.departments.join(", ")}. Awaiting confirmation.`,
    recommendation: rec,
  });
});

// 10. POST /api/coa/recommendations/:id/department-action (Department user confirms or flags issue)
app.post("/api/coa/recommendations/:id/department-action", (req, res) => {
  const { id } = req.params;
  const { department, action, note } = req.body; // action: "confirm" | "flag"
  const rec = coaDb.recommendations.find((r) => r.id === id);
  if (!rec) {
    return res.status(404).json({ success: false, error: "Recommendation not found" });
  }

  if (!rec.departmentConfirmations) {
    rec.departmentConfirmations = {};
  }

  rec.departmentConfirmations[department] = {
    status: action === "confirm" ? "confirmed" : "flagged",
    note: note || "",
    time: new Date().toISOString().replace("T", " ").substring(0, 16),
  };

  // If all departments confirmed, set recommendation status to confirmed and schedule into calendar
  const allDepts = rec.departments;
  const allConfirmed = allDepts.every(
    (d) => rec.departmentConfirmations?.[d]?.status === "confirmed"
  );
  const anyFlagged = allDepts.some(
    (d) => rec.departmentConfirmations?.[d]?.status === "flagged"
  );

  if (allConfirmed) {
    rec.status = "confirmed";
    // Add to Calendar
    coaDb.calendarBlocks.push({
      id: `cal-rec-${Date.now()}`,
      title: `${rec.isClustered ? `Cluster ${rec.cluster_id}` : rec.departments[0]}: ${rec.station_text}`,
      station: rec.station_text,
      department: rec.departments.join(" + "),
      date: new Date().toISOString().substring(0, 10),
      startTime: rec.slot_window.split("-")[0]?.trim() || "01:30",
      endTime: rec.slot_window.split("-")[1]?.split("(")[0]?.trim() || "04:30",
      priority: rec.priority_tier,
      status: "approved",
      description: rec.plain_language_reason,
      clusterId: rec.cluster_id,
      isClustered: rec.isClustered,
      trainsAffected: rec.trains_affected_clustered,
    });
  }

  return res.json({
    success: true,
    message:
      action === "confirm"
        ? `Department ${department} confirmed assigned slot.`
        : `Department ${department} flagged an issue. Routed back to COA Reviewer with GapSense fallback options.`,
    recommendation: rec,
    allConfirmed,
    anyFlagged,
  });
});

// POST /api/coa/slots/accept - COA accepts प्रवाहPlan AI Optimized Slot
app.post("/api/coa/slots/accept", requireCoaAdmin, (req, res) => {
  const { slot } = req.body;
  if (!slot) {
    return res.status(400).json({ success: false, error: "Slot data is required" });
  }

  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);

  // 1. Create a formal sanction notification issue in hierarchicalIssuesDb
  const notificationIssue: any = {
    id: `notif-slot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ticketNo: `TKT-CR-SANCTION-${slot.slotCode || Math.floor(1000 + Math.random() * 9000)}`,
    currentStatus: "Sanctioned by COA",
    station: slot.location.split(/[\–\-\(]/)[0].trim() || "Central Line Section",
    department: Array.isArray(slot.departments) ? slot.departments.join(", ") : "Multi-Department",
    originalRequest: {
      title: `COA Approved प्रवाहPlan Slot: ${slot.slotCode} - ${slot.workName}`,
      description: `COA Master Traffic Controller has approved and sanctioned प्रवाहPlan AI Slot ${slot.slotCode}.\nSlot Timings: ${slot.timing} on ${slot.date}\nLocation: ${slot.location}\nParticipating Departments: ${Array.isArray(slot.departments) ? slot.departments.join(", ") : slot.departments}\nWork Scope: ${Array.isArray(slot.workItems) ? slot.workItems.map((w: any) => w.name || w.workType).join(" • ") : "Joint corridor maintenance"}\nDelay Principle: Minimum train delays ensured; 0 local trains affected; critical infrastructure prioritized.`,
      trackSection: slot.location,
      lineType: "Sanctioned Corridor Lines",
      nearestKmPost: "Designated Block Limits",
      priority: "High",
      hazardCategory: "Corridor Maintenance Sanction",
      reportedAt: timestamp,
      estimatedFixTimeMinutes: 180,
      media: [],
      reportedBy: {
        name: "COA Master Traffic Controller",
        empId: "COA-CR-001",
        phone: "+91 22 2262 0123",
        gangNo: "COA Central Operations Desk",
      },
    },
    activeRequest: {
      title: `COA Approved प्रवाहPlan Slot: ${slot.slotCode} - ${slot.workName}`,
      description: `COA Master Traffic Controller has approved and sanctioned प्रवाहPlan AI Slot ${slot.slotCode}.\nSlot Timings: ${slot.timing} on ${slot.date}\nLocation: ${slot.location}\nParticipating Departments: ${Array.isArray(slot.departments) ? slot.departments.join(", ") : slot.departments}\nWork Scope: ${Array.isArray(slot.workItems) ? slot.workItems.map((w: any) => w.name || w.workType).join(" • ") : "Joint corridor maintenance"}\nDelay Principle: Minimum train delays ensured; 0 local trains affected; critical infrastructure prioritized.`,
      trackSection: slot.location,
      lineType: "Sanctioned Corridor Lines",
      nearestKmPost: "Designated Block Limits",
      priority: "High",
      hazardCategory: "Corridor Maintenance Sanction",
      reportedAt: timestamp,
      estimatedFixTimeMinutes: 180,
      media: [],
      reportedBy: {
        name: "COA Master Traffic Controller",
        empId: "COA-CR-001",
        phone: "+91 22 2262 0123",
        gangNo: "COA Central Operations Desk",
      },
    },
    escalationHistory: [
      {
        id: `esc-slot-${Date.now()}`,
        level: "COA Management",
        escalatedBy: {
          name: "COA Master Traffic Controller",
          empId: "COA-CR-001",
          role: "COA Master Controller",
          department: "Central Railway Traffic Operations",
        },
        escalatedTo: "Department Head, Zonal Head, Supervisor",
        timestamp,
        reason: `COA Master Traffic Controller accepted प्रवाहPlan AI Slot on ${slot.date} for ${slot.location} (${slot.timing}). Dispatched to Department Head, Zonal Head, and Supervisor inboxes.`,
        remarks: `Sanctioned work slot assigned: ${slot.timing} on ${slot.date}. Minimum train delays principle verified. Added to calendars of Worker and Zonal Head.`,
      },
    ],
    modificationHistory: [],
  };

  hierarchicalIssuesDb.unshift(notificationIssue);

  // 2. Also update any pending issue from Zonal Head that matches the work or location
  if (Array.isArray(slot.workItems)) {
    slot.workItems.forEach((w: any) => {
      if (w.id) {
        const matchingIssue = hierarchicalIssuesDb.find((i) => i.id === w.id || i.ticketNo === w.id);
        if (matchingIssue) {
          matchingIssue.currentStatus = "Sanctioned by COA";
          const escList = (matchingIssue as any).escalationHistory || [];
          escList.push({
            id: `esc-match-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            level: "COA Management",
            escalatedBy: {
              name: "COA Master Traffic Controller",
              empId: "COA-CR-001",
              role: "COA Master Controller",
              department: "Central Railway Traffic Operations",
            },
            escalatedTo: "Department Head, Zonal Head, Supervisor",
            timestamp,
            reason: `COA Master Traffic Controller accepted प्रवाहPlan AI Slot on ${slot.date} for ${slot.location} (${slot.timing}). Dispatched to Department Head, Zonal Head, and Supervisor inboxes.`,
            remarks: `Sanctioned work slot assigned: ${slot.timing} on ${slot.date}. Minimum train delays principle verified. Added to calendars of Worker and Zonal Head.`,
          });
          (matchingIssue as any).escalationHistory = escList;
        }
      }
    });
  }

  // 3. Add to coaDb.calendarBlocks so it appears on calendars
  const newCalBlock: any = {
    id: `cal-prv-${slot.id || Date.now()}`,
    title: slot.workName,
    station: slot.location,
    department: Array.isArray(slot.departments) ? slot.departments.join(" & ") : "Multi-Department",
    date: slot.date,
    startTime: slot.startTime || "01:30",
    endTime: slot.endTime || "04:30",
    priority: "Critical",
    status: "approved",
    description: `Joint maintenance slot approved by प्रवाहPlan AI Schedule Optimizer. Work items: ${Array.isArray(slot.workItems) ? slot.workItems.map((w: any) => w.name).join("; ") : slot.workName}`,
    trainsAffected: 0,
  };
  coaDb.calendarBlocks.unshift(newCalBlock);

  // 4. Update matching service requests to Approved
  if (Array.isArray(slot.workItems)) {
    slot.workItems.forEach((w: any) => {
      const matchReq = coaDb.requests.find((r) => r.id === w.id || r.description.includes(w.name));
      if (matchReq) {
        matchReq.status = "Approved";
        matchReq.assignedSlot = `${slot.date} ${slot.timing}`;
      }
    });
  }

  // 5. Create and dispatch structured notification to all involved operational roles
  const slotNotification = {
    id: `notif-slot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    slotId: slot.id,
    slotCode: slot.slotCode,
    title: `COA Approved प्रवाहPlan Slot: ${slot.slotCode} - ${slot.workName}`,
    message: `COA Master Traffic Controller has sanctioned प्रवाहPlan AI Slot ${slot.slotCode} for ${slot.location} on ${slot.date} (${slot.timing}). Zero train delays verified. Dispatched to Department Head, Zonal Head, Supervisor, and Worker inboxes.`,
    timing: slot.timing,
    startTime: slot.startTime || "01:30",
    endTime: slot.endTime || "04:30",
    date: slot.date,
    location: slot.location,
    workName: slot.workName,
    departments: Array.isArray(slot.departments) ? slot.departments : [slot.departments],
    recipientRoles: ["department_user", "zonal_head", "supervisor", "worker"],
    recipientDepts: Array.isArray(slot.departments) ? slot.departments : [slot.departments],
    createdAt: new Date().toISOString(),
    sanctionedBy: "COA Master Traffic Controller",
    status: "active",
  };
  notificationsDb.unshift(slotNotification);

  return res.json({
    success: true,
    message: `Slot ${slot.slotCode} successfully accepted. Notifications dispatched to inboxes of Department Head, Zonal Head, Supervisor, and Worker. Task added to calendars of Worker and Zonal Head.`,
    notificationIssue,
    calendarBlock: newCalBlock,
    notification: slotNotification,
  });
});

// GET /api/notifications - Retrieve operational notifications for user role
app.get("/api/notifications", (req, res) => {
  const userRole = (req.headers["x-user-role"] as string) || "";
  let list = [...notificationsDb];
  if (userRole && userRole !== "coa_admin") {
    list = list.filter((n) => !n.recipientRoles || n.recipientRoles.includes(userRole));
  }
  return res.json({ success: true, count: list.length, notifications: list });
});

// POST /api/notifications - Broadcast an operational notification
app.post("/api/notifications", (req, res) => {
  const notif = req.body;
  if (!notif || !notif.title) {
    return res.status(400).json({ success: false, error: "Title is required" });
  }
  const item = {
    id: notif.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...notif,
    createdAt: notif.createdAt || new Date().toISOString(),
  };
  notificationsDb.unshift(item);
  return res.json({ success: true, notification: item });
});

// Worker Issue Reporting Endpoint
app.post("/api/worker/report-issue", (req, res) => {
  const issue = req.body;
  if (!issue || !issue.description) {
    return res.status(400).json({ error: "Missing required issue data or description" });
  }

  // Also bridge into service requests for COA planning
  const validPriority =
    issue.priority === "Emergency" ||
    issue.priority === "High" ||
    issue.priority === "Medium" ||
    issue.priority === "Low"
      ? issue.priority
      : "High";

  const newReq = {
    id: `req-wrk-${Date.now()}`,
    department: `${issue.department || "Engineering"} Department`,
    trackArea: issue.location?.address || "Dadar - Matunga Junction",
    description: `[Field Worker Log]: ${issue.description}`,
    priority: validPriority as "High" | "Low" | "Medium" | "Emergency",
    preferredSlot: "Immediate / Next Available Night Window",
    status: "Pending" as const,
    createdAt: new Date().toISOString().substring(0, 16).replace("T", " "),
    workType: `${issue.department || "Track"} Repair & Defect Clearance`,
    submittedBy: issue.reportedBy?.name || "Field Maintainer Gang #12",
  };

  coaDb.requests.unshift(newReq);

  return res.json({
    success: true,
    ticketNo: issue.ticketNo || `CR-WRK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    assignedSupervisor: issue.assignedSupervisor,
    status: "Reported & Transmitted to Section Supervisor",
  });
});

// In-memory hierarchical issues store initialized with realistic Mumbai Central Line mock data
const hierarchicalIssuesDb: HierarchicalIssue[] = JSON.parse(
  JSON.stringify(INITIAL_HIERARCHICAL_ISSUES)
);

// Helper: Determine if role can view issue based on strict hierarchy visibility rules
function canUserViewIssue(
  issue: HierarchicalIssue,
  userRole: string,
  userEmpId?: string,
  _userStation?: string
): boolean {
  if (!userRole) return true;

  switch (userRole) {
    case "worker":
      // Field worker can view issues they personally reported OR work officially sanctioned by COA
      if (issue.currentStatus === "Sanctioned by COA") {
        return true;
      }
      if (userEmpId && issue.originalRequest.reportedBy.empId !== userEmpId) {
        return false;
      }
      return true;

    case "supervisor":
      // Supervisor can view any issue in their jurisdiction from Reported onwards
      return true;

    case "zonal_head":
      // Zonal Head only views issues that have reached Zonal Head or higher
      const zonalAllowedStatuses: IssueLifecycleStatus[] = [
        "Escalated to Zonal Head",
        "Under Zonal Review",
        "Resolved by Zonal Head",
        "Escalated to Department Head",
        "Under Department Review",
        "Resolved by Department Head",
        "Escalated to COA",
        "Under COA Review",
        "Sanctioned by COA",
        "Resolved / Closed",
      ];
      return zonalAllowedStatuses.includes(issue.currentStatus);

    case "department_user":
    case "dept_head":
      // Department Head only views issues that have reached Department level or higher
      const deptAllowedStatuses: IssueLifecycleStatus[] = [
        "Escalated to Department Head",
        "Under Department Review",
        "Resolved by Department Head",
        "Escalated to COA",
        "Under COA Review",
        "Sanctioned by COA",
        "Resolved / Closed",
      ];
      return deptAllowedStatuses.includes(issue.currentStatus);

    case "coa_admin":
    case "coa":
      // COA only views issues that reached final escalation level (or resolved from COA)
      const coaAllowedStatuses: IssueLifecycleStatus[] = [
        "Escalated to COA",
        "Under COA Review",
        "Sanctioned by COA",
        "Resolved / Closed",
      ];
      return coaAllowedStatuses.includes(issue.currentStatus);

    default:
      return true;
  }
}

// 1. GET /api/issues - Role-enforced list of hierarchical issues
app.get("/api/issues", (req, res) => {
  const userRole = (req.headers["x-user-role"] || req.query.role || "") as string;
  const userEmpId = (req.headers["x-user-empid"] || req.query.empId || "") as string;
  const userStation = (req.headers["x-user-station"] || req.query.station || "") as string;
  const filterStatus = (req.query.status || "") as string;
  const filterStation = (req.query.station || "") as string;

  let filtered = hierarchicalIssuesDb.filter((issue) =>
    canUserViewIssue(issue, userRole, userEmpId, userStation)
  );

  if (filterStatus) {
    filtered = filtered.filter((i) => i.currentStatus === filterStatus);
  }
  if (filterStation && filterStation !== "all") {
    filtered = filtered.filter((i) =>
      i.station.toLowerCase().includes(filterStation.toLowerCase())
    );
  }

  return res.json({
    success: true,
    total: filtered.length,
    userRole,
    issues: filtered,
  });
});

// 2. GET /api/issues/:id - Single issue with complete audit trail
app.get("/api/issues/:id", (req, res) => {
  const { id } = req.params;
  const userRole = (req.headers["x-user-role"] || req.query.role || "") as string;
  const userEmpId = (req.headers["x-user-empid"] || req.query.empId || "") as string;

  const issue = hierarchicalIssuesDb.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) {
    return res.status(404).json({ success: false, error: "Issue not found" });
  }

  if (userRole && !canUserViewIssue(issue, userRole, userEmpId)) {
    return res.status(403).json({
      success: false,
      error: "Access Denied: You do not have permission to view this issue at its current hierarchy stage.",
    });
  }

  return res.json({
    success: true,
    issue,
  });
});

// 3. POST /api/issues - Worker reports a new issue
app.post("/api/issues", (req, res) => {
  const body = req.body;
  if (!body || !body.description || !body.title) {
    return res.status(400).json({ success: false, error: "Missing required issue fields" });
  }

  const nowStr = new Date().toISOString().substring(0, 16).replace("T", " ");
  const ticketNo = `CR-WRK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const issueId = `h-iss-${Date.now()}`;

  const workerInfo = body.reportedBy || {
    name: "Suresh R. Patil",
    empId: "WRK-CR-2041",
    phone: "+91 97692 31204",
    gangNo: "P-Way Gang #12",
  };

  const supervisorInfo = body.supervisor || {
    name: "Rajesh K. Shinde",
    empId: "SUP-CR-3104",
    designation: "SSE / P-Way (Dadar Section)",
    phone: "+91 98201 44521",
    depot: "Dadar P-Way Maintenance Depot (Km 9/12)",
  };

  const snapshot = {
    title: body.title,
    department: body.department || "Engineering",
    station: body.station || "Dadar",
    trackSection: body.trackSection || "DR – GC",
    nearestKmPost: body.nearestKmPost || "Km 11/14",
    lineType: body.lineType || "Down Slow",
    coordinates: body.coordinates || { lat: 19.0269, lng: 72.8488 },
    description: body.description,
    voiceTranscript: body.voiceTranscript,
    priority: body.priority || "High",
    estimatedFixTimeMinutes: Number(body.estimatedFixTimeMinutes) || 45,
    media: body.media || [],
    technicalNotes: body.technicalNotes || "",
  };

  const initialHistory: IssueModificationRecord = {
    id: `mod-${Date.now()}-1`,
    level: "Worker",
    modifiedBy: {
      name: workerInfo.name,
      empId: workerInfo.empId,
      role: "Field Track Maintainer Gr-IV",
      department: body.department || "Engineering",
    },
    dateTime: nowStr,
    changes: "Original field defect report logged",
    remarks: body.description,
    actionTaken: "Reported to Section Supervisor for review",
  };

  const newIssue: HierarchicalIssue = {
    id: issueId,
    ticketNo,
    currentStatus: "Under Supervisor Review",
    station: snapshot.station,
    zone: "Central Zone",
    department: snapshot.department,
    supervisor: supervisorInfo,
    zonalHead: {
      name: "Virendra K. Meena",
      empId: "ZON-CR-1102",
      designation: "Chief Track Engineer (CTE / HQ CSMT)",
      zone: "Central Railway Zone",
    },
    departmentHead: {
      name: "Dr. Pradeep Verma",
      empId: "DPT-CR-5520",
      designation: "Sr. Divisional Engineer (Sr. DEN / Central Line)",
      department: "Engineering Department",
    },
    originalRequest: {
      ...snapshot,
      reportedBy: workerInfo,
      reportedAt: nowStr,
    },
    activeRequest: {
      ...snapshot,
    },
    modificationHistory: [initialHistory],
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  hierarchicalIssuesDb.unshift(newIssue);

  return res.status(201).json({
    success: true,
    message: "Issue logged and transmitted to Supervisor for technical verification.",
    issue: newIssue,
  });
});

// 4. PUT /api/issues/:id/edit - Editable Handover at receiving hierarchy level
app.put("/api/issues/:id/edit", (req, res) => {
  const { id } = req.params;
  const { modifiedBy, level, changesSummary, remarks, activeRequest } = req.body;

  const issue = hierarchicalIssuesDb.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) {
    return res.status(404).json({ success: false, error: "Issue not found" });
  }

  // Hierarchy role validation for editing
  const reqRole = (req.headers["x-user-role"] || req.body.userRole || "") as string;
  if (reqRole === "worker") {
    return res.status(403).json({
      success: false,
      error: "Workers cannot modify active requests after submission. Modifications are reserved for receiving hierarchy authorities.",
    });
  }

  const nowStr = new Date().toISOString().substring(0, 16).replace("T", " ");

  // Update active request (NEVER TOUCH originalRequest to preserve worker submission immutably!)
  if (activeRequest) {
    issue.activeRequest = {
      ...issue.activeRequest,
      ...activeRequest,
      media: activeRequest.media || issue.activeRequest.media,
    };
    if (activeRequest.station) {
      issue.station = activeRequest.station;
    }
  }

  // Record audit trail entry
  const historyRecord: IssueModificationRecord = {
    id: `mod-${Date.now()}`,
    level: level || "Supervisor",
    modifiedBy: modifiedBy || {
      name: "Authorized Reviewer",
      empId: "OFF-001",
      role: level || "Supervisor",
    },
    dateTime: nowStr,
    changes: changesSummary || "Technical parameters and scope updated",
    remarks: remarks || "Scope revised during handover inspection",
    actionTaken: "Active request updated by " + (level || "Reviewer"),
  };

  issue.modificationHistory.push(historyRecord);
  issue.updatedAt = nowStr;

  return res.json({
    success: true,
    message: "Issue active request updated successfully. Original worker submission preserved.",
    issue,
  });
});

// 5. POST /api/issues/:id/escalate - Stepwise Escalation (Supervisor -> Zonal -> Dept -> COA)
app.post("/api/issues/:id/escalate", (req, res) => {
  const { id } = req.params;
  const { userRole, modifiedBy, reason, remarks, targetLevel } = req.body;

  const issue = hierarchicalIssuesDb.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) {
    return res.status(404).json({ success: false, error: "Issue not found" });
  }

  const nowStr = new Date().toISOString().substring(0, 16).replace("T", " ");
  const effectiveRole = (req.headers["x-user-role"] || userRole || "") as string;

  // Enforce stepwise hierarchy: bypass prevention!
  if (issue.currentStatus === "Reported" || issue.currentStatus === "Under Supervisor Review") {
    if (effectiveRole !== "supervisor" && effectiveRole !== "coa_admin") {
      return res.status(403).json({
        success: false,
        error: "Only the designated Supervisor can escalate this issue to Zonal Head.",
      });
    }
    if (targetLevel === "COA Management" || targetLevel === "Department Head") {
      return res.status(400).json({
        success: false,
        error: "Hierarchy Violation: Supervisor must forward to Zonal Head first. Cannot bypass Zonal or Department level.",
      });
    }

    issue.currentStatus = "Escalated to Zonal Head";
    issue.escalatedToZonalAt = nowStr;
    issue.zonalEscalationReason = reason || "Escalated for Zonal Technical review & multi-section coordination";
    issue.zonalRemarks = remarks || "";

    issue.modificationHistory.push({
      id: `mod-${Date.now()}`,
      level: "Supervisor",
      modifiedBy: modifiedBy || {
        name: issue.supervisor.name,
        empId: issue.supervisor.empId,
        role: "SSE / Supervisor",
      },
      dateTime: nowStr,
      changes: "Forwarded to Zonal Head with supervisory endorsement",
      remarks: remarks || reason || "Escalated to Zonal Head",
      actionTaken: "Escalated to Zonal Head",
    });
  } else if (
    issue.currentStatus === "Escalated to Zonal Head" ||
    issue.currentStatus === "Under Zonal Review"
  ) {
    if (effectiveRole !== "zonal_head" && effectiveRole !== "coa_admin") {
      return res.status(403).json({
        success: false,
        error: "Only the Zonal Head can forward this issue to Department Head.",
      });
    }
    if (targetLevel === "COA Management") {
      return res.status(400).json({
        success: false,
        error: "Hierarchy Violation: Zonal Head must forward to Department Head first. Cannot bypass Department level.",
      });
    }

    issue.currentStatus = "Escalated to Department Head";
    issue.escalatedToDeptAt = nowStr;
    issue.deptEscalationReason = reason || "Escalated to Sr. Divisional Engineer for departmental block sanction";
    issue.deptRemarks = remarks || "";

    issue.modificationHistory.push({
      id: `mod-${Date.now()}`,
      level: "Zonal Head",
      modifiedBy: modifiedBy || {
        name: issue.zonalHead?.name || "Virendra K. Meena",
        empId: issue.zonalHead?.empId || "ZON-CR-1102",
        role: "Chief Track Engineer (Zonal Head)",
      },
      dateTime: nowStr,
      changes: "Forwarded to Department Head with zonal track recommendations",
      remarks: remarks || reason || "Escalated to Department Head",
      actionTaken: "Escalated to Department Head",
    });
  } else if (
    issue.currentStatus === "Escalated to Department Head" ||
    issue.currentStatus === "Under Department Review"
  ) {
    if (
      effectiveRole !== "department_user" &&
      effectiveRole !== "dept_head" &&
      effectiveRole !== "coa_admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Only the Department Head can escalate this issue to COA Management.",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: "Reason for COA escalation is mandatory before final management handover.",
      });
    }

    issue.currentStatus = "Escalated to COA";
    issue.escalatedToCoaAt = nowStr;
    issue.coaEscalationReason = reason;
    issue.coaRemarks = remarks || "";

    issue.modificationHistory.push({
      id: `mod-${Date.now()}`,
      level: "Department Head",
      modifiedBy: modifiedBy || {
        name: issue.departmentHead?.name || "Dr. Pradeep Verma",
        empId: issue.departmentHead?.empId || "DPT-CR-5520",
        role: "Sr. Divisional Engineer (Dept Head)",
      },
      dateTime: nowStr,
      changes: `Escalated to COA Management Authority. Reason: ${reason}`,
      remarks: remarks || reason,
      actionTaken: "Escalated to COA Management",
    });
  } else {
    return res.status(400).json({
      success: false,
      error: `Issue cannot be escalated from current status '${issue.currentStatus}'`,
    });
  }

  issue.updatedAt = nowStr;

  return res.json({
    success: true,
    message: `Issue successfully forwarded to ${issue.currentStatus}.`,
    issue,
  });
});

// 6. POST /api/issues/:id/resolve - Mark resolved at current hierarchy level
app.post("/api/issues/:id/resolve", (req, res) => {
  const { id } = req.params;
  const { userRole, modifiedBy, resolutionDetails, level } = req.body;

  const issue = hierarchicalIssuesDb.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) {
    return res.status(404).json({ success: false, error: "Issue not found" });
  }

  const effectiveRole = (req.headers["x-user-role"] || userRole || "") as string;
  if (effectiveRole === "worker") {
    return res.status(403).json({
      success: false,
      error: "Workers cannot certify issue resolution. Resolutions require supervisory or management sign-off.",
    });
  }

  if (!resolutionDetails || !resolutionDetails.trim()) {
    return res.status(400).json({
      success: false,
      error: "Detailed technical resolution summary is required.",
    });
  }

  const nowStr = new Date().toISOString().substring(0, 16).replace("T", " ");

  let finalStatus: IssueLifecycleStatus = "Resolved / Closed";
  if (effectiveRole === "supervisor") {
    finalStatus = "Resolved by Supervisor";
  } else if (effectiveRole === "zonal_head") {
    finalStatus = "Resolved by Zonal Head";
  } else if (effectiveRole === "department_user" || effectiveRole === "dept_head") {
    finalStatus = "Resolved by Department Head";
  } else {
    finalStatus = "Resolved / Closed";
  }

  issue.currentStatus = finalStatus;
  issue.resolvedAt = nowStr;
  issue.resolvedBy = {
    name: modifiedBy?.name || "Authorized Official",
    empId: modifiedBy?.empId || "OFF-001",
    level: level || effectiveRole,
  };
  issue.resolutionDetails = resolutionDetails;

  issue.modificationHistory.push({
    id: `mod-${Date.now()}`,
    level: (level as any) || "COA Management",
    modifiedBy: modifiedBy || {
      name: "Authorized Official",
      empId: "OFF-001",
      role: effectiveRole,
    },
    dateTime: nowStr,
    changes: `Marked resolved: ${resolutionDetails}`,
    remarks: resolutionDetails,
    actionTaken: `Resolved at ${level || effectiveRole} level`,
  });

  issue.updatedAt = nowStr;

  return res.json({
    success: true,
    message: `Issue resolved and logged under '${finalStatus}'.`,
    issue,
  });
});

// 7. POST /api/issues/:id/add-remarks - Add remarks / technical notes without changing status
app.post("/api/issues/:id/add-remarks", (req, res) => {
  const { id } = req.params;
  const { modifiedBy, level, remarks } = req.body;

  const issue = hierarchicalIssuesDb.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) {
    return res.status(404).json({ success: false, error: "Issue not found" });
  }

  if (!remarks || !remarks.trim()) {
    return res.status(400).json({ success: false, error: "Remarks cannot be empty." });
  }

  const nowStr = new Date().toISOString().substring(0, 16).replace("T", " ");

  issue.modificationHistory.push({
    id: `mod-${Date.now()}`,
    level: level || "Supervisor",
    modifiedBy: modifiedBy || {
      name: "Reviewer",
      empId: "REV-01",
      role: level || "Supervisor",
    },
    dateTime: nowStr,
    changes: "Added technical remarks",
    remarks,
    actionTaken: "Technical assessment logged",
  });

  issue.updatedAt = nowStr;

  return res.json({
    success: true,
    message: "Remarks successfully recorded in issue audit history.",
    issue,
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Railप्रवाह server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
