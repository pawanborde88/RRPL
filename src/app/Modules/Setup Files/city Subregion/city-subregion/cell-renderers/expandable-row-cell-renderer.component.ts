import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

interface ExpandableRowParams {
  onExpand?: (data: any, isExpanded: boolean) => void;
  onAddSubregion?: (data: any) => void;
  isExpanded?: (id: number) => boolean; // Check if row is expanded
}

@Component({
  selector: 'app-expandable-row-cell-renderer',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule],
  template: `
    <div style="display: flex; align-items: center; gap: 4px;">
      <button 
        mat-icon-button 
        (click)="toggleExpand($event)"
        [attr.aria-label]="isExpanded ? 'Collapse' : 'Expand'"
        style="width: 32px; height: 32px;">
        <mat-icon [style.transform]="isExpanded ? 'rotate(90deg)' : 'none'" 
                  style="transition: transform 0.2s;">
          {{ isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right' }}
        </mat-icon>
      </button>
      <button 
        mat-icon-button 
        color="primary"
        (click)="onAddSubregionClick($event)"
        matTooltip="Add subregion"
        style="width: 32px; height: 32px;">
        <mat-icon style="font-size: 1.2rem;">add_circle</mat-icon>
      </button>
    </div>
  `,
})
export class ExpandableRowCellRendererComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams & ExpandableRowParams;
  isExpanded: boolean = false;
  private static expandedRows: Map<any, boolean> = new Map();

  agInit(params: ICellRendererParams & ExpandableRowParams): void {
    this.params = params;
    // Check if this row is expanded using a unique identifier
    const rowId = params.data?.city_id || params.data?.lead_level_id;
    if (params.isExpanded && rowId) {
      this.isExpanded = params.isExpanded(rowId);
    } else {
      this.isExpanded = ExpandableRowCellRendererComponent.expandedRows.get(rowId) || false;
    }
  }

  toggleExpand(event: Event): void {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
    
    // Store expanded state
    const rowId = this.params.data?.city_id || this.params.data?.lead_level_id;
    if (rowId) {
      ExpandableRowCellRendererComponent.expandedRows.set(rowId, this.isExpanded);
    }
    
    if (this.params.onExpand) {
      this.params.onExpand(this.params.data, this.isExpanded);
    }
  }

  onAddSubregionClick(event: Event): void {
    event.stopPropagation();
    if (this.params.onAddSubregion) {
      this.params.onAddSubregion(this.params.data);
    }
  }

  private showDetailRow(): void {
    // This will be handled by the parent component
    // We'll use a custom approach with row data manipulation
    const gridApi = this.params.api;
    if (gridApi) {
      // Mark row as expanded in data
      (this.params.data as any).__expanded = true;
      gridApi.refreshCells({ rowNodes: [this.params.node] });
    }
  }

  private hideDetailRow(): void {
    const gridApi = this.params.api;
    if (gridApi) {
      (this.params.data as any).__expanded = false;
      gridApi.refreshCells({ rowNodes: [this.params.node] });
    }
  }

  refresh(params: ICellRendererParams & ExpandableRowParams): boolean {
    this.params = params;
    const rowId = params.data?.city_id || params.data?.lead_level_id;
    if (params.isExpanded && rowId) {
      this.isExpanded = params.isExpanded(rowId);
    } else {
      this.isExpanded = ExpandableRowCellRendererComponent.expandedRows.get(rowId) || false;
    }
    return true;
  }
}

