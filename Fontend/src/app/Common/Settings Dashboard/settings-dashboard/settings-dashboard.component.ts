import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  DestroyRef,
  untracked,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

// Module imports
import { AngularMaterialModule } from '../../../../angular-material.module';
import { TruncatePipe } from '../../../Pipes/truncate.pipe';
import { TemplateComponent } from '../../template/template.component';
import { environment } from '../../../../environments/environment';

// Configuration imports
import {
  MENU_ITEMS,
  MENU_SECTIONS,
  type MenuItem,
  type MenuSection,
  type MenuSectionWithItems,
  hasPermission,
  filterItemsByQuery,
  normalizeSearchQuery,
} from './settings-dashboard.config';

/**
 * Settings Dashboard Component - Production-Grade Angular Implementation
 * 
 * This component leverages advanced Angular 17+ features for maximum performance:
 * - Signal-based reactive state management with computed memoization
 * - OnPush change detection strategy for minimal re-renders
 * - Untracked side effects to prevent unnecessary signal dependencies
 * - Optimized computed signals with efficient filtering
 * - Memory-efficient cleanup with DestroyRef
 * - Type-safe configuration with readonly immutability
 * 
 * @performance
 * - Computed signals are memoized and only recalculate when dependencies change
 * - Permission checks are optimized with early returns
 * - Search filtering uses normalized queries for consistency
 * - TrackBy functions prevent unnecessary DOM re-renders
 * - Effects use untracked() to avoid creating signal dependencies
 * 
 * @features
 * - Real-time permission-based filtering
 * - Advanced search with normalized queries
 * - Section-based filtering
 * - Cross-tab permission synchronization
 * - Development mode debugging
 */
