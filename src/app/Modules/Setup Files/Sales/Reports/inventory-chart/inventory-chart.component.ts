import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  DestroyRef,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { finalize } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { UnitDetailsDialogComponent } from '../unit-details-dialog/unit-details-dialog.component';
import { CommonService } from '../../../../../Service/common/common.service';

/**
 * Modern Angular 17+ Inventory Chart Component
 * Implements high-density data visualization with Signals and OnPush detection.
 */

interface Wing {
  wing_id: number;
  wing_name: string;
}

interface Project {
  project_id: number;
  property_name: string;
}

interface Unit {
  floor_unit: string;
  unit_type: string;
  color_code: string;
  floor_unit_id: number | null;
  is_empty: boolean;
  booking_status_id?: number;
}

interface Floor {
  floor_name: string;
  units: Unit[];
}

interface InventoryStats {
  totalUnits: number;
  available: number;
  booked: number;
  empty: number;
}

@Component({
  selector: 'app-inventory-chart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './inventory-chart.component.html',
  styleUrl: './inventory-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryChartComponent implements OnInit, AfterViewInit {
  // Services
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // View References
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // View Configuration
  readonly displayedColumns = ['floor_name', 'units'] as const;

  // State Signals
  readonly loading = signal(false);
  readonly projectsList = signal<Project[]>([]);
  readonly allWingslist = signal<Wing[]>([]);
  readonly rawInventoryData = signal<Floor[]>([]);

  // Filter Signals
  readonly selectedProjectId = signal<number | null>(null);
  readonly selectedWingId = signal<number | null>(null);
  readonly searchText = signal('');
  readonly statusFilter = signal<'all' | 'available' | 'booked'>('all');

  // Dynamic Sizing Signals (per floor pagination if needed)
  readonly currentPages = signal<Record<number, number>>({});
  readonly pageSizes = signal<Record<number, number>>({});

  /**
   * Computed: Calculate maximum units per floor for layout normalization
   */
  readonly maxUnitsPerFloor = computed(() => {
    const data = this.rawInventoryData();
    return data.length ? Math.max(...data.map(f => f.units?.length || 0)) : 0;
  });

  /**
   * Computed: Data with layout padding (normalization)
   */
  readonly normalizedData = computed(() => {
    const data = this.rawInventoryData();
    const maxUnits = this.maxUnitsPerFloor();
    if (!data.length) return [];

    return data.map(floor => ({
      ...floor,
      units: [
        ...(floor.units || []),
        ...Array(Math.max(0, maxUnits - (floor.units?.length || 0))).fill(null).map(() => ({
          floor_unit: '',
          unit_type: '',
          color_code: 'transparent',
          floor_unit_id: null,
          is_empty: true,
          booking_status_id: undefined
        } as Unit))
      ]
    }));
  });

  /**
   * Computed: Filtered results based on search and status
   */
  readonly filteredData = computed(() => {
    const data = this.normalizedData();
    const query = this.searchText().toLowerCase().trim();
    const status = this.statusFilter();

    if (!query && status === 'all') return data;

    return data.map(floor => {
      const filteredUnits = (floor.units || []).filter(unit => {
        // Status filtering logic
        let matchesStatus = true;
        if (status !== 'all') {
          if (unit.is_empty) {
            matchesStatus = status === 'available';
          } else {
            const isBooked = unit.booking_status_id === 1 || unit.booking_status_id === 6;
            matchesStatus = status === 'booked' ? isBooked : !isBooked;
          }
        }

        // Search filtering logic
        let matchesQuery = true;
        if (query) {
          if (floor.floor_name?.toLowerCase().includes(query)) {
            matchesQuery = true;
          } else if (!unit.is_empty) {
            matchesQuery = unit.floor_unit?.toLowerCase().includes(query) ||
              unit.unit_type?.toLowerCase().includes(query);
          } else {
            matchesQuery = false;
          }
        }

        return matchesStatus && matchesQuery;
      });

      return { ...floor, units: filteredUnits };
    }).filter(floor => floor.units.length > 0);
  });

  /**
   * Computed: Real-time inventory statistics
   */
  readonly stats = computed<InventoryStats>(() => {
    const data = this.filteredData();
    const aggregate = { totalUnits: 0, available: 0, booked: 0, empty: 0 };

    data.forEach(floor => {
      floor.units.forEach(unit => {
        if (unit.is_empty) {
          aggregate.empty++;
        } else {
          aggregate.totalUnits++;
          const isBooked = unit.booking_status_id === 1 || unit.booking_status_id === 6;
          isBooked ? aggregate.booked++ : aggregate.available++;
        }
      });
    });

    return aggregate;
  });

  readonly hasData = computed(() => this.rawInventoryData().length > 0);
  readonly hasFilteredData = computed(() => this.filteredData().length > 0);
  readonly inventoryData = computed(() => this.filteredData());

  // Material Table Integration
  readonly dataSource = signal(new MatTableDataSource<Floor>([]));

  /**
   * Synchronize DataSource with filtered data and view state
   */
  private readonly syncDataSource = effect(() => {
    const data = this.filteredData();
    const ds = new MatTableDataSource(data);
    if (this.paginator) ds.paginator = this.paginator;
    if (this.sort) ds.sort = this.sort;
    this.dataSource.set(ds);
  }, { allowSignalWrites: true });

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    this.updateTableConfig();
  }

  private updateTableConfig(): void {
    const ds = this.dataSource();
    if (this.paginator) ds.paginator = this.paginator;
    if (this.sort) ds.sort = this.sort;
  }

  /**
   * Load baseline data (Projects)
   */
  private loadInitialData(): void {
    const roleId = Number(sessionStorage.getItem('role_id'));
    const userId = Number(sessionStorage.getItem('session_id'));

    this.loading.set(true);
    this.commonService.fetchUserProjectDropdown(roleId === 2 ? null : userId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(list => this.projectsList.set(list || []));
  }

  /**
   * Handle Project selection change
   */
  onProjectChange(projectId: number): void {
    if (projectId == null) return;

    this.resetViewState();
    this.selectedProjectId.set(projectId);

    // Parallel Fetching
    this.fetchWings(projectId);
    this.fetchInventory(projectId);
  }

  /**
   * Handle Wing selection change
   */
  onWingChange(wingId: number): void {
    this.selectedWingId.set(wingId);
    this.resetFilters();

    const projectId = this.selectedProjectId();
    if (projectId) this.fetchInventory(projectId, wingId);
  }

  private fetchWings(projectId: number): void {
    this.commonService.fetchWingDropdown(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(wings => this.allWingslist.set(wings || []));
  }

  private fetchInventory(projectId: number, wingId: number | null = null): void {
    this.loading.set(true);
    this.commonService.fetchInventoryChart(projectId, wingId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(res => this.rawInventoryData.set(res?.data || []));
  }

  /**
   * Reset local view state for new data context
   */
  private resetViewState(): void {
    this.allWingslist.set([]);
    this.rawInventoryData.set([]);
    this.resetFilters();
    this.currentPages.set({});
    this.pageSizes.set({});
  }

  private resetFilters(): void {
    this.searchText.set('');
    this.statusFilter.set('all');
  }

  refreshData(): void {
    const pid = this.selectedProjectId();
    if (pid) {
      this.fetchInventory(pid, this.selectedWingId());
    } else {
      this.showToast('Please select a project first.');
    }
  }

  openUnitDialog(unit: Unit): void {
    if (!unit.is_empty && unit.floor_unit_id) {
      this.dialog.open(UnitDetailsDialogComponent, {
        width: '70vw',
        maxWidth: '70vw',
        maxHeight: '100vh',

        data: { floor_unit_id: unit.floor_unit_id },
      });
    }
  }

  setStatusFilter(status: 'all' | 'available' | 'booked'): void {
    this.statusFilter.set(status);
  }

  getFloorUnitCount(floor: Floor): number {
    return floor.units?.filter(u => !u.is_empty).length || 0;
  }

  getUnitTooltip(unit: Unit): string {
    if (unit.is_empty) return 'Empty Space';
    const isBooked = unit.booking_status_id === 1 || unit.booking_status_id === 6;
    return `${unit.floor_unit} | ${unit.unit_type} | ${isBooked ? 'Booked' : 'Available'}`;
  }

  /**
   * Export current inventory view to CSV
   */
  exportToExcel(): void {
    const data = this.rawInventoryData();
    if (!data.length) return this.showToast('Nothing to export.');

    try {
      const rows = ['Floor,Unit,Type,Status'];
      data.forEach(f => {
        f.units?.filter(u => !u.is_empty).forEach(u => {
          const status = (u.booking_status_id === 1 || u.booking_status_id === 6) ? 'Booked' : 'Available';
          rows.push(`"${f.floor_name}","${u.floor_unit}","${u.unit_type}","${status}"`);
        });
      });

      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = Object.assign(document.createElement('a'), {
        href: url,
        download: `inventory_${this.selectedProjectId()}_${Date.now()}.csv`,
        style: 'display:none'
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.showToast('Export successful', 2000);
    } catch (e) {
      this.showToast('Export failed');
    }
  }

  private showToast(msg: string, duration = 3000): void {
    this.snackBar.open(msg, 'OK', { duration });
  }

  // Trackers for Performance
  trackByWingId = (_: number, w: Wing) => w.wing_id;
  trackByUnitId = (_: number, u: Unit) => u.floor_unit_id ?? _;
  trackByFloorName = (_: number, f: Floor) => f.floor_name || _;
}
