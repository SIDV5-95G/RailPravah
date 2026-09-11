import {
  DepartmentName,
  SubDepartmentName,
  HierarchyRole,
  MumbaiCorridor,
  MaintenanceBlock,
  BlockStatus,
} from "./types";

export interface DepartmentHierarchyNode {
  name: DepartmentName;
  color: string;
  iconBg: string;
  subDepartments: {
    name: SubDepartmentName;
    teams: string[];
    activities: string[];
  }[];
}

export const MUMBAI_DEPARTMENT_HIERARCHY: DepartmentHierarchyNode[] = [
  {
    name: "Engineering",
    color: "#0284c7", // Sky blue / Engineering blue
    iconBg: "bg-sky-50 text-sky-700 border-sky-200",
    subDepartments: [
      {
        name: "Track Maintenance",
        teams: ["P-Way Team 1 (Kurla)", "P-Way Team 2 (Dadar)", "P-Way Team 3 (Thane)"],
        activities: [
          "Track Tamping",
          "Rail Grinding",
          "Track Inspection",
          "Rail Joint Maintenance",
        ],
      },
      {
        name: "Track Machine",
        teams: ["CSMT Tamping Unit 09", "BCM Machine Unit 03", "CSM Heavy Duty 14"],
        activities: [
          "Track Machine Operation",
          "Deep Ballast Screening",
          "Switch Point Relaying",
        ],
      },
      {
        name: "Bridges / Structures",
        teams: ["Bridge Team Central", "Structural Audit Unit"],
        activities: [
          "Bridge Inspection",
          "Creek Bridge Girder Strengthening",
          "Expansion Joint Clearance",
        ],
      },
    ],
  },
  {
    name: "Electrical / Traction",
    color: "#f59e0b", // Amber / Traction Yellow
    iconBg: "bg-amber-50 text-amber-700 border-amber-200",
    subDepartments: [
      {
        name: "OHE Maintenance",
        teams: ["TRD Maintenance Crew 1", "TRD Maintenance Crew 2"],
        activities: [
          "OHE Maintenance",
          "Pantograph/OHE inspection",
          "Catenary Wire Dropper Renewal",
        ],
      },
      {
        name: "OHE Inspection",
        teams: ["TRD Vidyavihar Unit", "TRD Dadar Unit"],
        activities: [
          "OHE Inspection",
          "Tower Wagon Operation",
          "Insulator Washing & Spark Gap Check",
        ],
      },
      {
        name: "Power Supply",
        teams: ["Traction Sub-Station (TSS) Kalyan", "TSS Chinchpokli"],
        activities: [
          "Traction Power Maintenance",
          "Electrical Isolation",
          "25 kV Feeder Circuit Breaker Audit",
        ],
      },
    ],
  },
  {
    name: "Signal & Telecom",
    color: "#8b5cf6", // Purple / S&T
    iconBg: "bg-purple-50 text-purple-700 border-purple-200",
    subDepartments: [
      {
        name: "Signalling",
        teams: ["S&T Ghatkopar Signal Team", "S&T Dadar Signal Team"],
        activities: [
          "Signal Maintenance",
          "Signal Inspection",
          "Track Circuit Inspection",
          "Digital Axle Counter (DAC) Tuning",
        ],
      },
      {
        name: "Interlocking",
        teams: ["Electronic Interlocking (EI) Squad", "Route Relay Interlocking Crew"],
        activities: [
          "Interlocking Maintenance",
          "Point Machine Calibration",
          "Fail-Safe Dual Redundancy Test",
        ],
      },
      {
        name: "Telecom",
        teams: ["Telecom OFC Unit Thane", "Wireless & Control Comms Team"],
        activities: [
          "Telecom Maintenance",
          "OFC Maintenance",
          "Driver-Guard VHF Radio Station Tuning",
        ],
      },
    ],
  },
  {
    name: "Operations",
    color: "#10b981", // Emerald / Traffic Green
    iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    subDepartments: [
      {
        name: "Train Control",
        teams: ["Section Controller (CSMT-TNA)", "Chief Controller Mumbai Division"],
        activities: [
          "Train Movement",
          "Traffic Block Protection",
          "Block Approval",
          "Train Regulation",
        ],
      },
      {
        name: "Traffic Management",
        teams: ["Suburban Traffic Cell", "Freight Movement Cell"],
        activities: [
          "Emergency Coordination",
          "Platform Line Re-routing",
          "Speed Restriction Caution Notice",
        ],
      },
    ],
  },
];

export const MUMBAI_CORRIDORS: MumbaiCorridor[] = [
  {
    code: "CSTM – BY",
    from: "Chhatrapati Shivaji Maharaj Terminus",
    to: "Byculla",
    fromCode: "CSTM",
    toCode: "BY",
    lengthKm: 4.5,
    status: "Normal",
    activeBlocksCount: 1,
    tracks: ["Up Slow", "Down Slow", "Up Fast", "Down Fast"],
  },
  {
    code: "BY – DR",
    from: "Byculla",
    to: "Dadar",
    fromCode: "BY",
    toCode: "DR",
    lengthKm: 4.5,
    status: "Normal",
    activeBlocksCount: 1,
    tracks: ["Up Slow", "Down Slow", "Up Fast", "Down Fast"],
  },
  {
    code: "DR – GC",
    from: "Dadar",
    to: "Ghatkopar",
    fromCode: "DR",
    toCode: "GC",
    lengthKm: 10.5,
    status: "Maintenance",
    activeBlocksCount: 3,
    tracks: ["Up Slow", "Down Slow", "Up Fast", "Down Fast", "5th Line"],
  },
  {
    code: "GC – VK",
    from: "Ghatkopar",
    to: "Vikhroli",
    fromCode: "GC",
    toCode: "VK",
    lengthKm: 3.5,
    status: "AI Optimized",
    activeBlocksCount: 1,
    tracks: ["Up Slow", "Down Slow", "Up Fast", "Down Fast"],
  },
  {
    code: "VK – TNA",
    from: "Vikhroli",
    to: "Thane",
    fromCode: "VK",
    toCode: "TNA",
    lengthKm: 11.0,
    status: "Normal",
    activeBlocksCount: 2,
    tracks: ["Up Slow", "Down Slow", "Up Fast", "Down Fast", "5th Line", "6th Line"],
  },
];

// Realistic initial maintenance blocks reflecting Central Line operations
export const INITIAL_MUMBAI_BLOCKS: MaintenanceBlock[] = [];

export const DEPARTMENT_WORKLOADS = [];

export const MUMBAI_NOTIFICATIONS = [];
