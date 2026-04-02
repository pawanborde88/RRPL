import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../../environments/environment';
import { AddSourcesComponent } from '../../../../sources/add-sources/add-sources.component';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../../Common/success-dialog/success-dialog.component';
import { CommonService } from '../../../../../../Service/common/common.service';

@Component({
  selector: 'app-add-booking-visitor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    
  ],
  templateUrl: './add-booking-visitor-dialog.component.html',
  styleUrl: './add-booking-visitor-dialog.component.scss'
})
export class AddBookingVisitorDialogComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allModuleList: any[] = [];
  allTokenNolist: any[] = [];
  allTokenType: any[] = [];
  editMode: boolean = false;
  pipe = new DatePipe('en-US');

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddBookingVisitorDialogComponent>, // Reference to the dialog
    private commonService: CommonService
  ) {}
  
  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllprojectsList();
    this.fetchAllMsgModule();
    this.checkEditMode();

    this.addSourceForm.get('project_id')?.valueChanges.subscribe((projectID) => {

      if (projectID) {
        const effectiveProjectId = projectID;
        this.fetchTokenTypeDropdown(effectiveProjectId);
        const initialTokenTypeId = this.addSourceForm.get('token_type')?.value;
        this.fetchTokenNolist(effectiveProjectId, Number(initialTokenTypeId));

        this.addSourceForm.get('token_type')?.valueChanges.subscribe((newTokenTypeId) => {
          this.fetchTokenNolist(effectiveProjectId, newTokenTypeId ?? null);
        });
      }
    });
  }
  
  projectsList: any[] = [];
  addSourceForm = new FormGroup({
    token_type: new FormControl(1, [Validators.required]),
    token_id: new FormControl('1', [Validators.required]),
    project_id: new FormControl(null, [Validators.required]),
    date_of_visit: new FormControl(  this.pipe.transform(new Date(), 'yyyy-MM-dd'), [Validators.required]),
    no_visitor: new FormControl(null, [Validators.required]),
    created_by: new FormControl(this.userId),
    updated_by: new FormControl(this.userId),
    token_visitor_id: new FormControl(),
  });
  
  checkEditMode(): void {
    this.editMode = !!this.data?.row?.token_id;
    if (this.editMode) {
      this.patchFormData();
    }
  }
  
  patchFormData(): void {
    if (this.data?.row) {
      this.addSourceForm.patchValue({
        token_type: this.data.row.token_type_id,
        token_id: this.data.row.token_id,
        project_id: this.data.row.project_id,
        date_of_visit: this.data.row.date_of_visit,
        no_visitor: this.data.row.no_visitor,
        token_visitor_id: this.data.row.token_visitor_id,
      });
      this.fetchTokenTypeDropdown( this.data.row.project_id);
      this.fetchTokenNolist( this.data.row.project_id, this.data.row.token_type);

    }
  }
  
  onSubmit(): void {
    const formData = this.addSourceForm.value;
  
    // Format date to YYYY-MM-DD if needed
    if (formData.date_of_visit) {
      formData.date_of_visit = new Date(formData.date_of_visit).toISOString().split('T')[0];
    }
    
    // Initialize the apiUrl based on whether we're in edit mode
    const apiUrl = this.editMode ? 'edit_token_visitor' : 'add_token_visitor';
  
    // Send the request
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      (respons: any) => {
        if (respons.message) {
          this.dialog
          .open(SuccessDialogComponent, {
            data: { message: respons.message },
          })
         


        }
        this.dialogRef.close(true); // Close the dialog and notify the parent component

        
      },
      (error) => {
        // Handle error response
        console.error('Error:', error);
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }
  
  fetchAllprojectsList(): void {
    this.commonService.fetchUserProjectDropdown(this.userId).subscribe({
      next: (res: any) => {
        this.projectsList = res;
      },
      error: (err: any) => {
        console.error(err);

        this.snackBar.open('Unable to fetch Projects.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  fetchTokenTypeDropdown(projectID: any): void {
    this.http.post<any>(`${this.baseUrl}/token_type_dropdown`, {
      project_id: projectID,
    }).subscribe({
      next: (response) => {
        this.allTokenType = response;
      },
      error: (error) => {
        console.error('Error fetching tokenTypeDropdown:', error);
        this.snackBar.open(
          'Unable to fetch token type dropdown data.',
          'Close',
          { duration: 3000 }
        );
      },
    });
  }
  fetchTokenNolist(projectID: any, tokenTypeId: any): void {
    const payload = {
      project_id: projectID,
      token_type_id: tokenTypeId ?? null,
      status: 1,
    };

    this.http.post(`${this.baseUrl}/fetch_token_dropdown`, payload).subscribe({
      next: (res: any) => {
        this.allTokenNolist = res.map((item:any) => ({
          ...item,
          displayText: `${item.full_name} - ${item.token_no}` // Combine name and token no
          // OR if you want mobile instead: `${item.full_name} - ${item.mobile_no}`
        }));
      },
      error: () => {
        this.snackBar.open('Unable to fetch token list.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  fetchAllMsgModule(): void {
    this.http.get(`${this.baseUrl}/fetch_msg_module`).subscribe({
      next: (res: any) => {
        this.allModuleList = res;
      },
      error: (err: any) => {
        console.error(err);

        this.snackBar.open('Unable to fetch Tokens.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

}
