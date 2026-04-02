import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';

@Component({
  selector: 'app-sop-preview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // TemplateComponent,
    // BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    // QuillModule,
  ],
  templateUrl: './sop-preview.component.html',
  styleUrl: './sop-preview.component.scss',
})
export class SopPreviewComponent {
  userId: number | null = Number(sessionStorage.getItem('session_id'));
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  storageUrl = environment.STORAGE_URL;
  purpose: string = '';
  sopSteplist: any = {}; // Initialize as an empty object

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Made data public to use in template
    private dialogRef: MatDialogRef<SopPreviewComponent>
  ) {}

  ngOnInit(): void {
    console.log('SOP DATA:', this.data);
    this.fetchsopSteplog();
  }
  fetchsopSteplog() {
    const obj = {
      user_id: this.userId,
      sop_detail_id: this.data.item.sop_detail_id,
    };
    this.http.post(`${this.baseUrl}/fetch_sop_step`, obj).subscribe({
      next: (res: any) => {
        this.sopSteplist = res;
      },
      error: (err) => {
        console.error('Error fetching SOP step log:', err);
        this.snackBar.open('Error fetching SOP details.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  ExecuteSteps(): void {
    if (this.data?.item?.sop_detail_id) {
      const request = {
        user_id: this.userId,
        sop_id: this.data.item.sop_detail_id,
        purpose: this.purpose,
      };

      // Call the add_sop_execution API
      this.http.post(`${this.baseUrl}/add_sop_execution`, request).subscribe({
        next: (res: any) => {
          if (res.success) {
            const sopExecutionId = res.sop_execution_id;

            this.snackBar.open('SOP Execution started successfully.', 'Close', {
              duration: 3000,
            });
            this.dialogRef.close(); // Close the dialog after successful execution

            // Navigate to SOP details with sop_execution_id

            this.router.navigate(['/all-SOPdetails', sopExecutionId]); // Use sopExecutionId in the route
          }
        },
        error: (err) => {
          console.error('Error executing SOP:', err);
          this.snackBar.open(
            'Error executing SOP. Please try again.',
            'Close',
            {
              duration: 3000,
            }
          );
        },
      });
    } else {
      this.snackBar.open('Invalid SOP details. Unable to proceed.', 'Close', {
        duration: 3000,
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close(); // Method to close the dialog
  }
}
