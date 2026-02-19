import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';

@Component({
  selector: 'app-add-feed-bak-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,

  ],
  templateUrl: './add-feed-bak-dialog.component.html',
  styleUrl: './add-feed-bak-dialog.component.scss'
})
export class AddFeedBakDialogComponent {
  baseUrl = environment.API_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');
  selectedFile: File | null = null;
  projectsList: any[] = [];
  allConfiguration: any[] = [];
  isEditMode = false;
  FaceBookID: number | null = null;
  feedbackCategoryList: any[] = [];
  // For star rating UI
  stars: number[] = [1, 2, 3, 4, 5];

  /**
   * Safely returns the current rating value (0 if not set) for template comparisons.
   */
  get currentRating(): number {
    return (this.feedBackForm.get('rating')?.value as number | null) ?? 0;
  }
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddFeedBakDialogComponent>
  ) { }

  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchAllFeedbackCategory();
    // Pre-fill user_id with the logged-in user's id
    this.feedBackForm.patchValue({ user_id: this.userId });
  }


  feedBackForm = new FormGroup({
    project_id: new FormControl(null, [Validators.required]),
    user_id: new FormControl(this.userId),
    feedback_category_id: new FormControl(null, [Validators.required]),
    description: new FormControl(),
    rating: new FormControl(null, [Validators.required]),
    feedback_photo: new FormControl(null, [Validators.required]),
  });
  fetchAllProjects(): void {
    this.http.get<any[]>(`${this.baseUrl}/project_dropdown`).pipe(
      catchError(() => {
        this.snackBar.open('Failed to fetch projectsList data.', 'Close', {
          duration: 3000,
        });

        return of([]);
      })
    ).subscribe((res) => this.projectsList = res);
  }
  fetchAllFeedbackCategory(): void {
    this.http.post<any[]>(`${this.baseUrl}/feedback_category_dropdown`, {
      account_id: sessionStorage.getItem('account_id')
    }).pipe(
      catchError(() => {
        this.snackBar.open('Failed to fetch projectsList data.', 'Close', {
          duration: 3000,
        });
        return of([]);
      })
    ).subscribe((res) => this.feedbackCategoryList = res);
  }

  previewUrl: string | null = null;

  /**
   * Handles image selection from the file input and updates the form control.
   */
  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.feedBackForm.patchValue({ feedback_photo: file as any });

      // Generate preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Helper to trigger the hidden file input
   */
  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  /**
   * Sets the rating based on the star clicked by the user.
   */
  setRating(rating: number): void {
    this.feedBackForm.patchValue({ rating: rating as any });
  }

  onSubmit(): void {
    if (this.feedBackForm.invalid) {
      return;
    }

    const formValues = this.feedBackForm.value;
    const formData = new FormData();

    formData.append('project_id', String(formValues.project_id));
    formData.append('user_id', String(this.userId));
    formData.append('feedback_category_id', String(formValues.feedback_category_id));
    formData.append('description', formValues.description ?? '');
    formData.append('rating', String(formValues.rating));

    if (this.selectedFile) {
      formData.append('feedback_photo', this.selectedFile);
    }

    const apiUrl = `${this.baseUrl}/add_feedback`;

    this.http.post(apiUrl, formData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.feedBackForm.reset();
          this.dialog.open(SuccessDialogComponent, {
            data: { message: res.message },
          });
          this.dialogRef.close(true);
        } else {
          this.dialog.open(SuccessDialogComponent, {
            data: { message: res.message || 'Operation failed' },
          });
        }
      },
      error: (error) => {
        this.dialog.open(SuccessDialogComponent, {
          data: { message: error.error?.message || 'Something went wrong' },
        });
      },
    });
  }

}
