import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { BookingUpdatedLogFacade } from './booking-updated-log.facade';

@Component({
  selector: 'app-booking-updated-log-dialog',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    ConfigurableAgGridDataComponent
  ],
  templateUrl: './booking-updated-log-dialog.component.html',
  styleUrl: './booking-updated-log-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BookingUpdatedLogFacade]
})
export class BookingUpdatedLogDialogComponent implements OnInit, AfterViewInit {

  // Dependency Injection
  public readonly dialogRef = inject(MatDialogRef<BookingUpdatedLogDialogComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);
  readonly facade = inject(BookingUpdatedLogFacade);

  @ViewChild(ConfigurableAgGridDataComponent) grid!: ConfigurableAgGridDataComponent;

  constructor() {
    this.facade.setBookingId(this.data);
  }

  ngOnInit(): void {
    // Data is auto-loaded by the grid component
  }

  ngAfterViewInit(): void {
    if (this.grid) {
      this.grid.refreshData();
    }
  }


  // Expose facade properties for template
  readonly columns = this.facade.columns;
  readonly payload = this.facade.gridPayload;
  readonly apiEndpoint = this.facade.apiEndpoint;
}
