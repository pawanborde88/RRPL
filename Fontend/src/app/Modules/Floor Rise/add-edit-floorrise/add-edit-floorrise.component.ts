import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../Service/auth.service';
import { CommonService } from '../../../Service/common/common.service';
import { AutocompleteReusableComponent } from '../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-add-edit-floorrise',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    AutocompleteReusableComponent

  ],
  templateUrl: './add-edit-floorrise.component.html',
  styleUrl: './add-edit-floorrise.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class AddEditFloorriseComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialogRef = inject(MatDialogRef<AddEditFloorriseComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);

  readonly baseUrl = environment.API_URL;
  readonly userId = this.authService.userId();

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly allWingslist = signal<any[]>([]);
  readonly floorsList = signal<any[]>([]);
  readonly isEditMode = signal<boolean>(false);
  readonly floorRiseId = signal<number | null>(null);
  readonly floorRiseOnList = [1,2,3,4,5,6,7,8,9,10];

  readonly floorRiseForm = new FormGroup({
    project_id: new FormControl<number | number | null>(null, [Validators.required]),
    wing_id: new FormControl<number | number | null>(null),
    floor_id: new FormControl<number | number[] | null>(null),
    floor_rise_amount: new FormControl<number | any>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    floor_rise_on: new FormControl<number | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();

    if (this.data?.floorRiseID) {
      const floorRise = this.data.floorRiseID;

      this.isEditMode.set(true);
      this.floorRiseId.set(floorRise.floor_rise_id);

      this.loadFloorRiseData(floorRise);
    }
  }


  private loadInitialData(): void {
    this.commonService
      .fetchUserProjectDropdown(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) this.projectsList.set(res);
        },
        error: () => this.showError('Unable to fetch projects.'),
      });
  }

  private setupFormSubscriptions(): void {
    // Watch project_id changes
    this.floorRiseForm
      .get('project_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((id) => !!id)
      )
      .subscribe((projectID) => {
        this.fetchAllWings(projectID);
        // Reset wing and floor selection when project changes
        this.floorRiseForm.patchValue({ wing_id: null, floor_id: null });
        this.floorsList.set([]);
      });

    // Watch wing_id changes
    this.floorRiseForm
      .get('wing_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((wingId) => !!wingId)
      )
      .subscribe((wingId) => {
        const projectId = this.floorRiseForm.get('project_id')?.value;
        if (projectId && wingId) {
          this.fetchFloorDropdown(projectId, wingId);
        }
        // Reset floor selection when wing changes
        this.floorRiseForm.patchValue({ floor_id: null });
      });
  }

  private fetchAllWings(projectID: any): void {
    this.commonService.fetchWingDropdown(projectID).subscribe({
      next: (res: any) => {
        this.allWingslist.set(res);
      },
      error: () => {
        this.showError('Unable to fetch wings.');
      },
    });
  }

  private fetchFloorDropdown(projectId: number | number[], wingId: number | number[]): void {
    // Handle multi-select: take first value if array
    const selectedProjectId = Array.isArray(projectId) ? projectId[0] : projectId;
    const selectedWingId = Array.isArray(wingId) ? wingId[0] : wingId;

    if (!selectedProjectId || !selectedWingId) {
      return;
    }

    this.commonService.fetchFloorDropdown(selectedProjectId, selectedWingId).subscribe({
      next: (res: any) => {
        this.floorsList.set(res);
      },
      error: () => {
        this.showError('Unable to fetch floors.');
      },
    });
  }
  private loadFloorRiseData(data: any): void {
    this.loading.set(true);

    // Step 1: patch project_id (triggers wing API)
    this.floorRiseForm.patchValue({
      project_id: data.project_id,
    });
    this.floorRiseForm.patchValue({
      floor_rise_on: Number(data.floor_rise_on),
    });

    // Step 2: wait for wings, then patch wing_id
    setTimeout(() => {
      this.floorRiseForm.patchValue({
        wing_id: data.wing_id,
      });

      // Step 3: wait for floors, then patch remaining fields
      setTimeout(() => {
        this.floorRiseForm.patchValue({
          floor_id: [data.floor_id], // ⬅ floor is MULTI SELECT
          floor_rise_amount: Number(data.floor_rise_amount),
        });

        this.loading.set(false);
      }, 300);

    }, 300);
  }
  private buildPayload(): any {
    const v = this.floorRiseForm.value;

    const payload: any = {
      project_id: Array.isArray(v.project_id) ? v.project_id[0] : v.project_id,
      floor_rise_amount: Number(v.floor_rise_amount),
    };

    // wing_id → ALWAYS ARRAY
    if (v.wing_id) {
      payload.wing_id = Array.isArray(v.wing_id)
        ? v.wing_id
        : [v.wing_id];
    }

    // floor_id → ALWAYS ARRAY
    if (v.floor_id) {
      payload.floor_id = Array.isArray(v.floor_id)
        ? v.floor_id
        : [v.floor_id];
    }
    payload.floor_rise_on = Number(v.floor_rise_on);
    // EDIT MODE
    if (this.isEditMode()) {
      payload.floor_rise_id = this.floorRiseId(); // 🔥 REQUIRED
      payload.updated_by = this.userId;
    } else {
      payload.created_by = this.userId;
    }

    return payload;
  }

  onSubmit(): void {
    if (this.floorRiseForm.invalid) {
      this.floorRiseForm.markAllAsTouched();
      this.showError('Please fill all required fields correctly.');
      return;
    }

    this.loading.set(true);
    const payload = this.buildPayload();

    const apiUrl = this.isEditMode()
      ? `${this.baseUrl}/update_floor_rise`
      : `${this.baseUrl}/add_floor_rise`;

    this.http.post(apiUrl, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);

          this.showSuccess(
            this.isEditMode()
              ? 'Floor rise updated successfully!'
              : 'Floor rise added successfully!'
          );

          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading.set(false);
          this.showError(
            err?.error?.message ||
            `Failed to ${this.isEditMode() ? 'update' : 'add'} floor rise.`
          );
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

}
