import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../../Pipes/truncate.pipe';

@Component({
  selector: 'app-chekque-status-dialog',
  standalone: true,
   imports: [
      CommonModule,
      RouterModule,
      TemplateComponent,
      BreadcrumbComponent,
      AngularMaterialModule,
      FormsModule,
      ReactiveFormsModule,
      TruncatePipe, // Add the pipe here
    ],
  templateUrl: './chekque-status-dialog.component.html',
  styleUrl: './chekque-status-dialog.component.scss'
})
export class ChekqueStatusDialogComponent {
  receiptData: any;

  constructor(
    public dialogRef: MatDialogRef<ChekqueStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // If we're passing receipt data for display
    if (data.receiptData) {
      this.receiptData = data.receiptData;
    }
  }
}
