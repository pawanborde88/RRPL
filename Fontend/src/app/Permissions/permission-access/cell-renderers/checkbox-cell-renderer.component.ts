import { Component, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';

interface PermissionRow {
  permission_id?: number;
  rowType?: 'module' | 'permission';
  [key: string]: any;
}

interface CheckboxColumn {
  fieldName: string;
  role_id: number;
  text_type: string;
}

@Component({
  selector: 'app-checkbox-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="checkbox-container" *ngIf="hasPermissionId()">
      <input 
        type="checkbox" 
        class="ag-checkbox"
        [checked]="isChecked()"
        (change)="onCheckboxChange($event)"
        (click)="$event.stopPropagation()">
    </div>
  `,
  styles: [`
    .checkbox-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%;
      
      .ag-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #3b82f6;
        border: 1px solid #cbd5e1;
        border-radius: 3px;
        transition: all 0.2s ease-in-out;
        margin: 0;
        
        &:hover {
          border-color: #3b82f6;
        }
        
        &:checked {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
        
        &:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxCellRendererComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams & {
    data?: PermissionRow;
    checkboxColumn?: CheckboxColumn;
    onToggleCheckbox?: (col: CheckboxColumn, row: PermissionRow) => void;
  };

  private readonly cdr = inject(ChangeDetectorRef);

  agInit(params: ICellRendererParams & {
    checkboxColumn?: CheckboxColumn;
    onToggleCheckbox?: (col: CheckboxColumn, row: PermissionRow) => void;
  }): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams & {
    checkboxColumn?: CheckboxColumn;
    onToggleCheckbox?: (col: CheckboxColumn, row: PermissionRow) => void;
  }): boolean {
    this.params = params;
    this.cdr.markForCheck();
    return true;
  }

  getRowData(): PermissionRow | null {
    return this.params?.data as PermissionRow || null;
  }

  getCheckboxColumn(): CheckboxColumn | null {
    return this.params?.checkboxColumn || null;
  }

  hasPermissionId(): boolean {
    const row = this.getRowData();
    // Show checkboxes for both module rows (with first permission data) and permission rows
    return !!row?.permission_id;
  }

  isChecked(): boolean {
    const row = this.getRowData();
    const col = this.getCheckboxColumn();
    if (!row || !col) return false;
    // Checkbox value is either a number (role_permission_id) or null
    // Convert to boolean: number = true, null/undefined = false
    const value = row[col.fieldName];
    return value != null && value !== 0;
  }

  onCheckboxChange(event: any): void {
    event.stopPropagation();
    const row = this.getRowData();
    const col = this.getCheckboxColumn();
    if (row && col && this.params?.onToggleCheckbox) {
      this.params.onToggleCheckbox(col, row);
    }
  }
}

