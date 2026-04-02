import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AddChannelPartnerComponent } from '../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { QuillModule } from 'ngx-quill';
import { forkJoin } from 'rxjs';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';

@Component({
  selector: 'app-add-course',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    QuillModule,
  ],
  templateUrl: './add-course.component.html',
  styleUrl: './add-course.component.scss',
})
export class AddCourseComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allCompentenceLevel: any[] = [];
  allCourses: any[] = [];
  allQuiz: any[] = [];
  selectedFile: File | null = null;
  imageSize: string | null = null;
  imagePreview: string | null = null;
  storageUrl = environment.STORAGE_URL;
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddChannelPartnerComponent> // Reference to the dialog
  ) { }



  dateRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const from = group.get('valid_from')?.value;
    const to = group.get('valid_till')?.value;

    if (!from || !to) {
      return { dateRangeRequired: true };
    }

    return null;
  };

  
  addCourseForm = new FormGroup({
    user_id: new FormControl(this.userId),
    title: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    quiz_id: new FormControl(null, Validators.required),
    active_status_id: new FormControl(null, Validators.required),
    competency_level_id: new FormControl(
      null, Validators.required
    ),
    mandatory_course: new FormControl(null, Validators.required),
    valid_from: new FormControl('', Validators.required),
    valid_till: new FormControl('', Validators.required),
    thumbnail_img: new FormControl<File | null>(null),
    course_id: new FormControl(this.data?.rowData?.course_id || null),
  },
{ validators: this.dateRangeValidator }
);


  

  ngOnInit(): void {
    console.log(this.data);
    this.fetchInitialData();
    this.addCourseForm
      .get('competency_level_id')
      ?.valueChanges.subscribe((competencyLevel) => {
        if (competencyLevel) {
          this.fetchAllCourses(competencyLevel);
        }
      });

    if (this.data?.rowData.course_id) {
      this.patchFormData(this.data?.rowData);
    }

  }

  patchFormData(item: any): void {
    const attachmentUrl = item.thumbnail_img
      ? `${this.storageUrl}/${item.thumbnail_img}` // Construct the full URL
      : null;

    // Patch all form controls with the respective data from 'item'
    this.addCourseForm.patchValue({
      user_id: this.userId,
      title: item.title || '', // Ensure default value is empty string if not available
      description: item.description || '',
      quiz_id: item.quiz_id || null,
      active_status_id: item.active_status_id || null,
      competency_level_id: item.competency_level_id || null,
      mandatory_course: item.mandatory_course || false, // assuming boolean for mandatory_course
      valid_from: item.valid_from || '', // default to empty string if not available
      valid_till: item.valid_till || '', // default to empty string if not available
      thumbnail_img: item.thumbnail_img || null, // Keep as null if no image provided
    });

    // Set the image preview URL if attachment exists
    this.imagePreview = attachmentUrl;
  }

  fetchInitialData(): void {
    const competencyLevels$ = this.http.get<any[]>(
      `${this.baseUrl}/fetch_competency_level`
    );
    const quizzes$ = this.http.get<any[]>(`${this.baseUrl}/quiz_dropdown`);

    // Use forkJoin to execute both requests simultaneously
    forkJoin({
      competencyLevels: competencyLevels$,
      quizzes: quizzes$,
    }).subscribe({
      next: ({
        competencyLevels,
        quizzes,
      }: {
        competencyLevels: any[];
        quizzes: any[];
      }) => {
        this.allCompentenceLevel = competencyLevels;
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

  fetchAllCourses(competencyLevel: number): void {
    this.http
      .post(`${this.baseUrl}/course_dropdown`, {
        competency_level_id: competencyLevel,
      })
      .subscribe({
        next: (res: any) => {
          this.allCourses = res;
        },
        error: (err: any) => {
          console.error(err);
          this.snackBar.open('Unable to fetch courses.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  onChangeFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      this.selectedFile = input.files[0];
      this.imageSize = `${(this.selectedFile.size / 1024).toFixed(2)} KB`;

      // Generate image preview if it's an image file
      if (this.selectedFile.type.startsWith('image')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string; // Store the image preview
        };
        reader.readAsDataURL(this.selectedFile);
      } else {
        this.imagePreview = null; // Reset preview if not an image
      }

      // Patch the form with the selected file (for file upload)
      this.addCourseForm.patchValue({ thumbnail_img: this.selectedFile });
    }
  }
  deleteFile(): void {
    this.selectedFile = null;
    this.imageSize = null;
    this.addCourseForm.patchValue({ thumbnail_img: null });
  }

  onSubmit(): void {

    if (this.addCourseForm.invalid) {
      this.addCourseForm.markAllAsTouched(); // ✅ this is required
      return;
    }

    const formData = new FormData();
    const validFrom = this.addCourseForm.get('valid_from')?.value;
    const validTill = this.addCourseForm.get('valid_till')?.value;

    const formattedValidFrom = validFrom
      ? new Date(validFrom).toISOString().split('T')[0]
      : '';
    const formattedValidTill = validTill
      ? new Date(validTill).toISOString().split('T')[0]
      : '';
    Object.keys(this.addCourseForm.controls).forEach((key) => {
      const controlValue = this.addCourseForm.get(key)?.value;
      if (key === 'thumbnail_img' && this.selectedFile) {
        formData.append(key, this.selectedFile, this.selectedFile.name);
      } else if (key === 'valid_from') {
        formData.append('valid_from', formattedValidFrom);
      } else if (key === 'valid_till') {
        formData.append('valid_till', formattedValidTill);
      } else {
        formData.append(key, controlValue ?? '');
      }
    });
    const apiUrl = `${this.baseUrl}/${this.data.apiUrl}`;
    this.http.post(apiUrl, formData).subscribe({
      next: (res: any) => {
        this.snackBar.open(this.data.successMessage, 'Close', {
          duration: 3000,
        });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Unable to process the request.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

}
