import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { MatDialog } from '@angular/material/dialog';
import { ViewInfoMobEmailComponent } from '../../../../../View Mobile Email/view-info-mob-email/view-info-mob-email.component';
import { TableRowData, TableColumn } from '../../../../reusable-table/reusable-table.component';

/**
 * Standalone sensitive cell renderer component for AG-Grid
 * Refactored to Angular 17+ with Signals and OnPush change detection
 * Displays a lock icon that opens a dialog to view sensitive data
 */
@Component({
  selector: 'app-sensitive-cell-renderer',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule],
  template: `
    @if (isPinnedRow()) {
      <div></div>
    } @else {
      <div class="sensitive-cell-container">
        <button
          mat-icon-button
          type="button"
          [title]="title()"
          [attr.aria-label]="'View sensitive ' + title()"
          (click)="onClick($event)"
          class="lock-button">
          <mat-icon>lock</mat-icon>
        </button>
      </div>
    }
  `,
  styles: [`
    .sensitive-cell-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 4px;
    }
    
    .lock-button {
      min-width: 24px;
      width: 24px;
      height: 24px;
      padding: 0;
      transition: all 0.2s;
      
 
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SensitiveCellRendererComponent<T extends TableRowData = TableRowData> implements ICellRendererAngularComp {
  private readonly paramsSignal = signal<ICellRendererParams & { column?: TableColumn<T> } | null>(null);
  private readonly dialog = inject(MatDialog);

  // Computed signals for reactive state
  readonly params = computed(() => this.paramsSignal());
  readonly column = computed(() => this.params()?.column);
  readonly rowData = computed(() => this.params()?.data as T | undefined);
  readonly isPinnedRow = computed(() => this.params()?.node?.rowPinned === 'bottom');
  
  readonly value = computed(() => {
    const params = this.params();
    return String(params?.value || '');
  });

  readonly title = computed(() => {
    const column = this.column();
    return column?.label || 'Sensitive Data';
  });

  agInit(params: ICellRendererParams & { column?: TableColumn<T> }): void {
    this.paramsSignal.set(params);
  }

  onClick(event: Event): void {
    event.stopPropagation();
    const rowData = this.rowData();
    if (!rowData) return;

    this.dialog.open(ViewInfoMobEmailComponent, {
      width: '450px',
      maxWidth: '90vw',
      disableClose: true,
      autoFocus: false,
      data: {
        title: this.title(),
        value: this.value(),
        rowId: (rowData as any).id,
        call_masking_id: (rowData as any).call_masking_id,
        data: rowData
      },
    });
  }

  // AG-Grid cell renderer interface
  refresh(params: ICellRendererParams & { column?: TableColumn<T> }): boolean {
    this.paramsSignal.set(params);
    return true;
  }
}

