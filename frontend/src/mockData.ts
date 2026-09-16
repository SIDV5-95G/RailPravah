import {
  ServiceRequestItem,
  TimelineBlock,
  ConflictQueueItem,
  WhySlotDetail,
  WhatIfSimulationResult,
  InterventionLog,
  UserProfile,
  CalendarBlock,
  CoaRecommendation,
  MumbaiCorridor,
  MaintenanceBlock,
  DepartmentName,
  SubDepartmentName,
  DepartmentType,
  UserRole,
  HierarchicalIssue,
} from "./types";

export const MUMBAI_CENTRAL_LINE_CORRIDORS: MumbaiCorridor[] = [
  {
    code: "CSTM – BY",
    from: "Chhatrapati Shivaji Maharaj Terminus",
    to: "Byculla",
    fromCode: "CSTM",
    toCode: "BY",
    lengthKm: 4.8,
    status: "Normal",
    activeBlocksCount: 1,
    tracks: ["Up Fast", "Down Fast", "Up Slow", "Down Slow"],
  },
  {
    code: "BY – DR",
    from: "Byculla",
    to: "Dadar",
    fromCode: "BY",
    toCode: "DR",
    lengthKm: 4.2,
    status: "Normal",
    activeBlocksCount: 2,
    tracks: ["Up Fast", "Down Fast", "Up Slow", "Down Slow"],
  },
  {
    code: "DR – GC",
    from: "Dadar",
    to: "Ghatkopar",
    fromCode: "DR",
    toCode: "GC",
    lengthKm: 10.6,
    status: "Conflict",
    activeBlocksCount: 4,
    tracks: ["Up Fast", "Down Fast", "Up Slow", "Down Slow", "5th Line"],
  },
  {
    code: "GC – VK",
    from: "Ghatkopar",
    to: "Vikhroli",
    fromCode: "GC",
    toCode: "VK",
    lengthKm: 3.5,
    status: "AI Optimized",
    activeBlocksCount: 2,
    tracks: ["Up Fast", "Down Fast", "Up Slow", "Down Slow"],
  },
  {
    code: "VK – TNA",
    from: "Vikhroli",
    to: "Thane",
    fromCode: "VK",
    toCode: "TNA",
    lengthKm: 10.9,
    status: "Normal",
    activeBlocksCount: 2,
    tracks: ["Up Fast", "Down Fast", "Up Slow", "Down Slow", "5th & 6th Line"],
  },
  {
    code: "TNA – KYN",
    from: "Thane",
    to: "Kalyan",
    fromCode: "TNA",
    toCode: "KYN",
    lengthKm: 20.1,
    status: "Normal",
    activeBlocksCount: 2,
    tracks: ["Up Fast", "Down Fast", "Up Slow", "Down Slow", "5th Line", "6th Line"],
  },
];

export const DEPARTMENT_HIERARCHY_CONFIG: Record<
  DepartmentName,
  {
    subDepartments: SubDepartmentName[];
    color: string;
    lightColor: string;
    teams: string[];
    activities: string[];
  }
> = {
  Engineering: {
    subDepartments: ["Track Maintenance", "Track Machine", "Bridges / Structures"],
    color: "#3525cd",
    lightColor: "#e2dfff",
    teams: ["P-Way Team 1 (Matunga)", "P-Way Team 2 (Kurla)", "Track Machine Crew 4", "Bridge Squad 1"],
    activities: [
      "Track Tamping",
      "Rail Grinding",
      "Track Inspection",
      "Rail Joint Maintenance",
      "Track Machine Operation",
      "Bridge Inspection",
    ],
  },
  "Electrical / Traction": {
    subDepartments: ["OHE Maintenance", "OHE Inspection", "Power Supply"],
    color: "#d97706",
    lightColor: "#fef3c7",
    teams: ["TRD Crew 1 (Dadar)", "TRD Crew 2 (Vidyavihar)", "Tower Wagon Unit 3", "Sub-Station Squad"],
    activities: [
      "OHE Inspection",
      "OHE Maintenance",
      "Pantograph/OHE inspection",
      "Tower Wagon Operation",
      "Traction Power Maintenance",
      "Electrical Isolation",
    ],
  },
  "Signal & Telecom": {
    subDepartments: ["Signalling", "Interlocking", "Telecom"],
    color: "#0284c7",
    lightColor: "#e0f2fe",
    teams: ["S&T Interlocking Crew (Dadar)", "DAC Signal Squad (Ghatkopar)", "Telecom OFC Team 1"],
    activities: [
      "Signal Maintenance",
      "Signal Inspection",
      "Interlocking Maintenance",
      "Track Circuit Inspection",
      "Telecom Maintenance",
      "OFC Maintenance",
    ],
  },
  Operations: {
    subDepartments: ["Train Control", "Traffic Management"],
    color: "#4b5563",
    lightColor: "#f3f4f6",
    teams: ["Section Controller Line 1", "Traffic Block Marshal", "Emergency Response Team"],
    activities: [
      "Train Movement",
      "Traffic Block Protection",
      "Block Approval",
      "Train Regulation",
      "Emergency Coordination",
    ],
  },
};

