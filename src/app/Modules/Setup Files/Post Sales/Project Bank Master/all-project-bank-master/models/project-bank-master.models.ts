/**
 * TypeScript interfaces for Project Bank Master Management
 */

export interface Project {
  project_id: number;
  property_name: string;
}

export interface Wing {
  wing_id: number;
  wing_name: string;
}

export interface BankDetail {
  project_bank_id: number;
  project_id: number;
  bank_id: number;
  wing_id: number;
  account_type: string | null;
  bank_name: string;
  branch_name: string;
  project_name: string;
  account_no: string;
  ifsc_code: string;
  beneficiary_name: string;
  address: string;
  created_by: number;
  created_by_string: string;
  created_at: string;
  updated_by: number;
  updated_by_string: string;
  updated_at: string;
}

export interface WingData {
  wing_name: string;
  wing_id: number;
  wing_data: BankDetail[];
}

export interface ProjectBankData {
  project_name: string;
  wings: WingData[];
}

export interface ProjectBankResponse {
  success: boolean;
  data: ProjectBankData[];
}

export interface DialogData {
  mode: 'add' | 'edit';
  bankData?: BankDetail;
  projectId?: number;
  wingId?: number;
}





































