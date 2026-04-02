import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { TableRowData, TableColumn } from '../../../../reusable-table/reusable-table.component';

/**
 * Standalone clickable cell renderer component for AG-Grid
 * Refactored to Angular 17+ with Signals and OnPush change detection
 * Displays text that can be clicked to trigger an onClick handler
 */
@Component({
  selector: 'app-clickable-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isPinnedRow()) {
      <span></span>
    } @else {
      <span
        [style.cursor]="isClickable() ? 'pointer' : 'default'"
        [class.clickable-cell]="isClickable()"
        (click)="onCellClick($event)"
        [title]="value() || ''"
        class="clickable-cell-content">
        {{ value() }}
      </span>
    }
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 8px;
    }
    
    .clickable-cell-content {
      display: inline-block;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .clickable-cell {
      color: #1976d2;
      text-decoration: none;
      transition: color 0.2s;
      
      &:hover {
        color: #1565c0;
        text-decoration: underline;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClickableCellRendererComponent<T extends TableRowData = TableRowData> implements ICellRendererAngularComp {
  private readonly paramsSignal = signal<ICellRendererParams & { column?: TableColumn<T> } | null>(null);

  // Computed signals for reactive state
  readonly params = computed(() => this.paramsSignal());
  readonly column = computed(() => this.params()?.column);
  readonly rowData = computed(() => this.params()?.data as T | undefined);
  readonly isPinnedRow = computed(() => this.params()?.node?.rowPinned === 'bottom');
  
  readonly value = computed(() => {
    const params = this.params();
    return params?.valueFormatted || params?.value || '';
  });

  readonly isClickable = computed(() => {
    const column = this.column();
    return column?.clickable === true;
  });

  agInit(params: ICellRendererParams & { column?: TableColumn<T> }): void {
    this.paramsSignal.set(params);
  }

  onCellClick(event: Event): void {
    if (!this.isClickable()) return;
    
    const column = this.column();
    const rowData = this.rowData();
    
    if (!column?.onClick || !rowData) return;

    event.stopPropagation();
    const onClickFn = column.onClick as (item: T) => void;
    onClickFn(rowData);
  }

  // AG-Grid cell renderer interface
  refresh(params: ICellRendererParams & { column?: TableColumn<T> }): boolean {
    this.paramsSignal.set(params);
    return true;
  }
}