export const DEPARTMENT_WORKLOAD_STATS = [];

export const MUMBAI_NOTIFICATIONS = [];

export const INITIAL_MUMBAI_BLOCKS: MaintenanceBlock[] = [];


export const INITIAL_USER: UserProfile = {
  id: "user-unauth",
  name: "Unauthenticated Personnel",
  empId: "",
  department: "Engineering",
  role: "Guest",
  userRole: "worker",
  avatarUrl: "",
  isLoggedIn: false,
};

export const INITIAL_SERVICE_REQUESTS: ServiceRequestItem[] = [];

export const CENTRAL_LINE_STATIONS = [
  // Mainline
  { code: "CSMT", name: "CSMT (Chhatrapati Shivaji Maharaj Terminus)", line: "Mainline", km: "0.0" },
  { code: "BY", name: "Byculla", line: "Mainline", km: "4.5" },
  { code: "DR", name: "Dadar Junction", line: "Mainline", km: "9.0" },
  { code: "MT", name: "Matunga", line: "Mainline", km: "10.5" },
  { code: "CLA", name: "Kurla Junction", line: "Mainline", km: "15.0" },
  { code: "VVH", name: "Vidyavihar", line: "Mainline", km: "16.5" },
  { code: "GC", name: "Ghatkopar", line: "Mainline", km: "19.5" },
  { code: "VK", name: "Vikhroli", line: "Mainline", km: "23.0" },
  { code: "BND", name: "Bhandup", line: "Mainline", km: "27.0" },
  { code: "MLND", name: "Mulund", line: "Mainline", km: "31.5" },
  { code: "TNA", name: "Thane Junction", line: "Mainline", km: "34.0" },
  { code: "DIVA", name: "Diva Junction", line: "Mainline", km: "43.0" },
  { code: "DI", name: "Dombivli", line: "Mainline", km: "48.5" },
  { code: "THK", name: "Thakurli", line: "Mainline", km: "51.0" },
  { code: "KYN", name: "Kalyan Junction", line: "Mainline", km: "54.0" },

  // Kasara Branch (North East)
  { code: "TLA", name: "Titwala", line: "Kasara Branch", km: "67.0" },
  { code: "ASO", name: "Asangaon", line: "Kasara Branch", km: "85.0" },
  { code: "ATG", name: "Atgaon", line: "Kasara Branch", km: "99.0" },
  { code: "KRD", name: "Khardi", line: "Kasara Branch", km: "110.0" },
  { code: "KSRA", name: "Kasara Terminal", line: "Kasara Branch", km: "121.0" },

  // Khopoli Branch (South East)
  { code: "ABH", name: "Ambernath", line: "Khopoli Branch", km: "60.0" },
  { code: "BUD", name: "Badlapur", line: "Khopoli Branch", km: "68.0" },
  { code: "NRL", name: "Neral Junction", line: "Khopoli Branch", km: "87.0" },
  { code: "KJT", name: "Karjat Junction", line: "Khopoli Branch", km: "100.0" },
  { code: "PDI", name: "Palasdari", line: "Khopoli Branch", km: "104.0" },
  { code: "KHPI", name: "Khopoli Terminal", line: "Khopoli Branch", km: "115.0" },
];

export const INITIAL_CALENDAR_BLOCKS: CalendarBlock[] = [];

export const INITIAL_RECOMMENDATIONS: CoaRecommendation[] = [];


export const INITIAL_TIMELINE_BLOCKS: TimelineBlock[] = [];

export const INITIAL_WHY_SLOTS: WhySlotDetail[] = [];

export const INITIAL_CONFLICT_QUEUE: ConflictQueueItem[] = [];

