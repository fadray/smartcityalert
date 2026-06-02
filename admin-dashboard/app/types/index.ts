export interface User {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  role: string;
  department_id?: string;
  department?: Department;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  is_active: boolean;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  incident_type: string;
  severity_level: number;
  status: string;
  department_id: string;
  department?: Department;
  images: string[];
  current_workflow_level: number;
  escalation_history: any[];
  resolution_proofs: any[];
  approvals: any[];
  created_at: string;
  resolved_at?: string;
}

export interface Stats {
  active_incidents: number;
  today_incidents: number;
  pending_approvals: number;
  by_department: any[];
}
