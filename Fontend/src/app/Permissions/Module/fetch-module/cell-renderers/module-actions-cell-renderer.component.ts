import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AngularMaterialModule } from '../../../../../angular-material.module';

export interface ModuleActionsContext {
  openEdit: (data: { module_id?: string | number }) => void;
  deleteModule: (id: string | number) => void;
}

@Component({
  selector: 'app-module-actions-cell-renderer',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule],
  template: `
    <div class="module-actions">
      <button mat-icon-button (click)="onEdit($event)" matTooltip="Edit">
        <mat-icon>edit</mat-icon>
      </button>
      <button
        *ngIf="!data?.child?.length"
        mat-icon-button
        (click)="onDelete($event)"
        matTooltip="Delete"
        color="warn"
      >
        <mat-icon>delete</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .module-actions {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .module-actions button {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }
    .module-actions mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
})
export class ModuleActionsCellRendererComponent implements ICellRendererAngularComp {
  data: { module_id?: string; child?: unknown[] } | null = null;
  private ctx: ModuleActionsContext | null = null;

  agInit(params: ICellRendererParams): void {
    this.data = params.data ?? null;
    this.ctx = (params.context as ModuleActionsContext) ?? null;
  }

  refresh(params: ICellRendererParams): boolean {
    this.data = params.data ?? null;
    this.ctx = (params.context as ModuleActionsContext) ?? null;
    return true;
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    if (this.data?.module_id != null && this.ctx) {
      this.ctx.openEdit(this.data);
    }
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    if (this.data?.module_id != null && this.ctx) {
      this.ctx.deleteModule(this.data.module_id);
    }
  }
}
