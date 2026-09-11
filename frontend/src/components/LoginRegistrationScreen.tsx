import React, { useState } from "react";
import appLogo from "../assets/logo.png";
import { UserProfile, DepartmentType, UserRole } from "../types";
import {
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Layers,
  Radio,
  HardHat,
  Check,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface LoginRegistrationScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  currentUser: UserProfile;
}

export const LoginRegistrationScreen: React.FC<LoginRegistrationScreenProps> = ({
  onLoginSuccess,
}) => {
  // Top Portal Selection: "Maintenance Portal" vs "COA Admin Login"
  const [activePortal, setActivePortal] = useState<"maintenance" | "coa">("maintenance");

  // Maintenance Subtab: Sign-In vs Registration
  const [maintenanceTab, setMaintenanceTab] = useState<"signin" | "register">("signin");

  // Maintenance Credentials
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // COA Admin Credentials
  const [coaEmpId, setCoaEmpId] = useState("");
  const [coaPassword, setCoaPassword] = useState("");
  const [showCoaPassword, setShowCoaPassword] = useState(false);
  const [coaRememberMe, setCoaRememberMe] = useState(true);

  // Form & Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Personnel Registration Form State
  const [regName, setRegName] = useState("");
  const [regEmpId, setRegEmpId] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("supervisor");
  const [regDept, setRegDept] = useState<DepartmentType>("Engineering");
  const [regPass, setRegPass] = useState("");

  // Clean Maintenance prefix
  const cleanMaintenancePrefix = empId.trim().toUpperCase().slice(0, 3);

  // Maintenance Detected Role
  const detectedMaintenanceRole = (() => {
    if (cleanMaintenancePrefix === "ZON") {
      return {
        role: "zonal_head" as UserRole,
        label: "Zonal Head (CTE)",
        interfaceName: "Zonal Head Interface",
        badgeColor: "bg-[#f3e8ff] text-[#7c3aed] border-[#7c3aed]/30",
        btnClass: "bg-[#7c3aed] hover:bg-[#6d28d9]",
        icon: Layers,
      };
    }
    if (cleanMaintenancePrefix === "WRK") {
      return {
        role: "worker" as UserRole,
        label: "Field Worker",
        interfaceName: "Worker Interface",
        badgeColor: "bg-[#ffdcc3] text-[#904d00] border-[#904d00]/30",
        btnClass: "bg-[#904d00] hover:bg-[#7a4100]",
        icon: HardHat,
      };
    }
    if (cleanMaintenancePrefix === "DPT") {
      return {
        role: "department_user" as UserRole,
        label: "Department Head (Sr. DEN)",
        interfaceName: "Dept Head Interface",
        badgeColor: "bg-[#ffe4e6] text-[#be123c] border-[#be123c]/30",
        btnClass: "bg-[#be123c] hover:bg-[#9f1239]",
        icon: Building2,
      };
    }
    if (cleanMaintenancePrefix === "SUP") {
      return {
        role: "supervisor" as UserRole,
        label: "Supervisor (SSE)",
        interfaceName: "Supervisor Interface",
        badgeColor: "bg-[#dbeafe] text-[#1e40af] border-[#1e40af]/30",
        btnClass: "bg-[#1e40af] hover:bg-[#1e3a8a]",
        icon: ShieldCheck,
      };
    }
    return null;
  })();

  // Maintenance Authentication Handler
  const handleMaintenanceAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmp = empId.trim().toUpperCase();

    if (!cleanEmp) {
      setErrorMessage("Please enter your Official Employee ID.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    const prefix = cleanEmp.slice(0, 3);

    if (prefix === "COA") {
      setErrorMessage(
        "COA Controller ID detected. Please switch to the 'COA Admin Login' tab above for Operations Controller access."
      );
      return;
    }

    const validMaintenancePrefixes = ["WRK", "SUP", "ZON", "DPT"];
    if (!validMaintenancePrefixes.includes(prefix)) {
      setErrorMessage(
        `Invalid Official ID prefix "${prefix}". In the Maintenance Portal, Employee ID must start with WRK (Worker), SUP (Supervisor), ZON (Zonal Head), or DPT (Dept Head).`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: cleanEmp,
          password,
          role: detectedMaintenanceRole?.role,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Please verify your credentials.");
      }

      const rawRole = data.user.userRole || data.user.role || detectedMaintenanceRole?.role || "supervisor";
      const verifiedRole: UserRole = rawRole === "department_head" ? "department_user" : rawRole;
      let userAvatar =
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
      if (verifiedRole === "zonal_head") {
        userAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80";
      } else if (verifiedRole === "worker") {
        userAvatar = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80";
      } else if (verifiedRole === "department_user" || (verifiedRole as string) === "department_head") {
        userAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80";
      } else if (verifiedRole === "supervisor") {
        userAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80";
      }

      let mappedDept: DepartmentType = "Engineering";
      const rawDept = (data.user.department || "").toLowerCase();
      if (rawDept.includes("elect") || rawDept.includes("trd") || rawDept.includes("tract")) mappedDept = "Traction";
      else if (rawDept.includes("sign") || rawDept.includes("s&t") || rawDept.includes("comm")) mappedDept = "S&T";
      else if (rawDept.includes("oper") || rawDept.includes("traff")) mappedDept = "Operations";
      else mappedDept = "Engineering";

      const authenticatedUser: UserProfile = {
        id: data.user.id || `usr-${cleanEmp.toLowerCase()}`,
        name: data.user.name || "Authorized Official",
        email: data.user.email,
        empId: data.user.empId || cleanEmp,
        department: mappedDept,
        role: data.user.role || "Railway Maintenance Personnel",
        userRole: verifiedRole,
        avatarUrl: data.user.avatarUrl || userAvatar,
        isLoggedIn: true,
        reports_to: data.user.reports_to || null,
        reportingTo: data.user.reportingTo || null,
      };

      if (data.token) {
        localStorage.setItem("railpravah_token", data.token);
      }
      localStorage.setItem("railpravah_user", JSON.stringify(authenticatedUser));

      setIsSubmitting(false);
      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Authentication failed. Please verify your credentials.");
    }
  };

  // COA Admin Authentication Handler
  const handleCoaAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCoaEmp = coaEmpId.trim().toUpperCase();

    if (!cleanCoaEmp) {
      setErrorMessage("Please enter your Official COA Controller ID.");
      return;
    }

    if (!coaPassword.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    const prefix = cleanCoaEmp.slice(0, 3);
    if (prefix !== "COA") {
      setErrorMessage(
        `Invalid COA ID "${cleanCoaEmp}". COA Controller ID must begin with prefix 'COA' (e.g. COA-CR-4891).`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: cleanCoaEmp,
          password: coaPassword,
          role: "coa_admin",
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "COA Authentication failed. Please verify your controller credentials.");
      }

      const authenticatedUser: UserProfile = {
        id: data.user.id || `usr-${cleanCoaEmp.toLowerCase()}`,
        name: data.user.name || "Chief COA Operations Controller",
        empId: data.user.empId || cleanCoaEmp,
        department: "Operations",
        role: "Chief COA Traffic & Power Block Controller",
        userRole: "coa_admin",
        avatarUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC5sQPcjKJuVrfbGreHMaN4Smsm4Vt1ip5elxKPcfVbg_lnsKPqE2x4blO3Q-a-1nR01v1L-hRKRn5jL72vSHEkoj3gKsrQor4uhptnrvg6d8FfJWP4bolJ5INITzW8r_cihIvYIuizvD47KYt5azuqgewC3BT9WHV-fzDsERVanjhluAYabf2h5tHc2uCgpYvoZDzGsDQo6Y-kYrrPA9yRwjLWha8WpiglRn_C2ODGH8GHx0-PAn2T",
        isLoggedIn: true,
      };

      if (data.token) {
        localStorage.setItem("railpravah_token", data.token);
      }
      localStorage.setItem("railpravah_user", JSON.stringify(authenticatedUser));

      setIsSubmitting(false);
      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "COA Authentication failed. Please verify your controller credentials.");
    }
  };

  // Personnel Registration Handler (Maintenance Portal)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regEmpId.trim() || !regPass.trim()) {
      setErrorMessage("All registration fields are mandatory.");
      return;
    }

    if (regName.trim().length < 2) {
      setErrorMessage("Please enter a valid Full Name (minimum 2 characters).");
      return;
    }

    if (regPass.trim().length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    const cleanRegEmpId = regEmpId.trim().toUpperCase();
    const prefix = cleanRegEmpId.slice(0, 3);
    const expectedPrefix =
      regRole === "worker"
        ? "WRK"
        : regRole === "supervisor"
        ? "SUP"
        : regRole === "zonal_head"
        ? "ZON"
        : "DPT";

    if (prefix !== expectedPrefix) {
      const roleLabel =
        regRole === "worker"
          ? "Worker"
          : regRole === "supervisor"
          ? "Supervisor"
          : regRole === "zonal_head"
          ? "Zonal Head"
          : "Department Head";
      setErrorMessage(
        `For operational role "${roleLabel}", Employee ID must begin with prefix "${expectedPrefix}" (e.g. ${expectedPrefix}-CR-9042).`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          empId: cleanRegEmpId,
          password: regPass.trim(),
          role: regRole,
          department: regDept,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed. Please check your details.");
      }

      const deptLabel = regDept === "Traction" ? "TRD" : regDept === "S&T" ? "S&T" : "P-Way";
      const userRoleTitle =
        regRole === "worker"
          ? (regDept === "Traction" ? "OHE Linesman Gr-III" : regDept === "S&T" ? "Signal Maintainer Gr-II" : "Field Track Maintainer Gr-IV")
          : regRole === "supervisor"
          ? `Senior Section Engineer (SSE / ${deptLabel})`
          : regRole === "zonal_head"
          ? (regDept === "Traction" ? "Chief Electrical Engineer (CEE)" : regDept === "S&T" ? "Chief Signal & Telecom Engineer (CSTE)" : "Chief Track Engineer (CTE)")
          : (regDept === "Traction" ? "Sr. Divisional Electrical Engineer (Sr. DEE)" : regDept === "S&T" ? "Sr. Divisional Signal Engineer (Sr. DSTE)" : "Sr. Divisional Engineer (Sr. DEN)");

      const newUser: UserProfile = {
        id: data.user.id || `usr-${cleanRegEmpId.toLowerCase()}`,
        name: regName.trim(),
        email: data.user.email,
        empId: cleanRegEmpId,
        department: regDept,
        role: userRoleTitle,
        userRole: regRole,
        avatarUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        isLoggedIn: true,
        reports_to: data.user.reports_to || null,
        reportingTo: data.user.reportingTo || null,
      };

      if (data.token) {
        localStorage.setItem("railpravah_token", data.token);
      }
      localStorage.setItem("railpravah_user", JSON.stringify(newUser));

      setIsSubmitting(false);
      setSuccessMessage(`Account registered for ${regName.trim()} in Supabase Database. Redirecting to workspace...`);
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 600);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] grid-bg flex flex-col justify-between p-3 sm:p-6 md:p-8">
      {/* Top Banner / System Notice */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between text-[11px] text-[#464555] px-1 py-1">
        <span className="font-semibold tracking-wider text-[#1e40af] uppercase">
          Central Railway • CR Mumbai Division
        </span>
        <span className="flex items-center gap-1.5 text-[#5b5e66]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
          Common Block System Live
        </span>
      </div>

      {/* Main Centered Login Card */}
      <div className="w-full max-w-xl bg-white border border-[#c7c4d8] shadow-md rounded-2xl overflow-hidden mx-auto my-auto">
        {/* TOP: RailPravah Branding / Logo */}
        <div className="p-6 text-center border-b border-[#eceef0] bg-gradient-to-b from-white to-[#fbfcfe]">
          <div className="flex justify-center mb-2.5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 shadow-xs border border-[#e2e8f0] flex items-center justify-center">
              <img
                src={appLogo}
                alt="RailPravah Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1
            id="login-heading"
            className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#1a1c1e] font-sans"
          >
            Sign In to Railप्रवाह
          </h1>
          <p className="text-xs sm:text-[13px] text-[#5b5e66] mt-1 font-medium tracking-wide">
            MUMBAI DIVISION • CENTRAL LINE RAILWAY OPERATIONS & MAINTENANCE
          </p>
        </div>

        {/* PRIMARY PORTAL TABS: "Maintenance Portal" vs "COA Admin Login" */}
        <div className="grid grid-cols-2 p-1.5 bg-[#f1f3f5] rounded-xl mx-5 sm:mx-6 mt-5 border border-[#e2e8f0]">
          <button
            id="portal-tab-maintenance"
            type="button"
            onClick={() => {
              setActivePortal("maintenance");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activePortal === "maintenance"
                ? "bg-white text-[#1e40af] shadow-xs border border-[#c7c4d8]/40"
                : "text-[#5b5e66] hover:text-[#1a1c1e]"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#1e40af]" />
            <span>Maintenance Portal</span>
          </button>

          <button
            id="portal-tab-coa"
            type="button"
            onClick={() => {
              setActivePortal("coa");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activePortal === "coa"
                ? "bg-white text-[#15803d] shadow-xs border border-[#15803d]/30"
                : "text-[#5b5e66] hover:text-[#1a1c1e]"
            }`}
          >
            <Radio className="w-4 h-4 text-[#15803d]" />
            <span>COA Admin Login</span>
          </button>
        </div>

        {/* Quick Select Registered Personnel from Supabase */}
        <div className="mx-5 sm:mx-6 mt-4 p-3 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Official Database Personnel (1-Click Fill)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Password: <strong className="text-slate-800">RailPravah@2026</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {/* 1. COA Admin */}
            <button
              type="button"
              onClick={() => {
                setActivePortal("coa");
                setCoaEmpId("COA-CR-4891");
                setCoaPassword("RailPravah@2026");
                setErrorMessage(null);
                setSuccessMessage("Selected COA Chief Controller (COA-CR-4891)");
              }}
              className="p-1.5 text-left rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 font-mono">COA-CR-4891</span>
                <Radio className="w-3 h-3 text-emerald-600" />
              </div>
              <div className="text-[10px] text-slate-600 truncate font-medium">COA Controller</div>
              <div className="text-[9px] text-emerald-700 font-semibold">CSMT HQ</div>
            </button>

            {/* 2. Civil Dept Head */}
            <button
              type="button"
              onClick={() => {
                setActivePortal("maintenance");
                setMaintenanceTab("signin");
                setEmpId("DPT-CR-5520");
                setPassword("RailPravah@2026");
                setErrorMessage(null);
                setSuccessMessage("Selected Civil Dept Head: Dr. Pradeep Verma (DPT-CR-5520)");
              }}
              className="p-1.5 text-left rounded-lg bg-white border border-rose-200 hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 font-mono">DPT-CR-5520</span>
                <Building2 className="w-3 h-3 text-rose-600" />
              </div>
              <div className="text-[10px] text-slate-600 truncate font-medium">Dr. P. Verma (Sr. DEN)</div>
              <div className="text-[9px] text-rose-700 font-semibold">Civil Dept Head</div>
            </button>

            {/* 3. Civil Supervisor */}
            <button
              type="button"
              onClick={() => {
                setActivePortal("maintenance");
                setMaintenanceTab("signin");
                setEmpId("SUP-CR-3104");
                setPassword("RailPravah@2026");
                setErrorMessage(null);
                setSuccessMessage("Selected Civil Supervisor: Rajesh Shinde (SUP-CR-3104)");
              }}
              className="p-1.5 text-left rounded-lg bg-white border border-blue-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800 font-mono">SUP-CR-3104</span>
                <ShieldCheck className="w-3 h-3 text-blue-600" />
              </div>
              <div className="text-[10px] text-slate-600 truncate font-medium">Rajesh Shinde (SSE)</div>
              <div className="text-[9px] text-blue-700 font-semibold">Civil Dadar</div>
            </button>

            {/* 4. Civil Worker */}
            <button
              type="button"
              onClick={() => {
                setActivePortal("maintenance");
                setMaintenanceTab("signin");
                setEmpId("WRK-CR-1001");
                setPassword("RailPravah@2026");
                setErrorMessage(null);
                setSuccessMessage("Selected Civil Worker: Ramesh Pawar (WRK-CR-1001)");
              }}
              className="p-1.5 text-left rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 font-mono">WRK-CR-1001</span>
                <HardHat className="w-3 h-3 text-amber-600" />
              </div>
              <div className="text-[10px] text-slate-600 truncate font-medium">Ramesh Pawar</div>
              <div className="text-[9px] text-amber-700 font-semibold">Track Maintainer</div>
            </button>
          </div>
        </div>

        {/* SUBTABS (Only for Maintenance Portal) */}
        {activePortal === "maintenance" && (
          <div className="flex border-b border-[#eceef0] px-6 bg-[#fafafa] mt-4">
            <button
              id="subtab-signin"
              type="button"
              onClick={() => {
                setMaintenanceTab("signin");
                setErrorMessage(null);
              }}
              className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                maintenanceTab === "signin"
                  ? "border-[#1e40af] text-[#1e40af]"
                  : "border-transparent text-[#5b5e66] hover:text-[#1a1c1e]"
              }`}
            >
              Personnel Sign-In
            </button>
            <button
              id="subtab-register"
              type="button"
              onClick={() => {
                setMaintenanceTab("register");
                setErrorMessage(null);
              }}
              className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                maintenanceTab === "register"
                  ? "border-[#1e40af] text-[#1e40af]"
                  : "border-transparent text-[#5b5e66] hover:text-[#1a1c1e]"
              }`}
            >
              New Personnel Registration
            </button>
          </div>
        )}

        {/* Card Body */}
        <div className="p-5 sm:p-6">
          {/* Inline Alert Messages */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-4 p-3 bg-[#ffdad6] text-[#ba1a1a] text-xs font-medium rounded-xl flex items-center gap-2.5 border border-[#ba1a1a]/20 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#ba1a1a]" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              id="login-success-alert"
              className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2.5 border border-emerald-200 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* TAB CONTENT: MAINTENANCE PORTAL */}
          {activePortal === "maintenance" ? (
            maintenanceTab === "signin" ? (
              /* Maintenance Personnel Sign-In */
              <form onSubmit={handleMaintenanceAuth} className="space-y-4">
                {/* Official ID Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="maintenance-emp-id"
                      className="block text-xs font-semibold text-[#1a1c1e]"
                    >
                      Official Employee ID
                    </label>
                    {detectedMaintenanceRole ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${detectedMaintenanceRole.badgeColor} flex items-center gap-1 animate-in fade-in`}
                      >
                        <detectedMaintenanceRole.icon className="w-3 h-3" />
                        <span>Prefix "{cleanMaintenancePrefix}": {detectedMaintenanceRole.interfaceName}</span>
                      </span>
                    ) : cleanMaintenancePrefix.length > 0 ? (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Prefix: WRK, SUP, ZON, or DPT
                      </span>
                    ) : null}
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#727782] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="maintenance-emp-id"
                      type="text"
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value)}
                      placeholder="e.g. WRK-CR-1001, SUP-CR-3104, ZON-CR-1102, DPT-CR-5520"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#c7c4d8] rounded-xl text-sm font-medium text-[#1a1c1e] uppercase focus:outline-hidden focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af]"
                      autoComplete="username"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-[#5b5e66] mt-1">
                    Accepted prefixes: <strong className="text-[#904d00]">WRK</strong> (Worker), <strong className="text-[#1e40af]">SUP</strong> (Supervisor), <strong className="text-[#7c3aed]">ZON</strong> (Zonal Head), or <strong className="text-[#be123c]">DPT</strong> (Dept Head).
                  </p>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="maintenance-password"
                      className="block text-xs font-semibold text-[#1a1c1e]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(
                          "Default credentials: Enter password 'RailPravah@2026' with your official Employee ID (e.g. DPT-CR-5520, SUP-CR-3104, WRK-CR-1001)."
                        );
                      }}
                      className="text-[11px] text-[#1e40af] hover:underline cursor-pointer"
                    >
                      Need Help?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#727782] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="maintenance-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#c7c4d8] rounded-xl text-sm font-medium text-[#1a1c1e] focus:outline-hidden focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af]"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      id="btn-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727782] hover:text-[#1a1c1e] p-1 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>


                {/* Session Persistence */}
                <div className="flex items-center justify-between text-xs text-[#5b5e66] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      id="remember-session-maintenance"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#c7c4d8] text-[#1e40af] focus:ring-[#1e40af] w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Remember terminal session</span>
                  </label>
                </div>

                {/* Sign In Button */}
                <button
                  id="btn-submit-maintenance-signin"
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                    isSubmitting
                      ? "bg-[#727782] cursor-not-allowed opacity-80"
                      : detectedMaintenanceRole
                      ? detectedMaintenanceRole.btnClass
                      : "bg-[#1e40af] hover:bg-[#1e3a8a] active:scale-[0.99]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating & Routing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        {detectedMaintenanceRole
                          ? `Sign In to ${detectedMaintenanceRole.interfaceName}`
                          : "Sign In to Maintenance Portal"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* New Maintenance Registration */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <h3 className="text-xs font-bold text-blue-900">
                    New Railway Personnel Registration
                  </h3>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Register your employee ID for Central Line operations and track maintenance.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1a1c1e] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh K. More"
                    className="w-full px-3 py-2.5 bg-white border border-[#c7c4d8] rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1c1e] mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={regEmpId}
                      onChange={(e) => setRegEmpId(e.target.value)}
                      placeholder="e.g. SUP-CR-9042"
                      className="w-full px-3 py-2.5 bg-white border border-[#c7c4d8] rounded-xl text-sm uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1a1c1e] mb-1">
                      Operational Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 bg-white border border-[#c7c4d8] rounded-xl text-sm"
                    >
                      <option value="worker">Worker (WRK)</option>
                      <option value="supervisor">Supervisor (SUP)</option>
                      <option value="department_user">Department Head (DPT)</option>
                      <option value="zonal_head">Zonal Head (ZON)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1c1e] mb-1">
                      Department
                    </label>
                    <select
                      id="reg-dept-select"
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value as DepartmentType)}
                      className="w-full px-3 py-2.5 bg-white border border-[#c7c4d8] rounded-xl text-sm font-medium"
                    >
                      <option value="Engineering">Engineering (Civil / Track / P-Way)</option>
                      <option value="Traction">Traction (Electrical / OHE / TRD)</option>
                      <option value="S&T">Signal & Telecommunication (S&T)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1a1c1e] mb-1">
                      Terminal Access Password
                    </label>
                    <input
                      type="password"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-white border border-[#c7c4d8] rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Auto-Assigned Hierarchy Preview */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Hierarchical Reporting: </span>
                    <span className="text-slate-600">
                      {regRole === "worker"
                        ? `Auto-assigned to Section Supervisor (${regDept === "Traction" ? "SSE / TRD Kalyan" : regDept === "S&T" ? "SSE / S&T Kurla" : "SSE / P-Way Dadar"}) in ${regDept} Department`
                        : regRole === "supervisor"
                        ? `Auto-assigned to Zonal Head (${regDept === "Traction" ? "CEE / Traction" : regDept === "S&T" ? "CSTE / S&T" : "CTE / Central Zone"}) in ${regDept} Department`
                        : regRole === "zonal_head"
                        ? `Auto-assigned to Department Head (${regDept === "Traction" ? "Sr. DEE / TRD" : regDept === "S&T" ? "Sr. DSTE / Signals" : "Sr. DEN / Civil"}) in ${regDept} Department`
                        : "Auto-assigned to Chief Operations Controller (COA Admin - HQ CSMT)"}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#1e40af] hover:bg-[#1e3a8a] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Personnel Registration</span>
                </button>
              </form>
            )
          ) : (
            /* TAB CONTENT: COA ADMIN LOGIN */
            <form onSubmit={handleCoaAuth} className="space-y-4">
              {/* COA Banner */}
              <div className="p-3.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#dcfce7] border border-[#86efac] text-[#166534] shrink-0">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#166534] flex items-center gap-1.5">
                    <span>Control Operations Authority (COA) Portal</span>
                    <span className="text-[10px] bg-[#166534] text-white px-1.5 py-0.2 rounded font-mono font-semibold">
                      HQ CSMT
                    </span>
                  </div>
                  <p className="text-[11px] text-[#15803d] mt-0.5 leading-snug">
                    Dedicated console for Central Railway Operations & Power Block Controllers.
                  </p>
                </div>
              </div>

              {/* COA Controller ID Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="coa-controller-id"
                    className="block text-xs font-semibold text-[#1a1c1e]"
                  >
                    Official COA Controller ID
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#dcfce7] text-[#166534] border-[#166534]/30">
                    Prefix: COA
                  </span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-[#727782] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="coa-controller-id"
                    type="text"
                    value={coaEmpId}
                    onChange={(e) => setCoaEmpId(e.target.value)}
                    placeholder="e.g. COA-CR-4891"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#c7c4d8] rounded-xl text-sm font-medium text-[#1a1c1e] uppercase focus:outline-hidden focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
                    autoComplete="username"
                    required
                  />
                </div>
                <p className="text-[11px] text-[#5b5e66] mt-1">
                  Default Controller Account: <code className="font-mono font-bold text-[#166534]">COA-CR-4891</code>
                </p>
              </div>

              {/* COA Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="coa-password"
                    className="block text-xs font-semibold text-[#1a1c1e]"
                  >
                    COA Controller Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(
                        "Default credentials: Enter standard evaluation password 'RailPravah@2026' with COA-CR-4891."
                      );
                    }}
                    className="text-[11px] text-[#15803d] hover:underline cursor-pointer"
                  >
                    Need Help?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#727782] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="coa-password"
                    type={showCoaPassword ? "text" : "password"}
                    value={coaPassword}
                    onChange={(e) => setCoaPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#c7c4d8] rounded-xl text-sm font-medium text-[#1a1c1e] focus:outline-hidden focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    id="btn-toggle-coa-password"
                    onClick={() => setShowCoaPassword(!showCoaPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727782] hover:text-[#1a1c1e] p-1 cursor-pointer"
                    aria-label={showCoaPassword ? "Hide password" : "Show password"}
                  >
                    {showCoaPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Session Persistence */}
              <div className="flex items-center justify-between text-xs text-[#5b5e66] pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="remember-session-coa"
                    type="checkbox"
                    checked={coaRememberMe}
                    onChange={(e) => setCoaRememberMe(e.target.checked)}
                    className="rounded border-[#c7c4d8] text-[#15803d] focus:ring-[#15803d] w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Remember secure controller session</span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                id="btn-submit-coa-signin"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#15803d] hover:bg-[#166534] active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting to Operations Authority...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
                    <span>Sign In as COA Operations Controller</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Card Footer / System Status */}
        <div className="px-6 py-3 bg-[#f8fafc] border-t border-[#eceef0] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#5b5e66] gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>CR Mumbai Division Server: 10.14.88.21</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Control Helpline: <strong>+91 22 2262 0125</strong></span>
            <span>•</span>
            <span className="text-[#1e40af] font-medium">TLS 256-bit</span>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Security Notice */}
      <div className="w-full max-w-xl mx-auto text-center text-[11px] text-[#727782] mt-3">
        Railप्रवाह Common Block Planning & Traffic Management System • Ministry of Railways, Govt of India
      </div>
    </div>
  );
};
