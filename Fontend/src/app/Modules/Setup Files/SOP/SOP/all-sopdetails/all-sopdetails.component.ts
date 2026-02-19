import { Component } from '@angular/core';

import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';

@Component({
  selector: 'app-all-sopdetails',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    // QuillModule,
  ],
  templateUrl: './all-sopdetails.component.html',
  styleUrl: './all-sopdetails.component.scss'
})
export class AllSOPDetailsComponent {
  sopSteplist: any;
  userId: number | null = Number(sessionStorage.getItem('session_id'));
  roleId: number = Number(sessionStorage.getItem('role_id'));
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  domainUrl = environment.domainUrl;  SOPDetailsID: any;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private activateRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activateRoute.paramMap.subscribe((params) => {
      this.SOPDetailsID = params.get('id');
      console.log(this.SOPDetailsID);
      this.fetchsopSteplog();
    });
  }

  fetchsopSteplog() {
    const obj = {sop_execution_id: this.SOPDetailsID, user_id:this.userId };
    this.http.post(`${this.baseUrl}/fetch_sop_step_log`, obj).subscribe({
      next: (res: any) => {
        this.sopSteplist = res; // Corrected assignment
      },
      error: (err) => {
        console.error('Error fetching SOP step log:', err);
        this.snackBar.open('Error fetching SOP details.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  addSOPStepLog(item: any) {
    console.log(item);
    
    const requestPayload = {
      user_id: this.userId,
      sop_step_id: item.sop_step_id,
      status_id: item.status_id || null,
    sop_execution_id: this.SOPDetailsID,
      comment: item.comment || '',
      ...(item.sop_step_log_id && { sop_step_log_id: item.sop_step_log_id }),
    };

    const isEdit = !!item.sop_step_log_id;
    const apiUrl = isEdit ? 'edit_sop_step_log' : 'add_sop_step_log';
    const successMessage = isEdit
      ? 'SOP step log updated successfully!'
      : 'SOP step log added successfully!';
    const errorMessage = isEdit
      ? 'Error updating SOP step log.'
      : 'Error adding SOP step log.';

    this.http.post(`${this.baseUrl}/${apiUrl}`, requestPayload).subscribe({
      next: () => {
        this.snackBar.open(successMessage, 'Close', { duration: 3000 });
        this.fetchsopSteplog();
      },
      error: () => {
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
      },
    });
  }
}
