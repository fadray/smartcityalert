export interface EscalationRule {
  id: string;
  level: number;
  role: string;
  timeout_minutes: number;
  next_role: string;
  is_active: boolean;
}
