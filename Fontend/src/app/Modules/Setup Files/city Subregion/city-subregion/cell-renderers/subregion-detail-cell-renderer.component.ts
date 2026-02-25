import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ColDef, GridApi, GridReadyEvent, IDetailCellRendererParams } from 'ag-grid-community';

export interface SubregionCellRendererParams extends IDetailCellRendererParams {
  onDeleteSubregion?: (sub_region_id: number, city_id: number) => void;
  onEditSubregion?: (data: any) => void;
  onAddSubregion?: (data: { city_id: number, city_name: string }) => void;
}

@Component({
  selector: 'app-subregion-detail-cell-renderer',
  standalone: true,
  imports: [CommonModule, AgGridAngular, AngularMaterialModule],
  template: `
    <div class="ag-details-row" style="padding: 16px; background-color: #f9fafb;">
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 8px;">
          <mat-icon style="font-size: 1.25rem; width: 1.25rem; height: 1.25rem; color: #2563eb;">location_city</mat-icon>
          Subregions for {{ cityName }}
        </h3>
        <button mat-raised-button color="primary" 
          style="margin-top: 8px;"
          (click)="onAddSubregion()">
          <mat-icon style="font-size: 1rem; width: 1rem; height: 1rem;">add_circle</mat-icon>
          Add Subregion
        </button>
      </div>
      <div *ngIf="isLoading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px;">
        <mat-spinner diameter="40" style="margin-bottom: 16px;"></mat-spinner>
        <p style="font-size: 0.875rem; color: #6b7280; font-weight: 500;">Loading subregions...</p>
      </div>
      <div *ngIf="!isLoading && subregions.length === 0" style="padding: 32px; text-align: center; color: #6b7280; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <mat-icon style="font-size: 3rem; width: 3rem; height: 3rem; margin-bottom: 8px; color: #9ca3af;">location_off</mat-icon>
        <p style="font-size: 0.875rem; font-weight: 500;">No subregions found for this city</p>
      </div>
      <div *ngIf="!isLoading && subregions.length > 0" class="subregions-grid" style="background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <ag-grid-angular
          style="width: 100%; height: 400px;"
          class="ag-theme-quartz"
          [columnDefs]="detailColumnDefs"
          [rowData]="subregions"
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
export class SubregionDetailCellRendererComponent {
  private params!: SubregionCellRendererParams;
  cityName: string = '';
  subregions: any[] = [];
  isLoading: boolean = false;
  cityId: number = 0;

  detailColumnDefs: ColDef[] = [];
  detailDefaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
  };

  agInit(params: SubregionCellRendererParams): void {
    this.params = params;
    this.cityName = params.data.city_name || '';
    this.cityId = params.data.city_id;

    // Setup detail column definitions
    this.detailColumnDefs = [
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
        headerName: 'Action',
        sortable: false,
        filter: false,
        cellRenderer: 'actionCellRenderer',
        cellRendererParams: {
          color: 'warn',
          tooltip: 'Delete subregion',
          icon: 'delete',
          onClick: (data: any) => {
            if (this.params.onDeleteSubregion) {
              this.params.onDeleteSubregion(data.sub_region_id, this.cityId);
            }
          }
        },
        width: 100
      }
    ];

    // Load subregions
    this.loadSubregions();
  }

  loadSubregions(): void {
    this.isLoading = true;
    if (this.params.getDetailRowData) {
      this.params.getDetailRowData({
        successCallback: (rowData: any[]) => {
          this.subregions = rowData || [];
          this.isLoading = false;
        },
        failCallback: () => {
          this.isLoading = false;
        },
        node: this.params.node
      } as any);
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
      this.params.onEditSubregion({ ...event.data, city_id: this.cityId });
    }
  }

  onAddSubregion(): void {
    if (this.params.onAddSubregion) {
      this.params.onAddSubregion({ city_id: this.cityId, city_name: this.cityName });
    }
  }

  refresh(params: SubregionCellRendererParams): boolean {
    return false;
  }
}






















