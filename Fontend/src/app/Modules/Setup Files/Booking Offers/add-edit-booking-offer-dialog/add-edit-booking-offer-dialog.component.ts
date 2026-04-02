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
import { AddFaceBookComponent } from '../../../Facebook/Facebook Setup/add-face-book/add-face-book.component';

@Component({
  selector: 'app-add-edit-booking-offer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,

  ],
  templateUrl: './add-edit-booking-offer-dialog.component.html',
  styleUrl: './add-edit-booking-offer-dialog.component.scss'
})
export class AddEditBookingOfferDialogComponent {
  baseUrl = environment.API_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');
  selectedFile: File | null = null;
  projectsList: any[] = [];
  allConfiguration: any[] = [];
  isEditMode = false;
  FaceBookID: number | null = null;
  private readonly datePipe = new DatePipe('en-US');

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddFaceBookComponent>
  ) {}

  ngOnInit(): void {
    console.log(this.data);

    if (this.data.editData) {
      this.isEditMode = true;
      this.FaceBookID = this.data?.editData.offer_id;
      this.patchFormValues();
    }
  }

  patchFormValues(): void {
    const editData = this.data.editData;
    this.addBookingOfferForm.patchValue({
      project_id: this.data.project_id,
      offer_id: editData.offer_id,
      title: editData.title,
      description: editData.description,
      valid_from: editData.valid_from,
      valid_to: editData.valid_to,
      active_status_id: editData.active_status_id,
    });
  }

  addBookingOfferForm = new FormGroup({
    project_id: new FormControl(this.data.project_id, [Validators.required]),
    title: new FormControl(null, [Validators.required]),
    created_by: new FormControl(this.userId),
    description: new FormControl(),
    updated_by: new FormControl(this.userId),
    offer_id: new FormControl(null),
    active_status_id: new FormControl(null),
    valid_from: new FormControl(null),
    valid_to: new FormControl(null),
    offer_images: new FormControl<File | null>(null),
  });
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit() {
    if (this.addBookingOfferForm.valid) {
      const formData = new FormData();

 // Loop through form controls
 Object.keys(this.addBookingOfferForm.controls).forEach(key => {
  const control = this.addBookingOfferForm.get(key);
  const value = control?.value;

  if (key === 'offer_images') {
    // Skip file field, handled separately
    return;
  }

  if (key === 'valid_from' || key === 'valid_to') {
    const formattedDate = value ? this.datePipe.transform(value, 'yyyy-MM-dd') : '';
    formData.append(key, formattedDate || '');
  } else {
    formData.append(key, value !== null && value !== undefined ? value.toString() : '');
  }
});

// Append file separately if selected
if (this.selectedFile) {
  formData.append('offer_images', this.selectedFile);
}

      const apiUrl = this.FaceBookID
        ? `${this.baseUrl}/edit_add_offer`
        : `${this.baseUrl}/add_offer`;
  
      this.http.post(apiUrl, formData).subscribe({
        next: (res: any) => {
          if (res.sucess) {
            this.dialogRef.close(true);

            this.addBookingOfferForm.reset();
            this.dialog.open(SuccessDialogComponent, {
              data: { message: res.message },
              
            });

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
  
}
