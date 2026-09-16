import React, { useState } from "react";
import appLogo from "../assets/logo.png";
import { PravahSlotNotification, ScreenType, UserProfile, UserRole } from "../types";
import { OperationalNotificationsModal } from "./OperationalNotificationsModal";
import {
  Wrench,
  Brain,
  Cpu,
  ShieldAlert,
  BarChart3,
  CalendarCheck,
  Plus,
  HelpCircle,
  History,
  Search,
  Bell,
  Settings,
  LogIn,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
  Building2,
  Lock,
  FileText,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavigationProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onOpenNewBlockModal?: () => void;
  onOpenSupportModal: (type: "support" | "logs") => void;
  user: UserProfile;
  onToggleAuth: () => void;
  onToggleUserRole?: () => void;
  pendingCount?: number;
  criticalConflictCount?: number;
  operationalNotifications?: PravahSlotNotification[];
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onNavigate,
  onOpenNewBlockModal,
  onOpenSupportModal,
  user,
  onToggleAuth,
  criticalConflictCount = 4,
  operationalNotifications = [],
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  const isCoaAdmin = user.userRole === "coa_admin" || user.role.toLowerCase().includes("coa");
  const isDeptHead = user.userRole === "department_user";
  const isZonalHead = user.userRole === "zonal_head";
  const isSupervisor = user.userRole === "supervisor";
  const isWorker = user.userRole === "worker";

  // Build strictly role-segregated navigation items according to the RailPravah RBAC Matrix
  interface NavItem {
    id: ScreenType;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
    subtitle?: string;
  }

  interface NavSection {
    sectionTitle: string;
    items: NavItem[];
  }

  const getAuthorizedSections = (): NavSection[] => {
    switch (user.userRole) {
      case "worker":
        return [
          {
            sectionTitle: "Worker Operations",
            items: [
              {
                id: "worker-dashboard",
                label: "Worker Dashboard",
                icon: <Wrench className="w-4 h-4" />,
                badge: "WORKER",
                badgeColor: "bg-[#ffdcc3] text-[#904d00]",
                subtitle: "Report Issue • My Issues • Schedule",
              },
            ],
          },
        ];

      case "supervisor":
        return [
          {
            sectionTitle: "Supervisor Desk",
            items: [
              {
                id: "supervisor-dashboard",
                label: "Supervisor Dashboard",
                icon: <UserCheck className="w-4 h-4" />,
                badge: "SUPERVISOR",
                badgeColor: "bg-[#dbeafe] text-[#1e40af]",
                subtitle: "Assigned Stations • Worker Issues",
              },
            ],
          },
        ];

      case "zonal_head":
        return [
          {
            sectionTitle: "Zonal Authority",
            items: [
              {
                id: "zonal-dashboard",
                label: "Zonal Head Dashboard",
                icon: <ShieldCheck className="w-4 h-4" />,
                badge: "ZONAL",
                badgeColor: "bg-[#f3e8ff] text-[#7c3aed]",
                subtitle: "Zonal Issues • Possessions",
              },
            ],
          },
          {
            sectionTitle: "Corridor Tools & Planning",
            items: [
              {
                id: "service-request",
                label: "Service Requests",
                icon: <Wrench className="w-4 h-4" />,
              },
              {
                id: "whyslot",
                label: "WhySlot (AI Engine)",
                icon: <Brain className="w-4 h-4" />,
                badge: "AI",
                badgeColor: "bg-[#e2dfff] text-[#3525cd]",
              },
              {
                id: "whatif",
                label: "What-if Simulator",
                icon: <Cpu className="w-4 h-4" />,
                badge: "SIM",
                badgeColor: "bg-[#ffdcc3] text-[#904d00]",
              },
              {
                id: "conflictguard",
                label: "ConflictGuard",
                icon: <ShieldAlert className="w-4 h-4" />,
                badge: criticalConflictCount > 0 ? criticalConflictCount : undefined,
                badgeColor: "bg-[#ffdad6] text-[#ba1a1a]",
              },
              {
                id: "trackstats",
                label: "TrackStats",
                icon: <BarChart3 className="w-4 h-4" />,
              },
            ],
          },
        ];

      case "department_user":
      case "department_head":
        return [
          {
            sectionTitle: "Department Head",
            items: [
              {
                id: "department-dashboard",
                label: "Department Head Dashboard",
                icon: <Building2 className="w-4 h-4" />,
                badge: "DEPT HEAD",
                badgeColor: "bg-[#ffe4e6] text-[#be123c]",
                subtitle: "Department Issues • Clearances",
              },
            ],
          },
          {
            sectionTitle: "Corridor Tools & Planning",
            items: [
              {
                id: "service-request",
                label: "Service Requests",
                icon: <Wrench className="w-4 h-4" />,
              },
              {
                id: "whyslot",
                label: "WhySlot (AI Engine)",
                icon: <Brain className="w-4 h-4" />,
                badge: "AI",
                badgeColor: "bg-[#e2dfff] text-[#3525cd]",
              },
              {
                id: "whatif",
                label: "What-if Simulator",
                icon: <Cpu className="w-4 h-4" />,
                badge: "SIM",
                badgeColor: "bg-[#ffdcc3] text-[#904d00]",
              },
              {
                id: "conflictguard",
                label: "ConflictGuard",
                icon: <ShieldAlert className="w-4 h-4" />,
                badge: criticalConflictCount > 0 ? criticalConflictCount : undefined,
                badgeColor: "bg-[#ffdad6] text-[#ba1a1a]",
              },
              {
                id: "trackstats",
                label: "TrackStats",
                icon: <BarChart3 className="w-4 h-4" />,
              },
            ],
          },
        ];

      case "coa_admin":
        return [
          {
            sectionTitle: "COA Control Office",
            items: [
              {
                id: "coa-management",
                label: "COA Management",
                icon: <CalendarCheck className="w-4 h-4" />,
                badge: "COA APEX",
                badgeColor: "bg-[#3525cd] text-white",
                subtitle: "Master Dispatch • Approval",
              },
            ],
          },
          {
            sectionTitle: "Corridor Tools & Planning",
            items: [
              {
                id: "whyslot",
                label: "WhySlot (AI Engine)",
                icon: <Brain className="w-4 h-4" />,
                badge: "AI",
                badgeColor: "bg-[#e2dfff] text-[#3525cd]",
              },
              {
                id: "whatif",
                label: "What-if Simulator",
                icon: <Cpu className="w-4 h-4" />,
                badge: "SIM",
                badgeColor: "bg-[#ffdcc3] text-[#904d00]",
              },
              {
                id: "conflictguard",
                label: "ConflictGuard",
                icon: <ShieldAlert className="w-4 h-4" />,
                badge: criticalConflictCount > 0 ? criticalConflictCount : undefined,
                badgeColor: "bg-[#ffdad6] text-[#ba1a1a]",
              },
              {
                id: "trackstats",
                label: "TrackStats",
                icon: <BarChart3 className="w-4 h-4" />,
              },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const navSections = getAuthorizedSections();

  const handleItemClick = (screen: ScreenType) => {
    onNavigate(screen);
    setIsMobileMenuOpen(false);
  };

  // Hide the navigation header and sidebar entirely on the login/registration screen
  if (currentScreen === "login") {
    return null;
  }

  const getRoleHeaderBadge = () => {
    switch (user.userRole) {
      case "worker":
        return { label: "Worker", color: "bg-[#ffdcc3] text-[#904d00] border-[#904d00]/30" };
      case "supervisor":
        return { label: "Supervisor", color: "bg-[#dbeafe] text-[#1e40af] border-[#1e40af]/30" };
      case "zonal_head":
        return { label: "Zonal Head", color: "bg-[#f3e8ff] text-[#7c3aed] border-[#7c3aed]/30" };
      case "department_user":
        return { label: "Dept Head", color: "bg-[#ffe4e6] text-[#be123c] border-[#be123c]/30" };
      case "coa_admin":
        return { label: "COA Admin", color: "bg-[#3525cd] text-white border-[#3525cd]" };
      default:
        return { label: user.role, color: "bg-[#f2f4f6] text-[#191c1e] border-[#c7c4d8]" };
    }
  };

  const roleBadge = getRoleHeaderBadge();

  return (
    <>
      {/* Top Global Bar */}
      <header
        id="global-top-navbar"
        className={`fixed top-0 right-0 h-14 bg-white border-b border-[#c7c4d8]/40 z-30 flex items-center justify-between px-3 sm:px-6 shadow-xs transition-all duration-300 left-0 ${
          isSidebarCollapsed ? "lg:left-16" : "lg:left-64"
        }`}
      >
        {/* Left Side: Mobile Menu Toggle & Search Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl mr-2 sm:mr-4">
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 text-[#464555] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-md transition-colors shrink-0 cursor-pointer"
            title="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Quick Search Bar */}
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777587]" />
            <input
              id="top-search-input"
              type="text"
              placeholder="Search station, ticket, block..."
              className="w-full bg-[#f2f4f6] border border-[#c7c4d8]/50 rounded-md py-1.5 pl-9 pr-3 text-[13px] text-[#191c1e] placeholder:text-[#777587]/70 focus:outline-none focus:border-[#3525cd] focus:bg-white focus:ring-1 focus:ring-[#3525cd] transition-all font-mono"
            />
          </div>
        </div>

        {/* Right Side: Action Controls & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Role Indicator Badge */}
          <div
            id="active-role-indicator"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded border ${roleBadge.color}`}
          >
            <Lock className="w-3 h-3 shrink-0" />
            <span>{roleBadge.label}</span>
          </div>

          {/* Operational Notifications & Conflict Alert Bell */}
          <button
            id="notification-bell-btn"
            onClick={() => setIsNotificationsModalOpen(true)}
            title="Operational Slot Notifications & Alerts"
            className="relative p-2 text-[#464555] hover:bg-[#eceef0] rounded-md transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {operationalNotifications && operationalNotifications.length > 0 ? (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 h-4 text-[9px] font-bold font-mono rounded-full bg-[#3525cd] text-white flex items-center justify-center ring-2 ring-white shadow-xs">
                {operationalNotifications.length}
              </span>
            ) : criticalConflictCount > 0 ? (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white"></span>
            ) : null}
          </button>

          {/* Support & System Logs */}
          <button
            id="top-settings-btn"
            onClick={() => onOpenSupportModal("logs")}
            title="System Logs & Audit Information"
            className="p-2 text-[#464555] hover:bg-[#eceef0] rounded-md transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[#c7c4d8]/40">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#c7c4d8] object-cover"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-[12px] font-semibold text-[#191c1e] leading-tight flex items-center gap-1">
                <span>{user.name}</span>
                {user.authProvider === "google" && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Google
                  </span>
                )}
              </span>
              <span className="text-[10px] text-[#777587] font-mono">
                {user.email ? user.email : `${user.empId} • ${user.department.split(" ")[0]}`}
              </span>
            </div>
            <button
              id="auth-toggle-btn"
              onClick={onToggleAuth}
              title="Log Out"
              className="p-1.5 text-[#777587] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Control Room Side Navigation Bar */}
      <aside
        id="control-room-sidebar"
        className={`fixed left-0 top-0 bottom-0 bg-[#f2f4f6] border-r border-[#c7c4d8] flex flex-col z-50 lg:z-40 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-64 lg:w-16" : "w-64"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
          {/* Header Branding */}
          <div
            id="sidebar-brand-header"
            className={`h-14 border-b border-[#c7c4d8] flex items-center bg-white select-none ${
              isSidebarCollapsed ? "px-2 justify-center" : "px-3.5 justify-between"
            }`}
          >
            {isSidebarCollapsed ? (
              <div className="flex items-center justify-center gap-1.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    const defaultScreen: ScreenType = isWorker
                      ? "worker-dashboard"
                      : isSupervisor
                      ? "supervisor-dashboard"
                      : isZonalHead
                      ? "zonal-dashboard"
                      : isDeptHead
                      ? "department-dashboard"
                      : "coa-management";
                    handleItemClick(defaultScreen);
                  }}
                  className="p-1 rounded-md hover:bg-[#f2f4f6] transition-colors cursor-pointer shrink-0"
                  title="Railप्रवाह Central Railway Portal"
                >
                  <img
                    src={appLogo}
                    alt="Railप्रवाह Logo"
                    className="w-8 h-8 object-contain shrink-0"
                    referrerPolicy="no-referrer"
                  />
                </button>
                {onToggleSidebarCollapse && (
                  <button
                    id="sidebar-header-expand-btn"
                    type="button"
                    onClick={onToggleSidebarCollapse}
                    className="hidden lg:flex p-1 text-[#777587] hover:text-[#3525cd] hover:bg-[#f2f4f6] rounded-md transition-colors cursor-pointer shrink-0"
                    title="Expand dashboard"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultScreen: ScreenType = isWorker
                        ? "worker-dashboard"
                        : isSupervisor
                        ? "supervisor-dashboard"
                        : isZonalHead
                        ? "zonal-dashboard"
                        : isDeptHead
                        ? "department-dashboard"
                        : "coa-management";
                      handleItemClick(defaultScreen);
                    }}
                    className="cursor-pointer shrink-0 group"
                    title="Railप्रवाह Central Railway Portal"
                  >
                    <img
                      src={appLogo}
                      alt="Railप्रवाह Logo"
                      className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                  {/* Arrow directly beside logo to minimize/expand dashboard */}
                  {onToggleSidebarCollapse && (
                    <button
                      id="sidebar-header-minimize-btn"
                      type="button"
                      onClick={onToggleSidebarCollapse}
                      className="hidden lg:flex p-1 text-[#777587] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-md transition-colors cursor-pointer shrink-0"
                      title="Minimize dashboard"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div
                    onClick={() => {
                      const defaultScreen: ScreenType = isWorker
                        ? "worker-dashboard"
                        : isSupervisor
                        ? "supervisor-dashboard"
                        : isZonalHead
                        ? "zonal-dashboard"
                        : isDeptHead
                        ? "department-dashboard"
                        : "coa-management";
                      handleItemClick(defaultScreen);
                    }}
                    className="flex flex-col min-w-0 cursor-pointer ml-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-bold text-[14px] text-[#3525cd] tracking-tight leading-tight truncate">
                        Railप्रवाह
                      </h2>
                    </div>
                    <span className="text-[9.5px] font-bold tracking-wider uppercase text-[#777587] truncate">
                      Central Railway
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Close button on mobile */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(false);
              }}
              className="lg:hidden p-1 text-[#777587] hover:text-[#191c1e] rounded-md hover:bg-[#f2f4f6] cursor-pointer"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Role Card in Sidebar */}
          {isSidebarCollapsed ? (
            <div
              className="p-2 bg-white/70 border-b border-[#c7c4d8]/60 flex items-center justify-center"
              title={`${user.name} (${user.role}) • Emp ID: ${user.empId}`}
            >
              <div className="relative">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-[#c7c4d8] object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
              </div>
            </div>
          ) : (
            <div className="px-3.5 py-2.5 bg-white/70 border-b border-[#c7c4d8]/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-[#777587]">
                  Active Access Level
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  VERIFIED
                </span>
              </div>
              <div className="font-bold text-xs text-[#191c1e] mt-0.5 truncate">{user.name}</div>
              <div className="text-[11px] text-[#464555] font-medium truncate">{user.role}</div>
              <div className="text-[10px] text-[#777587] font-mono mt-0.5">
                Emp ID: {user.empId} • {user.department}
              </div>
            </div>
          )}

          {/* Role-Segregated Screen Links List */}
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
            {navSections.map((section, idx) => (
              <div key={section.sectionTitle || idx}>
                {!isSidebarCollapsed && (
                  <div className="px-2 pb-1 text-[10px] font-mono font-bold tracking-wider text-[#777587] uppercase">
                    {section.sectionTitle}
                  </div>
                )}
                {isSidebarCollapsed && idx > 0 && (
                  <div className="my-1.5 border-t border-[#c7c4d8]/50" />
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = currentScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`sidebar-nav-${item.id}`}
                        onClick={() => handleItemClick(item.id)}
                        title={item.label}
                        className={`w-full flex items-center rounded-md text-[12.5px] font-medium transition-all text-left cursor-pointer ${
                          isSidebarCollapsed
                            ? "justify-center p-2.5"
                            : "justify-between px-3 py-2"
                        } ${
                          isActive
                            ? "bg-[#3525cd] text-white font-semibold shadow-xs"
                            : "text-[#464555] hover:bg-[#e6e8ea] hover:text-[#191c1e]"
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            isSidebarCollapsed ? "justify-center relative" : "gap-2.5 truncate"
                          }`}
                        >
                          <span className={isActive ? "text-white" : "text-[#777587]"}>{item.icon}</span>
                          {!isSidebarCollapsed && (
                            <div className="truncate">
                              <span className="truncate block">{item.label}</span>
                              {item.subtitle && !isActive && (
                                <span className="text-[10px] text-[#777587] block truncate">
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                          )}
                          {isSidebarCollapsed && item.badge && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#ba1a1a] ring-1 ring-white" />
                          )}
                        </div>
                        {!isSidebarCollapsed && item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                              isActive ? "bg-white/20 text-white" : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Side Actions & CTA */}
          <div
            className={`border-t border-[#c7c4d8] bg-white ${
              isSidebarCollapsed ? "p-2 space-y-2" : "p-3.5 space-y-2.5"
            }`}
          >
            <div
              className={`flex ${
                isSidebarCollapsed ? "flex-col items-center gap-1.5" : "flex-col gap-1"
              }`}
            >
              <button
                id="sidebar-support-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSupportModal("support");
                }}
                className={`flex items-center rounded-md text-[12px] font-medium text-[#464555] hover:bg-[#f2f4f6] hover:text-[#191c1e] transition-colors text-left cursor-pointer ${
                  isSidebarCollapsed ? "p-2 justify-center" : "gap-3 px-3 py-1.5"
                }`}
                title="Support & Helpdesk"
              >
                <HelpCircle className="w-4 h-4 text-[#777587]" />
                {!isSidebarCollapsed && (
                  <span className="uppercase tracking-wider font-semibold">Support & Helpdesk</span>
                )}
              </button>
              <button
                id="sidebar-logs-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSupportModal("logs");
                }}
                className={`flex items-center rounded-md text-[12px] font-medium text-[#464555] hover:bg-[#f2f4f6] hover:text-[#191c1e] transition-colors text-left cursor-pointer ${
                  isSidebarCollapsed ? "p-2 justify-center" : "gap-3 px-3 py-1.5"
                }`}
                title="Audit Logs"
              >
                <History className="w-4 h-4 text-[#777587]" />
                {!isSidebarCollapsed && (
                  <span className="uppercase tracking-wider font-semibold">Audit Logs</span>
                )}
              </button>
            </div>
          </div>
        </aside>

      {/* Operational Slot Notifications Modal */}
      <OperationalNotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        userRole={user.userRole}
        userDepartment={user.department}
        userEmpId={user.empId}
        notifications={operationalNotifications}
        onNavigateToCalendar={() => {
          setIsNotificationsModalOpen(false);
          if (user.userRole === "worker") {
            onNavigate("worker-dashboard");
          } else if (user.userRole === "supervisor") {
            onNavigate("supervisor-dashboard");
          } else if (user.userRole === "zonal_head") {
            onNavigate("zonal-dashboard");
          } else if (user.userRole === "department_user") {
            onNavigate("department-dashboard");
          } else {
            onNavigate("coa-management");
          }
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("railpravah:open-calendar-tab"));
          }, 60);
        }}
      />
    </>
  );
};
