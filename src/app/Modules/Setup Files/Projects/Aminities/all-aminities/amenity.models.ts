/**
 * Type-safe models for Amenities feature
 */

export interface Amenity {
  amenity_id: number;
  name: string;
  category: string;
  category_id?: number;
  amenty_photo: string | string[]; // Can be a single string or array of strings
  project_id?: string | number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AmenityCategory {
  category_id: number;
  category: string;
}

export interface FetchAmenitiesRequest {
  project_id: string;
}

export interface DeleteAmenityRequest {
  amenity_id: number;
}

export interface PreviewImagesDialogData {
  images: Amenity | Amenity[];
  name: string;
}

