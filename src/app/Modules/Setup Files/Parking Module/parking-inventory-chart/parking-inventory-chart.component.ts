import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { CommonService } from '../../../../Service/common/common.service';
import { AllotUserParkingDialogComponent } from '../allot-user-parking-dialog/allot-user-parking-dialog.component';

// --- Interfaces ---

interface Wing {
  wing_id: number;
  wing_name: string;
}

interface Project {
  project_id: number;
  property_name: string;
}

interface ParkingUnit {
  floor_unit: string;
  unit_type: string;
  color_code: string | null;
  parking_plan_id: number;
  is_empty: boolean;
  booking_status_id: number | null;
  project_name?: string;
  wing_name?: string;
  parking_status: string | null;
  unit_id: number | null;
  wing_id?: number | null;
  floor_name?: string;
}

interface Floor {
  floor_name: string;
  units: ParkingUnit[];
  wing_id?: number | null;
}

interface InventoryStats {
  totalUnits: number;
  available: number;
  booked: number;
  reserved: number;
  occupancy: number;
}

interface ApiParkingItem {
  parking_plan_id: number;
  parking_no: string;
  parking_type: string;
  wing_name: string;
  wing_id: number | null;
  project_name: string;
  parking_status_id: number | null;
  parking_status: string | null;
  color_code: string | null;
  unit_id: number | null;
}

interface ApiParkingLevel {
  parking_level: string;
  wing_id?: number | null;
  parkings: ApiParkingItem[];
}

interface SelectedStats {
  available: number;
  booked: number;
}

