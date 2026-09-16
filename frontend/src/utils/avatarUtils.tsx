import React, { useState } from "react";
import { UserRole } from "../types";

export interface RoleAvatarConfig {
  code: string;
  title: string;
  primaryColor: string;
  badgeBg: string;
  badgeText: string;
  ringColor: string;
  avatarUrl: string;
  fallbackSvgDataUri: string;
}

// Crisp, lightweight inline SVG avatars with authentic railway gear & insignia
const createSvgAvatar = (bgGradient: [string, string], iconType: "worker" | "supervisor" | "zonal" | "dept" | "coa", badgeText: string) => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="bg-${iconType}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGradient[0]}" />
          <stop offset="100%" stop-color="${bgGradient[1]}" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
        </filter>
      </defs>
      <rect width="120" height="120" rx="60" fill="url(#bg-${iconType})" />
      
      <!-- Head and Shoulders Silhouette with Indian Railway Attire -->
      <!-- Shoulders/Torso -->
      ${
        iconType === "worker"
          ? `<path d="M 22 110 C 22 82, 38 78, 60 78 C 82 78, 98 82, 98 110 Z" fill="#d97706"/>
             <!-- High-Vis Vest Strips -->
             <path d="M 44 80 L 41 110 L 49 110 L 51 80 Z" fill="#facc15" opacity="0.9"/>
             <path d="M 76 80 L 79 110 L 71 110 L 69 80 Z" fill="#facc15" opacity="0.9"/>
             <path d="M 32 94 L 88 94 L 88 99 L 32 99 Z" fill="#facc15" opacity="0.9"/>`
          : iconType === "supervisor"
          ? `<path d="M 22 110 C 22 82, 38 78, 60 78 C 82 78, 98 82, 98 110 Z" fill="#1e3a8a"/>
             <!-- Formal White Collar & Tie -->
             <polygon points="60,82 50,78 70,78" fill="#ffffff"/>
             <polygon points="60,82 56,104 60,108 64,104" fill="#3b82f6"/>`
          : iconType === "zonal"
          ? `<path d="M 22 110 C 22 80, 36 76, 60 76 C 84 76, 98 80, 98 110 Z" fill="#4c1d95"/>
             <!-- Crisp Executive Collar & Lapel -->
             <polygon points="60,80 48,76 72,76" fill="#f8fafc"/>
             <polygon points="60,84 57,110 63,110" fill="#c084fc"/>
             <!-- Zonal Golden Badge Insignia -->
             <circle cx="76" cy="90" r="4" fill="#fbbf24"/>`
          : iconType === "dept"
          ? `<path d="M 22 110 C 22 80, 36 76, 60 76 C 84 76, 98 80, 98 110 Z" fill="#881337"/>
             <!-- Executive Suit & Gold Trim -->
             <polygon points="60,80 48,76 72,76" fill="#ffffff"/>
             <polygon points="60,84 56,110 64,110" fill="#f43f5e"/>
             <circle cx="76" cy="90" r="4.5" fill="#f59e0b"/>`
          : `<path d="M 22 110 C 22 82, 38 78, 60 78 C 82 78, 98 82, 98 110 Z" fill="#14532d"/>
             <!-- Control Center Uniform & Headset Wire -->
             <polygon points="60,82 50,78 70,78" fill="#f0fdf4"/>
             <path d="M 40 50 Q 32 68 46 86" stroke="#22c55e" stroke-width="2.5" fill="none"/>`
      }

      <!-- Neck -->
      <path d="M 52 64 L 68 64 L 68 78 L 52 78 Z" fill="#d4a373"/>

      <!-- Head / Face -->
      <ellipse cx="60" cy="54" rx="17" ry="20" fill="#e0ac69"/>
      
      <!-- Ears -->
      <ellipse cx="42" cy="55" rx="3.5" ry="5" fill="#d4a373"/>
      <ellipse cx="78" cy="55" rx="3.5" ry="5" fill="#d4a373"/>

      <!-- Facial Features: Subtle Glasses/Moustache/Features for distinguished Indian Railway look -->
      ${
        iconType === "zonal" || iconType === "dept"
          ? `<!-- Executive spectacles -->
             <rect x="47" y="49" width="10" height="7" rx="2" fill="none" stroke="#1e293b" stroke-width="1.8"/>
             <rect x="63" y="49" width="10" height="7" rx="2" fill="none" stroke="#1e293b" stroke-width="1.8"/>
             <line x1="57" y1="52" x2="63" y2="52" stroke="#1e293b" stroke-width="1.8"/>
             <!-- Distinguished Trim Moustache -->
             <path d="M 53 62 Q 60 60 67 62 Q 60 65 53 62" fill="#334155"/>`
          : iconType === "supervisor"
          ? `<!-- Supervisor specs & neat look -->
             <rect x="48" y="50" width="9" height="6" rx="2" fill="none" stroke="#0f172a" stroke-width="1.5"/>
             <rect x="63" y="50" width="9" height="6" rx="2" fill="none" stroke="#0f172a" stroke-width="1.5"/>
             <line x1="57" y1="53" x2="63" y2="53" stroke="#0f172a" stroke-width="1.5"/>`
          : iconType === "coa"
          ? `<!-- Controller Headset & Mic -->
             <path d="M 41 55 C 38 32, 82 32, 79 55" stroke="#0f172a" stroke-width="3" fill="none"/>
             <rect x="38" y="48" width="5" height="12" rx="2.5" fill="#22c55e"/>
             <rect x="77" y="48" width="5" height="12" rx="2.5" fill="#0f172a"/>
             <path d="M 40 56 Q 44 68 56 68" stroke="#0f172a" stroke-width="2" fill="none"/>
             <circle cx="57" cy="68" r="2.5" fill="#22c55e"/>`
          : `<!-- Track Maintainer moustache -->
             <path d="M 52 63 Q 60 61 68 63 Q 60 66 52 63" fill="#1f2937"/>`
      }

      <!-- Hair / Headgear -->
      ${
        iconType === "worker"
          ? `<!-- Yellow Railway Safety Hardhat -->
             <path d="M 40 46 C 40 28, 80 28, 80 46 Z" fill="#eab308"/>
             <path d="M 36 45 Q 60 41 84 45 L 86 48 Q 60 44 34 48 Z" fill="#ca8a04"/>
             <!-- IR White Reflective Strip -->
             <rect x="52" y="32" width="16" height="4" rx="1" fill="#ffffff" opacity="0.9"/>`
          : iconType === "supervisor"
          ? `<!-- White Engineer Inspection Helmet -->
             <path d="M 40 46 C 40 28, 80 28, 80 46 Z" fill="#f8fafc"/>
             <path d="M 36 45 Q 60 41 84 45 L 86 48 Q 60 44 34 48 Z" fill="#cbd5e1"/>
             <!-- Engineering Blue Badge -->
             <circle cx="60" cy="35" r="3.5" fill="#2563eb"/>`
          : `<!-- Professional Dark Hair -->
             <path d="M 41 47 C 41 32, 79 32, 79 47 C 76 38, 44 38, 41 47 Z" fill="#1e293b"/>`
      }

      <!-- Role Badge Pill in Corner -->
      <g filter="url(#shadow)">
        <rect x="70" y="88" width="44" height="22" rx="6" fill="#ffffff" stroke="${bgGradient[0]}" stroke-width="1.5"/>
        <text x="92" y="103" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="900" fill="${bgGradient[0]}" text-anchor="middle" letter-spacing="0.5">${badgeText}</text>
      </g>
    </svg>
  `
    .replace(/\s+/g, " ")
    .trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
};

// Role Config Registry
export const ROLE_AVATAR_CONFIGS: Record<UserRole, RoleAvatarConfig> = {
  worker: {
    code: "WRK",
    title: "Track Maintainer (Worker)",
    primaryColor: "#d97706",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
    badgeText: "WRK",
    ringColor: "ring-amber-500",
    avatarUrl: createSvgAvatar(["#b45309", "#d97706"], "worker", "WRK"),
    fallbackSvgDataUri: createSvgAvatar(["#b45309", "#d97706"], "worker", "WRK"),
  },
  supervisor: {
    code: "SSE",
    title: "Senior Section Engineer (Supervisor)",
    primaryColor: "#1d4ed8",
    badgeBg: "bg-blue-100 text-blue-900 border-blue-300",
    badgeText: "SSE",
    ringColor: "ring-blue-600",
    avatarUrl: createSvgAvatar(["#1e40af", "#3b82f6"], "supervisor", "SSE"),
    fallbackSvgDataUri: createSvgAvatar(["#1e40af", "#3b82f6"], "supervisor", "SSE"),
  },
  zonal_head: {
    code: "CTE",
    title: "Chief Track Engineer (Zonal Head)",
    primaryColor: "#6b21a8",
    badgeBg: "bg-purple-100 text-purple-900 border-purple-300",
    badgeText: "CTE",
    ringColor: "ring-purple-600",
    avatarUrl: createSvgAvatar(["#581c87", "#7e22ce"], "zonal", "CTE"),
    fallbackSvgDataUri: createSvgAvatar(["#581c87", "#7e22ce"], "zonal", "CTE"),
  },
  department_head: {
    code: "PCE",
    title: "Principal Chief Engineer (Dept Head)",
    primaryColor: "#9f1239",
    badgeBg: "bg-rose-100 text-rose-900 border-rose-300",
    badgeText: "PCE",
    ringColor: "ring-rose-600",
    avatarUrl: createSvgAvatar(["#881337", "#be123c"], "dept", "PCE"),
    fallbackSvgDataUri: createSvgAvatar(["#881337", "#be123c"], "dept", "PCE"),
  },
  department_user: {
    code: "PCE",
    title: "Principal Chief Engineer (Dept Head)",
    primaryColor: "#9f1239",
    badgeBg: "bg-rose-100 text-rose-900 border-rose-300",
    badgeText: "PCE",
    ringColor: "ring-rose-600",
    avatarUrl: createSvgAvatar(["#881337", "#be123c"], "dept", "PCE"),
    fallbackSvgDataUri: createSvgAvatar(["#881337", "#be123c"], "dept", "PCE"),
  },
  coa_admin: {
    code: "COA",
    title: "Chief Controller (Operations Authority)",
    primaryColor: "#15803d",
    badgeBg: "bg-emerald-100 text-emerald-900 border-emerald-300",
    badgeText: "COA",
    ringColor: "ring-emerald-600",
    avatarUrl: createSvgAvatar(["#14532d", "#16a34a"], "coa", "COA"),
    fallbackSvgDataUri: createSvgAvatar(["#14532d", "#16a34a"], "coa", "COA"),
  },
};

/**
 * Helper to get role avatar config
 */
export const getRoleAvatarConfig = (role?: UserRole | string | null): RoleAvatarConfig => {
  const normalized = (role || "").toLowerCase();
  if (normalized === "worker") return ROLE_AVATAR_CONFIGS.worker;
  if (normalized === "supervisor") return ROLE_AVATAR_CONFIGS.supervisor;
  if (normalized === "zonal_head") return ROLE_AVATAR_CONFIGS.zonal_head;
  if (normalized === "department_head" || normalized === "department_user" || normalized === "dept_head") {
    return ROLE_AVATAR_CONFIGS.department_head;
  }
  if (normalized === "coa_admin" || normalized === "coa") return ROLE_AVATAR_CONFIGS.coa_admin;
  return ROLE_AVATAR_CONFIGS.supervisor;
};

/**
 * Returns the reliable relatable Indian Railways avatar URL for a given role
 */
export const getRoleAvatarUrl = (role?: UserRole | string | null, _existingUrl?: string): string => {
  const config = getRoleAvatarConfig(role);
  return config.avatarUrl;
};

interface UserAvatarProps {
  role?: UserRole | string | null;
  name?: string;
  avatarUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showBadge?: boolean;
  showOnline?: boolean;
  alt?: string;
}

const SIZE_MAP = {
  xs: { size: "w-6 h-6", text: "text-[9px]", badge: "text-[7px] px-0.5" },
  sm: { size: "w-8 h-8", text: "text-xs", badge: "text-[8px] px-1" },
  md: { size: "w-10 h-10", text: "text-sm", badge: "text-[9px] px-1" },
  lg: { size: "w-12 h-12", text: "text-base", badge: "text-[10px] px-1.5" },
  xl: { size: "w-16 h-16", text: "text-lg", badge: "text-xs px-2" },
};

/**
 * Universal UserAvatar Component for RailPravah
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  role = "supervisor",
  name = "Railway Personnel",
  avatarUrl,
  size = "md",
  className = "",
  showBadge = false,
  showOnline = false,
  alt,
}) => {
  const config = getRoleAvatarConfig(role);
  const [imgError, setImgError] = useState(false);
  const sizeStyles = SIZE_MAP[size] || SIZE_MAP.md;

  const currentSrc = !imgError && avatarUrl && !avatarUrl.includes("unsplash.com")
    ? avatarUrl
    : config.fallbackSvgDataUri;

  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center ${className}`}>
      <img
        src={currentSrc}
        alt={alt || `${name} (${config.title})`}
        onError={() => setImgError(true)}
        className={`${sizeStyles.size} rounded-full object-cover shadow-xs border border-white/80 ring-2 ${config.ringColor}`}
      />
      {showOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1.5 ring-white" />
      )}
      {showBadge && (
        <span
          className={`absolute -bottom-1 -right-1 font-bold font-mono rounded shadow-xs border ${config.badgeBg} ${sizeStyles.badge}`}
        >
          {config.code}
        </span>
      )}
    </div>
  );
};
