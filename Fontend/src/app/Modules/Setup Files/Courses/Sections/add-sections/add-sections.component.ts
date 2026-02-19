import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AddChannelPartnerComponent } from '../../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { forkJoin } from 'rxjs';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-add-sections',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    QuillModule,
  ],
  templateUrl: './add-sections.component.html',
  styleUrl: './add-sections.component.scss',
})
export class AddSectionsComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allCompentenceLevel: any[] = [];
  allQuiz: any[] = [];

  allCourses: any[] = [];
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddChannelPartnerComponent> // Reference to the dialog
  ) {}
 
  ngOnInit(): void { 
    console.log(this.data);
    this.fetchallQuiz();
  }

  addSectionForm = new FormGroup({
    user_id: new FormControl(this.userId),
    course_id: new FormControl(this.data?.courseID),
    title: new FormControl(
      this.data?.rowData?.title || '',
      Validators.required
    ),
    quiz_id: new FormControl(this.data?.rowData?.quiz_id,Validators.required),
    active_status_id: new FormControl(this.data?.rowData?.active_status_id),
    description: new FormControl(this.data?.rowData?.description || '',Validators.required),
    section_id: new FormControl(this.data?.rowData?.section_id),

  });


  fetchallQuiz(): void {
    this.http.get<any[]>(`${this.baseUrl}/quiz_dropdown`).subscribe({
      next: (quizzes: any[]) => {
        this.allQuiz = quizzes;
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch data.', 'Close', {
          duration: 3000,
        });
      },
    });
}


  onSubmit(): void {


     if (this.addSectionForm.invalid) {
    this.addSectionForm.markAllAsTouched();
    this.snackBar.open('Please fill all required fields correctly.', 'Close', {
      duration: 3000,
    });
    return;
  }

  
    const formData = this.addSectionForm.value;

    // Initialize the apiUrl from the passed data
    let apiUrl = this.data.apiUrl;

    // Send the request
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      (response) => {
        console.log(response);
        this.snackBar.open(this.data.successMessage, 'Close', {
          duration: 3000,
        });
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
}
