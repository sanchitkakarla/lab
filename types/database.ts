export type CaseStatus = 'Received' | 'Prep Started' | 'In Fabrication' | 'Ready' | 'Delivered'
export type UserRole = 'owner' | 'technician' | 'front_desk'

export interface Tenant {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
  is_active: boolean
}

export interface Practice {
  id: string
  tenant_id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
  is_active: boolean
}

export interface Doctor {
  id: string
  tenant_id: string
  practice_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  portal_enabled: boolean
  created_at: string
}

export interface Product {
  id: string
  tenant_id: string
  name: string
  is_active: boolean
  sort_order: number
}

export interface UserProfile {
  id: string
  tenant_id: string
  role: UserRole
  first_name: string | null
  last_name: string | null
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  tenant_id: string
  practice_id: string
  doctor_id: string
  patient_first_name: string
  patient_last_name: string
  patient_dob: string
  product_id: string | null
  tooth_numbers: number[]
  colour_shade: string | null
  order_date: string
  case_start_date: string | null
  estimated_pickup_date: string
  case_status: CaseStatus
  notes: string | null
  created_by: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  practices?: Pick<Practice, 'id' | 'name'>
  doctors?: Pick<Doctor, 'id' | 'first_name' | 'last_name' | 'email'>
  products?: Pick<Product, 'id' | 'name'>
}

export interface OrderStageHistory {
  id: string
  order_id: string
  tenant_id: string
  stage_name: CaseStatus
  changed_at: string
  changed_by: string | null
  notes: string | null
}

export const STAGE_ORDER: CaseStatus[] = [
  'Received', 'Prep Started', 'In Fabrication', 'Ready', 'Delivered'
]

export const STATUS_COLORS: Record<CaseStatus, string> = {
  'Received':       'bg-blue-100 text-blue-800',
  'Prep Started':   'bg-purple-100 text-purple-800',
  'In Fabrication': 'bg-teal-100 text-teal-800',
  'Ready':          'bg-green-100 text-green-800',
  'Delivered':      'bg-gray-100 text-gray-600',
}

export const STATUS_HEX: Record<CaseStatus, string> = {
  'Received':       '#1D6BEB',
  'Prep Started':   '#6D28D9',
  'In Fabrication': '#0D9488',
  'Ready':          '#15803D',
  'Delivered':      '#6B7280',
}

export type PickupRequestStatus = 'pending' | 'approved' | 'rejected'

export interface PickupRequest {
  id: string
  tenant_id: string
  doctor_id: string
  practice_id: string
  patient_first_name: string
  patient_last_name: string
  patient_dob: string
  product_id: string | null
  tooth_numbers: number[]
  colour_shade: string | null
  preferred_pickup_date: string
  notes: string | null
  status: PickupRequestStatus
  order_id: string | null
  created_at: string
  updated_at: string
  doctors?: Pick<Doctor, 'id' | 'first_name' | 'last_name'>
  practices?: Pick<Practice, 'id' | 'name'>
  products?: Pick<Product, 'id' | 'name'>
}

export type TicketTaskType = 'payment' | 'case_status' | 'parts_not_found' | 'appointment' | 'other'
export type TicketStatus = 'open' | 'resolved'

export interface AITicket {
  id: string
  tenant_id: string
  phone_number: string
  customer_name: string
  task_type: TicketTaskType
  task_name: string
  question: string
  status: TicketStatus
  created_at: string
}
