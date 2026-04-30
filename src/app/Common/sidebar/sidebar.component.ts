import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal,
  computed,
  effect,
  TrackByFunction,
  HostListener,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  takeUntil,
  shareReplay,
  map,
} from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { SidebarStateService } from '../../Service/sidebar-state.service';
import { MenuConfigService, MenuItem, MenuItems, SubMenuItem } from '../../Service/menu-config.service';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../angular-material.module';
import { SearchService } from '../../Service/search.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AutoLogoutService } from '../../Auth/services/auto-logout.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [
    RouterModule,
    AngularMaterialModule,
    CommonModule,
    ReactiveFormsModule,
  ],
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slidePanel', [
      state(
        'collapsed',
        style({
          transform: 'translateX(-100%)',
          opacity: 0,
        })
      ),
      state(
        'expanded',
        style({
          transform: 'translateX(0)',
          opacity: 1,
        })
      ),
      transition(
        'collapsed <=> expanded',
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ),
    ]),
  ],
})
export class SidebarComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private readonly menuConfigService = inject(MenuConfigService);
  private readonly sidebarStateService = inject(SidebarStateService);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly autoLogoutService = inject(AutoLogoutService);

  // Signals for reactive state management
  readonly storageUrl = signal(environment.STORAGE_URL);
  readonly searchControl = new FormControl('');
  readonly expandedMenus = signal<Set<string>>(new Set());
  readonly expandedNestedMenus = signal<{ [parentKey: string]: Set<string> }>({});
  readonly hoveredMenuKey = signal<string | null>(null);
  readonly tippyPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });
  readonly isTippyHovered = signal(false);
  readonly isMenuItemHovered = signal(false);
  readonly activeMenuItems = signal<{ [key: string]: boolean }>({});
  readonly showUserMenu = signal(false);
  readonly userName = signal('');
  readonly userEmail = signal('');

  // Computed values for better performance
  readonly menuItems = computed(() => this.menuConfigService.buildMenuItems());
  readonly menuKeys = computed(() => Object.keys(this.menuItems()));
  readonly filteredMenuKeys = signal<string[]>([]);
  readonly isSidebarExpanded = computed(() => this.sidebarStateService.getSidebarState());

  // TrackBy functions for optimal rendering
  readonly trackByMenuKey: TrackByFunction<string> = (index: number, key: string) => key;
  readonly trackBySubMenuItem: TrackByFunction<SubMenuItem> = (index: number, item: SubMenuItem) =>
    item.routerLink || item.label;
  readonly trackByNestedItem: TrackByFunction<SubMenuItem> = (index: number, item: SubMenuItem) =>
    item.routerLink || item.label;

  // Private state
  private sidebarContentEl: HTMLElement | null = null;
  private scrollPosition = 0;
  private readonly STORAGE_KEYS = {
    expandedMenus: 'expandedMenus',
    expandedNestedMenus: 'expandedNestedMenus',
  } as const;

  constructor() {
    // Initialize filtered menu keys
    this.filteredMenuKeys.set([...this.menuKeys()]);

    // Effect to update filtered keys when menu keys change
    effect(() => {
      const keys = this.menuKeys();
      if (this.filteredMenuKeys().length === 0 || keys.length !== this.filteredMenuKeys().length) {
        this.filteredMenuKeys.set([...keys]);
      }
    });

    // Setup router events with optimized subscription
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
        shareReplay(1)
      )
      .subscribe((event) => {
        this.updateActiveMenuItems(event.url);
        this.updateOpenMenusBasedOnRoute();
        this.cdr.markForCheck();
      });

    // Setup sidebar state subscription (using observable for compatibility)
    this.sidebarStateService.sidebarState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isExpanded) => {
        if (isExpanded) {
          this.updateOpenMenusBasedOnRoute();
        }
        this.cdr.markForCheck();
      });

    // Setup search service subscription
    this.searchService.search$
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.searchControl.setValue(searchTerm, { emitEvent: false });
        this.filterMenuItems(searchTerm);
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.initializeSidebarContent();
    this.restoreExpandedMenus();
    this.updateOpenMenusBasedOnRoute();
    this.setupSearchControl();
    this.updateActiveMenuItems(this.router.url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.saveScrollPosition();
  }

  private initializeSidebarContent(): void {
    // Use requestAnimationFrame for DOM access
    requestAnimationFrame(() => {
      this.sidebarContentEl = document.getElementById('sidebarContent');
    });
  }

  private setupSearchControl(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.filterMenuItems(searchTerm || '');
        this.cdr.markForCheck();
      });
  }

  filterMenuItems(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredMenuKeys.set([...this.menuKeys()]);
      this.updateOpenMenusBasedOnRoute();
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const newExpandedMenus = new Set<string>();
    const newExpandedNested: { [key: string]: Set<string> } = { ...this.expandedNestedMenus() };

    const filtered = this.menuKeys().filter((key) => {
      const menuItem = this.menuItems()[key];
      if (!menuItem) return false;

      const titleMatch = menuItem.title.toLowerCase().includes(searchLower);
      const itemsMatch = menuItem.items?.some((item) =>
        this.searchInSubMenu(item, searchLower)
      );

      if (titleMatch || itemsMatch) {
        newExpandedMenus.add(key);

        if (menuItem.items) {
          const nestedSet = new Set<string>(newExpandedNested[key] || []);
          menuItem.items.forEach(child => {
            if (
              child.items &&
              child.items.some(nested => nested.label.toLowerCase().includes(searchLower))
            ) {
              nestedSet.add(child.label);
            }
          });
          newExpandedNested[key] = nestedSet;
        }
      }

      return titleMatch || itemsMatch;
    });

    this.expandedMenus.set(newExpandedMenus);
    this.expandedNestedMenus.set(newExpandedNested);
    this.filteredMenuKeys.set(filtered);
  }

  private searchInSubMenu(item: SubMenuItem, searchLower: string): boolean {
    if (item.label.toLowerCase().includes(searchLower)) {
      return true;
    }
    return item.items?.some((nestedItem) =>
      nestedItem.label.toLowerCase().includes(searchLower)
    ) ?? false;
  }

  getVisibleSubMenuItems(parentTitle: string, items: SubMenuItem[] | undefined): SubMenuItem[] {
    if (!items) return [];
    const searchTerm = this.searchControl.value?.toLowerCase().trim() || '';

    return items.filter(item => {
      if (item.visible === false) return false;
      if (!searchTerm) return true;

      // If the top level parent matches, show all its defined direct children
      if (parentTitle.toLowerCase().includes(searchTerm)) {
        return true;
      }

      const itemMatch = item.label.toLowerCase().includes(searchTerm);
      const childrenMatch = item.items && item.items.some(child =>
        child.label.toLowerCase().includes(searchTerm) && child.visible !== false
      );

      return itemMatch || childrenMatch;
    });
  }

  getVisibleNestedItems(parentTitle: string, subItemLabel: string, items: SubMenuItem[] | undefined): SubMenuItem[] {
    if (!items) return [];
    const searchTerm = this.searchControl.value?.toLowerCase().trim() || '';

    return items.filter(item => {
      if (item.visible === false) return false;
      if (!searchTerm) return true;

      if (
        parentTitle.toLowerCase().includes(searchTerm) ||
        subItemLabel.toLowerCase().includes(searchTerm)
      ) {
        return true;
      }

      return item.label.toLowerCase().includes(searchTerm);
    });
  }

  closeAllSubmenus(): void {
    this.expandedMenus.set(new Set());
    this.expandedNestedMenus.set({});
    localStorage.removeItem(this.STORAGE_KEYS.expandedMenus);
    localStorage.removeItem(this.STORAGE_KEYS.expandedNestedMenus);
    this.cdr.markForCheck();
  }

  toggleSubmenu(menuKey: string, event: Event): void {
    if (!this.isSidebarExpanded()) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const currentExpanded = new Set(this.expandedMenus());

    if (currentExpanded.has(menuKey)) {
      currentExpanded.delete(menuKey);
    } else {
      currentExpanded.clear();
      currentExpanded.add(menuKey);
      this.expandedNestedMenus.set({ [menuKey]: new Set() });
    }

    this.expandedMenus.set(currentExpanded);
    this.persistExpandedMenus();
    this.cdr.markForCheck();
  }

  toggleNestedSubmenu(
    parentKey: string,
    itemLabel: string,
    event: Event
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const currentNested = { ...this.expandedNestedMenus() };
    if (!currentNested[parentKey]) {
      currentNested[parentKey] = new Set();
    }

    const parentSet = new Set(currentNested[parentKey]);
    if (parentSet.has(itemLabel)) {
      parentSet.delete(itemLabel);
    } else {
      parentSet.clear();
      parentSet.add(itemLabel);
    }

    currentNested[parentKey] = parentSet;
    this.expandedNestedMenus.set(currentNested);
    this.persistExpandedMenus();
    this.cdr.markForCheck();
  }

  isSubmenuExpanded(menuKey: string): boolean {
    if (this.isSidebarExpanded()) {
      return this.expandedMenus().has(menuKey);
    }
    return this.hoveredMenuKey() === menuKey;
  }

  isNestedSubmenuExpanded(parentKey: string, itemLabel: string): boolean {
    return this.expandedNestedMenus()[parentKey]?.has(itemLabel) ?? false;
  }

  private persistExpandedMenus(): void {
    const expanded = Array.from(this.expandedMenus());
    const nestedMenus: { [parentKey: string]: string[] } = {};

    Object.keys(this.expandedNestedMenus()).forEach((parentKey) => {
      const nestedSet = this.expandedNestedMenus()[parentKey];
      if (nestedSet?.size > 0) {
        nestedMenus[parentKey] = Array.from(nestedSet);
      }
    });

    try {
      localStorage.setItem(this.STORAGE_KEYS.expandedMenus, JSON.stringify(expanded));
      localStorage.setItem(
        this.STORAGE_KEYS.expandedNestedMenus,
        JSON.stringify(nestedMenus)
      );
    } catch (error) {
      console.warn('Failed to persist expanded menus:', error);
    }
  }

  private restoreExpandedMenus(): void {
    try {
      const expanded = localStorage.getItem(this.STORAGE_KEYS.expandedMenus);
      if (expanded) {
        const menuKeys = JSON.parse(expanded) as string[];
        this.expandedMenus.set(new Set(menuKeys));
      }

      const nestedMenus = localStorage.getItem(this.STORAGE_KEYS.expandedNestedMenus);
      if (nestedMenus) {
        const nestedMenuData = JSON.parse(nestedMenus) as {
          [parentKey: string]: string[];
        };
        const restored: { [parentKey: string]: Set<string> } = {};

        Object.keys(nestedMenuData).forEach((parentKey) => {
          restored[parentKey] = new Set(nestedMenuData[parentKey]);
        });

        this.expandedNestedMenus.set(restored);
      }
    } catch (error) {
      console.warn('Failed to restore expanded menus:', error);
    }
  }

  onMenuItemHover(menuKey: string, event: MouseEvent): void {
    this.isMenuItemHovered.set(true);
    this.hoveredMenuKey.set(menuKey);

    if (!this.isSidebarExpanded()) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      this.tippyPosition.set({
        top: rect.top,
        left: rect.right + 10,
      });
    }
    this.cdr.markForCheck();
  }

  onMenuItemLeave(menuKey: string): void {
    this.isMenuItemHovered.set(false);

    if (!this.isSidebarExpanded()) {
      setTimeout(() => {
        if (!this.isTippyHovered()) {
          this.closeTippy();
        }
      }, 100);
    }
  }

  onTippyHover(): void {
    this.isTippyHovered.set(true);
  }

  onTippyLeave(): void {
    this.isTippyHovered.set(false);
    this.closeTippy();
  }

  closeTippy(): void {
    if (!this.isTippyHovered() && !this.isMenuItemHovered()) {
      this.hoveredMenuKey.set(null);
      this.cdr.markForCheck();
    }
  }

  updateActiveMenuItems(url: string): void {
    const activeItems: { [key: string]: boolean } = {};

    for (const key of this.menuKeys()) {
      const menuItem = this.menuItems()[key];
      if (!menuItem) continue;

      if (menuItem.routerLink && url.startsWith(menuItem.routerLink)) {
        activeItems[key] = true;
      }

      if (menuItem.items) {
        for (const subItem of menuItem.items) {
          if (this.isSubmenuItemActiveRecursive(subItem, url)) {
            activeItems[key] = true;
            break;
          }
        }
      }
    }

    this.activeMenuItems.set(activeItems);
  }

  private isSubmenuItemActiveRecursive(item: SubMenuItem, url: string): boolean {
    if (item.routerLink && url.startsWith(item.routerLink)) {
      return true;
    }
    return item.items?.some((nestedItem) =>
      this.isSubmenuItemActiveRecursive(nestedItem, url)
    ) ?? false;
  }

  private updateOpenMenusBasedOnRoute(): void {
    if (!this.isSidebarExpanded()) return;

    const currentExpanded = new Set(this.expandedMenus());
    const currentUrl = this.router.url;

    for (const key of this.menuKeys()) {
      const menuItem = this.menuItems()[key];
      if (!menuItem?.items) continue;

      const hasActiveItem = menuItem.items.some((item) =>
        this.isSubmenuItemActiveRecursive(item, currentUrl)
      );

      if (hasActiveItem) {
        currentExpanded.add(key);
      }
    }

    this.expandedMenus.set(currentExpanded);
    this.cdr.markForCheck();
  }

  isMenuItemActive(menuKey: string): boolean {
    const menuItem = this.menuItems()[menuKey];
    if (!menuItem) return false;

    const currentUrl = this.router.url;

    // Check if the menu item itself is active
    if (menuItem.routerLink && currentUrl.startsWith(menuItem.routerLink)) {
      return true;
    }

    // Recursively check all submenu items (including nested ones)
    if (menuItem.items) {
      return menuItem.items.some((item) =>
        this.isSubmenuItemActiveRecursive(item, currentUrl)
      );
    }

    return false;
  }

  isSubmenuItemActive(itemRouterLink?: string): boolean {
    if (!itemRouterLink) return false;
    const currentUrl = this.router.url;
    // Use startsWith to match nested routes
    return currentUrl.startsWith(itemRouterLink);
  }

  isNestedToggleActive(item: SubMenuItem): boolean {
    if (!item) return false;
    const currentUrl = this.router.url;
    // Check if any nested child is active
    return this.isSubmenuItemActiveRecursive(item, currentUrl);
  }

  onSubmenuItemClick(): void {
    this.saveScrollPosition();
    if (!this.isSidebarExpanded()) {
      this.closeTippy();
    }
    // Auto-close on mobile
    if (window.innerWidth < 576) {
      this.sidebarStateService.setSidebarState(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarStateService.toggleSidebarState();
    this.cdr.markForCheck();
  }

  onMainItemClick(menuKey: string, event: MouseEvent): void {
    event.preventDefault();
    const menuItem = this.menuItems()[menuKey];
    if (!menuItem) return;

    if (menuItem.items && menuItem.items.length > 0) {
      if (!this.isSidebarExpanded()) {
        this.sidebarStateService.toggleSidebarState();
      }
      this.toggleSubmenu(menuKey, event);
    } else if (menuItem.routerLink) {
      this.router.navigate([menuItem.routerLink]);
      // Auto-close on mobile
      if (window.innerWidth < 576) {
        this.sidebarStateService.setSidebarState(false);
      }
    }
  }

  handleSubItemClick(item: SubMenuItem): void {
    if (item.routerLink) {
      this.router.navigate([item.routerLink]);
      // Auto-close on mobile
      if (window.innerWidth < 576) {
        this.sidebarStateService.setSidebarState(false);
      }
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu.update((value) => !value);
    this.cdr.markForCheck();
  }

  readonly profileImage = signal('assets/Images/null_image.png');
  readonly userRole = signal('');

  loadUserData(): void {
    try {
      // Logic matching NavbarComponent
      const fullName = sessionStorage.getItem('user_full_name');
      const profileImg = sessionStorage.getItem('profile_image');
      const roleName = sessionStorage.getItem('role_name');
      const email = sessionStorage.getItem('user_email'); // Fallback or separate key if needed

      this.userName.set(fullName || 'User Name');
      this.userRole.set(roleName || '');
      this.userEmail.set(email || ''); // Keeping email for now, though Navbar uses Role often

      if (profileImg) {
        // Construct full URL if it's a relative path, similar to Navbar
        // Assuming environment.STORAGE_URL is needed
        this.profileImage.set(`${this.storageUrl()}/${profileImg}`);
      }
    } catch (error) {
      console.warn('Failed to load user data:', error);
      this.setDefaultUserData();
    }
  }

  private setDefaultUserData(): void {
    this.userName.set('User Name');
    this.userRole.set('User');
    this.profileImage.set('assets/Images/null_image.png');
  }

  handleImageError(): void {
    this.profileImage.set('assets/Images/null_image.png');
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.autoLogoutService.executeLogout();
  }

  private saveScrollPosition(): void {
    if (this.sidebarContentEl) {
      this.scrollPosition = this.sidebarContentEl.scrollTop;
    }
  }

  private restoreScrollPosition(): void {
    if (this.sidebarContentEl && this.scrollPosition > 0) {
      requestAnimationFrame(() => {
        if (this.sidebarContentEl) {
          this.sidebarContentEl.scrollTop = this.scrollPosition;
        }
      });
    }
  }

  // Helper method to check if menu item is visible
  isMenuItemVisible(menuKey: string): boolean {
    return this.menuItems()[menuKey]?.visible ?? false;
  }

  // Get general menu keys (exclude support items)
  getGeneralMenuKeys(): string[] {
    const supportKeys = ['helpDesk', 'setup'];
    return this.filteredMenuKeys().filter(key => !supportKeys.includes(key));
  }

  // Get support menu keys (Help Desk, Setup, etc.)
  getSupportMenuKeys(): string[] {
    const supportKeys = ['helpDesk', 'setup'];
    return this.filteredMenuKeys().filter(key => supportKeys.includes(key));
  }

}
