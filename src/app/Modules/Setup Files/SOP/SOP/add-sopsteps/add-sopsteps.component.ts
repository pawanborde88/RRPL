import { Component, Inject } from '@angular/core';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { QuillModule } from 'ngx-quill';
@Component({
  selector: 'app-add-sopsteps',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    QuillModule  ],
  templateUrl: './add-sopsteps.component.html',
  styleUrl: './add-sopsteps.component.scss'
})
export class AddSOPStepsComponent {
  addSOPForm: FormGroup;
  baseUrl = environment.API_URL;
  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<AddSOPStepsComponent>
  ) {
    // Initialize form
    this.addSOPForm = new FormGroup({
      user_id: new FormControl(sessionStorage.getItem('session_id') || '', Validators.required),
      active_status_id: new FormControl(this.data?.item?.active_status_id, Validators.required),
      sop_step: new FormControl(this.data?.item?.sop_step, Validators.required),
      sequence: new FormControl(this.data?.item?.sequence),
      sop_detail_id: new FormControl( this.data?.sop_detail_id?  this.data?.sop_detail_id:  this.data?.item?.sop_detail_id),
      sop_step_id: new FormControl(this.data?.item?.sop_step_id),
    });

  }

  ngOnInit(): void {
    console.log(this.data);

  }
  onSubmit(): void {
    if (this.addSOPForm.invalid) {
      this.snackBar.open('Please fill in all required fields', '', { duration: 3000 });
      return;
    }

    const formData = this.addSOPForm.value; // Get form data
    const obj: any = {
      user_id: formData.user_id,
      active_status_id: formData.active_status_id,
      sop_step: formData.sop_step,
      sequence: formData.sequence,
      sop_detail_id: formData.sop_detail_id,
    };

    if (formData.sop_step_id) {
      obj.sop_step_id = formData.sop_step_id; // Add only if sop_step_id exists
    }



    const apiUrl = this.addSOPForm.controls['sop_step_id'].value ? 'edit_sop_step' : 'add_sop_step';

    // Send request to the API
    this.http.post(`${this.baseUrl}/${apiUrl}`, obj).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.snackBar.open( this.addSOPForm.controls['sop_step_id'].value ? 'SOP Step updated successfully!' : 'SOP Step added successfully!', '', { duration: 3000 });
          this.dialogRef.close(true); // Close the dialog and return success
        } else {
          console.error('Error:', res.message);
          this.snackBar.open( this.addSOPForm.controls['sop_step_id'].value ? 'Failed to update SOP Step' : 'Failed to add SOP Step', '', { duration: 3000 });
        }
      },
      error: (err: any) => {
        console.error('Error occurred:', err);
        this.snackBar.open('An error occurred while saving the SOP Step', '', { duration: 3000 });
      },
    });
  }

  editorConfig: AngularEditorConfig = {
    editable: true,
    showToolbar: true,
    placeholder: 'Enter SOP description here...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    toolbarHiddenButtons: [[]],
  };
}
