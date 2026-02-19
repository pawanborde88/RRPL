import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, themeQuartz } from 'ag-grid-community';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, switchMap, tap } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../../../Common/template/template.component';
import { UnitPaymentScheduleCongigListComponent } from '../unit-payment-schedule-congig-list/unit-payment-schedule-congig-list.component';
import { UnitScheduleFloorCellRendererComponent } from './cell-renderers/unit-schedule-floor-cell-renderer.component';
import { UnitScheduleUnitCellRendererComponent } from './cell-renderers/unit-schedule-unit-cell-renderer.component';
import { CostomLoadingComponent } from '../../../../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
import { CommonService } from '../../../../../../../Service/common/common.service';
import { environment } from '../../../../../../../../environments/environment';

@Component({
  selector: 'app-unit-payment-schedule-config',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AgGridAngular,
    AutocompleteReusableComponent,
    UnitPaymentScheduleCongigListComponent,
    UnitScheduleFloorCellRendererComponent,
    UnitScheduleUnitCellRendererComponent,
    CostomLoadingComponent,
  ],
  templateUrl: './unit-payment-schedule-config.component.html',
  styleUrl: './unit-payment-schedule-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitPaymentScheduleConfigComponent implements OnInit {
  private readonly commonService = inject(CommonService);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly baseUrl = environment.API_URL;
  private readonly userId = Number(sessionStorage.getItem('session_id') ?? 0);

  // ─── State (Signals) ─────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly loadingUnits = signal(false);
  readonly projectsList = signal<any[]>([]);
  readonly allWingsList = signal<any[]>([]);
  readonly allStatusList = signal<any[]>([]);
  readonly rowData = signal<any[]>([]);
  readonly unitColumns = signal<string[]>(['floor_name']);
  readonly allFloorsChecked = signal(false);
  readonly gridApi = signal<GridApi | null>(null);
  readonly maxUnitsCount = signal(0);
  private readonly selectionVersion = signal(0);

  // ─── Form ────────────────────────────────────────────────────────────────
  readonly addpaymentStages = new FormGroup({
    project_id: new FormControl<string | null>(null, Validators.required),
    wing_id: new FormControl<string>('', Validators.required),
    stage_id: new FormControl<string>('', Validators.required),
  });

  // ─── Computed ────────────────────────────────────────────────────────────
  readonly hasSelectedUnits = computed(() => {
    this.selectionVersion(); // depend on selection changes
    return this.rowData().some((floor: any) =>
      Object.keys(floor).some((k) => k.startsWith('unit_') && floor[k]?.checked)
    );
  });

  readonly columnDefs = computed<ColDef[]>(() => {
    const cols = this.unitColumns();
    const defs: ColDef[] = [
      {
        field: 'floor_name',
        headerName: 'Floor Name',
        cellRenderer: UnitScheduleFloorCellRendererComponent,
        minWidth: 160,
        sortable: true,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        pinned: 'left',
        lockPinned: true,
      },
    ];
    cols.slice(1).forEach((col, i) => {
      defs.push({
        field: col,
        headerName: `Unit ${i + 1}`,
        cellRenderer: UnitScheduleUnitCellRendererComponent,
        minWidth: 120,
        sortable: false,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        valueGetter: (params) => {
          const key = params.colDef?.field;
          if (!key || typeof key !== 'string') return '';
          const u = params.data?.[key];
          return u && typeof u === 'object' && u.floor_unit != null ? String(u.floor_unit) : '';
        },
      });
    });
    return defs;
  });

  readonly gridContext = computed(() => ({
    toggleFloor: this.toggleFloor.bind(this),
    toggleUnit: this.toggleUnit.bind(this),
    refreshGrid: () => {
      this.selectionVersion.update((v) => v + 1);
      this.gridApi()?.refreshCells({ force: true });
      this.cdr.markForCheck();
    },
  }));

  // ─── AG Grid config ──────────────────────────────────────────────────────
  readonly defaultColDef: ColDef = {
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    sortable: true,
    suppressHeaderMenuButton: true,
  };

  readonly agGridTheme = themeQuartz.withParams({
    // Structure & borders
    wrapperBorder: { style: 'solid', width: 1, color: 'rgba(0,0,0,0.12)' },
    headerRowBorder: { style: 'solid', width: 1, color: 'rgba(0,0,0,0.12)' },
    rowBorder: { style: 'solid', width: 1, color: 'rgba(0,0,0,0.08)' },
    columnBorder: { style: 'solid', width: 1, color: 'rgba(0,0,0,0.12)' },
    wrapperBorderRadius: '8px',
    headerHeight: '44px',
    // Header – high contrast for visibility
    headerBackgroundColor: '#f1f5f9',
    headerTextColor: '#0f172a',
    headerFontSize: '14px',
    headerFontWeight: 600,
    // Cells – readable text and alternating rows
    cellTextColor: '#334155',
    dataFontSize: '14px',
    dataBackgroundColor: '#ffffff',
    oddRowBackgroundColor: '#f8fafc',
    // Hover & interaction
    rowHoverColor: 'rgba(59, 130, 246, 0.08)',
    headerCellHoverBackgroundColor: 'rgba(0,0,0,0.04)',
    // Floating filters & cell spacing
    cellHorizontalPadding: '12px',
  });

  readonly floatingFiltersHeight = 40;

  readonly getRowId = (params: { data?: any }): string =>
    params.data?.floor_id != null ? String(params.data.floor_id) : `row-${Math.random().toString(36).slice(2, 9)}`;

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadProjects();
    this.setupFormListeners();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi.set(params.api);
  }

  // ─── Form listeners (optimized RxJS) ─────────────────────────────────────
  private setupFormListeners(): void {
    this.addpaymentStages.get('project_id')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(() => {
        this.addpaymentStages.get('wing_id')!.reset('');
        this.addpaymentStages.get('stage_id')!.reset('');
        this.rowData.set([]);
        this.allStatusList.set([]);
      }),
      switchMap((projectId) => {
        if (projectId == null || projectId === '') {
          this.allWingsList.set([]);
          return of([]);
        }
        return this.commonService.fetchWingDropdown(Number(projectId));
      })
    ).subscribe((wings) => {
      if (Array.isArray(wings)) this.allWingsList.set(wings);
    });

    this.addpaymentStages.get('wing_id')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((wingId) => {
      const projectId = this.addpaymentStages.get('project_id')?.value;
      if (!wingId || !projectId) {
        this.rowData.set([]);
        this.allStatusList.set([]);
        return;
      }
      this.fetchStages(projectId, String(wingId));
      this.addpaymentStages.get('stage_id')!.reset('');
      this.rowData.set([]);
    });

    this.addpaymentStages.get('stage_id')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((stageId) => {
      const projectId = this.addpaymentStages.get('project_id')?.value;
      const wingId = this.addpaymentStages.get('wing_id')?.value;
      if (stageId && projectId && wingId) {
        this.fetchProjectUnits(String(projectId), String(wingId), String(stageId));
      } else {
        this.rowData.set([]);
      }
    });
  }

  // ─── Data loading ────────────────────────────────────────────────────────
  private loadProjects(): void {
    this.loading.set(true);
    this.commonService
      .fetchUserProjectDropdown(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.projectsList.set(list ?? []),
        error: () => this.showError('Unable to fetch projects.'),
        complete: () => this.loading.set(false),
      });
  }

  private fetchStages(projectId: string, wingId: string): void {
    this.http
      .post<{ data?: any[] }>(`${this.baseUrl}/fetch_payment_stage`, {
        project_id: projectId,
        wing_id: wingId,
        status_id: 1,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.allStatusList.set(res?.data ?? []),
        error: () => this.showError('No payment stages available'),
      });
  }

  private fetchProjectUnits(projectId: string, wingId: string, stageId: string): void {
    this.loadingUnits.set(true);
    this.http
      .post<{ status?: boolean; data?: any[] }>(`${this.baseUrl}/fetch_floor_units`, {
        project_id: projectId,
        wing_id: wingId,
        stage_id: stageId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.handleUnitsResponse(res);
          this.loadingUnits.set(false);
        },
        error: () => {
          this.showError('No units available for selection.');
          this.loadingUnits.set(false);
        },
      });
  }

  private handleUnitsResponse(res: { status?: boolean; data?: any[] }): void {
    if (!res?.status || !Array.isArray(res.data)) return;
    const data = res.data;
    const max = Math.max(0, ...data.map((f: any) => (f?.units?.length ?? 0)));
    this.maxUnitsCount.set(max);
    this.unitColumns.set([
      'floor_name',
      ...Array.from({ length: max }, (_, i) => `unit_${i + 1}`),
    ]);
    this.rowData.set(data.map((f: any) => this.transformFloorData(f)));
  }

  private transformFloorData(floor: any): any {
    const units = floor?.units ?? [];
    const transformed: any = {
      floor_id: floor.floor_id,
      floor_name: floor.floor_name,
      floorChecked: units.every((u: any) => u?.status),
    };
    units.forEach((unit: any, i: number) => {
      const key = `unit_${i + 1}`;
      transformed[key] = {
        floor_unit_id: unit.floor_unit_id,
        floor_unit: unit.floor_unit,
        unit_schedule_id: unit.unit_schedule_id,
        status: unit.status,
        checked: unit.status,
      };
    });
    return transformed;
  }

  // ─── Actions ─────────────────────────────────────────────────────────────
  submitSelectedUnits(): void {
    const { project_id, wing_id, stage_id } = this.addpaymentStages.getRawValue();
    if (!project_id || !wing_id || !stage_id) return;

    const rows = this.rowData();
    const selected = rows.flatMap((floor: any) =>
      Object.keys(floor)
        .filter((k) => k.startsWith('unit_') && floor[k]?.checked)
        .map((k) => ({
          floor_unit_id: floor[k].floor_unit_id,
          floor_id: floor.floor_id,
          unit_schedule_id: floor[k].unit_schedule_id,
          status: floor[k].status,
        }))
    );

    if (selected.length === 0) {
      this.snackBar.open('Please select at least one unit', 'Close', { duration: 3000 });
      return;
    }

    const payload = {
      unit_schedule_id: selected[0]?.unit_schedule_id ?? 0,
      created_by: this.userId,
      updated_by: this.userId,
      project_id,
      wing_id,
      stage_id,
      floor_id: [...new Set(selected.map((u: any) => u.floor_id))],
      floor_unit_id: selected.map((u: any) => u.floor_unit_id),
    };

    this.http
      .post(`${this.baseUrl}/update_unit_schedule`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.snackBar.open('Units submitted successfully!', 'Close', { duration: 3000 }),
        error: () => this.snackBar.open('Submission failed!', 'Close', { duration: 3000 }),
      });
  }

  toggleAllFloors(): void {
    const checked = this.allFloorsChecked();
    this.rowData().forEach((floor) => {
      floor.floorChecked = checked;
      Object.keys(floor).forEach((k) => {
        if (k.startsWith('unit_') && floor[k]) floor[k].checked = checked;
      });
    });
    this.selectionVersion.update((v) => v + 1);
    this.gridApi()?.refreshCells({ force: true });
    this.cdr.markForCheck();
  }

  toggleFloor(floor: any): void {
    const checked = !!floor?.floorChecked;
    Object.keys(floor || {}).forEach((k) => {
      if (k.startsWith('unit_') && floor[k]) floor[k].checked = checked;
    });
  }

  toggleUnit(unit: any, floor: any): void {
    if (!floor) return;
    const unitKeys = Object.keys(floor).filter((k) => k.startsWith('unit_') && floor[k]);
    floor.floorChecked = unitKeys.length > 0 && unitKeys.every((k) => floor[k].checked);
    const rows = this.rowData();
    this.allFloorsChecked.set(
      rows.every((f) =>
        Object.keys(f)
          .filter((k) => k.startsWith('unit_') && f[k])
          .every((k) => f[k].checked)
      )
    );
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