export const INITIAL_WHATIF_DATA: WhatIfSimulationResult = {
  telemetry: {
    cascadingDelayTotal: 14,
    forcedCancellations: 3,
    estSystemRecovery: "2h 15m",
    impactRadiusStations: 4,
  },
  cancellations: [
    {
      trainNo: "12111 (CSMT-AMI)",
      depTime: "19:55",
      status: "CANCELLED",
      reason: "Terminated at origin due to down line occupation overlap",
    },
    {
      trainNo: "11009 (CSMT-PUNE)",
      depTime: "20:30",
      status: "CANCELLED",
      reason: "Platform line congestion at Dadar junction",
    },
    {
      trainNo: "97441 (DR-TNA) Local",
      depTime: "20:45",
      status: "CANCELLED",
      reason: "Local path cancelled to prioritize mainline express clearing",
    },
  ],
  delays: [
    {
      trainNo: "22221 (RAJDHANI)",
      location: "Kalyan Jn.",
      scheduledTime: "16:40",
      simulatedTime: "17:25",
      delta: "+45m",
      severity: "high",
    },
    {
      trainNo: "12859 (GITANJALI)",
      location: "Dadar",
      scheduledTime: "16:55",
      simulatedTime: "17:35",
      delta: "+40m",
      severity: "high",
    },
    {
      trainNo: "95123 (FAST LOCAL)",
      location: "Kurla",
      scheduledTime: "17:05",
      simulatedTime: "17:37",
      delta: "+32m",
      severity: "medium",
    },
    {
      trainNo: "12127 (INTERCITY)",
      location: "Thane",
      scheduledTime: "17:15",
      simulatedTime: "17:40",
      delta: "+25m",
      severity: "medium",
    },
    {
      trainNo: "93444 (SLOW LOCAL)",
      location: "Ghatkopar",
      scheduledTime: "17:22",
      simulatedTime: "17:42",
      delta: "+20m",
      severity: "medium",
    },
    {
      trainNo: "11029 (KOYNA EXP)",
      location: "Karjat",
      scheduledTime: "17:45",
      simulatedTime: "18:00",
      delta: "+15m",
      severity: "low",
    },
    {
      trainNo: "97711 (DR-KYN)",
      location: "Dombivli",
      scheduledTime: "17:55",
      simulatedTime: "18:05",
      delta: "+10m",
      severity: "low",
    },
  ],
  aiAnalysis:
    "Injecting a +45m delay on Maintenance Block M-442 (Kalyan - Thakurli) creates a critical bottleneck between Dadar and Kalyan. ConflictGuard identifies 3 necessary cancellations to protect peak suburban punctuality.",
};

export const INITIAL_INTERVENTIONS: InterventionLog[] = [];

export interface RolePreset {
  id: string;
  name: string;
  empId: string;
  role: string;
  department: DepartmentType;
  userRole: UserRole;
  avatarUrl: string;
  badge: string;
  badgeColor: string;
  description: string;
}

export const DEMO_USER_PROFILES: RolePreset[] = [];

export const DEPARTMENT_SUPERVISOR_MAP = {
  Track: {
    name: "Rajesh K. Shinde",
    empId: "SUP-CR-3104",
    designation: "Senior Section Engineer (SSE / P-Way, Dadar Section)",
    phone: "+91 98201 44521",
    depot: "Dadar P-Way Maintenance Depot (Km 9/12)",
    status: "Active on Duty" as const,
    email: "sup-cr-3104@railpravah.gov.in",
  },
  Electrical: {
    name: "Sunil G. Gaikwad",
    empId: "SUP-CR-3105",
    designation: "Senior Section Engineer (SSE / Traction Distribution TRD)",
    phone: "+91 98202 88412",
    depot: "Kalyan TRD Power & Catenary Substation",
    status: "Active on Duty" as const,
    email: "sup-cr-3105@railpravah.gov.in",
  },
  Signal: {
    name: "Deepak V. Kulkarni",
    empId: "SUP-CR-3106",
    designation: "Senior Section Engineer (SSE / Signal & Telecom)",
    phone: "+91 98203 11984",
    depot: "Byculla S&T Base Depot (Floor 1)",
    status: "Active on Duty" as const,
    email: "sup-cr-3106@railpravah.gov.in",
  },
  Other: {
    name: "Anand B. Deshmukh",
    empId: "SUP-CR-3107",
    designation: "Divisional Traffic Inspector (DTI / Yard Operations)",
    phone: "+91 98204 99120",
    depot: "CSMT Central Traffic Control Room (Floor 2)",
    status: "Active on Duty" as const,
    email: "dti.ops.csmt@cr.railnet.gov.in",
  },
};

export const INITIAL_WORKER_REPORTED_ISSUES = [];

export const INITIAL_HIERARCHICAL_ISSUES: HierarchicalIssue[] = [];


