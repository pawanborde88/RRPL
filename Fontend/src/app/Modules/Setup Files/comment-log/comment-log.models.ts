/**
 * Type-safe models for Comment Log component
 * Ensures compile-time type checking and better IDE support
 */

export interface CommentLog {
  comment_log_id?: number;
  lead_follow_up_id?: number;
  commented_by?: string;
  created_by_name?: string;
  created_at: string;
  comment?: string;
  remark?: string;
  lead_level?: string;
  call_status?: string;
  follow_up_date?: string;
  follow_up_period?: string;
}

export interface LeadLevel {
  lead_level_id: number;
  lead_level: string;
}

export interface CallStatus {
  call_status_id: number;
  call_status: string;
}

export interface CommentFormData {
  created_by: number;
  enquiry_id?: number;
  token_id?: number;
  project_lead_id?: number;
  lead_level_id: number;
  project_id?: number | null;
  call_status_id: number;
  follow_up_date?: string;
  follow_up_period?: string;
  comment?: string;
  remark?: string;
}

export interface ApiResponse {
  message: string;
  success?: boolean;
  data?: any;
}

export interface DialogData {
  title: string;
  for: 'Enquiries' | 'lead-followUp' | string;
  apiUrl: string;
  payload: string;
  request: any;
  rowData?: {
    project_enq_id?: number;
    token_id?: number;
    project_lead_id?: number;
    project_id?: number | number[];
  };
}

export enum CommentType {
  ENQUIRIES = 'Enquiries',
  LEAD_FOLLOW_UP = 'lead-followUp',
}

export enum ApiEndpoint {
  FETCH_LEAD_FOLLOW_UP = 'fetch_lead_follow_up',
  FETCH_COMMENT = 'fetch_comment',
  DELETE_LEAD_FOLLOW_UP = 'delete_lead_follow_up',
  DELETE_COMMENT = 'delete_comment',
}





















































