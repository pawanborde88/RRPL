/**
 * TypeScript interfaces for Project QR Code Management
 */

export interface Project {
  project_id: string | number;
  property_name: string;
  project_logo?: string | null;
  project_slug?: string;
  slug_log?: {
    created_by_name?: string;
    updated_at?: string | Date;
  };
}

// Re-export from EnquiryManagementService for convenience
export type { ProjectDropdownResponse } from '../../services/enquiry-management.service';

export interface ProjectQRDetailsResponse extends Project {
  project_slug: string;
}

export interface QRProjectDetailsPayload {
  project_id: string | number;
}

export interface ChangeProjectSlugPayload {
  project_id: string | number;
  created_by: number | null;
}

export type DownloadFormat = 'png' | 'pdf';

export interface ShareData {
  title: string;
  text: string;
  url: string;
}






































