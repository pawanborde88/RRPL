import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { AddDocumentComponent } from '../add-document/add-document.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';

@Component({
  selector: 'app-add-project-links',
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
  templateUrl: './add-project-links.component.html',
  styleUrl: './add-project-links.component.scss'
})
export class AddProjectLinksComponent {
baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  selectedFileName: string = ''; // To display the selected file name

  pipe = new DatePipe('en-US');
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddDocumentComponent> // Reference to the dialog
  ) {}

  ngOnInit(): void {
    console.log(this.data.projectid);
  }
  addProjectLinkForm = new FormGroup({
    user_id: new FormControl(this.userId),
    project_id: new FormControl(this.data.projectid),
    display_name: new FormControl(this.data.display_name),
    project_link: new FormControl('', [Validators.pattern(/^https?:\/\/[^\s]+$/)]), // URL validation
  });


  onSubmit(): void {
    const { apiUrl, successMessage } = this.data;
    
    const formData = {
      user_id: this.addProjectLinkForm.value.user_id,
      project_id: this.addProjectLinkForm.value.project_id,
      project_link: this.addProjectLinkForm.value.project_link,
      display_name: this.addProjectLinkForm.value.display_name,
    };

    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      () => {
        this.snackBar.open(successMessage, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      () => {
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }
}
