import {
  Component,
  OnInit,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  HostListener
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SidebarStateService } from '../../Service/sidebar-state.service';
import { environment } from '../../../environments/environment';
import { ResetPasswordComponent } from '../../Auth/reset-password/reset-password.component';
import { NetworkStatusService } from '../../Service/network-status.service';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';

/**
 * High-performance Navbar Component with Angular 17+ advanced patterns:
 * - Standalone component with optimized imports
 * - Signals for reactive state management
 * - OnPush change detection for minimal re-renders
 * - takeUntilDestroyed for automatic subscription cleanup
 * - inject() function for clean DI
 * - Memoized computed values
 * - SSR-compatible code
 * - Production-grade error handling
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    NotificationPanelComponent
  ],
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit {
  // Dependency injection using inject() function
  private readonly router = inject(Router);
  private readonly sidebarStateService = inject(SidebarStateService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly networkStatusService = inject(NetworkStatusService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  // Constants
  readonly storageUrl = environment.STORAGE_URL;
  readonly defaultProfileImage = 'assets/Images/null_image.png';
  readonly adminRoleIds = ['1', '2'] as const;

  // Reactive state using signals
  private readonly userDataSignal = signal<UserData | null>(null);
  readonly notificationCount = signal<number>(20);
  readonly taskCount = signal<number>(0);
  readonly isNotificationOpen = signal<boolean>(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isClickInside = target.closest('.notification-container');
    if (!isClickInside && this.isNotificationOpen()) {
      this.isNotificationOpen.set(false);
    }
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.isNotificationOpen.update(v => !v);
  }

  // Computed values (memoized)
  readonly logoUrl = computed(() => {
    const logo = this.userDataSignal()?.logo;
    return logo && logo !== '' ? `${this.storageUrl}/${logo}` : null;
  });

  readonly userFullName = computed(() => this.userDataSignal()?.userFullName ?? '');
  readonly partner = computed(() => {
    const p = this.userDataSignal()?.partner;
    return p && p !== 'null' && p !== 'undefined' && p !== 'UNDEFINED' ? p : null;
  });
  readonly roleId = computed(() => this.userDataSignal()?.roleId ?? null);
  readonly roleName = computed(() => this.userDataSignal()?.roleName ?? null);

  readonly hasAdminAccess = computed(() => {
    const roleId = this.roleId();
    return roleId ? this.adminRoleIds.includes(roleId as typeof this.adminRoleIds[number]) : false;
  });

  readonly profileImageUrl = computed(() => {
    const image = this.userDataSignal()?.profileImage;
    return image ? `${this.storageUrl}/${image}` : this.defaultProfileImage;
  });

  readonly sidebarIcon = computed(() =>
    this.sidebarStateService.sidebarState() ? 'menu_open' : 'menu'
  );

  // Private state for network monitoring
  private wasOffline = false;
  private wasWeak = false;
  private wasVeryWeak = false;

  ngOnInit(): void {
    this.initializeUserData();
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize user data from sessionStorage with SSR safety
   */
  private initializeUserData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const userData: UserData = {
        userFullName: sessionStorage.getItem('user_full_name'),
        partner: sessionStorage.getItem('partner_id'),
        roleId: sessionStorage.getItem('role_id'),
        profileImage: sessionStorage.getItem('profile_image'),
        roleName: sessionStorage.getItem('role_name'),
        logo: sessionStorage.getItem('logo')
      };

      this.userDataSignal.set(userData);
    } catch (error) {
      console.error('Failed to initialize user data:', error);
    }
  }

  /**
   * Initialize network status monitoring with optimized RxJS subscriptions
   */
  private initializeNetworkMonitoring(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.wasOffline = !navigator.onLine;

    // Online/offline status monitoring
    this.networkStatusService.onlineStatus$.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((isOnline) => {
      if (!isOnline && !this.wasOffline) {
        this.wasOffline = true;
        this.showSnackBar('You are offline, Please check your internet connection.', 'error', 5000);
      } else if (isOnline && this.wasOffline) {
        this.wasOffline = false;
        this.showSnackBar('Back online! All features should work now.', 'success', 3000);
      }
    });

    // Weak connection monitoring
    this.networkStatusService.weakConnection$.pipe(
      distinctUntilChanged(),
      filter(isWeak => isWeak && !this.wasWeak),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.wasWeak = true;
      this.showSnackBar('Your internet connection seems weak. Experience may be degraded.', 'default', 5000);
    });

    // Very weak connection monitoring
    this.networkStatusService.veryWeakConnection$.pipe(
      distinctUntilChanged(),
      filter(isVeryWeak => isVeryWeak && !this.wasVeryWeak),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.wasVeryWeak = true;
      this.showSnackBar('Your internet connection is VERY slow. Some actions may fail.', 'error', 6000);
    });
  }


  /**
   * Toggle sidebar state
   */
  toggleSidebar(): void {
    this.sidebarStateService.toggleSidebarState();
  }

  /**
   * Handle image loading errors with fallback
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.defaultProfileImage) {
      img.src = this.defaultProfileImage;
    }
  }

  /**
   * Open change password dialog
   */
  openChangePasswordDialog(): void {
    this.dialog.open(ResetPasswordComponent, {
      width: '400px',
      disableClose: false,
      autoFocus: true
    });
  }

  /**
   * Logout user and navigate to login
   */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.clear();
      } catch (error) {
        console.error('Failed to clear session storage:', error);
      }
    }
    this.router.navigate(['/login']);
  }

  /**
   * Show snackbar with consistent styling
   */
  private showSnackBar(message: string, type: 'success' | 'error' | 'default', duration: number): void {
    const panelClass = type === 'error'
      ? ['snackbar-error']
      : type === 'success'
        ? ['snackbar-success']
        : [];

    this.snackBar.open(message, 'Dismiss', {
      duration,
      panelClass
    });
  }
}

/**
 * User data interface for type safety
 */
interface UserData {
  userFullName: string | null;
  partner: string | null;
  roleId: string | null;
  profileImage: string | null;
  roleName: string | null;
  logo: string | null;
}
