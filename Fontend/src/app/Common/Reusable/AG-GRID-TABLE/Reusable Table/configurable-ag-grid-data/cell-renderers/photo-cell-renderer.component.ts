import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../../../environments/environment';
import { TableRowData, TableColumn } from '../../../../reusable-table/reusable-table.component';

/**
 * Standalone photo cell renderer component for AG-Grid
 * Refactored to Angular 17+ with optimized Signals and OnPush change detection
 * Displays an image with storageUrl prefix
 */
@Component({
  selector: 'app-photo-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isPinnedRow()) {
      <span></span>
    } @else {
      <div class="photo-container">
          <img
            [alt]="value() || 'user'"
            [src]="imageSrc()"
            [class]="logo"
            [style.cursor]="isClickable() ? 'pointer' : 'default'"
            (click)="onImageClick($event)"
            loading="lazy"
          />
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 2px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .photo-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px; /* Fixed width for uniform look */
      height: 40px; /* Fixed height for uniform look */
      background-color: #f3f4f6; /* Light gray placeholder background */
      border-radius: 6px;
      overflow: hidden;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
    }

    .logo {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain; /* Maintain ratio within the fixed box */
      transition: all 0.2s ease-in-out;

      &:hover {
        transform: scale(1.1);
        z-index: 50;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoCellRendererComponent<T extends TableRowData = TableRowData> implements ICellRendererAngularComp {
  private readonly paramsSignal = signal<ICellRendererParams & { column?: TableColumn<T> } | null>(null);

  readonly storageUrl = environment.STORAGE_URL;
  readonly imgSpanLogo = 'imgSpanLogo';
  readonly logo = 'logo';

  // Computed signals for reactive state
  readonly params = computed(() => this.paramsSignal());
  readonly column = computed(() => this.params()?.column);
  readonly value = computed(() => {
    const params = this.params();
    return params?.value || null;
  });
  readonly rowData = computed(() => this.params()?.data as T | undefined);
  readonly isPinnedRow = computed(() => this.params()?.node?.rowPinned === 'bottom');

  readonly imageSrc = computed(() => {
    const photoValue = this.value();
    const column = this.column();

    if (!photoValue) {
      return column?.nullImage || 'assets/Images/user.png';
    }

    if (typeof photoValue === 'string' && (photoValue.startsWith('http://') || photoValue.startsWith('https://'))) {
      return photoValue;
    }

    return `${this.storageUrl}/${photoValue}`;
  });

  readonly isClickable = computed(() => {
    const column = this.column();
    return column?.clickable === true;
  });

  agInit(params: ICellRendererParams & { column?: TableColumn<T> }): void {
    this.paramsSignal.set(params);
  }

  onImageClick(event: Event): void {
    if (!this.isClickable()) return;

    const column = this.column();
    const rowData = this.rowData();

    if (!column?.onClick || !rowData) return;

    event.stopPropagation();
    const onClickFn = column.onClick as (item: T) => void;
    onClickFn(rowData);
  }

  refresh(params: ICellRendererParams & { column?: TableColumn<T> }): boolean {
    this.paramsSignal.set(params);
    return true;
  }
}

