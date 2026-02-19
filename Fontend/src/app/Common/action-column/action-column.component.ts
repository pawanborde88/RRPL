import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { inject } from '@angular/core';
interface TableAction {
  icon: string;
  tooltip: string;
  action: string;
  color?: string;
  disabled?: boolean;
  show?: (element: any) => boolean;
}

@Component({
  selector: 'app-action-column',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatMenuModule,
    FormsModule,
  ],
  templateUrl: './action-column.component.html',
  styleUrl: './action-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionColumnComponent implements OnInit, OnChanges {
  @Input() rowData: any;
  @Input() actions: any[] = [];
  @Input() showCheckbox = false;
  @Input() selectedItems: any[] = [];
  @Input() idProperty = 'id';

  @Output() actionClick = new EventEmitter<{ action: string; row: any }>();
  @Output() checkboxChange = new EventEmitter<{ checked: boolean; row: any }>();

  // Memoized visible actions to avoid recalculating on every change detection
  private cachedVisibleActions: any[] = [];
  private lastActionsHash: string = '';
  private lastRowDataId: any = null;

  // Memoized selected state
  private cachedIsSelected: boolean = false;
  private lastSelectedItemsHash: string = '';

  // TrackBy function for actions to prevent unnecessary re-renders
  trackByAction = (index: number, action: any): string => {
    return action?.action || `action-${index}`;
  };

  private readonly cdr = inject(ChangeDetectorRef);

  constructor() { }

  ngOnInit(): void {
    this.updateCachedValues();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only update if relevant inputs changed
    if (changes['selectedItems'] || changes['rowData'] || changes['actions']) {
      // Reset cache if actions reference changed (even if content is same)
      if (changes['actions'] && !changes['actions'].firstChange) {
        this.lastActionsHash = ''; // Force recalculation
      }
      this.updateCachedValues();
      this.cdr.markForCheck();
    }
  }

  private updateCachedValues(): void {
    // Update visible actions cache
    this.updateVisibleActionsCache();

    // Update selected state cache
    if (this.rowData && this.selectedItems) {
      const selectedHash = this.getSelectedItemsHash();
      const currentRowId = this.rowData[this.idProperty];

      if (selectedHash !== this.lastSelectedItemsHash || currentRowId !== this.lastRowDataId) {
        this.cachedIsSelected = this.isSelectedInternal();
        this.lastSelectedItemsHash = selectedHash;
        this.lastRowDataId = currentRowId;
      }
    } else if (this.rowData) {
      // Handle case when selectedItems is empty/null
      const currentRowId = this.rowData[this.idProperty];
      if (currentRowId !== this.lastRowDataId) {
        this.cachedIsSelected = false;
        this.lastRowDataId = currentRowId;
        this.lastSelectedItemsHash = 'empty';
      }
    }
  }

  private updateVisibleActionsCache(): void {
    if (!this.actions || !this.rowData) {
      this.cachedVisibleActions = [];
      this.lastActionsHash = '';
      return;
    }

    // Create a hash of actions array and rowData ID to detect changes
    // Use action property for hashing (more stable than object reference)
    const actionKeys = this.actions.map(a => (a as any)?.action || '').join(',');
    const actionsHash = `${this.actions.length}-${actionKeys}-${this.rowData[this.idProperty]}`;

    if (actionsHash !== this.lastActionsHash) {
      // Filter visible actions and cache result
      this.cachedVisibleActions = this.actions.filter(action => {
        if (!action) return false;
        const showFn = (action as any).show;
        return showFn ? showFn(this.rowData) : true;
      });
      this.lastActionsHash = actionsHash;
    }
  }

  private getSelectedItemsHash(): string {
    if (!this.selectedItems || this.selectedItems.length === 0) {
      return 'empty';
    }
    // Create a hash based on selected items IDs
    return this.selectedItems.map(item => item[this.idProperty]).sort().join(',');
  }

  isSelected(): boolean {
    return this.cachedIsSelected;
  }

  private isSelectedInternal(): boolean {
    if (!this.selectedItems || !this.rowData) return false;
    return this.selectedItems.some(item =>
      item[this.idProperty] === this.rowData[this.idProperty]
    );
  }

  getVisibleActions(): any[] {
    // Return cached value to avoid recalculating
    return this.cachedVisibleActions;
  }

  isActionDisabled(action: any): boolean {
    if (typeof action.disabled === 'function') {
      // Pass the rowData to the disabled function
      return action.disabled(this.rowData);
    }
    return !!action.disabled;
  }

  triggerAction(action: string, event: MouseEvent): void {
    event.stopPropagation();
    this.actionClick.emit({
      action: action,
      row: this.rowData
    });
  }

  onCheckboxChange(event: any): void {
    this.checkboxChange.emit({
      checked: event.checked,
      row: this.rowData
    });
  }
}