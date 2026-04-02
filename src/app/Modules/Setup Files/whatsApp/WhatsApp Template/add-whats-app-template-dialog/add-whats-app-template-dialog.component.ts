import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AddSourcesComponent } from '../../../sources/add-sources/add-sources.component';

@Component({
  selector: 'app-add-whats-app-template-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-whats-app-template-dialog.component.html',
  styleUrl: './add-whats-app-template-dialog.component.scss'
})
export class AddWhatsAppTemplateDialogComponent implements OnInit{
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allModuleList: any[] = [];
  editMode: boolean = false;
  
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddSourcesComponent> // Reference to the dialog
  ) {}
  
  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllprojectsList();
    this.fetchAllMsgModule();
    this.checkEditMode();
  }
  
  projectsList: any[] = [];
  addSourceForm = new FormGroup({
    whatsapp_template_setup_id: new FormControl(this.data?.row?.whatsapp_template_setup_id), // Default userId if no row
    template_name: new FormControl('', [Validators.required]), // Default userId if no row
    project_id: new FormControl(null, [Validators.required]),
    module_id: new FormControl(null, [Validators.required]),
    language_code: new FormControl(null, [Validators.required]),
    created_by: new FormControl(this.userId),
    updated_by: new FormControl(this.userId),
  });

  checkEditMode(): void {
    this.editMode = !!this.data?.row?.whatsapp_template_setup_id;
    if (this.editMode) {
      this.patchFormData();
    }
  }

  patchFormData(): void {
    if (this.data?.row) {
      this.addSourceForm.patchValue({
        whatsapp_template_setup_id: this.data.row.whatsapp_template_setup_id,
        template_name: this.data.row.template_name,
        project_id: this.data.row.project_id,
        module_id: this.data.row.module_id,
        language_code: this.data.row.language_code,
      });
    }
  }

  onSubmit(): void {
    const formData = this.addSourceForm.value;

    // Initialize the apiUrl based on whether we're in edit mode
    const apiUrl = this.editMode ? 'update_whatsapp_template' : 'add_whatsapp_template';

    // Send the request
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      (respons:any) => {
        if(respons.message){
          this.dialogRef.close(true); // Close the dialog and notify the parent component
        }


        this.snackBar.open(respons.message, 'Close', {
          duration: 3000,
        });
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
    this.http.get(`${this.baseUrl}/project_dropdown`).subscribe({
      next: (res: any) => {
        this.projectsList = res;
      },
      error: (err: any) => {
        console.error(err);

        this.snackBar.open('Unable to fetch Tokens.', 'Close', {
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