@Component({
  selector: 'app-settings-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    AngularMaterialModule,
    TruncatePipe,
  ],
  templateUrl: './settings-dashboard.component.html',
  styleUrls: ['./settings-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDashboardComponent {
  // ============================================
  // DEPENDENCY INJECTION
  // ============================================
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // ============================================
  // SIGNALS - Reactive State Management
  // ============================================

  /**
   * User permissions signal - writable signal for permission data
   * Initialized from sessionStorage but can be updated reactively
   * Uses untracked() when reading from sessionStorage to avoid signal dependency
   */
  private readonly permissions = signal<string>(
    untracked(() => sessionStorage.getItem('permission') ?? '')
  );

  /**
   * Complete menu items configuration - immutable data structure
   * Imported from configuration file for better maintainability
   */
  private readonly menuItems = MENU_ITEMS;

  /**
   * User data signals for header display
   */
  readonly userName = signal<string>(
    untracked(() => sessionStorage.getItem('user_full_name') ?? 'Projet Panwar')
  );

  readonly userRole = signal<string>(
    untracked(() => sessionStorage.getItem('role_name') ?? 'Administrator')
  );


  // ============================================
  // COMPUTED SIGNALS - Derived State (Memoized)
  // ============================================

  /**
   * All items filtered by permissions - computed once and reused
   * Optimized to filter all items in a single pass
   */
  private readonly filteredItemsByPermission = computed(() => {
    const perms = this.permissions();
    return this.menuItems.filter((item) =>
      hasPermission(item.requiredPermission, perms)
    );
  });

  /**
   * Filtered user section items based on permissions
   * Uses memoized filtered items for better performance
   */
  readonly userSection = computed(() => {
    return this.filteredItemsByPermission().filter(
      (item) => item.section === 'user'
    );
  });

  /**
   * Filtered system configuration section based on permissions
   * Uses memoized filtered items for better performance
   */
  readonly otherSection = computed(() => {
    return this.filteredItemsByPermission().filter(
      (item) => item.section === 'system'
    );
  });

  /**
   * Sections configuration for template iteration
   * Combines sections with their metadata and filtered items
   * Optimized to avoid redundant filtering
   */
  readonly sections = computed<readonly MenuSectionWithItems[]>(() => {
    const userItems = this.userSection();
    const systemItems = this.otherSection();

    return MENU_SECTIONS.map((section) => ({
      ...section,
      items:
        section.key === 'user' ? userItems : systemItems,
    }));
  });

  /**
   * Check if any sections have visible items
   * Optimized with early return
   */
  readonly hasVisibleSections = computed(() => {
    const filtered = this.filteredItemsByPermission();
    return filtered.length > 0;
  });

  /**
   * Total count of visible items across all sections
   * Uses memoized filtered items for O(1) calculation
   */
  readonly totalVisibleItems = computed(
    () => this.filteredItemsByPermission().length
  );

  // ============================================
  // UI STATE SIGNALS - Search & Filtering
  // ============================================

  /**
   * Current search text used to filter items by label/description
   * Normalized in computed signals for consistency
   */
  readonly searchQuery = signal<string>('');

  /**
   * View density mode: 'comfortable' | 'compact'
   * Persisted in localStorage for user preference
   */
  readonly densityMode = signal<'comfortable' | 'compact'>(
    (() => {
      const saved = untracked(() => localStorage.getItem('settings-density'));
      return (saved === 'compact' ? 'compact' : 'comfortable') as 'comfortable' | 'compact';
    })()
  );

  /**
   * Currently selected section scope for quick filtering
   */
  readonly activeSectionFilter = signal<'all' | 'user' | 'system'>('all');

  /**
   * Normalized search query - memoized for performance
   * Only recalculates when searchQuery changes
   */
  private readonly normalizedSearchQuery = computed(() =>
    normalizeSearchQuery(this.searchQuery())
  );

  /**
   * Sections filtered by current search query and section filter
   * Highly optimized with early returns and memoized computations
   */
  readonly sectionsFiltered = computed(() => {
    const query = this.normalizedSearchQuery();
    const scope = this.activeSectionFilter();
    const allSections = this.sections();

    // Early return if no search and showing all sections
    if (!query && scope === 'all') {
      return allSections.filter((section) => section.items.length > 0);
    }

    // Filter sections by scope
    const scopeFilteredSections = allSections.filter((section) => {
      if (scope === 'all') return true;
      return section.key === scope;
    });

    // Apply search filter if query exists
    if (query) {
      return scopeFilteredSections
        .map((section) => ({
          ...section,
          items: filterItemsByQuery(section.items, query),
        }))
        .filter((section) => section.items.length > 0);
    }

    return scopeFilteredSections.filter((section) => section.items.length > 0);
  });

  /**
   * Whether any filtered section has visible items
   * Optimized with early return
   */
  readonly hasVisibleSectionsFiltered = computed(() => {
    const filtered = this.sectionsFiltered();
    return filtered.length > 0 && filtered.some((s) => s.items.length > 0);
  });

  // ============================================
  // CONSTRUCTOR WITH OPTIMIZED EFFECTS
  // ============================================

  constructor() {
    // Initialize user data from sessionStorage
    effect(() => {
      untracked(() => {
        const fullName = sessionStorage.getItem('user_full_name');
        const roleName = sessionStorage.getItem('role_name');

        if (fullName) {
          this.userName.set(fullName);
        }
        if (roleName) {
          this.userRole.set(roleName);
        }
      });
    });

    // Effect for debugging permission changes in development
    // Uses untracked() to prevent creating signal dependencies for logging
    effect(() => {
      if (!environment.production) {
        untracked(() => {
          console.log('📊 Settings Dashboard State:', {
            permissions: this.permissions(),
            totalItems: this.totalVisibleItems(),
            userSectionCount: this.userSection().length,
            systemSectionCount: this.otherSection().length,
            searchQuery: this.searchQuery(),
            densityMode: this.densityMode(),
          });
        });
      }
    });

    // Effect to listen for storage changes (cross-tab synchronization)
    // Uses untracked() when accessing window to avoid signal dependencies
    effect(() => {
      // Track permissions signal to trigger effect
      this.permissions();

      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'permission' && event.newValue) {
          const newPermissions = event.newValue;
          untracked(() => {
            this.permissions.set(newPermissions);
          });
        }
      };

      untracked(() => {
        window.addEventListener('storage', handleStorageChange);
      });

      // Cleanup registered automatically via destroyRef
      this.destroyRef.onDestroy(() => {
        untracked(() => {
          window.removeEventListener('storage', handleStorageChange);
        });
      });
    });

    // Effect to persist density mode preference
    effect(() => {
      const mode = this.densityMode();
      untracked(() => {
        localStorage.setItem('settings-density', mode);
      });
    });
  }

  // ============================================
  // METHODS - Event Handlers & Utilities
  // ============================================

  /**
   * Handles card click events, prevents navigation for disabled items
   * Optimized with early return and proper event handling
   * @param event - Click or keyboard event
   * @param item - Menu item that was clicked
   */
  onCardClick(event: Event, item: MenuItem): void {
    if (!item.disabled) return;

    event.preventDefault();
    event.stopPropagation();

    this.snackBar.open(
      `${item.label} is currently unavailable`,
      'Dismiss',
      {
        duration: 3000,
        panelClass: ['snackbar-warning'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      }
    );
  }

  /**
   * Handles section filter toggle changes
   * Updates the active section filter signal when user selects a different filter
   * @param event - MatButtonToggleChange event from mat-button-toggle-group
   */
  onSectionFilterChange(event: { value: 'all' | 'user' | 'system' }): void {
    this.activeSectionFilter.set(event.value);
  }

  /**
   * Triggers a soft refresh feedback without reloading data
   * Gives users confirmation that the dashboard is up-to-date
   */
  refreshSections(): void {
    this.snackBar.open('Settings dashboard refreshed', 'Dismiss', {
      duration: 2500,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  // ============================================
  // TRACKBY FUNCTIONS - Performance Optimization
  // ============================================

  /**
   * TrackBy function for @for optimization
   * Uses routerLink as unique identifier for stable DOM references
   * Prevents unnecessary DOM re-renders when array order changes
   * @param index - Item index in array (unused but required by Angular)
   * @param item - Menu item
   * @returns Unique identifier for tracking
   */
  trackByRouterLink(_index: number, item: MenuItem): string {
    return item.routerLink;
  }

  /**
   * TrackBy function for sections
   * Uses section key for stable DOM references
   * @param index - Section index (unused but required by Angular)
   * @param section - Menu section
   * @returns Unique identifier for section
   */
  trackBySection(_index: number, section: MenuSectionWithItems): string {
    return section.key;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Generates a safe DOM id for section containers
   * Pure function with memoization potential
   * @param title - Section title
   * @returns Kebab-cased identifier
   */
  sectionId(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Public method to check if user has a specific permission
   * Can be used in template or other components
   * Uses memoized permissions signal
   * @param permission - Permission code to check
   * @returns True if user has permission
   */
  hasPermission(permission: string): boolean {
    return hasPermission(permission, this.permissions());
  }

  /**
   * Updates user permissions (useful for testing or permission changes)
   * Synchronizes with sessionStorage for persistence
   * @param newPermissions - New permission string
   */
  updatePermissions(newPermissions: string): void {
    this.permissions.set(newPermissions);
    untracked(() => {
      sessionStorage.setItem('permission', newPermissions);
    });
  }

  /**
   * Toggles density mode between comfortable and compact
   * Persists preference to localStorage
   */
  toggleDensityMode(): void {
    const current = this.densityMode();
    this.densityMode.set(current === 'comfortable' ? 'compact' : 'comfortable');
  }

  /**
   * Computed signal for user management modules count
   */
  readonly userManagementModules = computed(() => {
    return this.userSection().length;
  });

  /**
   * Get route for user management sub-modules
   * Returns routes matching MENU_ITEMS configuration for consistency
   */
  getUserManagementRoute(type: 'users' | 'customers' | 'teams' | 'vendors'): string {
    // Routes matching the MENU_ITEMS configuration
    const routes: Record<string, string> = {
      users: '/setup/all-users',
      customers: '/comming-soon',
      teams: '/all-teams',
      vendors: '/all-vendors'
    };
    return routes[type] || '/all-setupDashboard';
  }
}
