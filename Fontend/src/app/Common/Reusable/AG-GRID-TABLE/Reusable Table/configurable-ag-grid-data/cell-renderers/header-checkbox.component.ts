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
      <input 
        #checkboxInput
        type="checkbox" 
        [checked]="checked"
        (change)="onCheckboxChange($any($event.target).checked)">
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    .header-checkbox-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      margin: 0;
      border: 2px solid #0d4678;
      border-radius: 4px;
      appearance: none;
      -webkit-appearance: none;
      position: relative;
    }
    input[type="checkbox"]:checked {
      background-color: #0d4678;
    }
    input[type="checkbox"]:checked::after {
      content: '✔';
      position: absolute;
      color: white;
      font-size: 14px;
      top: -2px;
      left: 2px;
    }
    input[type="checkbox"]:indeterminate {
      background-color: #0d4678;
    }
    input[type="checkbox"]:indeterminate::after {
      content: '-';
      position: absolute;
      color: white;
      font-size: 20px;
      top: -6px;
      left: 4px;
      font-weight: bold;
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
      const p = this.params as any;
      const context = p.context;
      const facade = p.facade || context?.facade;
      const idProperty = p.idProperty || context?.idProperty || 'id';

      // Update local state immediately to keep UI in sync with click
      this.checked = checked;
      this.indeterminate = false;
      this.updateIndeterminateState();

      if (checked) {
        if (facade && typeof facade.selectPage === 'function') {
          facade.selectPage(idProperty);
        } else {
          console.error('HeaderCheckbox: selectPage method not found on facade!', facade);
          // Fallback to basic API if facade fails
          this.params.api.selectAll();
        }
      } else {
        if (facade && typeof facade.deselectPage === 'function') {
          facade.deselectPage(idProperty);
        } else {
          console.error('HeaderCheckbox: deselectPage method not found on facade!', facade);
          this.params.api.deselectAll();
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
      // Skip rows that are pinned or are just placeholders for unloaded data
      if (node && node.data && !node.rowPinned && !node.data.__isPlaceholder) {
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
