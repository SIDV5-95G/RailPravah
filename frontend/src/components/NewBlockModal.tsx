import React, { useState } from "react";
import appLogo from "../assets/logo.png";
import { DepartmentType, PriorityType, TimelineBlock } from "../types";
import { Plus, X, Wrench, Clock, MapPin, Sparkles } from "lucide-react";

interface NewBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (block: TimelineBlock) => void;
}

export const NewBlockModal: React.FC<NewBlockModalProps> = ({ isOpen, onClose, onAddBlock }) => {
  const [code, setCode] = useState("BLK-" + Math.floor(100 + Math.random() * 900));
  const [title, setTitle] = useState("");
  const [stationSection, setStationSection] = useState("DR - GC");
  const [startHour, setStartHour] = useState(2.0);
  const [durationHours, setDurationHours] = useState(3.0);
  const [department, setDepartment] = useState<DepartmentType>("Engineering");
  const [type, setType] = useState<"ai-planned" | "clustered-task" | "scheduled-train">("ai-planned");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddBlock({
      id: "tb-custom-" + Date.now(),
      code,
      title: title || `${code} (${department})`,
      stationSection,
      startHour: Number(startHour),
      durationHours: Number(durationHours),
      type,
      department,
      notes: notes || "Directly injected by Division Dispatch Controller",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-[#c7c4d8] rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#eceef0] pb-3">
          <div className="flex items-center gap-2.5">
            <img
              src={appLogo}
              alt="Railप्रवाह"
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-[16px] font-bold text-[#191c1e]">New Maintenance Block Entry</h2>
              <p className="text-[11px] text-[#777587]">Schedule corridor window on Central Line matrix</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#777587] hover:text-[#191c1e] text-[18px] font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-[13px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1">
                Block Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded py-1.5 px-2.5 font-mono text-[#191c1e] focus:bg-white focus:outline-none focus:border-[#3525cd]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as DepartmentType)}
                className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded py-1.5 px-2.5 text-[#191c1e] focus:bg-white focus:outline-none focus:border-[#3525cd]"
              >
                <option value="Engineering">Engineering (Track)</option>
                <option value="Traction">Traction (OHE)</option>
                <option value="S&T">S&T (Signals)</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1">
              Task Title / Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Crossover renewal & rail grinding"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded py-1.5 px-2.5 text-[#191c1e] focus:bg-white focus:outline-none focus:border-[#3525cd]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1">
              Track Sector (Central Line)
            </label>
            <select
              value={stationSection}
              onChange={(e) => setStationSection(e.target.value)}
              className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded py-1.5 px-2.5 font-mono text-[#191c1e] focus:bg-white focus:outline-none focus:border-[#3525cd]"
            >
              <option value="CSTM - BY">CSTM - BY (CSMT to Byculla)</option>
              <option value="BY - DR">BY - DR (Byculla to Dadar)</option>
              <option value="DR - GC">DR - GC (Dadar to Ghatkopar)</option>
              <option value="GC - VK">GC - VK (Ghatkopar to Vikhroli)</option>
              <option value="VK - TNA">VK - TNA (Vikhroli to Thane)</option>
              <option value="TNA - KYN">TNA - KYN (Thane to Kalyan)</option>
              <option value="KYN - KJT">KYN - KJT (Kalyan to Karjat)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1">
                Start Hour (0 - 24)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                step="0.5"
                value={startHour}
                onChange={(e) => setStartHour(parseFloat(e.target.value))}
                className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded py-1.5 px-2.5 font-mono text-[#191c1e] focus:bg-white focus:outline-none focus:border-[#3525cd]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1">
                Duration (Hours)
              </label>
              <input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded py-1.5 px-2.5 font-mono text-[#191c1e] focus:bg-white focus:outline-none focus:border-[#3525cd]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1">
              Slot Type
            </label>
            <div className="flex gap-2">
              {[
                { id: "ai-planned", label: "AI Planned Block" },
                { id: "clustered-task", label: "Joint Multi-Dept Cluster" },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setType(t.id as any)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded border ${
                    type === t.id
                      ? "bg-[#3525cd] text-white border-[#3525cd]"
                      : "bg-[#f2f4f6] text-[#464555] border-[#c7c4d8]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#eceef0]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#f2f4f6] text-[#464555] text-[12px] font-bold uppercase rounded hover:bg-[#e0e3e5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#3525cd] text-white text-[12px] font-bold uppercase rounded hover:bg-[#4f46e5] flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Insert into Timeline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
