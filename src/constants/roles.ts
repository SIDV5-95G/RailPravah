import { UserRole, DepartmentType, ComplaintStatus } from '../types/database.types.js';

export const ROLES: Record<string, UserRole> = {
  WORKER: 'worker',
  SUPERVISOR: 'supervisor',
  ZONAL_HEAD: 'zonal_head',
  DEPARTMENT_HEAD: 'department_head',
  COA_ADMIN: 'coa_admin',
};

export const DEPARTMENTS: Record<string, DepartmentType> = {
  CIVIL: 'civil',
  ELECTRICAL: 'electrical',
  SIGNAL_COMM: 'signal_comm',
};

export const ROLE_HIERARCHY_LEVEL: Record<UserRole, number> = {
  worker: 1,
  supervisor: 2,
  zonal_head: 3,
  department_head: 4,
  coa_admin: 5,
};

export const COMPLAINT_STATUS_ORDER: Record<ComplaintStatus, number> = {
  open_supervisor: 2,
  open_zonal_head: 3,
  open_department_head: 4,
  open_coa: 5,
  closed: 6,
};

export const NEXT_COMPLAINT_STATUS: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
  open_supervisor: 'open_zonal_head',
  open_zonal_head: 'open_department_head',
  open_department_head: 'open_coa',
};

// Next role title in the chain to handle complaint
export const ESCALATION_TARGET_ROLE: Partial<Record<ComplaintStatus, UserRole>> = {
  open_supervisor: 'zonal_head',
  open_zonal_head: 'department_head',
  open_department_head: 'coa_admin',
};

// Seed/Mock user dictionary for offline development and testing
export const MOCK_USERS = [
  // COA Admin
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'coa.admin@railpravah.gov.in',
    name: 'Rajesh Sharma (COA Admin)',
    role: 'coa_admin' as UserRole,
    department: null,
    reports_to: null,
  },
  // Civil
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    email: 'civil.pce@railpravah.gov.in',
    name: 'Vikramaditya Rao (Civil Dept Head / PCE)',
    role: 'department_head' as UserRole,
    department: 'civil' as DepartmentType,
    reports_to: null,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    email: 'civil.zonal@railpravah.gov.in',
    name: 'Amitabh Sengupta (Civil Zonal Head / SrDEN)',
    role: 'zonal_head' as UserRole,
    department: 'civil' as DepartmentType,
    reports_to: 'c1000000-0000-0000-0000-000000000001',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    email: 'civil.sup@railpravah.gov.in',
    name: 'Ramesh Yadav (Civil Supervisor / SSE Track)',
    role: 'supervisor' as UserRole,
    department: 'civil' as DepartmentType,
    reports_to: 'c1000000-0000-0000-0000-000000000002',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    email: 'civil.worker@railpravah.gov.in',
    name: 'Manoj Kumar (Civil Trackman)',
    role: 'worker' as UserRole,
    department: 'civil' as DepartmentType,
    reports_to: 'c1000000-0000-0000-0000-000000000003',
  },
  // Electrical
  {
    id: 'e2000000-0000-0000-0000-000000000001',
    email: 'elec.pcee@railpravah.gov.in',
    name: 'Sunil Deshmukh (Electrical Dept Head / PCEE)',
    role: 'department_head' as UserRole,
    department: 'electrical' as DepartmentType,
    reports_to: null,
  },
  {
    id: 'e2000000-0000-0000-0000-000000000002',
    email: 'elec.zonal@railpravah.gov.in',
    name: 'Praveen Nair (Electrical Zonal Head / SrDEE)',
    role: 'zonal_head' as UserRole,
    department: 'electrical' as DepartmentType,
    reports_to: 'e2000000-0000-0000-0000-000000000001',
  },
  {
    id: 'e2000000-0000-0000-0000-000000000003',
    email: 'elec.sup@railpravah.gov.in',
    name: 'Kishore Patil (Electrical Supervisor / SSE TRD)',
    role: 'supervisor' as UserRole,
    department: 'electrical' as DepartmentType,
    reports_to: 'e2000000-0000-0000-0000-000000000002',
  },
  {
    id: 'e2000000-0000-0000-0000-000000000004',
    email: 'elec.worker@railpravah.gov.in',
    name: 'Dinesh Verma (Electrical Lineman)',
    role: 'worker' as UserRole,
    department: 'electrical' as DepartmentType,
    reports_to: 'e2000000-0000-0000-0000-000000000003',
  },
  // S&T
  {
    id: 'd3000000-0000-0000-0000-000000000001',
    email: 'st.pcste@railpravah.gov.in',
    name: 'Harish Chandra (S&T Dept Head / PCSTE)',
    role: 'department_head' as UserRole,
    department: 'signal_comm' as DepartmentType,
    reports_to: null,
  },
  {
    id: 'd3000000-0000-0000-0000-000000000002',
    email: 'st.zonal@railpravah.gov.in',
    name: 'Anand Kulkarni (S&T Zonal Head / SrDSTE)',
    role: 'zonal_head' as UserRole,
    department: 'signal_comm' as DepartmentType,
    reports_to: 'd3000000-0000-0000-0000-000000000001',
  },
  {
    id: 'd3000000-0000-0000-0000-000000000003',
    email: 'st.sup@railpravah.gov.in',
    name: 'Sanjay Bhatt (S&T Supervisor / SSE Signal)',
    role: 'supervisor' as UserRole,
    department: 'signal_comm' as DepartmentType,
    reports_to: 'd3000000-0000-0000-0000-000000000002',
  },
  {
    id: 'd3000000-0000-0000-0000-000000000004',
    email: 'st.worker@railpravah.gov.in',
    name: 'Gopal Tiwari (S&T Signal Maintainer)',
    role: 'worker' as UserRole,
    department: 'signal_comm' as DepartmentType,
    reports_to: 'd3000000-0000-0000-0000-000000000003',
  },
];
