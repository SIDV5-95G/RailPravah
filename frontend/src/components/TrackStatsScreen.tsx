import React, { useState, useEffect, useCallback } from "react";
import {
  InterventionLog,
  TrackStatsTelemetryResponse,
  TrackStatsMetrics,
  ChartDataPoint,
} from "../types";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Activity,
  Layers,
  ArrowUpRight,
  Filter,
  Calendar,
  ShieldCheck,
  Cpu,
  Train,
  RefreshCw,
  AlertTriangle,
  Radio,
  Gauge,
  Timer,
} from "lucide-react";

interface TrackStatsScreenProps {
  interventions?: InterventionLog[];
}

export const TrackStatsScreen: React.FC<TrackStatsScreenProps> = () => {
  const [timeRange, setTimeRange] = useState<"7D" | "30D">("7D");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [telemetryData, setTelemetryData] = useState<TrackStatsTelemetryResponse | null>(null);

  const fetchTrackStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/coa/track-stats?range=${timeRange}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data: TrackStatsTelemetryResponse = await res.json();
      if (data.success) {
        setTelemetryData(data);
      } else {
        throw new Error("Failed to load telemetry data from server");
      }
    } catch (err: any) {
      console.error("TrackStats fetch error:", err);
      setError(err.message || "Failed to connect to database telemetry");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchTrackStats();
  }, [fetchTrackStats]);

  // Fallback metrics if initial loading or offline
  const defaultMetrics: TrackStatsMetrics = {
    dateRangeLabel: timeRange === "7D" ? "Past 7 Days (Live)" : "Past 30 Days (Live)",
    periodSubtitle: timeRange === "7D" ? "Rolling 7 Days (Central Line Suburban Division)" : "Past 30 Days (Mumbai Division)",
    punctuality: {
      value: "98.4%",
      delta: "+1.2%",
      deltaColor: "text-[#006e1c]",
      context: "Central Line Peak Hours",
      subDetail: "1,428 Suburban local runs tracked",
    },
    timeRecovered: {
      value: "142 hrs",
      badge: "AI Optimized",
      badgeBg: "bg-[#e2dfff] text-[#3525cd]",
      context: "Across 62 Track Windows",
      subDetail: "Avg 2.29 hrs recovered per block",
    },
    conflictsResolved: {
      value: "84",
      subBadge: "98% Auto-Slotted",
      subBadgeColor: "text-[#006e1c]",
      context: "Zero SIL-4 Violations",
      subDetail: "Only 2 escalated to Section Controller",
    },
    trackUtilization: {
      value: "92.6%",
      delta: "+8.4% Net",
      badgeBg: "bg-[#ffdcc3] text-[#904d00]",
      context: "Night & Shadow Corridors",
      subDetail: "High-density 4-line main corridor",
    },
    chartAvgGain: "Average AI Gain: +28.4% Track Throughput",
    chartNetSaved: "142 Net Hours Saved (7-Day Total)",
    benchmarks: {
      conflictLatency: {
        ai: "4.0m",
        manual: "38m",
        pctReduction: "89% reduction in slot assignment time",
        barPct: 90,
      },
      clusteringRate: {
        rate: "78%",
        manualRate: "21%",
        detail: "54 multi-discipline track & OHE joint blocks",
        barPct: 78,
      },
      punctualityProtection: {
        aiRate: "98.4%",
        manualRate: "91.2%",
        detail: "Protected morning & evening local suburban corridors",
        barPct: 98.4,
      },
      divisionSummary:
        "Railप्रवाह saved 142 total hours of passenger delay across active track windows.",
    },
  };

  const currentMetrics = telemetryData
    ? timeRange === "7D"
      ? telemetryData.metrics7D
      : telemetryData.metrics30D
    : defaultMetrics;

  const activeChartData: ChartDataPoint[] = telemetryData
    ? timeRange === "7D"
      ? telemetryData.chartData7D
      : telemetryData.chartData30D
    : [];

  const rawInterventions: InterventionLog[] = telemetryData
    ? timeRange === "7D"
      ? telemetryData.interventions7D
      : telemetryData.interventions30D
    : [];

  const filteredInterventions = rawInterventions.filter((item) => {
    if (filterType === "ALL") return true;
    if (filterType === "UPTIME") return item.status === "closed" || item.type.includes("Speed");
    return item.type.toUpperCase().includes(filterType);
  });

  return (
    <div id="trackstats-screen" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#c7c4d8]/60 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#e2dfff] text-[#3525cd] font-mono flex items-center gap-1">
              <Radio className="w-3 h-3 text-[#3525cd] animate-pulse" />
              Live Central Railway Analytics
            </span>
            <span className="text-[11px] text-[#777587] font-mono">
              {currentMetrics.periodSubtitle}
            </span>
          </div>
          <h1 className="text-[24px] font-bold text-[#191c1e] tracking-tight mt-1 flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-[#e2dfff] text-[#3525cd]">
              <BarChart3 className="w-5 h-5" />
            </span>
            TrackStats: Real-Time & Historical Performance
          </h1>
          <p className="text-xs text-[#555364] mt-0.5">
            Real-time division uptime, timetable delay minimization, corridor disruptions & AI optimization telemetry.
          </p>
        </div>

        {/* 7 Days vs 30 Days Interactive Range Selector & Refresh */}
        <div className="flex flex-col sm:items-end gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#f2f4f6] p-1.5 rounded-xl border border-[#c7c4d8]">
              <button
                id="trackstats-btn-7d"
                type="button"
                onClick={() => setTimeRange("7D")}
                className={`px-3 py-1.5 text-[12px] font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  timeRange === "7D"
                    ? "bg-[#3525cd] text-white shadow-xs"
                    : "text-[#464555] hover:text-[#191c1e] hover:bg-[#e2dfff]/30"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>7 Days</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-normal ${timeRange === "7D" ? "bg-white/20 text-white" : "bg-black/5 text-[#777587]"}`}>
                  Daily
                </span>
              </button>
              <button
                id="trackstats-btn-30d"
                type="button"
                onClick={() => setTimeRange("30D")}
                className={`px-3 py-1.5 text-[12px] font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  timeRange === "30D"
                    ? "bg-[#3525cd] text-white shadow-xs"
                    : "text-[#464555] hover:text-[#191c1e] hover:bg-[#e2dfff]/30"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>30 Days</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-normal ${timeRange === "30D" ? "bg-white/20 text-white" : "bg-black/5 text-[#777587]"}`}>
                  4 Weeks
                </span>
              </button>
            </div>

            <button
              id="trackstats-refresh-btn"
              type="button"
              onClick={() => fetchTrackStats(true)}
              disabled={loading || refreshing}
              title="Refresh database telemetry"
              className="p-2 rounded-xl border border-[#c7c4d8] bg-white hover:bg-[#f2f4f6] text-[#464555] hover:text-[#191c1e] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#3525cd]" : ""}`} />
            </button>
          </div>

          <span className="text-[11px] font-mono text-[#777587]">
            Active Window: <strong className="text-[#191c1e]">{currentMetrics.dateRangeLabel}</strong>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchTrackStats()}
            className="text-xs font-bold text-red-700 underline cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Top 4 Dynamic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Punctuality Index */}
        <div className="bg-white border border-[#c7c4d8] rounded-xl p-4 shadow-xs hover:border-[#3525cd]/40 transition-all relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center"><RefreshCw className="w-4 h-4 animate-spin text-[#3525cd]" /></div>}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777587] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#006e1c]" />
              Punctuality Index
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#f2f4f6] text-[#464555]">
              {timeRange}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-[28px] font-mono font-bold text-[#006e1c]">
              {currentMetrics.punctuality.value}
            </span>
            <span className={`text-[11px] font-bold flex items-center gap-0.5 ${currentMetrics.punctuality.deltaColor || "text-[#006e1c]"}`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {currentMetrics.punctuality.delta}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#191c1e] mt-1 block">
            {currentMetrics.punctuality.context}
          </span>
          <span className="text-[10px] text-[#777587] block font-mono mt-0.5">
            {currentMetrics.punctuality.subDetail}
          </span>
        </div>

        {/* Metric 2: Net Time Recovered */}
        <div className="bg-white border border-[#c7c4d8] rounded-xl p-4 shadow-xs hover:border-[#3525cd]/40 transition-all relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center"><RefreshCw className="w-4 h-4 animate-spin text-[#3525cd]" /></div>}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777587] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#3525cd]" />
              Net Time Recovered
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#f2f4f6] text-[#464555]">
              {timeRange}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-[28px] font-mono font-bold text-[#3525cd]">
              {currentMetrics.timeRecovered.value}
            </span>
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${currentMetrics.timeRecovered.badgeBg || "bg-[#e2dfff] text-[#3525cd]"}`}>
              {currentMetrics.timeRecovered.badge}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#191c1e] mt-1 block">
            {currentMetrics.timeRecovered.context}
          </span>
          <span className="text-[10px] text-[#777587] block font-mono mt-0.5">
            {currentMetrics.timeRecovered.subDetail}
          </span>
        </div>

        {/* Metric 3: Conflicts Resolved */}
        <div className="bg-white border border-[#c7c4d8] rounded-xl p-4 shadow-xs hover:border-[#3525cd]/40 transition-all relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center"><RefreshCw className="w-4 h-4 animate-spin text-[#3525cd]" /></div>}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777587] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#191c1e]" />
              Conflicts Resolved
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#f2f4f6] text-[#464555]">
              {timeRange}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-[28px] font-mono font-bold text-[#191c1e]">
              {currentMetrics.conflictsResolved.value}
            </span>
            <span className={`text-[11px] font-semibold ${currentMetrics.conflictsResolved.subBadgeColor || "text-[#006e1c]"}`}>
              {currentMetrics.conflictsResolved.subBadge}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#191c1e] mt-1 block">
            {currentMetrics.conflictsResolved.context}
          </span>
          <span className="text-[10px] text-[#777587] block font-mono mt-0.5">
            {currentMetrics.conflictsResolved.subDetail}
          </span>
        </div>

        {/* Metric 4: Track Utilization / Uptime */}
        <div className="bg-white border border-[#c7c4d8] rounded-xl p-4 shadow-xs hover:border-[#3525cd]/40 transition-all relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center"><RefreshCw className="w-4 h-4 animate-spin text-[#3525cd]" /></div>}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777587] flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#904d00]" />
              Track Utilization & Uptime
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#f2f4f6] text-[#464555]">
              {timeRange}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-[28px] font-mono font-bold text-[#904d00]">
              {currentMetrics.trackUtilization.value}
            </span>
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${currentMetrics.trackUtilization.badgeBg || "bg-[#ffdcc3] text-[#904d00]"}`}>
              {currentMetrics.trackUtilization.delta}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#191c1e] mt-1 block">
            {currentMetrics.trackUtilization.context}
          </span>
          <span className="text-[10px] text-[#777587] block font-mono mt-0.5">
            {currentMetrics.trackUtilization.subDetail}
          </span>
        </div>
      </div>

      {/* Main Charts & Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bar Chart of Efficiency */}
        <div className="lg:col-span-7 bg-white border border-[#c7c4d8] rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eceef0] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-[#191c1e] uppercase tracking-wider">
                  Schedule Efficiency Trend
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#e2dfff] text-[#3525cd]">
                  {timeRange === "7D" ? "7 Days Daily Breakdown" : "30 Days 4-Week Cohorts"}
                </span>
              </div>
              <span className="text-[11px] text-[#777587] block mt-0.5">
                {timeRange === "7D"
                  ? "Daily AI Autonomous Slotting vs Traditional Manual Dispatch (Database Timeline)"
                  : "Weekly aggregate throughput gain across 4 rolling calendar cohorts (Database Timeline)"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-medium shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#3525cd]"></span>
                <span className="font-semibold text-[#191c1e]">Railप्रवाह AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#c7c4d8]"></span>
                <span className="text-[#777587]">Manual</span>
              </div>
            </div>
          </div>

          {/* Dynamic CSS Bar Chart */}
          <div className="h-64 pt-6 flex items-end justify-between gap-3 sm:gap-4 border-b border-[#eceef0] pb-2">
            {activeChartData.length > 0 ? (
              activeChartData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-44">
                    {/* Manual Bar */}
                    <div
                      style={{ height: `${item.manual}%` }}
                      className="w-1/2 max-w-[28px] bg-[#c7c4d8] rounded-t transition-all group-hover:bg-[#a8a5b9] cursor-pointer"
                      title={`Manual: ${item.manual}% efficiency on ${item.label} (${item.fullDate})`}
                    ></div>
                    {/* AI Bar */}
                    <div
                      style={{ height: `${item.ai}%` }}
                      className="w-1/2 max-w-[28px] bg-[#3525cd] rounded-t transition-all group-hover:bg-[#4f46e5] relative cursor-pointer"
                      title={`Railप्रवाह AI: ${item.ai}% efficiency (+${item.savedHours}h saved) on ${item.label} (${item.fullDate})`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#191c1e] text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md transition-opacity whitespace-nowrap z-20 pointer-events-none">
                        {item.ai}% (+{item.savedHours}h)
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-mono font-bold text-[#191c1e] block">{item.label}</span>
                    <span className="text-[9px] font-mono text-[#777587] block whitespace-nowrap">{item.fullDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#777587] font-mono">
                <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#3525cd]" />
                Calculating dynamic efficiency trends from database...
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[#777587] pt-1">
            <span className="font-semibold text-[#191c1e]">{currentMetrics.chartAvgGain}</span>
            <span className="text-[#006e1c] font-bold bg-[#dcfce7] px-2 py-0.5 rounded">
              {currentMetrics.chartNetSaved}
            </span>
          </div>
        </div>

        {/* Right: AI vs Manual Progress Comparison */}
        <div className="lg:col-span-5 bg-white border border-[#c7c4d8] rounded-xl shadow-xs p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-[#191c1e] uppercase tracking-wider">
                Impact: With AI vs Manual
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#f2f4f6] text-[#3525cd]">
                {timeRange} Comparison
              </span>
            </div>
            <span className="text-[11px] text-[#777587]">
              {timeRange === "7D"
                ? "Direct operational benchmark on Central Line (Past 7 Days)"
                : "30-Day aggregate division benchmark across Mumbai Suburban Network"}
            </span>
          </div>

          <div className="space-y-4">
            {/* Metric 1 */}
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="font-semibold text-[#191c1e]">Conflict Resolution Latency</span>
                <span className="font-mono text-[#006e1c] font-bold">
                  {currentMetrics.benchmarks.conflictLatency.ai} (AI) vs {currentMetrics.benchmarks.conflictLatency.manual} (Manual)
                </span>
              </div>
              <div className="h-2.5 bg-[#f2f4f6] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#006e1c] rounded-full transition-all duration-500"
                  style={{ width: `${currentMetrics.benchmarks.conflictLatency.barPct}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-[#777587] mt-0.5 block">
                {currentMetrics.benchmarks.conflictLatency.pctReduction}
              </span>
            </div>

            {/* Metric 2 */}
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="font-semibold text-[#191c1e]">Joint Department Clustering Rate</span>
                <span className="font-mono text-[#3525cd] font-bold">
                  {currentMetrics.benchmarks.clusteringRate.rate} vs {currentMetrics.benchmarks.clusteringRate.manualRate}
                </span>
              </div>
              <div className="h-2.5 bg-[#f2f4f6] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#3525cd] rounded-full transition-all duration-500"
                  style={{ width: `${currentMetrics.benchmarks.clusteringRate.barPct}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-[#777587] mt-0.5 block">
                {currentMetrics.benchmarks.clusteringRate.detail}
              </span>
            </div>

            {/* Metric 3 */}
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="font-semibold text-[#191c1e]">Suburban Network Punctuality</span>
                <span className="font-mono text-[#006e1c] font-bold">
                  {currentMetrics.benchmarks.punctualityProtection.aiRate} vs {currentMetrics.benchmarks.punctualityProtection.manualRate}
                </span>
              </div>
              <div className="h-2.5 bg-[#f2f4f6] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#006e1c] rounded-full transition-all duration-500"
                  style={{ width: `${currentMetrics.benchmarks.punctualityProtection.barPct}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-[#777587] mt-0.5 block">
                {currentMetrics.benchmarks.punctualityProtection.detail}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#f8f9fc] rounded-lg border border-[#c7c4d8] text-[11px] text-[#464555] leading-relaxed">
            <strong className="text-[#191c1e]">Division Summary:</strong>{" "}
            {currentMetrics.benchmarks.divisionSummary}
          </div>
        </div>
      </div>

      {/* Critical Interventions Audit Table */}
      <div className="bg-white border border-[#c7c4d8] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#c7c4d8] bg-[#fafafa] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#191c1e] uppercase tracking-wider">
                Critical AI Interventions & Disruptions Audit Log
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#3525cd] text-white">
                {timeRange}: {filteredInterventions.length} live database events
              </span>
            </div>
            <span className="text-[11px] text-[#777587]">
              {timeRange === "7D"
                ? "Recent 7-day deconfliction log across Central Railway sections (Database Audit Trail)"
                : "Full 30-day chronological log of AI conflict resolutions and de-escalations (Database Audit Trail)"}
            </span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-[#777587]" />
            {[
              { label: "ALL", key: "ALL" },
              { label: "CONFLICT", key: "CONFLICT" },
              { label: "SIGNAL", key: "SIGNAL" },
              { label: "EMERGENCY", key: "EMERGENCY" },
              { label: "UPTIME / RESOLVED", key: "UPTIME" },
            ].map(({ label, key }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterType(key)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                  filterType === key
                    ? "bg-[#3525cd] text-white shadow-2xs"
                    : "bg-[#f2f4f6] text-[#464555] hover:text-[#191c1e] hover:bg-[#e2dfff]/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#f2f4f6] text-[#464555] uppercase text-[10px] font-bold tracking-wider border-b border-[#c7c4d8]">
                <th className="py-2.5 px-4">Event ID</th>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Sector / Node</th>
                <th className="py-2.5 px-4">Intervention Type</th>
                <th className="py-2.5 px-4">Defect / Incident Description</th>
                <th className="py-2.5 px-4 text-right">Time Recovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {filteredInterventions.length > 0 ? (
                filteredInterventions.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#3525cd]">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#3525cd]" />
                        <span>{log.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#464555]">
                      <div className="font-semibold text-[#191c1e]">{log.date || "Today"}</div>
                      <div className="text-[10px] text-[#777587]">{log.timeUTC} IST</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#191c1e]">
                      <div className="flex items-center gap-1.5">
                        <Train className="w-3.5 h-3.5 text-[#777587]" />
                        <span>{log.sectorNode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                          log.type.includes("Emergency")
                            ? "bg-[#fee2e2] text-[#991b1b]"
                            : log.type.includes("Conflict")
                            ? "bg-[#e2dfff] text-[#3525cd]"
                            : log.type.includes("Signal")
                            ? "bg-[#dcfce7] text-[#166534]"
                            : "bg-[#ffdcc3] text-[#904d00]"
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#464555] max-w-xs truncate" title={log.description}>
                      <span className="text-[11px] font-mono text-[#191c1e]">{log.description || "Routine track maintenance & deconfliction"}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#006e1c] whitespace-nowrap">
                      {log.timeRecovered}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#777587] font-mono">
                    {loading ? "Fetching live intervention audit logs from database..." : "No events matched the selected filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary with live telemetry */}
        <div className="p-3 bg-[#f8fafc] border-t border-[#eceef0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[#777587]">
          <span>
            Displaying <strong className="text-[#191c1e]">{filteredInterventions.length}</strong> of{" "}
            <strong className="text-[#191c1e]">{rawInterventions.length}</strong> database events logged in {timeRange === "7D" ? "last 7 days" : "past 30 days"}
          </span>
          {telemetryData?.telemetry && (
            <div className="flex items-center gap-3 text-[11px] text-[#555364]">
              <span>DB Records: <strong className="text-[#191c1e]">{telemetryData.telemetry.totalComplaints}</strong> issues</span>
              <span>•</span>
              <span><strong className="text-[#191c1e]">{telemetryData.telemetry.totalTrainRuns}</strong> scheduled trains</span>
              <span>•</span>
              <span className="text-[#3525cd] font-bold">Central Railway Live Telemetry</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
