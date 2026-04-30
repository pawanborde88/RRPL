import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-add-edit-nearby-locations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
  templateUrl: './add-edit-nearby-locations.html',
  styleUrl: './add-edit-nearby-locations.scss',
})
export class AddEditNearbyLocations implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddEditNearbyLocations>);
  public readonly data = inject(MAT_DIALOG_DATA);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly baseUrl = environment.API_URL;

  locationForm!: FormGroup;
  loading = false;

  ngOnInit(): void {
    this.initForm();
    if (this.data.action === 'edit' && this.data.locationData) {
      // For edit, we might just have one area, but we'll use the same structure
      this.area.clear();
      this.addArea(this.data.locationData.near_by_area, this.data.locationData.distance);
    }
  }

  private initForm(): void {
    this.locationForm = this.fb.group({
      project_id: [this.data.projectId],
      created_by: [1], // Defaulting to 1 as per example, should ideally come from auth service
      area: this.fb.array([this.createAreaGroup()])
    });
  }

  get area(): FormArray {
    return this.locationForm.get('area') as FormArray;
  }

  createAreaGroup(near_by_area = '', distance = ''): FormGroup {
    return this.fb.group({
      near_by_area: [near_by_area, [Validators.required]],
      distance: [distance, [Validators.required]]
    });
  }

  addArea(near_by_area = '', distance = ''): void {
    this.area.push(this.createAreaGroup(near_by_area, distance));
  }

  removeArea(index: number): void {
    if (this.area.length > 1) {
      this.area.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = this.locationForm.value;

    this.http.post<any>(`${this.baseUrl}/add_nearby_area`, payload).subscribe({
      next: (res) => {
        if (res.status) {
          this.snackBar.open(
            `Locations ${this.data.action === 'add' ? 'added' : 'updated'} successfully`,
            'Close',
            { duration: 3000 }
          );
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || 'Something went wrong', 'Close', { duration: 3000 });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error saving locations:', err);
        this.snackBar.open('Error saving locations', 'Close', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
