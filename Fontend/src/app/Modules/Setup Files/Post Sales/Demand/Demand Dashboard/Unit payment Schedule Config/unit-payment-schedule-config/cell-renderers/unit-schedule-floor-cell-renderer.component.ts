import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export interface UnitScheduleContext {
  toggleFloor: (floor: any) => void;
  refreshGrid: () => void;
}

@Component({
  selector: 'app-unit-schedule-floor-cell-renderer',
  standalone: true,
  template: `
    <div class="flex items-center gap-2 h-full">
      <input
        type="checkbox"
        class="ag-checkbox"
        [checked]="floor?.floorChecked ?? false"
        (change)="onToggle($event)"
        (click)="$event.stopPropagation()"
      />
      <span class="truncate">{{ floor?.floor_name ?? '' }}</span>
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
export class UnitScheduleFloorCellRendererComponent implements ICellRendererAngularComp {
  private readonly cdr = inject(ChangeDetectorRef);
  floor: any = null;
  private ctx: UnitScheduleContext | null = null;

  agInit(params: ICellRendererParams): void {
    this.floor = params.data;
    this.ctx = (params.context as UnitScheduleContext) || null;
  }

  refresh(params: ICellRendererParams): boolean {
    this.floor = params.data;
    this.ctx = (params.context as UnitScheduleContext) || null;
    this.cdr.markForCheck();
    return true;
  }

  onToggle(event: Event): void {
    event.stopPropagation();
    if (!this.floor || !this.ctx) return;
    this.floor.floorChecked = (event.target as HTMLInputElement).checked;
    this.ctx.toggleFloor(this.floor);
    this.ctx.refreshGrid();
  }
}
