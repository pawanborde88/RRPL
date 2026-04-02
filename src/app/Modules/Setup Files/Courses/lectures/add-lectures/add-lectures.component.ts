import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { AddChannelPartnerComponent } from '../../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-add-lectures',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    QuillModule
  ],
  templateUrl: './add-lectures.component.html',
  styleUrl: './add-lectures.component.scss',
})
export class AddLecturesComponent implements OnInit {
  baseUrl = environment.API_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allQuiz: any[] = [];
  contentTypes: any[] = [];

  selectedFile: File | null = null;
  displayVideoPreview: string | null = null;
  videoSize: string | null = null;

  selectedImage: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddChannelPartnerComponent>
  ) {}

  ngOnInit(): void {
    this.fetchallQuiz();
    this.fetchAllContentTypes();
  }

  addLectureForm: FormGroup = new FormGroup({
    title: new FormControl(this.data?.rowData?.title, Validators.required),
    active_status_id: new FormControl(this.data?.rowData?.active_status_id),
    quiz_id: new FormControl(this.data?.rowData?.quiz_id,Validators.required),
    //content: new FormControl(this.data?.rowData?.content),
    content: new FormControl(
  this.data?.rowData?.content_type_id === 2
    ? this.data?.rowData?.content_url || this.data?.rowData?.lecture_video || ''
    : ''
),

    lecture_video: new FormControl(this.data?.rowData?.lecture_video),
    lecture_image: new FormControl(null),
    lecture_description: new FormControl(this.data?.rowData?.lecture_description,Validators.required),
    //section_id: new FormControl(this.data?.rowData),
   section_id: new FormControl(this.data?.rowData?.section_id),
    lecture_id: new FormControl(this.data?.rowData?.lecture_id),
    content_type_id: new FormControl(this.data?.rowData?.content_type_id),
  });

  fetchallQuiz(): void {
    this.http.get<any[]>(`${this.baseUrl}/quiz_dropdown`).subscribe({
      next: (quizzes) => this.allQuiz = quizzes,
      error: (err) => {
        console.error(err);
        this.snackBar.open('Unable to fetch quizzes.', 'Close', { duration: 3000 });
      }
    });
  }

  fetchAllContentTypes(): void {
    this.http.get<any[]>(`${this.baseUrl}/lecture_content_types`).subscribe({
      next: (res) => this.contentTypes = res,
      error: (err) => {
        console.error(err);
        this.snackBar.open('Unable to fetch content types.', 'Close', { duration: 3000 });
      },
    });
  }

  onChangeFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      const maxSize = 50 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Invalid file type. Please upload a video.', 'Close', { duration: 3000 });
        return;
      }

      if (file.size > maxSize) {
        this.snackBar.open('File size exceeds 50 MB.', 'Close', { duration: 3000 });
        return;
      }

      this.selectedFile = file;
      this.addLectureForm.patchValue({ lecture_video: file });

      const reader = new FileReader();
      reader.onload = () => {
        this.displayVideoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);

      this.videoSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  deleteFile(): void {
    this.selectedFile = null;
    this.displayVideoPreview = null;
    this.videoSize = null;
    this.addLectureForm.patchValue({ lecture_video: null });
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Invalid image format. Upload JPG/PNG/WEBP.', 'Close', { duration: 3000 });
        return;
      }

      if (file.size > maxSize) {
        this.snackBar.open('Image too large. Max 5 MB.', 'Close', { duration: 3000 });
        return;
      }

      this.selectedImage = file;
      this.addLectureForm.patchValue({ lecture_image: file });

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  deleteImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.addLectureForm.patchValue({ lecture_image: null });
  }

 onSubmit(): void {

   if (this.addLectureForm.invalid) {
    this.addLectureForm.markAllAsTouched();
    this.snackBar.open('Please fill fields with * marks.', 'Close', { duration: 3000 });
    return;
  }
  const formData = new FormData();
  const formValue = this.addLectureForm.value;

  // ✅ Detect Edit Mode
  const isEdit = this.data.apiUrl === 'edit_lecture';

  // ✅ Include lecture_id only in edit mode
  if (isEdit && formValue.lecture_id) {
    formData.append('lecture_id', formValue.lecture_id.toString());
  }

  // Required fields
  formData.append('section_id', formValue.section_id?.toString() ?? '');
  formData.append('title', formValue.title ?? '');
  formData.append('content_type_id', formValue.content_type_id?.toString() ?? '');
  formData.append('active_status_id', formValue.active_status_id?.toString() ?? '');
  formData.append('quiz_id', formValue.quiz_id?.toString() ?? '');
  formData.append('prerequisite_lecture_id', formValue.prerequisite_lecture_id ?? '');

  // Conditional content
  if (formValue.content_type_id === 1 && this.selectedFile) {
    formData.append('lecture_video', this.selectedFile, this.selectedFile.name);
    formData.append('content_url', '');
  } else if (formValue.content_type_id === 2) {
    formData.append('lecture_video', '');
    formData.append('content_url', formValue.content ?? '');
  }

  // Optional: Image & Description
  if (this.selectedImage) {
    formData.append('lecture_image', this.selectedImage, this.selectedImage.name);
  }

  formData.append('lecture_description', formValue.lecture_description ?? '');

  // ✅ Use dynamic API URL
  const url = `${this.baseUrl}/${this.data.apiUrl}`;
  this.http.post(url, formData).subscribe(
    () => {
      this.snackBar.open(this.data.successMessage || 'Lecture saved successfully', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    },
    () => {
      this.snackBar.open('Something went wrong. Please try again.', 'Close', { duration: 3000 });
    }
  );
}

  
}
