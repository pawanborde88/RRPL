import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../../angular-material.module';

interface ActionCellRendererParams {
  color?: string;
  tooltip?: string;
  icon?: string;
  onClick?: (data: any) => void;
}

@Component({
  selector: 'app-action-cell-renderer',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule],
  template: `
    <button mat-icon-button 
      [color]="color" 
      class="transition-colors duration-200 hover:bg-red-50 rounded-full"
      [matTooltip]="tooltip"
      (click)="onClick()">
      <mat-icon>{{ icon }}</mat-icon>
    </button>
  `,
})
export class ActionCellRendererComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams & ActionCellRendererParams;
  color: string = 'warn';
  tooltip: string = '';
  icon: string = 'delete';

  agInit(params: ICellRendererParams & ActionCellRendererParams): void {
    this.params = params;
    this.color = params.color || 'warn';
    this.tooltip = params.tooltip || '';
    this.icon = params.icon || 'delete';
  }

  onClick(): void {
    if (this.params.onClick && typeof this.params.onClick === 'function') {
      this.params.onClick(this.params.data);
    }
  }

  refresh(params: ICellRendererParams & ActionCellRendererParams): boolean {
    this.params = params;
    this.color = params.color || 'warn';
    this.tooltip = params.tooltip || '';
    this.icon = params.icon || 'delete';
    return true;
  }
}

