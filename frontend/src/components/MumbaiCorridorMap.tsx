import React from "react";
import { MUMBAI_CENTRAL_LINE_CORRIDORS } from "../mockData";
import { MumbaiCorridor, CorridorStatus } from "../types";
import { AlertTriangle, CheckCircle2, Sparkles, Activity, ShieldCheck, MapPin } from "lucide-react";

interface MumbaiCorridorMapProps {
  selectedCorridor: string;
  onSelectCorridor: (corridorCode: string) => void;
  corridors?: MumbaiCorridor[];
}

export const MumbaiCorridorMap: React.FC<MumbaiCorridorMapProps> = ({
  selectedCorridor,
  onSelectCorridor,
  corridors,
}) => {
  const activeCorridors = corridors && corridors.length > 0 ? corridors : MUMBAI_CENTRAL_LINE_CORRIDORS;
  const getStatusColor = (status: CorridorStatus) => {
    switch (status) {
      case "Conflict":
        return {
          bg: "bg-[#ffdad6]",
          text: "text-[#ba1a1a]",
          border: "border-[#ba1a1a]",
          dot: "bg-[#ba1a1a]",
          line: "bg-[#ba1a1a]",
        };
      case "AI Optimized":
        return {
          bg: "bg-[#e2dfff]",
          text: "text-[#3525cd]",
          border: "border-[#3525cd]",
          dot: "bg-[#3525cd]",
          line: "bg-[#3525cd]",
        };
      case "Maintenance":
        return {
          bg: "bg-[#fef3c7]",
          text: "text-[#92400e]",
          border: "border-[#d97706]",
          dot: "bg-[#d97706]",
          line: "bg-[#d97706]",
        };
      case "Block Active":
        return {
          bg: "bg-[#dcfce7]",
          text: "text-[#166534]",
          border: "border-[#16a34a]",
          dot: "bg-[#16a34a]",
          line: "bg-[#16a34a]",
        };
      default:
        return {
          bg: "bg-[#f2f4f6]",
          text: "text-[#464555]",
          border: "border-[#c7c4d8]",
          dot: "bg-[#137333]",
          line: "bg-[#777587]",
        };
    }
  };

  const stations = [
    { code: "CSTM", name: "CSMT Terminus", km: "0.0" },
    { code: "BY", name: "Byculla", km: "4.8" },
    { code: "DR", name: "Dadar Junction", km: "9.0" },
    { code: "GC", name: "Ghatkopar", km: "19.6" },
    { code: "VK", name: "Vikhroli", km: "23.1" },
    { code: "TNA", name: "Thane Junction", km: "34.0" },
    { code: "KYN", name: "Kalyan Junction", km: "54.1" },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#c7c4d8]/60 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eceef0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#e2dfff] text-[#3525cd] text-[10px] font-bold font-mono uppercase rounded">
              Mumbai Division • Central Line
            </span>
            <span className="text-xs text-[#777587] font-medium">Interactive Track Schema</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#191c1e] mt-0.5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#3525cd]" />
            <span>Corridor Status & Topology (CSTM &rarr; BY &rarr; DR &rarr; GC &rarr; VK &rarr; TNA &rarr; KYN)</span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
          <button
            onClick={() => onSelectCorridor("ALL")}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${selectedCorridor === "ALL"
                ? "bg-[#3525cd] text-white shadow-xs"
                : "bg-[#f2f4f6] text-[#464555] hover:bg-[#e6e8ea]"
              }`}
          >
            Show All Corridors
          </button>
          <span className="text-[#c7c4d8]">|</span>
          <span className="inline-flex items-center gap-1 text-[#ba1a1a]">
            <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span> Conflict
          </span>
          <span className="inline-flex items-center gap-1 text-[#3525cd]">
            <span className="w-2 h-2 rounded-full bg-[#3525cd]"></span> AI Optimized
          </span>
          <span className="inline-flex items-center gap-1 text-[#137333]">
            <span className="w-2 h-2 rounded-full bg-[#137333]"></span> Normal
          </span>
        </div>
      </div>

      {/* Schematic Track Diagram with Clickable Nodes and Segments */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[700px] py-3 px-4 bg-[#f8f9fa] rounded-lg border border-[#eceef0]">
          <div className="relative flex items-center justify-between">
            {/* Connecting Track Line */}
            <div className="absolute top-1/2 left-6 right-6 h-1.5 bg-[#c7c4d8]/70 -translate-y-1/2 z-0 rounded-full" />

            {/* Station Nodes and Corridor Links */}
            {stations.map((stn, idx) => {
              const nextStn = stations[idx + 1];
              const corridorCode = nextStn ? `${stn.code} – ${nextStn.code}` : null;
              const corridorData = corridorCode
                ? activeCorridors.find((c) => c.code === corridorCode)
                : null;
              const corridorStyle = corridorData ? getStatusColor(corridorData.status) : null;
              const isCorridorSelected = selectedCorridor === corridorCode;

              return (
                <React.Fragment key={stn.code}>
                  {/* Station Station Node */}
                  <div className="relative z-10 flex flex-col items-center group">
                    <button
                      onClick={() => onSelectCorridor(corridorCode || "ALL")}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-black transition-all transform group-hover:scale-110 shadow-xs cursor-pointer ${selectedCorridor.includes(stn.code)
                          ? "bg-[#3525cd] text-white ring-4 ring-[#e2dfff]"
                          : "bg-white text-[#191c1e] border-2 border-[#3525cd]"
                        }`}
                    >
                      {stn.code}
                    </button>
                    <span className="mt-1.5 text-[11px] font-bold text-[#191c1e] whitespace-nowrap">
                      {stn.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#777587]">{stn.km} km</span>
                  </div>

                  {/* Inter-Station Corridor Segment */}
                  {corridorCode && corridorData && corridorStyle && (
                    <div className="relative z-10 flex-1 mx-2">
                      <button
                        onClick={() => onSelectCorridor(corridorCode)}
                        className={`w-full py-1 px-2 rounded-md border text-center transition-all cursor-pointer ${isCorridorSelected
                            ? "bg-[#3525cd] text-white border-[#3525cd] ring-2 ring-[#e2dfff] shadow-sm"
                            : `${corridorStyle.bg} ${corridorStyle.text} ${corridorStyle.border} hover:brightness-95`
                          }`}
                        title={`Click to filter planner for ${corridorCode}`}
                      >
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold font-mono">
                          {corridorData.status === "Conflict" && <AlertTriangle className="w-3 h-3 text-[#ba1a1a]" />}
                          {corridorData.status === "AI Optimized" && <Sparkles className="w-3 h-3 text-[#3525cd]" />}
                          {corridorData.status === "Normal" && <CheckCircle2 className="w-3 h-3 text-[#137333]" />}
                          <span>{corridorCode}</span>
                        </div>
                        <div className="text-[9px] uppercase tracking-wider font-semibold opacity-90">
                          {corridorData.status} • {corridorData.activeBlocksCount} Blocks
                        </div>
                      </button>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {selectedCorridor !== "ALL" && (
        <div className="flex items-center justify-between bg-[#e2dfff]/40 p-2.5 rounded-lg border border-[#3525cd]/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#3525cd]">Filtered to Corridor:</span>
            <span className="font-mono font-black text-[#191c1e] px-2 py-0.5 bg-white rounded border border-[#3525cd]/30">
              {selectedCorridor}
            </span>
          </div>
          <button
            onClick={() => onSelectCorridor("ALL")}
            className="text-[#3525cd] font-bold hover:underline text-[11px] cursor-pointer uppercase tracking-wider"
          >
            Clear Filter (Show All Corridors)
          </button>
        </div>
      )}
    </div>
  );
};