@Component({
  selector: 'app-parking-inventory-chart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './parking-inventory-chart.component.html',
  styleUrls: ['./parking-inventory-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParkingInventoryChartComponent implements OnInit, AfterViewInit {
  // --- Services ---
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // --- View Children ---
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // --- Signals & State ---
  readonly loading = signal(false);
  readonly projectsList = signal<Project[]>([]);
  readonly allWingsList = signal<Wing[]>([]);

  // Current selection info
  readonly selectedProjectId = signal<number | null>(null);
  readonly selectedProjectName = signal<string>('');
  readonly selectedWingId = signal<number | null>(null);
  readonly selectedWingName = signal<string>('');

  // Primary Data Source
  readonly rawInventoryData = signal<Floor[]>([]);

  // Filter Signals
  readonly searchText = signal('');
  readonly statusFilter = signal<'all' | 'available' | 'booked'>('all');
  readonly typeFilter = signal<'all' | 'car' | 'bike'>('all');

  // Selection state
  readonly selectedParkingIds = signal<Set<number>>(new Set());
  readonly selectedFloorIds = signal<Set<string>>(new Set());

  // Material Table Data Source
  readonly dataSource = new MatTableDataSource<Floor>([]);
  readonly displayedColumns = ['floor_name', 'units'] as const;

  // --- Computed State ---

  readonly filteredData = computed(() => {
    const rawData = this.rawInventoryData();
    const query = this.searchText().toLowerCase().trim();
    const status = this.statusFilter();
    const type = this.typeFilter();
    const wingId = this.selectedWingId();

    if (!rawData.length) return [];

    // Filter floors by wing if wing is selected
    let filteredFloors = rawData;
    if (wingId) {
      filteredFloors = rawData.filter(floor =>
        floor.units.some(unit => unit.wing_id === wingId)
      );
    }

    // Filter units within floors
    return filteredFloors.map(floor => {
      const units = floor.units.filter(unit => {
        // 1. Wing filter (already applied at floor level, but double-check)
        if (wingId && unit.wing_id !== wingId) return false;

        // 2. Status Filter
        let matchesStatus = true;
        if (status === 'available') matchesStatus = !this.isBooked(unit);
        else if (status === 'booked') matchesStatus = this.isBooked(unit);

        // 3. Type Filter
        let matchesType = true;
        if (type !== 'all') {
          const t = unit.unit_type.toLowerCase();
          if (type === 'car') matchesType = t.includes('car');
          if (type === 'bike') matchesType = t.includes('bike') || t.includes('scooter') || t.includes('motorcycle');
        }

        // 4. Search Filter
        let matchesQuery = true;
        if (query) {
          matchesQuery =
            floor.floor_name.toLowerCase().includes(query) ||
            unit.floor_unit.toLowerCase().includes(query) ||
            unit.unit_type.toLowerCase().includes(query) ||
            (unit.wing_name?.toLowerCase() || '').includes(query) ||
            (unit.parking_status?.toLowerCase() || '').includes(query);
        }

        return matchesStatus && matchesType && matchesQuery;
      });

      return { ...floor, units };
    }).filter(floor => floor.units.length > 0);
  });

  readonly stats = computed<InventoryStats>(() => {
    const data = this.filteredData();
    let total = 0, booked = 0;

    data.forEach(floor => {
      floor.units.forEach(unit => {
        if (!unit.is_empty) {
          total++;
          if (this.isBooked(unit)) booked++;
        }
      });
    });

    return {
      totalUnits: total,
      available: total - booked,
      booked,
      reserved: 0, // Update this if you have reserved status
      occupancy: total > 0 ? (booked / total) * 100 : 0
    };
  });

  readonly hasData = computed(() => this.rawInventoryData().length > 0);


  // --- Effects ---
  constructor() {
    // Sync table data source with signals
    // Sync table data source with signals
    effect(() => {
      this.dataSource.data = this.filteredData();
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // --- Data Loading ---

  private loadInitialData(): void {
    const roleId = Number(sessionStorage.getItem('role_id'));
    const userId = Number(sessionStorage.getItem('session_id'));

    this.loading.set(true);
    this.commonService.fetchUserProjectDropdown(roleId === 2 ? null : userId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (list: Project[]) => this.projectsList.set(list || []),
        error: (err: any) => this.showError('Failed to load projects')
      });
  }

  onProjectChange(projectId: number): void {
    this.selectedProjectId.set(projectId);
    this.selectedWingId.set(null);
    this.selectedWingName.set('');

    // Reset Data
    this.rawInventoryData.set([]);
    this.allWingsList.set([]);

    this.fetchWings(projectId);
    this.fetchInventory(projectId);
  }

  onWingChange(wingId: number | null): void {
    this.selectedWingId.set(wingId);

    // Get wing name
    if (wingId) {
      const wing = this.allWingsList().find(w => w.wing_id === wingId);
      this.selectedWingName.set(wing?.wing_name || '');
    } else {
      this.selectedWingName.set('');
    }

    if (this.selectedProjectId()) {
      this.fetchInventory(this.selectedProjectId()!, wingId);
    }
  }

  private fetchWings(projectId: number): void {
    this.commonService.fetchWingDropdown(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wings: Wing[]) => this.allWingsList.set(wings || []),
        error: () => console.warn('Failed to fetch wings')
      });
  }

  private fetchInventory(projectId: number, wingId: number | null = null): void {
    this.loading.set(true);
    this.commonService.fetchParkingInventoryChart(projectId, wingId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          const mapped = this.mapApiToInternal(res?.data || []);
          this.rawInventoryData.set(mapped);
          if (!mapped.length && res?.message) {
            this.showToast(res.message);
          }
        },
        error: (err: any) => {
          console.error(err);
          this.showError('Failed to fetch inventory');
        }
      });
  }

  // --- Mappers & Helpers ---

  private mapApiToInternal(apiData: ApiParkingLevel[]): Floor[] {
    if (!Array.isArray(apiData)) return [];

    return apiData.map(level => {
      const units = (level.parkings || []).map(p => {
        // Handle color_code formatting
        let color = p.color_code;
        if (color && !color.startsWith('#')) {
          color = `#${color}`;
        }

        return {
          floor_unit: p.parking_no,
          unit_type: p.parking_type,
          parking_plan_id: p.parking_plan_id,
          color_code: color || null,
          is_empty: false,
          booking_status_id: p.parking_status_id,
          project_name: p.project_name,
          wing_name: p.wing_name,
          wing_id: p.wing_id,
          parking_status: p.parking_status,
          unit_id: p.unit_id,
          floor_name: level.parking_level
        } as ParkingUnit;
      });

      return {
        floor_name: level.parking_level,
        wing_id: level.wing_id,
        units
      } as Floor;
    });
  }

  isBooked(unit: ParkingUnit): boolean {
    return unit.booking_status_id === 1 ||
      unit.parking_status?.toUpperCase() === 'BOOKED' ||
      unit.parking_status?.toUpperCase() === 'BOOK';
  }


  // Selection Helpers
  isUnitSelected(unit: ParkingUnit): boolean {
    return this.selectedParkingIds().has(unit.parking_plan_id);
  }

  toggleUnitSelection(unit: ParkingUnit): void {
    const current = new Set(this.selectedParkingIds());
    if (current.has(unit.parking_plan_id)) {
      current.delete(unit.parking_plan_id);
    } else {
      current.add(unit.parking_plan_id);
    }
    this.selectedParkingIds.set(current);
  }

  clearAllSelections(): void {
    this.selectedParkingIds.set(new Set());
    this.selectedFloorIds.set(new Set());
  }

  // --- Actions ---

  refreshData(): void {
    const pid = this.selectedProjectId();
    if (pid) {
      this.fetchInventory(pid, this.selectedWingId());
    }
  }



  onUnitClick(unit: ParkingUnit): void {
    this.openAllotmentDialog([unit.parking_plan_id]);
  }

  allotSelected(): void {
    const ids = Array.from(this.selectedParkingIds());
    if (ids.length) {
      this.openAllotmentDialog(ids);
    }
  }

  openAllotmentDialog(ids: number[]): void {
    if (!ids.length) return;

    const dialogRef = this.dialog.open(AllotUserParkingDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: {
        parking_plan_ids: ids
      },
      panelClass: 'modern-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refreshData();
        this.clearAllSelections();
      }
    });
  }

  exportToExcel(): void {
    const data = this.filteredData();
    if (!data.length) return this.showToast('No data to export');

    const csvContent = [
      ['Floor', 'Unit', 'Type', 'Status', 'Wing', 'Project', 'Unit ID'].join(',')
    ];

    data.forEach(f => {
      f.units.forEach(u => {
        if (!u.is_empty) {
          const status = this.isBooked(u) ? 'Booked' : 'Available';
          csvContent.push(
            [
              `"${f.floor_name}"`,
              `"${u.floor_unit}"`,
              `"${u.unit_type}"`,
              `"${status}"`,
              `"${u.wing_name || ''}"`,
              `"${u.project_name || ''}"`,
              `"${u.unit_id || ''}"`
            ].join(',')
          );
        }
      });
    });

    const projectName = this.selectedProjectName().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const wingName = this.selectedWingName().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = wingName
      ? `parking_${projectName}_${wingName}_${Date.now()}.csv`
      : `parking_${projectName}_${Date.now()}.csv`;

    const blob = new Blob(['\uFEFF' + csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  // --- Helper Methods ---


  trackByFloorName(_: number, item: Floor): string {
    return item.floor_name;
  }

  trackByUnitId(_: number, item: ParkingUnit): number {
    return item.parking_plan_id || 0;
  }

  private showToast(msg: string): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}