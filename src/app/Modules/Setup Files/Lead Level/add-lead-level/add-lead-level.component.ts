import { Component, Inject, OnInit } from '@angular/core';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AddTeamsComponent } from '../../Team/add-teams/add-teams.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-add-lead-level',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent
  ],
  templateUrl: './add-lead-level.component.html',
  styleUrl: './add-lead-level.component.scss',
})
export class AddLeadLevelComponent  implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddLeadLevelComponent> // Reference to the dialog
  ) // Injected dialog data
  {}
  ngOnInit(): void {
    console.log(this.data);
    
  }

  addLeadLevelForm = new FormGroup({
    user_id: new FormControl(this.userId),
    lead_level: new FormControl(this.data?.rowData?.lead_level || '', Validators.required),
    call_status: new FormControl(this.data?.rowData?.call_status || '', Validators.required),
    active_status_id: new FormControl(this.data?.rowData?.active_status_id, Validators.required),
    lead_level_id: new FormControl(this.data?.rowData?.lead_level_id || null),
    updated_by: new FormControl(this.userId),
  });
  
  onSubmit(): void {
    const formData = {
      ...this.addLeadLevelForm.value,
      call_status_id: this.data?.rowData?.call_status_id,
      lead_level_id: this.data?.leadLevelID || this.addLeadLevelForm.value.lead_level_id,
    };
  
    this.http.post(`${this.baseUrl}/${this.data.apiUrl}`, formData).subscribe(
      () => {
        this.snackBar.open(this.data.successMessage, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      () => {
        this.snackBar.open('Something went wrong. Please try again.', 'Close', { duration: 3000 });
      }
    );
  }
  
  
}
