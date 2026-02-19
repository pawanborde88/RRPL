/**
 * Type definitions for Inventory Chart component
 */

export interface Project {
  project_id: number;
  property_name: string;
  [key: string]: any;
}

export interface Wing {
  wing_id: number;
  wing_name: string;
  [key: string]: any;
}

export interface Unit {
  floor_unit: string;
  unit_type: string;
  color_code: string;
  floor_unit_id: number | null;
  booking_status_id: number | null;
  is_empty: boolean;
  [key: string]: any;
}

export interface Floor {
  floor_id: number;
  floor_name: string;
  floor_order: number;
  units: Unit[];
  [key: string]: any;
}

export interface InventoryStats {
  totalUnits: number;
  available: number;
  booked: number;
  empty: number;
}

export interface InventoryChartResponse {
  data: Floor[];
  [key: string]: any;
}

export interface InventoryFilters {
  searchText: string;
  statusFilter: 'all' | 'available' | 'booked';
}

export type StatusFilter = 'all' | 'available' | 'booked';





































