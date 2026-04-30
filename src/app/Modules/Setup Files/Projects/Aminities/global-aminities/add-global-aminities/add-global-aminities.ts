import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonService } from '../../../../../../Service/common/common.service';
import { AuthService } from '../../../../../../Service/auth.service';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-add-global-aminities',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
  templateUrl: './add-global-aminities.html',
  styleUrl: './add-global-aminities.scss',
})
export class AddGlobalAminities implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AddGlobalAminities>);
  readonly data = inject(MAT_DIALOG_DATA);
  private readonly commonService = inject(CommonService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly userId = this.authService.userId;
  readonly loading = signal<boolean>(false);
  
  selectedFile: File | null = null;
  selectedFileName = '';
  logoPreview: string | ArrayBuffer | null = null;
  readonly storageUrl = environment.STORAGE_URL;

  readonly amenityForm = new FormGroup({
    amenitie_name: new FormControl('', Validators.required),
    icon_text: new FormControl(''),
    status_id: new FormControl(1, Validators.required),
  });

  ngOnInit(): void {
    if (this.data) {
      this.amenityForm.patchValue({
        amenitie_name: this.data.amenitie_name,
        icon_text: this.data.icon_text,
        status_id: this.data.status_id || 1,
      });
      
      if (this.data.logo) {
        this.logoPreview = this.data.logo.startsWith('http') ? this.data.logo : `${this.storageUrl}/${this.data.logo}`;
      }
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;

      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveAmenity(): void {
    if (this.amenityForm.invalid) return;

    this.loading.set(true);
    const formValues = this.amenityForm.value;
    const formData = new FormData();

    formData.append('amenitie_name', formValues.amenitie_name || '');
    formData.append('icon_text', formValues.icon_text || '');
    formData.append('status_id', String(formValues.status_id));

    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }

    if (this.data) {
      // Edit mode
      formData.append('amenity_id', this.data.amenity_id);
      formData.append('updated_by', String(this.userId()));

      this.commonService.editAmenity(formData).subscribe({
        next: (res: any) => {
          this.loading.set(false);
          if (res.success || res.status) {
            this.snackBar.open('Amenity updated successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(res.message || 'Failed to update amenity', 'Close', { duration: 3000 });
          }
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Error updating amenity', 'Close', { duration: 3000 });
        }
      });
    } else {
      // Add mode
      formData.append('created_by', String(this.userId()));

      this.commonService.addAmenity(formData).subscribe({
        next: (res: any) => {
          this.loading.set(false);
          if (res.success || res.status) {
            this.snackBar.open('Amenity added successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(res.message || 'Failed to add amenity', 'Close', { duration: 3000 });
          }
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Error adding amenity', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
