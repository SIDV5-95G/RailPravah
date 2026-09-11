import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';
import { SectionFieldGroup, CautionOrder, DepartmentType } from '../types/database.types.js';

// ── Initial Seed Data for Section Field Groups & Rosters ───────────────────────
const INITIAL_FIELD_GROUPS: SectionFieldGroup[] = [
  // ── Civil / P-Way Groups ──────────────────────────────────────────────────
  {
    id: 'grp-pw-12',
    gang_code: 'GANG-PW-12',
    name: 'Track Group #12 (Dadar - Matunga)',
    department: 'civil',
    section_division: 'P-Way Dadar Sub-Division (DR - GC)',
    mate_name: 'Vivek Patil (Sr. Mate)',
    mate_contact: '+91 98201 44521',
    total_strength: 10,
    on_duty_count: 8,
    beat_location: 'Km 9/20 to Km 12/04 (Down Fast & Down Slow)',
    operational_status: 'on_patrol',
    shift_name: 'Morning (06:00 - 14:00)',
    assigned_slot_id: null,
    roster_members: [
      { emp_id: 'TM-CR-101', name: 'Vivek Patil', designation: 'Track Mate', status: 'On Duty', contact: '+91 98201 44521' },
      { emp_id: 'TM-CR-102', name: 'Suresh More', designation: 'Keyman', status: 'On Duty', contact: '+91 98201 44522' },
      { emp_id: 'TM-CR-103', name: 'Ganesh Shinde', designation: 'Trackman-I', status: 'On Duty', contact: '+91 98201 44523' },
      { emp_id: 'TM-CR-104', name: 'Raju Jadhav', designation: 'Trackman-II', status: 'On Duty', contact: '+91 98201 44524' },
      { emp_id: 'TM-CR-105', name: 'Dinesh Kamble', designation: 'Trackman-II', status: 'On Duty', contact: '+91 98201 44525' },
      { emp_id: 'TM-CR-106', name: 'Amol Pawar', designation: 'Trackman-III', status: 'On Duty', contact: '+91 98201 44526' },
      { emp_id: 'TM-CR-107', name: 'Pradeep Gaikwad', designation: 'Trackman-III', status: 'On Duty', contact: '+91 98201 44527' },
      { emp_id: 'TM-CR-108', name: 'Kailash Sonawane', designation: 'Trackman-IV', status: 'On Duty', contact: '+91 98201 44528' },
      { emp_id: 'TM-CR-109', name: 'Vikas Bhosale', designation: 'Trackman-IV', status: 'Leave', contact: '+91 98201 44529' },
      { emp_id: 'TM-CR-110', name: 'Nitin Mane', designation: 'Trackman-IV', status: 'Rest', contact: '+91 98201 44530' },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'grp-pw-14',
    gang_code: 'GANG-PW-14',
    name: 'Track Group #14 (Kurla Junction Yard)',
    department: 'civil',
    section_division: 'P-Way Kurla Sub-Division (DR - GC)',
    mate_name: 'Anil Gokhale (Head Mate)',
    mate_contact: '+91 98201 88310',
    total_strength: 12,
    on_duty_count: 10,
    beat_location: 'Points & Crossings 104A/B, 108 (Kurla Fast Yard)',
    operational_status: 'turnout_maintenance',
    shift_name: 'Morning (06:00 - 14:00)',
    assigned_slot_id: null,
    roster_members: [
      { emp_id: 'TM-CR-111', name: 'Anil Gokhale', designation: 'Track Mate', status: 'On Duty', contact: '+91 98201 88310' },
      { emp_id: 'TM-CR-112', name: 'Mohan Chavan', designation: 'Keyman', status: 'On Duty', contact: '+91 98201 88311' },
      { emp_id: 'TM-CR-113', name: 'Sachin Sawant', designation: 'Blacksmith', status: 'On Duty', contact: '+91 98201 88312' },
      { emp_id: 'TM-CR-114', name: 'Ramesh Kadam', designation: 'Trackman-I', status: 'On Duty', contact: '+91 98201 88313' },
      { emp_id: 'TM-CR-115', name: 'Sunil Thorat', designation: 'Trackman-II', status: 'On Duty', contact: '+91 98201 88314' },
      { emp_id: 'TM-CR-116', name: 'Deepak Salve', designation: 'Trackman-II', status: 'On Duty', contact: '+91 98201 88315' },
      { emp_id: 'TM-CR-117', name: 'Santosh Tambe', designation: 'Trackman-III', status: 'On Duty', contact: '+91 98201 88316' },
      { emp_id: 'TM-CR-118', name: 'Pravin Kharat', designation: 'Trackman-III', status: 'On Duty', contact: '+91 98201 88317' },
      { emp_id: 'TM-CR-119', name: 'Manoj Ghodke', designation: 'Trackman-IV', status: 'On Duty', contact: '+91 98201 88318' },
      { emp_id: 'TM-CR-120', name: 'Ajay Shinde', designation: 'Trackman-IV', status: 'On Duty', contact: '+91 98201 88319' },
      { emp_id: 'TM-CR-121', name: 'Sanjay Lokhande', designation: 'Trackman-IV', status: 'Leave', contact: '+91 98201 88320' },
      { emp_id: 'TM-CR-122', name: 'Rohit Waghmare', designation: 'Helper', status: 'Rest', contact: '+91 98201 88321' },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // ── Electrical / TRD Groups ───────────────────────────────────────────────
  {
    id: 'grp-trd-04',
    gang_code: 'GANG-TRD-04',
    name: 'TRD Overhead Group #04 (Kurla - Vidyavihar)',
    department: 'electrical',
    section_division: 'Traction Distribution Central Line',
    mate_name: 'P. V. Kulkarni (TRD Supervisor)',
    mate_contact: '+91 98202 11980',
    total_strength: 8,
    on_duty_count: 7,
    beat_location: 'OHE Mast #14/02 to #18/20 (Contact Wire Inspection)',
    operational_status: 'standby',
    shift_name: 'Morning (06:00 - 14:00)',
    assigned_slot_id: null,
    roster_members: [
      { emp_id: 'EL-CR-201', name: 'P. V. Kulkarni', designation: 'TRD Incharge', status: 'On Duty', contact: '+91 98202 11980' },
      { emp_id: 'EL-CR-202', name: 'Mahesh Deshmukh', designation: 'Linesman-I', status: 'On Duty', contact: '+91 98202 11981' },
      { emp_id: 'EL-CR-203', name: 'Sandip Gite', designation: 'Linesman-II', status: 'On Duty', contact: '+91 98202 11982' },
      { emp_id: 'EL-CR-204', name: 'Rahul Zagade', designation: 'Tower Car Driver', status: 'On Duty', contact: '+91 98202 11983' },
      { emp_id: 'EL-CR-205', name: 'Yogesh Shinde', designation: 'Khalasi', status: 'On Duty', contact: '+91 98202 11984' },
      { emp_id: 'EL-CR-206', name: 'Ashok Bhalerao', designation: 'Khalasi', status: 'On Duty', contact: '+91 98202 11985' },
      { emp_id: 'EL-CR-207', name: 'Chetan Mhatre', designation: 'Helper', status: 'On Duty', contact: '+91 98202 11986' },
      { emp_id: 'EL-CR-208', name: 'Vijay Pote', designation: 'Helper', status: 'Leave', contact: '+91 98202 11987' },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // ── Signal & Telecom Groups ───────────────────────────────────────────────
  {
    id: 'grp-st-02',
    gang_code: 'GANG-ST-02',
    name: 'S&T Signal Squad #02 (Byculla - Dadar)',
    department: 'signal_comm',
    section_division: 'Signal & Telecom Suburban Division',
    mate_name: 'D. M. Nair (Signal Inspector)',
    mate_contact: '+91 98203 77412',
    total_strength: 7,
    on_duty_count: 6,
    beat_location: 'Auto Signals S-12, S-14 & Point Machine 101/A',
    operational_status: 'on_patrol',
    shift_name: 'Morning (06:00 - 14:00)',
    assigned_slot_id: null,
    roster_members: [
      { emp_id: 'ST-CR-301', name: 'D. M. Nair', designation: 'Signal Inspector', status: 'On Duty', contact: '+91 98203 77412' },
      { emp_id: 'ST-CR-302', name: 'Anand Shirodkar', designation: 'Signal Maintainer-I', status: 'On Duty', contact: '+91 98203 77413' },
      { emp_id: 'ST-CR-303', name: 'Kiran Gurav', designation: 'Telecom Maintainer', status: 'On Duty', contact: '+91 98203 77414' },
      { emp_id: 'ST-CR-304', name: 'Tushar Mohite', designation: 'Signal Maintainer-II', status: 'On Duty', contact: '+91 98203 77415' },
      { emp_id: 'ST-CR-305', name: 'Ravindra Patil', designation: 'Point Technician', status: 'On Duty', contact: '+91 98203 77416' },
      { emp_id: 'ST-CR-306', name: 'Virendra Pal', designation: 'Helper', status: 'On Duty', contact: '+91 98203 77417' },
      { emp_id: 'ST-CR-307', name: 'Mayur Jagtap', designation: 'Helper', status: 'Rest', contact: '+91 98203 77418' },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ── Initial Caution Orders Seed Data ──────────────────────────────────────────
const INITIAL_CAUTION_ORDERS: CautionOrder[] = [
  {
    id: 'co-dr-402',
    order_no: 'CO-DR-402',
    section_location: 'Km 10/18 (Mast #10/24)',
    track_line: 'Down Slow',
    imposed_speed: '30 KMPH',
    reason: 'Fishplate bolt elongation & tongue rail check',
    status: 'active',
    department: 'civil',
    imposed_at: '2026-09-08T06:00:00+05:30',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'co-dr-398',
    order_no: 'CO-DR-398',
    section_location: 'Km 8/12 (Matunga Curve)',
    track_line: 'Up Fast',
    imposed_speed: '45 KMPH',
    reason: 'Cushion deep screening tamp pending',
    status: 'revocation_review',
    department: 'civil',
    imposed_at: '2026-09-07T14:30:00+05:30',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'co-trd-105',
    order_no: 'CO-TRD-105',
    section_location: 'Km 15/04 (Kurla Outer)',
    track_line: 'Down Fast',
    imposed_speed: '50 KMPH',
    reason: 'Catenary dropper adjustment & isolator inspection',
    status: 'active',
    department: 'electrical',
    imposed_at: '2026-09-09T08:00:00+05:30',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let inMemoryFieldGroups = [...INITIAL_FIELD_GROUPS];
let inMemoryCautionOrders = [...INITIAL_CAUTION_ORDERS];

/**
 * GET /api/supervisor/field-groups
 * Returns all section field groups & rosters from Supabase or memory.
 */
export const getFieldGroups = async (req: Request, res: Response): Promise<void> => {
  const deptQuery = (req.headers['x-user-dept'] || req.query.department || req.query.dept || '') as string;
  let deptKey: DepartmentType | 'all' = 'all';
  const cleanDept = deptQuery.toLowerCase();
  if (cleanDept.includes('elect') || cleanDept.includes('trd') || cleanDept.includes('tract')) deptKey = 'electrical';
  else if (cleanDept.includes('sign') || cleanDept.includes('s&t') || cleanDept.includes('comm')) deptKey = 'signal_comm';
  else if (cleanDept.includes('civ') || cleanDept.includes('track') || cleanDept.includes('p-way') || cleanDept.includes('pway')) deptKey = 'civil';

  let groups = [...inMemoryFieldGroups];

  if (isSupabaseConfigured()) {
    try {
      let query = supabaseAdmin.from('section_field_groups').select('*').order('gang_code', { ascending: true });
      if (deptKey !== 'all') {
        query = query.eq('department', deptKey);
      }
      const { data: dbData, error } = await query;
      if (!error && dbData && dbData.length > 0) {
        groups = dbData;
      } else if (!error && (!dbData || dbData.length === 0)) {
        await supabaseAdmin.from('section_field_groups').upsert(INITIAL_FIELD_GROUPS as any);
      }
    } catch (err) {
      console.warn('Supabase getFieldGroups note:', err);
    }
  }

  if (deptKey !== 'all') {
    groups = groups.filter((g) => g.department === deptKey);
  }

  res.json({
    success: true,
    count: groups.length,
    groups,
  });
};

/**
 * POST /api/supervisor/field-groups
 * Creates a new field squad / gang roster.
 */
export const createFieldGroup = async (req: Request, res: Response): Promise<void> => {
  const body = req.body;
  const newGroup: SectionFieldGroup = {
    id: body.id || `grp-${Date.now()}`,
    gang_code: body.gang_code || `GANG-${Date.now().toString().slice(-4)}`,
    name: body.name || 'New Section Field Squad',
    department: body.department || 'civil',
    section_division: body.section_division || 'Central Railway Section',
    mate_name: body.mate_name || 'Staff Mate',
    mate_contact: body.mate_contact || '',
    total_strength: Number(body.total_strength) || (body.roster_members ? body.roster_members.length : 8),
    on_duty_count: Number(body.on_duty_count) || (body.roster_members ? body.roster_members.filter((m: any) => m.status === 'On Duty' || m.status === 'Present').length : 8),
    beat_location: body.beat_location || 'Designated Corridor Section',
    operational_status: body.operational_status || 'standby',
    shift_name: body.shift_name || 'Morning (06:00 - 14:00)',
    assigned_slot_id: body.assigned_slot_id || null,
    roster_members: body.roster_members || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  inMemoryFieldGroups.unshift(newGroup);

  if (isSupabaseConfigured()) {
    try {
      await supabaseAdmin.from('section_field_groups').insert(newGroup as any);
    } catch (err) {
      console.warn('Supabase createFieldGroup note:', err);
    }
  }

  res.status(201).json({
    success: true,
    message: `Field group ${newGroup.name} created successfully.`,
    group: newGroup,
  });
};

/**
 * PUT /api/supervisor/field-groups/:id
 * Updates gang operational status, beat location, on-duty count, or roster members.
 */
export const updateFieldGroup = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  const idx = inMemoryFieldGroups.findIndex((g) => g.id === id || g.gang_code === id);
  if (idx !== -1) {
    inMemoryFieldGroups[idx] = {
      ...inMemoryFieldGroups[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
  }

  if (isSupabaseConfigured()) {
    try {
      await supabaseAdmin
        .from('section_field_groups')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as any)
        .or(`id.eq.${id},gang_code.eq.${id}`);
    } catch (err) {
      console.warn('Supabase updateFieldGroup note:', err);
    }
  }

  const updatedGroup = idx !== -1 ? inMemoryFieldGroups[idx] : { id, ...updates };

  res.json({
    success: true,
    message: `Section field squad updated successfully.`,
    group: updatedGroup,
  });
};

/**
 * GET /api/supervisor/caution-orders
 * Returns all active and historical caution orders.
 */
export const getCautionOrders = async (req: Request, res: Response): Promise<void> => {
  const deptQuery = (req.headers['x-user-dept'] || req.query.department || req.query.dept || '') as string;
  let deptKey: DepartmentType | 'all' = 'all';
  const cleanDept = deptQuery.toLowerCase();
  if (cleanDept.includes('elect') || cleanDept.includes('trd') || cleanDept.includes('tract')) deptKey = 'electrical';
  else if (cleanDept.includes('sign') || cleanDept.includes('s&t') || cleanDept.includes('comm')) deptKey = 'signal_comm';
  else if (cleanDept.includes('civ') || cleanDept.includes('track') || cleanDept.includes('p-way') || cleanDept.includes('pway')) deptKey = 'civil';

  let orders = [...inMemoryCautionOrders];

  if (isSupabaseConfigured()) {
    try {
      let query = supabaseAdmin.from('caution_orders').select('*').order('created_at', { ascending: false });
      if (deptKey !== 'all') {
        query = query.eq('department', deptKey);
      }
      const { data: dbData, error } = await query;
      if (!error && dbData && dbData.length > 0) {
        orders = dbData;
      } else if (!error && (!dbData || dbData.length === 0)) {
        await supabaseAdmin.from('caution_orders').upsert(INITIAL_CAUTION_ORDERS as any);
      }
    } catch (err) {
      console.warn('Supabase getCautionOrders note:', err);
    }
  }

  if (deptKey !== 'all') {
    orders = orders.filter((o) => o.department === deptKey);
  }

  res.json({
    success: true,
    count: orders.length,
    orders,
  });
};

/**
 * POST /api/supervisor/caution-orders
 * Creates a new caution order.
 */
export const createCautionOrder = async (req: Request, res: Response): Promise<void> => {
  const body = req.body;
  const newOrder: CautionOrder = {
    id: body.id || `co-${Date.now()}`,
    order_no: body.order_no || `CO-DR-${Math.floor(100 + Math.random() * 900)}`,
    section_location: body.section_location || 'Central Line Corridor',
    track_line: body.track_line || 'Down Slow',
    imposed_speed: body.imposed_speed || '30 KMPH',
    reason: body.reason || 'Track inspection restriction',
    status: body.status || 'active',
    department: body.department || 'civil',
    imposed_at: body.imposed_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  inMemoryCautionOrders.unshift(newOrder);

  if (isSupabaseConfigured()) {
    try {
      await supabaseAdmin.from('caution_orders').insert(newOrder as any);
    } catch (err) {
      console.warn('Supabase createCautionOrder note:', err);
    }
  }

  res.status(201).json({
    success: true,
    message: `Caution order ${newOrder.order_no} created successfully.`,
    order: newOrder,
  });
};

/**
 * PUT /api/supervisor/caution-orders/:id
 * Updates caution order status (e.g. active, revocation_review, cancelled).
 */
export const updateCautionOrder = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  const idx = inMemoryCautionOrders.findIndex((o) => o.id === id || o.order_no === id);
  if (idx !== -1) {
    inMemoryCautionOrders[idx] = {
      ...inMemoryCautionOrders[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
  }

  if (isSupabaseConfigured()) {
    try {
      await supabaseAdmin
        .from('caution_orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as any)
        .or(`id.eq.${id},order_no.eq.${id}`);
    } catch (err) {
      console.warn('Supabase updateCautionOrder note:', err);
    }
  }

  const updatedOrder = idx !== -1 ? inMemoryCautionOrders[idx] : { id, ...updates };

  res.json({
    success: true,
    message: `Caution order updated successfully.`,
    order: updatedOrder,
  });
};
