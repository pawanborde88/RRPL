import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { CpDialogStore, DialogData } from './store/cp-dialog.store';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';

@Component({
  selector: 'app-all-cpdialog-data',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    ConfigurableAgGridDataComponent
  ],
  templateUrl: './all-cpdialog-data.component.html',
  styleUrl: './all-cpdialog-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllCPDialogDataComponent implements OnInit {
  public readonly dialogRef = inject(MatDialogRef<AllCPDialogDataComponent>);
  public readonly store = inject(CpDialogStore);

  // Injected dialog data with type safety
  private readonly dialogData = inject<DialogData>(MAT_DIALOG_DATA, { optional: true }) || {};

  ngOnInit(): void {
    // Initialize the store when the component initializes
    this.store.initialize(this.dialogData);
  }

  /**
   * Closes the dialog
   */
  protected onClose(): void {
    this.dialogRef.close();
  }
}
