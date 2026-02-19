import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';

@Component({
  selector: 'app-cancel-token-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './cancel-token-dialog.component.html',
  styleUrl: './cancel-token-dialog.component.scss',
})
export class CancelTokenDialogComponent implements OnInit {
  baseUrl = environment.API_URL;
  loading: boolean = false;
  cancelRemark: string = '';  // Add this line


  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
        private dialog: MatDialog,
    
    private sanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<CancelTokenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    console.log(this.data);
  }

  onConfirm(): void {
    if (this.data?.for) {
      // Return the cancel remark when bookingForm is present
      this.dialogRef.close({ cancel_remark: this.cancelRemark });
    } else {
      // Return simple true when no bookingForm
      this.dialogRef.close(true);
    }
  }
}
