/**
 * Constants for Comment Log component
 * Centralizes magic values and configuration
 */

export const COMMENT_LOG_CONSTANTS = {
  // Lead Level IDs with special behavior
  LEAD_LEVEL: {
    NO_FOLLOW_UP_REQUIRED: 13, // Lead level that doesn't require follow-up
    NO_FOLLOW_UP_REQUIRED_ALT: 24,
    NO_FOLLOW_UP_REQUIRED_ALT_2: 25, // Alternative lead level that doesn't require follow-up
  },
  
  // Date configuration
  DATE_FORMAT: {
    DISPLAY: 'dd MMM yyyy, hh:mm a',
    DATE_ONLY: 'dd MMM yyyy',
    API_DATE: 'yyyy-MM-dd',
    API_TIME: 'HH:mm',
  },
  
  // Follow-up configuration
  FOLLOW_UP: {
    MAX_DAYS_AHEAD: 30,
  },
  
  // Snackbar configuration
  SNACKBAR: {
    DURATION: 3000,
    CLOSE_ACTION: 'Close',
  },
  
  // Dialog configuration
  DIALOG: {
    MIN_WIDTH: '25vw',
  },
  
  // Error messages
  ERROR_MESSAGES: {
    FETCH_COMMENTS: 'Unable to fetch comments.',
    FETCH_LEAD_LEVELS: 'Unable to fetch lead levels.',
    FETCH_CALL_STATUS: 'Unable to fetch call statuses.',
    DELETE_COMMENT: 'Unable to delete comment.',
    SUBMIT_COMMENT: 'Failed to submit comment.',
    INVALID_COMMENT_ID: 'Invalid Comment ID',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    DELETE_COMMENT: 'Comment deleted successfully',
  },
  
  // Confirmation messages
  CONFIRMATION_MESSAGES: {
    DELETE_COMMENT: 'Are you sure you want to delete this comment?',
  },
  
  // API Endpoints
  API_ENDPOINTS: {
    FETCH_LEAD_FOLLOW_UP: 'fetch_lead_follow_up',
    FETCH_COMMENT: 'fetch_comment',
    DELETE_LEAD_FOLLOW_UP: 'delete_lead_follow_up',
    DELETE_COMMENT: 'delete_comment',
    FETCH_LEAD_LEVEL: 'fetch_lead_level',
    CALL_STATUS_DROPDOWN: 'call_status_dropdown',
  },
  
  // Component types
  COMPONENT_TYPE: {
    ENQUIRIES: 'Enquiries',
    LEAD_FOLLOW_UP: 'lead-followUp',
  },
  
  // Storage keys
  STORAGE_KEYS: {
    ROLE_ID: 'role_id',
    SESSION_ID: 'session_id',
  },
} as const;

// Type for component types
export type ComponentType =
  | typeof COMMENT_LOG_CONSTANTS.COMPONENT_TYPE.ENQUIRIES
  | typeof COMMENT_LOG_CONSTANTS.COMPONENT_TYPE.LEAD_FOLLOW_UP;








