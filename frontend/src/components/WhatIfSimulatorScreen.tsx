import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  WhatIfSimulationResult,
  ServiceRequestItem,
  CalendarBlock,
  TimelineBlock,
  HierarchicalIssue,
} from "../types";
import {
  Cpu,
  Play,
  RefreshCw,
  Sparkles,
  Database,
  Train,
  Clock,
  MapPin,
  Building2,
  AlertTriangle,
  TrendingDown,
  Timer,
  PlusCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface WhatIfSimulatorScreenProps {
  initialData?: WhatIfSimulationResult;
  requests?: ServiceRequestItem[];
  calendarBlocks?: CalendarBlock[];
  timelineBlocks?: TimelineBlock[];
  onSimulate: (targetBlock: string, delayMinutes: number) => Promise<WhatIfSimulationResult | null>;
}

export interface DatabaseProblemItem {
  id: string;
  sourceType: "complaint" | "service_request" | "calendar_block";
  ticketNo: string;
  title: string;
  description: string;
  station: string;
  line: string;
  department: string;
  priority: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  scheduledWindowText: string;
  baseDurationMinutes: number;
}

export interface DbTrainSchedule {
  id: string;
  train_no: string;
  train_name: string;
  service_type: "slow_local" | "fast_local" | "mail_express" | "freight";
  direction: "UP" | "DOWN";
  corridor_section: string;
  station: string;
  line_type: string;
  scheduled_slot: string;
  destination: string;
  origin: string;
  priority_tier: number;
}

// Compute deterministic overrun simulation from real database train schedules
export function computeOverrunSimulationFromDb(
  problem: DatabaseProblemItem,
  overrunMins: number,
  allDbTrains: DbTrainSchedule[]
): WhatIfSimulationResult {
  const isCritical = problem.priority.toUpperCase() === "CRITICAL" || problem.priority.toUpperCase() === "P1";
  const baseCount = isCritical ? 18 : 12;
  const computedDelays = Math.max(2, Math.round(baseCount * (overrunMins / 30)));
  const computedRadius = Math.max(2, Math.min(6, Math.round(3 * Math.max(0.6, overrunMins / 30))));

  const parseBaseTime = (timeStr: string, offsetMins: number) => {
    const parts = (timeStr || "14:00").split(":");
    let h = parseInt(parts[0] || "14", 10);
    let m = parseInt(parts[1] || "0", 10);
    const total = (h * 60 + m + offsetMins) % 1440;
    const resH = String(Math.floor(total / 60)).padStart(2, "0");
    const resM = String(total % 60).padStart(2, "0");
    return `${resH}:${resM}`;
  };

  // Filter relevant trains matching the problem's station or corridor
  const searchSec = `${problem.station} ${problem.line}`.toLowerCase();
  let relevantTrains = allDbTrains.filter((t) => {
    return (
      searchSec.includes(t.station.toLowerCase()) ||
      searchSec.includes(t.corridor_section.toLowerCase()) ||
      t.corridor_section.toLowerCase().includes(problem.station.toLowerCase())
    );
  });

  if (relevantTrains.length === 0) {
    relevantTrains = allDbTrains.slice(0, 6);
  }

  const delays = relevantTrains.slice(0, 7).map((train, idx) => {
    const delayDelta = Math.max(5, overrunMins - idx * 3);
    return {
      trainNo: `${train.train_no} (${train.train_name})`,
      location: `${train.station} Approach Signal`,
      scheduledTime: train.scheduled_slot,
      simulatedTime: parseBaseTime(train.scheduled_slot, delayDelta),
      delta: `+${delayDelta}m`,
      severity: idx < 2 ? ("high" as const) : idx < 4 ? ("medium" as const) : ("low" as const),
    };
  });

  return {
    telemetry: {
      cascadingDelayTotal: Math.max(delays.length, computedDelays),
      forcedCancellations: overrunMins >= 45 ? 2 : overrunMins >= 30 ? 1 : 0,
      estSystemRecovery: `${Math.floor(overrunMins / 20)}h ${(overrunMins % 20) * 3}m`,
      impactRadiusStations: computedRadius,
    },
    cancellations: [],
    delays,
    aiAnalysis: `Database-tracked maintenance problem "${problem.title}" on ${problem.station} (${problem.line}) overran its scheduled window (${problem.scheduledWindowText}) by +${overrunMins} minutes. Cascades delays across ${delays.length} active scheduled trains from database timetable spanning ${computedRadius} division stations.`,
  };
}

export const WhatIfSimulatorScreen: React.FC<WhatIfSimulatorScreenProps> = ({
  initialData,
  requests = [],
  calendarBlocks = [],
  timelineBlocks = [],
  onSimulate,
}) => {
  const [dbIssues, setDbIssues] = useState<HierarchicalIssue[]>([]);
  const [dbTrains, setDbTrains] = useState<DbTrainSchedule[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isCreatingSample, setIsCreatingSample] = useState(false);

  // Fetch complaints & train timetable directly from the database
  const fetchDatabaseRecords = useCallback(async () => {
    setIsLoadingDb(true);
    try {
      // 1. Fetch Issues
      const resIssues = await fetch("/api/issues");
      const dataIssues = await resIssues.json();
      if (dataIssues.success && Array.isArray(dataIssues.issues)) {
        setDbIssues(dataIssues.issues);
      }

      // 2. Fetch Train Timetable from database
      const resTrains = await fetch("/api/trains");
      const dataTrains = await resTrains.json();
      if (dataTrains.success && Array.isArray(dataTrains.trains)) {
        setDbTrains(dataTrains.trains);
      }
    } catch (err) {
      console.warn("Could not fetch database records:", err);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    fetchDatabaseRecords();
  }, [fetchDatabaseRecords]);

  // Transform ONLY items from database tables (complaints, service_requests, calendar_blocks)
  const databaseProblems = useMemo<DatabaseProblemItem[]>(() => {
    const list: DatabaseProblemItem[] = [];

    // 1. Complaints table in Supabase (/api/issues)
    dbIssues.forEach((issue) => {
      const station = issue.station || issue.activeRequest?.station || issue.activeRequest?.trackSection || "Central Line Section";
      const line = issue.activeRequest?.lineType || "Mainline";
      const title = issue.activeRequest?.title || issue.originalRequest?.title || "Track & Infrastructure Issue";
      const desc = issue.activeRequest?.description || issue.originalRequest?.description || "";
      const dept = issue.department || issue.activeRequest?.department || "Engineering (P-Way)";
      const priority = issue.activeRequest?.priority || "HIGH";
      const slotWindow = (issue.activeRequest as any)?.slotWindow || (issue.originalRequest as any)?.slotWindow || "14:00 - 15:30";

      const times = slotWindow.match(/(\d{1,2}:\d{2})/g) || ["14:00", "15:30"];
      const start = times[0] || "14:00";
      const end = times[1] || "15:30";

      list.push({
        id: `complaint-${issue.id}`,
        sourceType: "complaint",
        ticketNo: issue.ticketNo || `CMP-${issue.id.slice(0, 6)}`,
        title,
        description: desc,
        station,
        line,
        department: dept,
        priority,
        status: issue.currentStatus,
        scheduledStart: start,
        scheduledEnd: end,
        scheduledWindowText: `${start} – ${end}`,
        baseDurationMinutes: 90,
      });
    });

    // 2. Service Requests table in Supabase (/api/coa/requests)
    (requests || []).forEach((req) => {
      const station = req.trackArea || "Central Division Sector";
      const title = req.taskName || req.description || "Track Maintenance Request";
      const desc = req.description || "";
      const dept = req.department || "Engineering (P-Way)";
      const priority = req.priority || "MEDIUM";
      const slotWindow = req.assignedSlot || req.preferredSlot || "10:00 - 12:00";

      const times = slotWindow.match(/(\d{1,2}:\d{2})/g) || ["10:00", "12:00"];
      const start = times[0] || "10:00";
      const end = times[1] || "12:00";

      list.push({
        id: `request-${req.id}`,
        sourceType: "service_request",
        ticketNo: `REQ-${req.id.toUpperCase().slice(0, 8)}`,
        title,
        description: desc,
        station,
        line: "Demanded Corridor Track",
        department: dept,
        priority,
        status: req.status,
        scheduledStart: start,
        scheduledEnd: end,
        scheduledWindowText: `${start} – ${end}`,
        baseDurationMinutes: 120,
      });
    });

    // 3. Approved Maintenance Blocks table in Supabase (/api/coa/calendar)
    (calendarBlocks || []).forEach((cal) => {
      const station = cal.station || "Central Division";
      const title = cal.title || cal.taskName || "Approved Track Block";
      const desc = cal.description || "";
      const dept = cal.department || "Engineering (P-Way)";
      const priority = cal.priority || "HIGH";
      const start = cal.startTime || "01:30";
      const end = cal.endTime || "04:30";

      list.push({
        id: `cal-${cal.id}`,
        sourceType: "calendar_block",
        ticketNo: `BLK-${cal.id.toUpperCase().slice(0, 8)}`,
        title,
        description: desc,
        station,
        line: `${cal.startTime} - ${cal.endTime} Block Window`,
        department: dept,
        priority,
        status: cal.status,
        scheduledStart: start,
        scheduledEnd: end,
        scheduledWindowText: `${start} – ${end} (${cal.date})`,
        baseDurationMinutes: 180,
      });
    });

    return list;
  }, [dbIssues, requests, calendarBlocks]);

  const [selectedProblemId, setSelectedProblemId] = useState<string>("");

  useEffect(() => {
    if (databaseProblems.length > 0 && (!selectedProblemId || !databaseProblems.some((p) => p.id === selectedProblemId))) {
      setSelectedProblemId(databaseProblems[0].id);
    }
  }, [databaseProblems, selectedProblemId]);

  const currentProblem = useMemo<DatabaseProblemItem | null>(() => {
    return databaseProblems.find((p) => p.id === selectedProblemId) || databaseProblems[0] || null;
  }, [databaseProblems, selectedProblemId]);

  // Overrun duration state (how many minutes the problem extends past scheduled time)
  const [overrunMinutes, setOverrunMinutes] = useState<number>(15);
  const [customOverrunInput, setCustomOverrunInput] = useState<string>("15");
  const [isLoading, setIsLoading] = useState(false);

  const presetOverruns = [15, 30, 45, 60];

  // Compute the simulated end time given the overrun
  const simulatedEndTime = useMemo(() => {
    if (!currentProblem) return "15:45";
    const parts = (currentProblem.scheduledEnd || "15:30").split(":");
    let h = parseInt(parts[0] || "15", 10);
    let m = parseInt(parts[1] || "30", 10);
    const total = (h * 60 + m + overrunMinutes) % 1440;
    const resH = String(Math.floor(total / 60)).padStart(2, "0");
    const resM = String(total % 60).padStart(2, "0");
    return `${resH}:${resM}`;
  }, [currentProblem, overrunMinutes]);

  // Simulation result state
  const [simulationResult, setSimulationResult] = useState<WhatIfSimulationResult | null>(() => {
    if (initialData && initialData.telemetry) return initialData;
    return null;
  });

  // Execute overrun simulation via Gemini 2.5 Flash backed by database train schedule
  const executeOverrunSimulation = useCallback(
    async (problem: DatabaseProblemItem, extraMins: number) => {
      setIsLoading(true);
      const queryPrompt = `Maintenance Problem Overrun: "${problem.title}" at ${problem.station} (${problem.department}). Original Scheduled Window: ${problem.scheduledWindowText}. The work is taking +${extraMins} minutes longer than original scheduled time (extended to ${simulatedEndTime}).`;
      try {
        const result = await onSimulate(queryPrompt, extraMins);
        if (result && result.telemetry && Array.isArray(result.delays) && result.delays.length > 0) {
          setSimulationResult(result);
        } else {
          setSimulationResult(computeOverrunSimulationFromDb(problem, extraMins, dbTrains));
        }
      } catch (err) {
        console.warn("What-if overrun simulation fallback:", err);
        setSimulationResult(computeOverrunSimulationFromDb(problem, extraMins, dbTrains));
      } finally {
        setIsLoading(false);
      }
    },
    [onSimulate, simulatedEndTime, dbTrains]
  );

  const handleProblemChange = (id: string) => {
    setSelectedProblemId(id);
    const p = databaseProblems.find((item) => item.id === id);
    if (p) {
      executeOverrunSimulation(p, overrunMinutes);
    }
  };

  const handlePresetClick = (mins: number) => {
    setOverrunMinutes(mins);
    setCustomOverrunInput(mins.toString());
    if (currentProblem) {
      executeOverrunSimulation(currentProblem, mins);
    }
  };

  const handleCustomOverrunChange = (val: string) => {
    setCustomOverrunInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setOverrunMinutes(parsed);
    }
  };

  const handleRunSimulation = () => {
    if (currentProblem) {
      executeOverrunSimulation(currentProblem, overrunMinutes);
    }
  };

  // Quick action: Seed a sample complaint into the database table if empty
  const handleCreateSampleComplaint = async () => {
    setIsCreatingSample(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Track Circuit Joint Defect & Weld Renewal",
          description: "Micro-fissure detected on Down Fast Line requiring urgent sleeper replacement & track possession.",
          station: "Dadar – Matunga",
          lineType: "Down Fast Line (Beside PF No. 4)",
          priority: "HIGH",
          department: "Engineering (P-Way)",
          slotWindow: "14:00 - 15:30",
          reportedBy: {
            name: "Sunil Shinde",
            empId: "WRK-CR-1001",
            phone: "9820144521",
            gangNo: "Gang-04",
          },
        }),
      });
      if (res.ok) {
        await fetchDatabaseRecords();
      }
    } catch (e) {
      console.warn("Error creating sample complaint:", e);
    } finally {
      setIsCreatingSample(false);
    }
  };

  // Safe fallback calculation if simulationResult is empty
  const activeSimulation = useMemo<WhatIfSimulationResult>(() => {
    if (
      simulationResult &&
      simulationResult.telemetry &&
      typeof simulationResult.telemetry.cascadingDelayTotal === "number"
    ) {
      return simulationResult;
    }
    if (currentProblem) {
      return computeOverrunSimulationFromDb(currentProblem, overrunMinutes, dbTrains);
    }
    return {
      telemetry: {
        cascadingDelayTotal: 0,
        forcedCancellations: 0,
        estSystemRecovery: "0m",
        impactRadiusStations: 0,
      },
      cancellations: [],
      delays: [],
      aiAnalysis: "Select a database problem above to simulate cascading overrun impact on trains.",
    };
  }, [simulationResult, currentProblem, overrunMinutes, dbTrains]);

  return (
    <div id="whatif-simulator-screen" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#c7c4d8]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#ffdcc3] text-[#904d00] font-mono flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> Maintenance Overrun Simulator
            </span>
            <span className="text-[11px] text-[#777587] font-mono">
              Central Railway • Database Timetable Engine
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#dcfce7] text-[#166534] border border-[#86efac] flex items-center gap-1 font-mono">
              <Database className="w-2.5 h-2.5" />
              {databaseProblems.length} Problems • {dbTrains.length} Trains in DB
            </span>
          </div>
          <h1 className="text-[23px] font-bold text-[#191c1e] tracking-tight mt-1 flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-[#ffdcc3] text-[#904d00]">
              <Cpu className="w-5 h-5" />
            </span>
            What-If Schedule Overrun & Train Delay Simulator
          </h1>
          <p className="text-[12.5px] text-[#464555] mt-0.5">
            Simulate the cascading impact on database scheduled trains if maintenance work takes <strong>longer than its original allotted possession time</strong> (+15m, +30m, +45m, +60m).
          </p>
        </div>

        {/* Live Model Badge & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDatabaseRecords}
            disabled={isLoadingDb}
            className="flex items-center gap-1 text-[11px] font-mono font-bold bg-[#f2f4f6] text-[#464555] border border-[#c7c4d8] px-2.5 py-1.5 rounded hover:bg-[#e0e3e5] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? "animate-spin" : ""}`} />
            <span>Sync DB</span>
          </button>
          <div className="flex items-center gap-1.5 bg-white border border-[#c7c4d8] px-3 py-1.5 rounded-md shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#3525cd] animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-[#191c1e]">Gemini 2.5 Flash</span>
          </div>
        </div>
      </div>

      {/* Empty Database State Notice */}
      {databaseProblems.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#c7c4d8] rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#ffdcc3] text-[#904d00] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-[#191c1e]">No Maintenance Problems Found in Database</h3>
            <p className="text-[12.5px] text-[#777587] max-w-lg mx-auto mt-1">
              The What-If simulator only runs on genuine problems recorded in your Supabase database tables (<code>complaints</code>, <code>service_requests</code>, <code>maintenance_plans</code>).
            </p>
          </div>
          <button
            onClick={handleCreateSampleComplaint}
            disabled={isCreatingSample}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#3525cd] text-white text-[12.5px] font-bold rounded-md hover:bg-[#2515b0] transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            {isCreatingSample ? "Ingesting Sample Problem..." : "➕ Seed Sample Problem into Database"}
          </button>
        </div>
      ) : (
        <>
          {/* Main Control Panel: Select Database Problem & Overrun Duration */}
          <div className="bg-white border border-[#c7c4d8] rounded-xl p-5 shadow-xs space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              {/* Select Database Problem */}
              <div className="md:col-span-6">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#3525cd]" />
                    Select Problem From Database Table
                  </label>
                  {currentProblem && (
                    <span className="text-[10px] font-mono font-bold text-[#3525cd] bg-[#e2dfff] px-2 py-0.5 rounded">
                      {currentProblem.ticketNo}
                    </span>
                  )}
                </div>
                <select
                  id="whatif-database-problem-select"
                  value={selectedProblemId}
                  onChange={(e) => handleProblemChange(e.target.value)}
                  className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-2.5 px-3 text-[12.5px] font-medium text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white focus:ring-1 focus:ring-[#3525cd] transition-all cursor-pointer truncate"
                >
                  {databaseProblems.map((prob) => (
                    <option key={prob.id} value={prob.id}>
                      [{prob.ticketNo}] {prob.station} • {prob.title} ({prob.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Overrun Duration Selector (+15m, +30m, etc.) */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#ba1a1a]" />
                  Extra Time / Overrun (+mins)
                </label>
                <div className="flex items-center gap-1.5">
                  {presetOverruns.map((min) => (
                    <button
                      key={min}
                      id={`overrun-preset-${min}`}
                      onClick={() => handlePresetClick(min)}
                      className={`flex-1 py-2 text-[12px] font-mono font-bold rounded border transition-all cursor-pointer ${
                        overrunMinutes === min
                          ? "bg-[#ba1a1a] text-white border-[#ba1a1a]"
                          : "bg-[#f2f4f6] text-[#464555] border-[#c7c4d8] hover:bg-[#e0e3e5]"
                      }`}
                    >
                      +{min}m
                    </button>
                  ))}
                  <div className="w-16">
                    <input
                      id="custom-overrun-input"
                      type="text"
                      value={customOverrunInput}
                      onChange={(e) => handleCustomOverrunChange(e.target.value)}
                      placeholder="+mins"
                      className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded py-2 px-2 text-center text-[12px] font-mono text-[#191c1e] focus:outline-none focus:border-[#ba1a1a] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Simulate Action Button */}
              <div className="md:col-span-3">
                <button
                  id="run-overrun-simulation-btn"
                  onClick={handleRunSimulation}
                  disabled={isLoading || !currentProblem}
                  className="w-full py-2.5 px-4 bg-[#ba1a1a] text-white text-[13px] font-bold uppercase tracking-wider rounded-md hover:bg-[#93000a] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-75 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Simulating Overrun...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Simulate +{overrunMinutes}m Overrun</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Problem & Time Progression Display Banner */}
            {currentProblem && (
              <div className="bg-[#f8fafc] border border-[#c7c4d8] rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c7c4d8]/60 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#3525cd] text-white">
                        {currentProblem.sourceType.replace("_", " ")}
                      </span>
                      <span className="text-[13px] font-bold text-[#191c1e]">
                        {currentProblem.title}
                      </span>
                    </div>
                    <span className="text-[11.5px] text-[#777587] mt-0.5 block">
                      Location: <strong className="text-[#191c1e]">{currentProblem.station}</strong> • Line: {currentProblem.line} • Dept: <span className="text-[#3525cd] font-semibold">{currentProblem.department}</span>
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded font-mono self-start sm:self-auto ${
                      currentProblem.priority === "CRITICAL"
                        ? "bg-[#ffdad6] text-[#ba1a1a]"
                        : currentProblem.priority === "HIGH"
                        ? "bg-[#ffdcc3] text-[#904d00]"
                        : "bg-[#e2dfff] text-[#3525cd]"
                    }`}
                  >
                    Priority: {currentProblem.priority}
                  </span>
                </div>

                {/* Scheduled Slot vs Overrun Slot Visual Progression */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
                  <div className="bg-white border border-[#c7c4d8]/80 rounded p-2.5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777587]">
                      Original Scheduled Window
                    </span>
                    <span className="font-mono font-bold text-[#191c1e] text-[13px] mt-0.5 block">
                      {currentProblem.scheduledWindowText}
                    </span>
                    <span className="text-[10.5px] text-[#777587] font-mono">
                      End Time: <strong>{currentProblem.scheduledEnd}</strong>
                    </span>
                  </div>

                  <div className="bg-white border border-[#ba1a1a]/30 rounded p-2.5 bg-[#fff8f7]">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#ba1a1a]">
                      Simulated Overrun (+{overrunMinutes}m)
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 font-mono font-bold text-[#ba1a1a] text-[13px]">
                      <span>{currentProblem.scheduledEnd}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{simulatedEndTime}</span>
                    </div>
                    <span className="text-[10.5px] text-[#ba1a1a] font-mono">
                      Possession extended by <strong>+{overrunMinutes} mins</strong>
                    </span>
                  </div>

                  <div className="bg-white border border-[#c7c4d8]/80 rounded p-2.5 flex flex-col justify-between">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777587]">
                        Database Timetable Link
                      </span>
                      <span className="font-mono text-[11px] text-[#464555] block truncate mt-0.5">
                        {dbTrains.length} active trains indexed in database
                      </span>
                    </div>
                    <span className="text-[10.5px] text-[#3525cd] font-bold font-mono">
                      Dynamic timetable delay projection
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Telemetry Metric Cards: Trains Delayed & Impact Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div id="whatif-delayed-trains-card" className="bg-white border border-[#c7c4d8] rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#ba1a1a] flex items-center gap-1.5">
                  <Train className="w-4 h-4" />
                  Trains Delayed By +{overrunMinutes}m Overrun
                </span>
                <span className="text-[11px] text-[#ba1a1a] font-medium bg-[#ffdad6] px-2 py-0.5 rounded font-mono">
                  Downstream Signals
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-[32px] font-mono font-bold text-[#ba1a1a]">
                  {activeSimulation.telemetry?.cascadingDelayTotal ?? 0}
                </span>
                <span className="text-[11.5px] text-[#777587] font-mono">
                  Est. Recovery: <strong className="text-[#191c1e]">{activeSimulation.telemetry?.estSystemRecovery || "1h 30m"}</strong>
                </span>
              </div>
            </div>

            <div id="whatif-impact-radius-card" className="bg-white border border-[#c7c4d8] rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#3525cd] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Corridor Impact Radius
                </span>
                <span className="text-[11px] text-[#3525cd] font-medium bg-[#e2dfff] px-2 py-0.5 rounded font-mono">
                  Adjacent Junctions
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-[32px] font-mono font-bold text-[#3525cd]">
                  {activeSimulation.telemetry?.impactRadiusStations ?? 0}
                </span>
                <span className="text-[11.5px] text-[#777587] font-mono">
                  Stations around {currentProblem?.station || "Corridor"}
                </span>
              </div>
            </div>
          </div>

          {/* Cascading Delays Live Table */}
          <div className="bg-white border border-[#c7c4d8] rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#c7c4d8] bg-[#fafafa] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-bold text-[#191c1e] uppercase tracking-wider flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#ba1a1a]" />
                  Downstream Trains Delayed By Overrun (Database Timetable Engine)
                </h2>
                <span className="text-[11px] text-[#777587]">
                  Scheduled suburban and express train slots pushed back due to +{overrunMinutes}m overrun on {currentProblem?.station}
                </span>
              </div>

              <span className="text-[11px] font-mono text-[#3525cd] bg-[#e2dfff] px-2.5 py-1 rounded font-semibold">
                {(activeSimulation.delays || []).length} Database Trains Simulated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#f2f4f6] text-[#464555] uppercase text-[10px] font-bold tracking-wider border-b border-[#c7c4d8]">
                    <th className="py-2.5 px-4">Train No. / Service</th>
                    <th className="py-2.5 px-4">Sector Location</th>
                    <th className="py-2.5 px-4">Scheduled Slot</th>
                    <th className="py-2.5 px-4">Delayed Slot (+{overrunMinutes}m)</th>
                    <th className="py-2.5 px-4">Overrun Delta</th>
                    <th className="py-2.5 px-4 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {(activeSimulation.delays || []).map((row, index) => (
                    <tr key={index} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#191c1e]">{row.trainNo}</td>
                      <td className="py-3 px-4 font-medium text-[#464555]">{row.location}</td>
                      <td className="py-3 px-4 font-mono text-[#777587]">{row.scheduledTime}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#ba1a1a]">{row.simulatedTime}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-[#ffdad6] text-[#ba1a1a]">
                          <TrendingDown className="w-3 h-3" />
                          {row.delta}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
                            row.severity === "high"
                              ? "bg-[#ffdad6] text-[#ba1a1a]"
                              : row.severity === "medium"
                              ? "bg-[#ffdcc3] text-[#904d00]"
                              : "bg-[#e2dfff] text-[#3525cd]"
                          }`}
                        >
                          {row.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Synthesis Box */}
            {activeSimulation.aiAnalysis && (
              <div className="p-4 bg-[#f8fafc] border-t border-[#c7c4d8] space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#3525cd] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3525cd]" />
                  <span>AI Overrun & Dispatch Impact Synthesis</span>
                </span>
                <p className="text-[12px] text-[#464555] leading-relaxed font-mono">
                  {activeSimulation.aiAnalysis}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
