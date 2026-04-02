import { Component, signal, computed, ChangeDetectionStrategy, effect, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams, ColDef, GridReadyEvent, ValueFormatterParams } from 'ag-grid-community';
import { ActionCellRendererComponent } from './action-cell-renderer.component';
import { Subregion, CallStatus } from '../services/city-subregion.service';
import { interval } from 'rxjs';

@Component({
  selector: 'app-detail-row-renderer',
  standalone: true,
  imports: [CommonModule, AgGridAngular, AngularMaterialModule, ActionCellRendererComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 16px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
      <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <mat-icon style="font-size: 1.25rem; width: 1.25rem; height: 1.25rem; color: #2563eb;">
            {{ isLeadLevel() ? 'phone' : 'location_city' }}
          </mat-icon>
          <h3 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0;">
            {{ isLeadLevel() ? 'Call Statuses for ' + leadLevelName() : 'Subregions for ' + cityName() }}
          </h3>
        </div>
          <button 
          mat-raised-button 
          color="primary" 
          (click)="onAddSubregion()"
          style="display: flex; align-items: center; gap: 4px;">
          <mat-icon style="font-size: 1rem; width: 1rem; height: 1rem;">add_circle</mat-icon>
          {{ isLeadLevel() ? 'Add Call Status' : 'Add Subregion' }}
        </button>
      </div>
      <div *ngIf="isLoading()" style="display: flex; flex-direction: column; align-items: center; justify-center; padding: 48px;">
        <mat-spinner diameter="40" style="margin-bottom: 16px;"></mat-spinner>
        <p style="font-size: 0.875rem; color: #6b7280; font-weight: 500;">Loading {{ isLeadLevel() ? 'call statuses' : 'subregions' }}...</p>
      </div>
      <div *ngIf="!isLoading() && subregions().length === 0" style="padding: 32px; text-align: center; color: #6b7280; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <mat-icon style="font-size: 3rem; width: 3rem; height: 3rem; margin-bottom: 8px; color: #9ca3af;">
          {{ isLeadLevel() ? 'phone_disabled' : 'location_off' }}
        </mat-icon>
        <p style="font-size: 0.875rem; font-weight: 500;">No {{ isLeadLevel() ? 'call statuses' : 'subregions' }} found</p>
      </div>
      <div *ngIf="!isLoading() && subregions().length > 0" style="background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <ag-grid-angular
          style="width: 100%; height: 400px;"
          class="ag-theme-quartz"
          [columnDefs]="detailColumnDefs()"
          [rowData]="subregions()"
          [defaultColDef]="detailDefaultColDef"
          [pagination]="true"
          [paginationPageSize]="10"
          (gridReady)="onDetailGridReady($event)"
          (rowClicked)="onDetailRowClicked($event)">
        </ag-grid-angular>
      </div>
    </div>
  `,
})
export class DetailRowRendererComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams & { 
    getSubregions?: (id: number) => Subregion[] | CallStatus[];
    isLoadingSubregions?: (id: number) => boolean;
    onAddSubregion?: (data: any) => void;
    onEditSubregion?: (data: any) => void;
    onDeleteSubregion?: (id: number, parentId: number) => void;
    isLeadLevel?: boolean;
  };

  readonly cityName = signal<string>('');
  readonly leadLevelName = signal<string>('');
  readonly cityId = signal<number>(0);
  readonly leadLevelId = signal<number>(0);
  readonly subregions = signal<(Subregion | CallStatus)[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isLeadLevel = signal<boolean>(false);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly detailColumnDefs = computed<ColDef[]>(() => {
    return this.isLeadLevel() ? this.callStatusColumnDefs() : this.subregionColumnDefs();
  });

  readonly subregionColumnDefs = computed<ColDef[]>(() => [
    {
      field: 'sub_region',
      headerName: 'Sub region',
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
      valueFormatter: (params: ValueFormatterParams) => {
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
      valueFormatter: (params: ValueFormatterParams) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      },
      flex: 1
    },
    {
      field: 'actions',
      headerName: 'Action',
      sortable: false,
      filter: false,
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        color: 'warn',
        tooltip: 'Delete subregion',
        icon: 'delete',
        onClick: (data: any) => {
          if (this.params.onDeleteSubregion) {
            this.params.onDeleteSubregion(data.sub_region_id, this.cityId());
          }
        }
      },
      width: 100
    }
  ]);

  readonly callStatusColumnDefs = computed<ColDef[]>(() => [
    {
      field: 'call_status',
      headerName: 'Call Status',
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      flex: 1
    },
    {
      field: 'active_status',
      headerName: 'Status',
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
      valueFormatter: (params: ValueFormatterParams) => {
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
      valueFormatter: (params: ValueFormatterParams) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      },
      flex: 1
    },
    {
      field: 'actions',
      headerName: 'Action',
      sortable: false,
      filter: false,
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        color: 'warn',
        tooltip: 'Delete call status',
        icon: 'delete',
        onClick: (data: any) => {
          if (this.params.onDeleteSubregion) {
            this.params.onDeleteSubregion(data.call_status_id, this.leadLevelId());
          }
        }
      },
      width: 100
    }
  ]);

  readonly detailDefaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
  };

  agInit(params: ICellRendererParams & any): void {
    this.params = params;
    const isLeadLevel = params.isLeadLevel || false;
    this.isLeadLevel.set(isLeadLevel);
    const parentData = params.data?.parentData || params.data;
    
    if (isLeadLevel) {
      this.leadLevelName.set(parentData?.lead_level || '');
      this.leadLevelId.set(parentData?.lead_level_id || 0);
    } else {
      this.cityName.set(parentData?.city_name || '');
      this.cityId.set(parentData?.city_id || 0);
    }
    this.updateSubregions();
    
    // Poll for updates while loading to detect when parent signals change
    // This is necessary because the parent component's signals change asynchronously
    // and the cell renderer needs to detect these changes with OnPush change detection
    interval(100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const wasLoading = this.isLoading();
        this.updateSubregions();
        const nowLoading = this.isLoading();
        
        // Only trigger change detection if loading state or data changed
        if (wasLoading !== nowLoading || this.subregions().length > 0) {
          this.cdr.markForCheck();
        }
      });
  }

  updateSubregions(): void {
    if (this.params.getSubregions) {
      const id = this.isLeadLevel() ? this.leadLevelId() : this.cityId();
      this.subregions.set(this.params.getSubregions(id) || []);
    }
    if (this.params.isLoadingSubregions) {
      const id = this.isLeadLevel() ? this.leadLevelId() : this.cityId();
      this.isLoading.set(this.params.isLoadingSubregions(id));
    }
  }

  onDetailGridReady(params: GridReadyEvent): void {
    params.api.sizeColumnsToFit();
  }

  onDetailRowClicked(event: any): void {
    if (event.event?.target?.closest('button')) {
      return;
    }
    if (this.params.onEditSubregion) {
      if (this.isLeadLevel()) {
        this.params.onEditSubregion({ ...event.data, lead_level_id: this.leadLevelId() });
      } else {
        this.params.onEditSubregion({ ...event.data, city_id: this.cityId() });
      }
    }
  }

  onAddSubregion(): void {
    if (this.params.onAddSubregion) {
      const parentData = this.params.data?.parentData || this.params.data;
      this.params.onAddSubregion(parentData);
    }
  }

  refresh(params: ICellRendererParams & any): boolean {
    this.params = params;
    const isLeadLevel = params.isLeadLevel || false;
    this.isLeadLevel.set(isLeadLevel);
    const parentData = params.data?.parentData || params.data;
    
    if (isLeadLevel) {
      this.leadLevelName.set(parentData?.lead_level || '');
      this.leadLevelId.set(parentData?.lead_level_id || 0);
    } else {
      this.cityName.set(parentData?.city_name || '');
      this.cityId.set(parentData?.city_id || 0);
    }
    this.updateSubregions();
    return true;
  }
}

