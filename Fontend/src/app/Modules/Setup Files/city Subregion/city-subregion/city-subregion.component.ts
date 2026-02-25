import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  signal,
  computed,
  effect,
  inject,
  ChangeDetectionStrategy,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddCitySubregionComponent } from '../add-city-subregion/add-city-subregion.component';
import { AddLeadLevelComponent } from '../../Lead Level/add-lead-level/add-lead-level.component';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  AllCommunityModule,
  ModuleRegistry,
  ValueFormatterParams
} from 'ag-grid-community';
import { ActionCellRendererComponent } from './cell-renderers/action-cell-renderer.component';
import { ExpandableRowCellRendererComponent } from './cell-renderers/expandable-row-cell-renderer.component';
import { DetailRowRendererComponent } from './cell-renderers/detail-row-renderer.component';
import { CitySubregionService, City, Subregion, LeadLevel, CallStatus } from './services/city-subregion.service';
import { switchMap, of } from 'rxjs';

ModuleRegistry.registerModules([AllCommunityModule]);

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-city-subregion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    TemplateComponent,
    BreadcrumbComponent,
    AgGridAngular,
    ActionCellRendererComponent,
    ExpandableRowCellRendererComponent,
    DetailRowRendererComponent,
  ],
  templateUrl: './city-subregion.component.html',
  styleUrl: './city-subregion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitySubregionComponent {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  // Dependency injection using inject()
  private readonly dataService = inject(CitySubregionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Signals for state management
  readonly viewMode = signal<'city' | 'leadLevel'>('city');
  readonly loading = signal(false);
  readonly rowData = signal<(City | LeadLevel)[]>([]);
  readonly expandedCities = signal<Set<number>>(new Set());
  readonly expandedLeadLevels = signal<Set<number>>(new Set());
  readonly subregionsMap = signal<Map<number, Subregion[]>>(new Map());
  readonly callStatusMap = signal<Map<number, CallStatus[]>>(new Map());
  readonly loadingSubregionsMap = signal<Map<number, boolean>>(new Map());
  readonly loadingCallStatusMap = signal<Map<number, boolean>>(new Map());

  // Computed signals for derived state
  readonly displayRowData = computed(() => {
    const data = this.rowData();
    const mode = this.viewMode();
    const expandedCities = this.expandedCities();
    const expandedLeadLevels = this.expandedLeadLevels();

    const result: any[] = [];

    if (mode === 'leadLevel') {
      data.forEach((leadLevel: any) => {
        if (leadLevel?.isDetailRow) return;
        result.push(leadLevel);
        if (leadLevel?.lead_level_id && expandedLeadLevels.has(leadLevel.lead_level_id)) {
          result.push({
            isDetailRow: true,
            parentData: leadLevel,
            lead_level_id: leadLevel.lead_level_id,
            lead_level: leadLevel.lead_level
          });
        }
      });
    } else {
      data.forEach((city: any) => {
        if (city?.isDetailRow) return;
        if (city && (city.city_id || city.city_name)) {
          result.push(city);
          if (city.city_id && expandedCities.has(city.city_id)) {
            result.push({
              isDetailRow: true,
              parentData: city,
              city_id: city.city_id,
              city_name: city.city_name
            });
          }
        }
      });
    }

    return result;
  });

  readonly columnDefs = computed<ColDef[]>(() => {
    return this.viewMode() === 'leadLevel' ? this.leadLevelColumnDefs() : this.cityColumnDefs();
  });

  private gridApi!: GridApi;

  // City/Subregion Column Definitions - using computed signal
  readonly cityColumnDefs = computed<ColDef[]>(() => [
    {
      headerName: 'Sub Region',
      width: 120,
      cellRenderer: ExpandableRowCellRendererComponent,
      cellRendererParams: {
        onExpand: (data: any, isExpanded: boolean) => {
          this.toggleCityExpansion(data.city_id, isExpanded);
        },
        onAddSubregion: (data: any) => {
          this.openAddcitySubregionDialog('add', 'subRegion', data);
        },
        isExpanded: (cityId: number) => this.expandedCities().has(cityId)
      },
      sortable: false,
      filter: false,
      pinned: 'left',
      suppressMovable: true,
      valueGetter: () => '', // Don't show any value, just the buttons
      cellStyle: { padding: '4px' }
    },
    {
      field: 'city_name',
      headerName: 'City Name',
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.value) return '';
        const subregionCount = params.data?.sub_region_count || 0;
        const cityName = params.value || '';
        return `<div style="display: flex; align-items: center; gap: 12px;"><span style="font-weight: 500; color: #111827;">${cityName}</span><span style="font-size: 0.875rem; font-weight: 600; color: #6b7280;">(${subregionCount} subregions)</span></div>`;
      }
    },
    {
      field: 'updated_by_name',
      headerName: 'Updated By',
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      valueGetter: (params) => params.data.updated_by_name || params.data.updated_by || ''
    },
    {
      field: 'updated_at',
      headerName: 'Updated At',
      sortable: true,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filter: false,
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        color: 'warn',
        tooltip: 'Delete city',
        icon: 'delete',
        onClick: (data: any) => this.deleteCity(data.city_id)
      },
      width: 100
    }
  ]);

  // Lead Level/Call Status Column Definitions - using computed signal
  readonly leadLevelColumnDefs = computed<ColDef[]>(() => [
    {
      headerName: 'Call Status',
      width: 120,
      cellRenderer: ExpandableRowCellRendererComponent,
      cellRendererParams: {
        onExpand: (data: any, isExpanded: boolean) => {
          this.toggleLeadLevelExpansion(data.lead_level_id, isExpanded);
        },
        onAddSubregion: (data: any) => {
          this.openAddCallStatus('add', data);
        },
        isExpanded: (leadLevelId: number) => this.expandedLeadLevels().has(leadLevelId)
      },
      sortable: false,
      filter: false,
      pinned: 'left',
      suppressMovable: true,
      valueGetter: () => '', // Don't show any value, just the buttons
      cellStyle: { padding: '4px' }
    },
    {
      field: 'lead_level',
      headerName: 'Lead Level',
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      flex: 1
    },
    {
      field: 'created_by_name',
      headerName: 'Created By',
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      flex: 1
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      sortable: true,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      },
      flex: 1
    },
    {
      field: 'updated_by_name',
      headerName: 'Updated By',
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      flex: 1
    },
    {
      field: 'updated_at',
      headerName: 'Updated At',
      sortable: true,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      },
      flex: 1
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filter: false,
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        color: 'warn',
        tooltip: 'Delete lead level',
        icon: 'delete',
        onClick: (data: any) => this.deleteLeadLevel(data.lead_level_id)
      },
      width: 100
    }
  ]);

  readonly defaultColDef: ColDef = {
    flex: 1,
    minWidth: 150,
    resizable: true,
  };

  // Full-width detail row renderer - Dynamic based on view mode
  readonly detailCellRenderer = DetailRowRendererComponent;

  readonly detailCellRendererParams = computed(() => {
    if (this.viewMode() === 'leadLevel') {
      return {
        getSubregions: (leadLevelId: number) => this.getCallStatuses(leadLevelId),
        isLoadingSubregions: (leadLevelId: number) => this.isLoadingCallStatus(leadLevelId),
        onAddSubregion: (leadLevelData: any) => this.openAddCallStatus('add', leadLevelData),
        onEditSubregion: (callStatusData: any) => this.openAddCallStatus('edit', callStatusData),
        onDeleteSubregion: (callStatusId: number, leadLevelId: number) => this.deleteCallStatus(callStatusId, leadLevelId),
        isLeadLevel: true
      };
    }
    return {
      getSubregions: (cityId: number) => this.getSubregions(cityId),
      isLoadingSubregions: (cityId: number) => this.isLoadingSubregions(cityId),
      onAddSubregion: (cityData: any) => this.openAddcitySubregionDialog('add', 'subRegion', cityData),
      onEditSubregion: (subregionData: any) => this.openAddcitySubregionDialog('update', 'subRegion', subregionData),
      onDeleteSubregion: (subregionId: number, cityId: number) => this.deleteSubregion(subregionId, cityId),
      isLeadLevel: false
    };
  });

  isFullWidthRow = (params: any) => {
    return params.rowNode.data && params.rowNode.data.isDetailRow === true;
  };

  getRowHeight = (params: any) => {
    if (params.data && params.data.isDetailRow) {
      return 500; // Height for detail row
    }
    return undefined; // Default row height
  };

  constructor() {
    // Initialize view mode from route
    this.route.url
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(urlSegments => {
        const path = urlSegments.map(segment => segment.path).join('/');
        this.viewMode.set(path.includes('lead_level') ? 'leadLevel' : 'city');
        this.loadData();
      });

    // Effect to update grid when displayRowData changes
    // Use setTimeout to defer grid API calls and avoid AG-Grid error #252
    effect(() => {
      const data = this.displayRowData();
      if (this.gridApi) {
        setTimeout(() => {
          if (this.gridApi) {
            this.gridApi.setGridOption('rowData', data);
            this.gridApi.setGridOption('columnDefs', this.columnDefs());
            this.gridApi.setGridOption('fullWidthCellRendererParams', this.detailCellRendererParams());
          }
        }, 0);
      }
    });
  }

  loadData(): void {
    if (this.viewMode() === 'leadLevel') {
      this.fetchAllLeadLevel();
    } else {
      this.fetchAllCity();
    }
  }


  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    params.api.setGridOption('columnDefs', this.columnDefs());
    params.api.setGridOption('fullWidthCellRendererParams', this.detailCellRendererParams());
    const data = this.displayRowData();
    if (data.length > 0) {
      params.api.setGridOption('rowData', data);
    }
    params.api.sizeColumnsToFit();
  }

  fetchAllCity(): void {
    this.loading.set(true);
    this.dataService.fetchCities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.rowData.set(res);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.snackBar.open('Unable to fetch cities.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  toggleCityExpansion(cityId: number, isExpanded: boolean): void {
    const expanded = new Set(this.expandedCities());
    if (isExpanded) {
      expanded.add(cityId);
      this.expandedCities.set(expanded);
      if (!this.subregionsMap().has(cityId)) {
        this.fetchSubregionData(cityId);
      }
    } else {
      expanded.delete(cityId);
      this.expandedCities.set(expanded);
    }
  }

  getSubregions(cityId: number): Subregion[] {
    return this.subregionsMap().get(cityId) || [];
  }

  isLoadingSubregions(cityId: number): boolean {
    return this.loadingSubregionsMap().get(cityId) || false;
  }

  fetchSubregionData(cityId: number): void {
    if (this.subregionsMap().has(cityId)) {
      return; // Already loaded
    }

    const loadingMap = new Map(this.loadingSubregionsMap());
    loadingMap.set(cityId, true);
    this.loadingSubregionsMap.set(loadingMap);

    this.dataService.fetchSubregions(cityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (subregions) => {
          const subregionsMap = new Map(this.subregionsMap());
          subregionsMap.set(cityId, subregions);
          this.subregionsMap.set(subregionsMap);

          const updatedLoadingMap = new Map(this.loadingSubregionsMap());
          updatedLoadingMap.set(cityId, false);
          this.loadingSubregionsMap.set(updatedLoadingMap);
        },
        error: (err) => {
          console.error(err);
          const updatedLoadingMap = new Map(this.loadingSubregionsMap());
          updatedLoadingMap.set(cityId, false);
          this.loadingSubregionsMap.set(updatedLoadingMap);
          this.snackBar.open('Unable to fetch subregions.', 'Close', {
            duration: 3000,
          });
        },
      });
  }


  deleteCity(cityId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this City?' },
    });

    dialogRef.afterClosed()
      .pipe(
        switchMap(result => result ? this.dataService.deleteCity(cityId) : of(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.snackBar.open('City deleted successfully', 'Close', { duration: 3000 });
            this.dataService.clearCitiesCache();
            this.fetchAllCity();
          }
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Unable to delete City.', 'Close', { duration: 3000 });
        },
      });
  }

  deleteSubregion(subregionId: number, cityId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this Sub-region?' },
    });

    dialogRef.afterClosed()
      .pipe(
        switchMap(result => result ? this.dataService.deleteSubregion(subregionId) : of(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.snackBar.open('Sub-region deleted successfully', 'Close', { duration: 3000 });
            // Remove subregion from map
            const subregionsMap = new Map(this.subregionsMap());
            const subregions = subregionsMap.get(cityId) || [];
            const updatedSubregions = subregions.filter(sub => sub.sub_region_id !== subregionId);
            subregionsMap.set(cityId, updatedSubregions);
            this.subregionsMap.set(subregionsMap);
          }
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Unable to delete Sub-region.', 'Close', { duration: 3000 });
        },
      });
  }



  openAddcitySubregionDialog(action: string, multiple: string, item?: any): void {
    const dialogRef = this.dialog.open(AddCitySubregionComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        multiple,
        title: action === 'add' ? `Add ${multiple === 'city' ? 'City' : 'Subregion'}` : `Edit ${multiple === 'city' ? 'City' : 'Subregion'}`,
        apiUrl: action === 'add' ? (multiple === 'city' ? 'add_city' : 'add_sub_region') : (multiple === 'city' ? 'edit_city' : 'edit_sub_region'),
        successMessage: `${action === 'add' ? 'added' : 'updated'} successfully`,
        rowData: item,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.success) {
          if (multiple === 'city') {
            this.dataService.clearCitiesCache();
            this.fetchAllCity();
          } else if (item?.city_id) {
            // Clear cached subregions and refresh
            const subregionsMap = new Map(this.subregionsMap());
            subregionsMap.delete(item.city_id);
            this.subregionsMap.set(subregionsMap);
            this.fetchSubregionData(item.city_id);
          }
        }
      });
  }

  onRowClicked(event: any): void {
    if (event.event?.target?.closest('button')) {
      return; // Don't open dialog if clicking action buttons
    }
    if (this.viewMode() === 'leadLevel') {
      this.openLeadLevelDialog('edit', event.data);
    } else {
      this.openAddcitySubregionDialog('update', 'city', event.data);
    }
  }

  onDetailRowClicked(event: any, parentData: any): void {
    if (event.event?.target?.closest('button')) {
      return; // Don't open dialog if clicking action buttons
    }
    if (this.viewMode() === 'leadLevel') {
      this.openAddCallStatus('edit', { ...event.data, lead_level_id: parentData.lead_level_id });
    } else {
      this.openAddcitySubregionDialog('update', 'subRegion', { ...event.data, city_id: parentData.city_id });
    }
  }

  // Lead Level Methods
  fetchAllLeadLevel(): void {
    this.loading.set(true);
    this.dataService.fetchLeadLevels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.rowData.set(res);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.snackBar.open('Unable to fetch lead levels.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  toggleLeadLevelExpansion(leadLevelId: number, isExpanded: boolean): void {
    const expanded = new Set(this.expandedLeadLevels());
    if (isExpanded) {
      expanded.add(leadLevelId);
      this.expandedLeadLevels.set(expanded);
      if (!this.callStatusMap().has(leadLevelId)) {
        this.fetchCallStatusData(leadLevelId);
      }
    } else {
      expanded.delete(leadLevelId);
      this.expandedLeadLevels.set(expanded);
    }
  }

  fetchCallStatusData(leadLevelId: number): void {
    if (this.callStatusMap().has(leadLevelId)) {
      return; // Already loaded
    }

    const loadingMap = new Map(this.loadingCallStatusMap());
    loadingMap.set(leadLevelId, true);
    this.loadingCallStatusMap.set(loadingMap);

    this.dataService.fetchCallStatuses(leadLevelId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (callStatuses) => {
          const callStatusMap = new Map(this.callStatusMap());
          callStatusMap.set(leadLevelId, callStatuses);
          this.callStatusMap.set(callStatusMap);

          const updatedLoadingMap = new Map(this.loadingCallStatusMap());
          updatedLoadingMap.set(leadLevelId, false);
          this.loadingCallStatusMap.set(updatedLoadingMap);
        },
        error: (err) => {
          console.error(err);
          const updatedLoadingMap = new Map(this.loadingCallStatusMap());
          updatedLoadingMap.set(leadLevelId, false);
          this.loadingCallStatusMap.set(updatedLoadingMap);
          this.snackBar.open('Unable to fetch call statuses.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  getCallStatuses(leadLevelId: number): CallStatus[] {
    return this.callStatusMap().get(leadLevelId) || [];
  }

  isLoadingCallStatus(leadLevelId: number): boolean {
    return this.loadingCallStatusMap().get(leadLevelId) || false;
  }

  openLeadLevelDialog(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddLeadLevelComponent, {
      minWidth: '20vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Lead Level' : 'Edit Lead Level',
        apiUrl: action === 'add' ? 'add_lead_level' : 'edit_lead_level',
        successMessage: action === 'add' ? 'Lead Level added successfully' : 'Lead Level updated successfully',
        rowData: row,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.dataService.clearLeadLevelsCache();
          this.fetchAllLeadLevel();
        }
      });
  }

  openAddCallStatus(action: string, row: any): void {
    const dialogRef = this.dialog.open(AddLeadLevelComponent, {
      minWidth: '20vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        leadLevelID: row.lead_level_id,
        title: action === 'add' ? 'Add Call Status' : 'Edit Call Status',
        apiUrl: action === 'add' ? 'add_call_status' : 'edit_call_status',
        successMessage: action === 'add' ? 'Call Status added successfully' : 'Call Status updated successfully',
        rowData: row,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.dataService.clearLeadLevelsCache();
          this.fetchAllLeadLevel();
          if (row.lead_level_id) {
            const callStatusMap = new Map(this.callStatusMap());
            callStatusMap.delete(row.lead_level_id);
            this.callStatusMap.set(callStatusMap);
            this.fetchCallStatusData(row.lead_level_id);
          }
        }
      });
  }

  deleteLeadLevel(leadLevelId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete lead level?' },
    });

    dialogRef.afterClosed()
      .pipe(
        switchMap(result => result ? this.dataService.deleteLeadLevel(leadLevelId) : of(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.snackBar.open('Lead level deleted successfully', 'Close', {
              duration: 3000,
            });
            this.dataService.clearLeadLevelsCache();
            this.fetchAllLeadLevel();
          }
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Unable to Delete Lead Level.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  deleteCallStatus(callStatusId: number, leadLevelId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Call Status?' },
    });

    dialogRef.afterClosed()
      .pipe(
        switchMap(result => result ? this.dataService.deleteCallStatus(callStatusId) : of(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.snackBar.open('Call Status successfully deleted.', 'Close', { duration: 3000 });
            // Refresh call statuses
            const callStatusMap = new Map(this.callStatusMap());
            callStatusMap.delete(leadLevelId);
            this.callStatusMap.set(callStatusMap);
            this.fetchCallStatusData(leadLevelId);
          }
        },
        error: (err) => {
          this.snackBar.open('Unable to Delete Call Status.', 'Close', { duration: 3000 });
        },
      });
  }
}

