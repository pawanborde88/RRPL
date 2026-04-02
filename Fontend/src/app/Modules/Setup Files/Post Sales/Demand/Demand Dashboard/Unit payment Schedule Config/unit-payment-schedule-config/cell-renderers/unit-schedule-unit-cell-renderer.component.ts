import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export interface UnitScheduleContext {
  toggleUnit: (unit: any, floor: any) => void;
  refreshGrid: () => void;
}

@Component({
  selector: 'app-unit-schedule-unit-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="unit" class="flex items-center gap-2 h-full">
      <input
        type="checkbox"
        class="ag-checkbox"
        [checked]="unit?.checked ?? false"
        (change)="onToggle($event)"
        (click)="$event.stopPropagation()"
      />
      <span class="truncate">{{ unit?.floor_unit ?? '' }}</span>
    </div>
  `,
  styles: [`
    .ag-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #3b82f6;
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitScheduleUnitCellRendererComponent implements ICellRendererAngularComp {
  private readonly cdr = inject(ChangeDetectorRef);
  unit: any = null;
  floor: any = null;
  private ctx: UnitScheduleContext | null = null;

  agInit(params: ICellRendererParams): void {
    const colId = params.column?.getColId() || params.colDef?.field || '';
    this.floor = params.data;
    this.unit = (this.floor && colId ? this.floor[colId] : null) || null;
    this.ctx = (params.context as UnitScheduleContext) || null;
  }

  refresh(params: ICellRendererParams): boolean {
    const colId = params.column?.getColId() || params.colDef?.field || '';
    this.floor = params.data;
    this.unit = (this.floor && colId ? this.floor[colId] : null) || null;
    this.ctx = (params.context as UnitScheduleContext) || null;
    this.cdr.markForCheck();
    return true;
  }

  onToggle(event: Event): void {
    event.stopPropagation();
    if (!this.unit || !this.floor || !this.ctx) return;
    this.unit.checked = (event.target as HTMLInputElement).checked;
    this.ctx.toggleUnit(this.unit, this.floor);
    this.ctx.refreshGrid();
  }
}
