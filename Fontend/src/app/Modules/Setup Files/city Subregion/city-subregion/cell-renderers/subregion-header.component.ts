import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

@Component({
  selector: 'app-subregion-header',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule],
  template: `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; width: 100%;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <mat-icon style="font-size: 1.25rem; width: 1.25rem; height: 1.25rem; color: #2563eb;">location_city</mat-icon>
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0;">
          Subregions for {{ cityName }}
        </h3>
      </div>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onAddSubregion()"
        style="display: flex; align-items: center; gap: 4px;">
        <mat-icon style="font-size: 1rem; width: 1rem; height: 1rem;">add_circle</mat-icon>
        Add Subregion
      </button>
    </div>
  `,
})
export class SubregionHeaderComponent implements IHeaderAngularComp {
  params!: IHeaderParams;
  cityName: string = '';
  cityId: number = 0;
  onAddSubregion: () => void = () => {};

  agInit(params: IHeaderParams & { cityName?: string; cityId?: number; onAddSubregion?: () => void }): void {
    this.params = params;
    this.cityName = params.cityName || '';
    this.cityId = params.cityId || 0;
    this.onAddSubregion = params.onAddSubregion || (() => {});
  }

  refresh(params: IHeaderParams & { cityName?: string; cityId?: number; onAddSubregion?: () => void }): boolean {
    this.params = params;
    this.cityName = params.cityName || '';
    this.cityId = params.cityId || 0;
    this.onAddSubregion = params.onAddSubregion || (() => {});
    return true;
  }
}
