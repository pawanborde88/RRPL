import { Component, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { ActionButton, TableRowData } from '../../../../reusable-table/reusable-table.component';

/**
 * Standalone action cell renderer component for AG-Grid
 * Optimized with OnPush change detection and memoization
 */
@Component({
  selector: 'app-action-cell-renderer',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule],
  template: `
    @if (isPinnedRow()) {
     
    } @else {
      <div class="action-cell-container">
        @for (action of visibleActions(); track action.action) {
          <button
            mat-icon-button
            type="button"
            [disabled]="isActionDisabled(action)"
            [title]="getTooltip(action)"
            [attr.aria-label]="getTooltip(action)"
            (click)="onActionClick($event, action)"
            [style.color]="getActionColor(action)"
            class="action-button">
            @if (action.iconType === 'fontawesome') {
              <i [class]="action.icon" [style.font-size.px]="20"></i>
            } @else {
              <mat-icon>{{ action.icon || 'circle' }}</mat-icon>
            }
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .action-cell-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 100%;
      padding: 4px;
    }
    
    .action-button {
      height: 25px;
      transition: background-color 0.2s;
      
      &:hover:not(:disabled) {
        background-color: rgba(0, 0, 0, 0.04);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionCellRendererComponent<T extends TableRowData = TableRowData> implements ICellRendererAngularComp {
  params!: ICellRendererParams & {
    actions?: readonly ActionButton<T>[] | ActionButton<T>[];
    onActionClick?: (event: { action: string; row: T }) => void;
  };

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly colorMap: Readonly<Record<string, string>> = {
    'primary': '#0d4678',
    'accent': '#ff4081',
    'warn': '#f44336',
    'error': '#f44336',
    'success': '#097969',
    'info': '#2196f3',
  } as const;

  // Memoized visible actions computation
  private cachedVisibleActions: ActionButton<T>[] = [];
  private lastRowId: string | number | undefined;
  private lastActionsHash: string = '';

  // AG-Grid cell renderer interface
  agInit(params: ICellRendererParams & {
    actions?: readonly ActionButton<T>[] | ActionButton<T>[];
    onActionClick?: (event: { action: string; row: T }) => void;
  }): void {
    this.params = params;
  }

  get actions(): readonly ActionButton<T>[] | ActionButton<T>[] {
    return this.params?.actions || [];
  }

  visibleActions(): ActionButton<T>[] {
    const rowData = this.params?.data as T;
    if (!rowData || !this.actions) return [];

    const rowId = rowData.id;
    const actionsHash = this.getActionsHash();

    // Cache invalidation check
    if (rowId !== this.lastRowId || actionsHash !== this.lastActionsHash) {
      this.cachedVisibleActions = this.computeVisibleActions(rowData);
      this.lastRowId = rowId;
      this.lastActionsHash = actionsHash;
    }

    return this.cachedVisibleActions;
  }

  private computeVisibleActions(rowData: T): ActionButton<T>[] {
    const actionsArray = Array.isArray(this.actions) ? this.actions : [...this.actions];
    return actionsArray.filter(action => {
      if (!action) return false;
      const showFn = (action as any).show;
      return showFn ? (typeof showFn === 'function' ? showFn(rowData) : showFn) : true;
    });
  }

  private getActionsHash(): string {
    const actionsArray = Array.isArray(this.actions) ? this.actions : [...this.actions];
    return JSON.stringify(actionsArray.map(a => ({ action: a.action, icon: a.icon })));
  }

  isActionDisabled(action: ActionButton<T>): boolean {
    const rowData = this.params?.data as T;
    if (!rowData) return true;

    if (typeof action.disabled === 'function') {
      return action.disabled(rowData);
    }
    return !!action.disabled;
  }

  getActionColor(action: ActionButton<T>): string {
    const isDisabled = this.isActionDisabled(action);
    const actionColor = (action as any).color || 'primary';
    const colorMap = this.colorMap as Record<string, string>;
    const iconColor = colorMap[actionColor] || colorMap['primary'];
    return isDisabled ? 'rgba(0, 0, 0, 0.26)' : iconColor;
  }

  getTooltip(action: ActionButton<T>): string {
    const rowData = this.params?.data as T;
    if (!rowData) return action.action;

    const tooltip = (action as any).tooltip;
    if (typeof tooltip === 'function') {
      return tooltip(rowData);
    }
    return tooltip || (action as any).label || action.action;
  }

  isPinnedRow(): boolean {
    return this.params?.node?.rowPinned === 'bottom';
  }



  onActionClick(event: Event, action: ActionButton<T>): void {
    event.stopPropagation();
    if (!this.isActionDisabled(action) && this.params?.data) {
      const actionEvent = {
        action: action.action,
        row: this.params.data as T
      };

      // Use callback from params if available, otherwise emit to parent (for backward compatibility)
      if (this.params.onActionClick) {
        this.params.onActionClick(actionEvent);
      }
    }
  }

  // AG-Grid cell renderer interface
  refresh(params: ICellRendererParams & {
    actions?: readonly ActionButton<T>[] | ActionButton<T>[];
    onActionClick?: (event: { action: string; row: T }) => void;
  }): boolean {
    this.params = params;
    // Invalidate cache to force recalculation
    this.lastRowId = undefined;
    this.lastActionsHash = '';
    this.cdr.markForCheck();
    return true;
  }
}

