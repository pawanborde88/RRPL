import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../../../environments/environment';
import { SnackbarService } from '../../../../../../Service/snackbar.service';

@Component({
  selector: 'app-change-profile-picture-dialog',
  standalone:true,
  imports: [AngularMaterialModule, CommonModule],
  templateUrl: './change-profile-picture-dialog.component.html',
  styleUrls: ['./change-profile-picture-dialog.component.scss']
})
export class ChangeProfilePictureDialogComponent {

  selectedFile: File | undefined;
  uploading: boolean = false;
  baseUrl = environment.API_URL;


  constructor(
    public dialogRef: MatDialogRef<ChangeProfilePictureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackbarService: SnackbarService

  ) { }

  handleFileInput(event: any) {
    this.selectedFile = event.target.files[0];
  }

  saveProfilePicture() {
    this.uploading = true;
    console.log(this.selectedFile);


    const formData = new FormData();
    formData.append('profile_picture', this.selectedFile!);
    formData.append('applicant_id', sessionStorage.getItem('applicant_id')!);

    this.http.post(`${this.baseUrl}/upload_profile_picture`, formData).subscribe({
      next: (res: any) => {
        console.log(res);

        if (res.success) {
          this.data.onUploadComplete().then(() => {
            this.snackbarService.showDataSnackbar('Profile picture updated');
          });
        } else {
          console.log(res);
          this.snackbarService.showDataSnackbar('Error occurred while updating, please try later');
        }
      },
      error: (error: any) => {
        console.log(error);
        this.snackbarService.showDataSnackbar('Error occurred while updating, please try later');
        this.uploading = false;

      },
      complete: () => {
        this.uploading = false;
        this.dialogRef.close();
      }
    });

  }
}
