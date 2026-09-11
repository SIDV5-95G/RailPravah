import React from "react";
import { ScreenType, UserProfile, UserRole } from "../types";
import {
  Wrench,
  ShieldCheck,
  UserCheck,
  Building2,
  CalendarCheck,
  Lock,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

interface HierarchyTabBarProps {
  currentScreen: ScreenType;
  onNavigate?: (screen: ScreenType) => void;
  currentUser: UserProfile;
  onSwitchUserRole?: (role: UserRole) => void;
}

export const HierarchyTabBar: React.FC<HierarchyTabBarProps> = ({
  currentScreen,
  onNavigate,
  currentUser,
}) => {
  const getRoleDeskDetails = (role: UserRole) => {
    switch (role) {
      case "worker":
        return {
          deskName: "Worker Desk",
          roleTitle: "Worker",
          authorizedScope: "Report Field Issues • My Issues & Status • Group Schedule • Emergency SOS",
          restrictedScope: "Supervisor, Zonal, Department, & COA Management Desks Restricted",
          badgeColor: "bg-[#904d00] text-white",
          accentColor: "border-[#ffdcc3] bg-[#fffaf5]",
          textColor: "text-[#904d00]",
          icon: <Wrench className="w-4 h-4 text-[#904d00]" />,
        };
      case "supervisor":
        return {
          deskName: "SUPERVISOR",
          roleTitle: "SUPERVISOR",
          authorizedScope: "Assigned Section DR-GC • Worker Issue Review & Technical Edits • Escalate to Zonal Head",
          restrictedScope: "Worker Defect Submission Form, Zonal, Department, & COA Management Restricted",
          badgeColor: "bg-[#1e40af] text-white",
          accentColor: "border-[#dbeafe] bg-[#f0f7ff]",
          textColor: "text-[#1e40af]",
          icon: <UserCheck className="w-4 h-4 text-[#1e40af]" />,
        };
      case "zonal_head":
        return {
          deskName: "Zonal Technical Authority Desk",
          roleTitle: "Chief Track Engineer (CTE / HQ CSMT)",
          authorizedScope: "Zonal Possessions • Supervisor Escalations • Service Requests • WhySlot AI • What-if Simulator • ConflictGuard",
          restrictedScope: "Worker Desks, Supervisor Desks, Department Desks, & COA Management Restricted",
          badgeColor: "bg-[#7c3aed] text-white",
          accentColor: "border-[#f3e8ff] bg-[#faf5ff]",
          textColor: "text-[#7c3aed]",
          icon: <ShieldCheck className="w-4 h-4 text-[#7c3aed]" />,
        };
      case "department_user":
        return {
          deskName: "Department Sanction Desk",
          roleTitle: "Sr. Divisional Engineer (Sr. DEN / Central Line)",
          authorizedScope: "Division Clearances (P-Way, TRD, S&T) • Escalations • Service Requests • WhySlot AI • What-if Simulator • ConflictGuard",
          restrictedScope: "Worker Desks, Supervisor Desks, Zonal Desks, & COA Management Restricted",
          badgeColor: "bg-[#be123c] text-white",
          accentColor: "border-[#ffe4e6] bg-[#fff5f6]",
          textColor: "text-[#be123c]",
          icon: <Building2 className="w-4 h-4 text-[#be123c]" />,
        };
      case "coa_admin":
        return {
          deskName: "Control Office Application (COA)",
          roleTitle: "Chief COA Traffic & Power Block Controller",
          authorizedScope: "Master Slot Dispatch • AI Shadow Clustering • Corridor Clearance • Conflict Resolution",
          restrictedScope: "Dedicated Control Console • Worker/Supervisor Field Operations Handled Separately",
          badgeColor: "bg-[#3525cd] text-white",
          accentColor: "border-[#e2dfff] bg-[#f7f6ff]",
          textColor: "text-[#3525cd]",
          icon: <CalendarCheck className="w-4 h-4 text-[#3525cd]" />,
        };
      default:
        return {
          deskName: "Railway Personnel Terminal",
          roleTitle: currentUser.role,
          authorizedScope: "Standard Authorized Scope",
          restrictedScope: "Cross-Role Desks Restricted",
          badgeColor: "bg-[#191c1e] text-white",
          accentColor: "border-[#eceef0] bg-white",
          textColor: "text-[#191c1e]",
          icon: <Lock className="w-4 h-4 text-[#191c1e]" />,
        };
    }
  };

  const details = getRoleDeskDetails(currentUser.userRole);

  return (
    <div
      id="hierarchy-access-banner"
      className={`border rounded-xl p-3.5 sm:p-4 shadow-xs mb-4 ${details.accentColor}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-white shadow-2xs border border-black/5 shrink-0">
            {details.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded shrink-0 ${details.badgeColor}`}
              >
                {details.deskName}
              </span>
              <span className="text-xs font-bold text-[#191c1e] truncate max-w-[200px] sm:max-w-[320px]" title={currentUser.name}>
                {currentUser.name}{" "}
                <span className="text-[#777587] font-mono font-normal whitespace-nowrap">
                  ({currentUser.empId})
                </span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                <span>Authorized Role Active</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-black/10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/80 border border-black/10 rounded-lg text-[11px] font-mono text-[#464555]">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-[10px] uppercase">Strict RBAC Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
