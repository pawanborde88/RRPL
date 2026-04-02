/**
 * Menu configuration constants for Settings Dashboard
 * Extracted for better maintainability and testability
 */

export interface MenuItem {
  readonly routerLink: string;
  readonly icon: string;
  readonly label: string;
  readonly description: string;
  readonly color: string;
  readonly disabled?: boolean;
  readonly requiredPermission?: string;
  readonly section: 'user' | 'system';
  readonly badge?: string;
  readonly subtitle?: string;
  readonly estimatedRelease?: string;
}

export interface MenuSection {
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  readonly key: 'user' | 'system';
}

/**
 * Menu section with filtered items for display
 */
export interface MenuSectionWithItems extends MenuSection {
  readonly items: readonly MenuItem[];
}

/**
 * Complete menu items configuration
 * Organized by section for better maintainability
 */
export const MENU_ITEMS: readonly MenuItem[] = [
  // ========== User Management Section ==========
  {
    routerLink: '/setup/all-users',
    icon: 'supervisor_account',
    label: 'Users',
    description: 'Manage system users and their permissions',
    color: '#1976d2',
    requiredPermission: '224',
    disabled: false,
    section: 'user',
  },
  {
    routerLink: '/comming-soon',
    icon: 'people',
    label: 'Customers',
    description: 'View and manage customer accounts',
    color: '#1cc88a',
    requiredPermission: '224',
    disabled: false,
    section: 'user',
  },
  {
    routerLink: '/all-teams',
    icon: 'groups',
    label: 'Teams',
    description: 'Organize users into functional teams',
    color: '#36b9cc',
    requiredPermission: '224',
    disabled: false,
    section: 'user',
  },
  {
    routerLink: '/all-vendors',
    icon: 'store',
    label: 'Vendors',
    description: 'Manage vendor relationships',
    color: '#f6c23e',
    requiredPermission: '224',
    disabled: false,
    section: 'user',
  },

  // ========== System Configuration Section ==========
  {
    routerLink: '/all-projects',
    icon: 'holiday_village',
    label: 'All Projects',
    description: 'View and manage all projects',
    color: '#1976d2',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/module',
    icon: 'lock',
    label: 'Permission Module',
    description: 'Configure system permissions and roles',
    color: '#1cc88a',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/all-tokentypes',
    icon: 'casino',
    label: 'Token Types',
    description: 'Manage token types and configurations',
    color: '#36b9cc',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },

  {
    routerLink: '/all-citySubregion',
    icon: 'location_city',
    label: 'City Sub Regions',
    description: 'Configure geographical subdivisions',
    color: '#e74a3b',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },

  {
    routerLink: '/setup/lead_level',
    icon: 'assignment',
    label: 'Lead Status',
    description: 'Configure lead status workflow',
    color: '#e8f5fc',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/setup/sources',
    icon: 'source',
    label: 'Sources',
    description: 'Manage lead sources',
    color: '#1976d2',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/all-SOPCategory',
    icon: 'category',
    label: 'SOP Category',
    description: 'Standard operating procedure categories',
    color: '#1cc88a',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/all-preferred-location',
    icon: 'pin_drop',
    label: 'Native Location',
    description: 'Manage preferred customer locations',
    color: '#36b9cc',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/all-preferred-bank',
    icon: 'assured_workload',
    label: 'Preferred Bank',
    description: 'Configure banking partners',
    color: '#f6c23e',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/settings/dashboard/cp-booking-bill-workflow',
    icon: 'credit_card',
    label: 'CP Booking Bill Workflow',
    description: 'Create and manage project templates',
    color: '#f6c23e',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/setup/all-whatsapp-templates',
    icon: 'message',
    label: 'WhatsApp Templates',
    description: 'Manage WhatsApp templates',
    color: '#1976d2',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/setup/all-booking-offers',
    icon: 'credit_card',
    label: 'All Booking Offers',
    description: 'Manage booking offers',
    color: '#1976d2',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },

  {
    routerLink: '/ivr/all-ivrusers',
    icon: 'phone',
    label: 'IVR Users',
    description: 'Manage IVR users',
    color: '#1976d2',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/setup/all-floor',
    icon: 'layers',
    label: 'Floor',
    description: 'Manage IVR users',
    color: '#1976d2',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/all-user-login-log',
    icon: 'supervised_user_circle',
    label: 'All User Login Log',
    description: 'Manage User Login',
    color: '#d21998ff',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },
  {
    routerLink: '/whatsapp/all-whatsapp-message-log',
    icon: 'message',
    label: 'WhatsApp Message Logs',
    description: 'Manage WhatsApp message logs',
    color: '#1976d2',
    requiredPermission: '224',
    disabled: false,
    section: 'system',
  },

] as const;

/**
 * Section metadata configuration
 */
export const MENU_SECTIONS: readonly MenuSection[] = [
  {
    title: 'User Management',
    icon: 'people',
    description: 'Control access, roles, and user accounts',
    key: 'user',
  },
  {
    title: 'System Configuration',
    icon: 'tune',
    description: 'Configure system-wide settings and features',
    key: 'system',
  },
] as const;

/**
 * Permission check utility
 * Pure function for optimal performance
 */
export function hasPermission(
  requiredPermission: string | undefined,
  userPermissions: string
): boolean {
  if (!requiredPermission) return true;
  return userPermissions.includes(requiredPermission);
}

/**
 * Normalize search query for consistent filtering
 */
export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Filter items by search query
 * Optimized for performance with early returns
 */
export function filterItemsByQuery(
  items: readonly MenuItem[],
  query: string
): readonly MenuItem[] {
  if (!query) return items;

  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return items;

  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery)
  );
}
