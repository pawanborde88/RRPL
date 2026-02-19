import { Component, ChangeDetectorRef, inject, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

@Component({
  selector: 'app-header-checkbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header-checkbox-container">
      <div class="form-check">
        <input 
          #checkboxInput
          class="form-check-input" 
          type="checkbox" 
          [checked]="checked"
          (change)="onCheckboxChange($any($event.target).checked)">
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .header-checkbox-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
    }
    .form-check {
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .form-check-input {
      width: 16px;
      height: 16px;
      margin: 0;
      cursor: pointer;
      flex-shrink: 0;
    }
    .form-check-input:indeterminate {
      background-color: #0d4678;
      border-color: #0d4678;
    }
  `]
})
export class HeaderCheckboxComponent implements IHeaderAngularComp, AfterViewInit {
  private params!: IHeaderParams;
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('checkboxInput') checkboxInput!: ElementRef<HTMLInputElement>;

  checked = false;
  indeterminate = false;
  private isProcessing = false;

  agInit(params: IHeaderParams): void {
    this.params = params;
    this.params.api.addEventListener('selectionChanged', this.onSelectionChanged.bind(this));
    this.params.api.addEventListener('rowDataUpdated', this.onSelectionChanged.bind(this));
    this.params.api.addEventListener('modelUpdated', this.onSelectionChanged.bind(this));
    this.onSelectionChanged();
  }

  refresh(params: IHeaderParams): boolean {
    this.params = params;
    this.onSelectionChanged();
    return true;
  }

  onCheckboxChange(checked: boolean): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const context = (this.params as any).context;
      const facade = context?.facade;
      const idProperty = context?.idProperty || 'id';

      // Update local state immediately to keep UI in sync with click
      this.checked = checked;
      this.indeterminate = false;
      this.updateIndeterminateState();

      if (checked) {
        if (facade) {
          facade.selectAll(idProperty);
        } else {
          console.error('HeaderCheckbox: Facade not found in context!');
        }
      } else {
        if (facade) {
          facade.deselectAll();
        } else {
          console.error('HeaderCheckbox: Facade not found in context!');
        }
      }
    } catch (e) {
      console.error('HeaderCheckbox: Error', e);
    } finally {
      this.isProcessing = false;
      // Final sync with actual grid state
      this.updateUIState();
    }
  }

  private onSelectionChanged(): void {
    if (this.isProcessing) return;
    this.updateUIState();
  }

  private updateUIState(): void {
    const api = this.params.api;
    const pageSize = api.paginationGetPageSize();
    const currentPage = api.paginationGetCurrentPage();
    const startRow = currentPage * pageSize;
    const endRow = startRow + pageSize;

    let totalPageRows = 0;
    let selectedPageRows = 0;

    // Only check rows on the current page for much better performance
    for (let i = startRow; i < endRow; i++) {
      const node = api.getDisplayedRowAtIndex(i);
      if (node && node.data && !node.rowPinned) {
        totalPageRows++;
        if (node.isSelected()) {
          selectedPageRows++;
        }
      }
    }

    if (selectedPageRows === totalPageRows && totalPageRows > 0) {
      this.checked = true;
      this.indeterminate = false;
    } else if (selectedPageRows > 0) {
      this.checked = false;
      this.indeterminate = true;
    } else {
      this.checked = false;
      this.indeterminate = false;
    }

    this.updateIndeterminateState();
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    this.updateIndeterminateState();
  }

  private updateIndeterminateState(): void {
    if (this.checkboxInput?.nativeElement) {
      this.checkboxInput.nativeElement.indeterminate = this.indeterminate;
    }
  }
}
