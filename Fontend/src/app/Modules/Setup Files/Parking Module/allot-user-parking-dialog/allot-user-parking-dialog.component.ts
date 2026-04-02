import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';
import { CommonService } from '../../../../Service/common/common.service';
import { Project, ReceiptsService, Unit, Wing } from '../../Post Sales/Recovery/Recipts/receipts.service';
import { CommonModule } from '@angular/common';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

export interface ParkingAllotmentData {
  parking_plan_ids: number[]; // Array of selected parking IDs
  parking_details?: any[]; // Optional details for display
}

@Component({
  selector: 'app-allot-user-parking-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    AngularMaterialModule,
    AutocompleteReusableComponent
  ],
  templateUrl: './allot-user-parking-dialog.component.html',
  styleUrl: './allot-user-parking-dialog.component.scss'
})
export class AllotUserParkingDialogComponent implements OnInit {
  // Injections
  private readonly receiptsService = inject(ReceiptsService);
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<AllotUserParkingDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject<ParkingAllotmentData>(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);

  // Signals for Data
  readonly projectsList = signal<Project[]>([]);
  readonly wingsList = signal<Wing[]>([]);
  readonly unitList = signal<Unit[]>([]);
  readonly parkingDetails = signal<any[]>([]);
  readonly loading = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);

  // User ID from session
  readonly userId = Number(sessionStorage.getItem('session_id'));

  // Form
  readonly allotmentForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null, Validators.required),
    floor_unit_id: new FormControl<number | null>(null, Validators.required),
    parking_plan_id: new FormControl<number[]>([], Validators.required), // Hidden control for submission
    created_by: new FormControl<number>(this.userId)
  });

  ngOnInit(): void {
    if (this.data?.parking_plan_ids?.length) {
      this.allotmentForm.patchValue({ parking_plan_id: this.data.parking_plan_ids });
      this.fetchSelectedParkings(this.data.parking_plan_ids); // Fetch details
    } else {
      this.snackBar.open('No parking slots selected', 'Close', { duration: 3000 });
      this.dialogRef.close();
    }

    this.fetchAllProjects();

    // Listen to Project Change
    this.allotmentForm.controls.project_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pid => {
        this.allotmentForm.controls.wing_id.reset();
        this.allotmentForm.controls.floor_unit_id.reset();
        this.wingsList.set([]);
        this.unitList.set([]);
        if (pid) this.fetchWings(pid);
      });

    // Listen to Wing Change
    this.allotmentForm.controls.wing_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(wid => {
        this.allotmentForm.controls.floor_unit_id.reset();
        this.unitList.set([]);
        const pid = this.allotmentForm.controls.project_id.value;
        if (pid && wid) this.fetchUnits(pid, wid);
      });
  }

  private fetchAllProjects(): void {
    this.receiptsService.fetchProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => this.projectsList.set(projects),
        error: () => this.showError('Failed to fetch projects')
      });
  }

  private fetchWings(projectId: number): void {
    this.receiptsService.fetchWings(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wings) => this.wingsList.set(wings),
        error: () => this.showError('Failed to fetch wings')
      });
  }

  private fetchSelectedParkings(ids: number[]): void {
    this.commonService.fetch_parkings({ parking_plan_id: ids })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const details = res.data || [];
          this.parkingDetails.set(details);

          // Auto-patch Project and Wing from first item
          if (details.length > 0) {
            const first = details[0];
            const pId = first.project_id;
            const wId = first.wing_id;

            if (pId && wId) {
              // 1. Patch Project (without emitting event to avoid double fetch)
              this.allotmentForm.controls.project_id.setValue(pId, { emitEvent: false });
              this.allotmentForm.controls.project_id.disable(); // Disable project selection

              // 2. Fetch Wings Manually
              this.fetchWings(pId);

              // 3. Patch Wing (without emitting event)
              this.allotmentForm.controls.wing_id.setValue(wId, { emitEvent: false });


              // 4. Fetch Units Manually
              this.fetchUnits(pId, wId);
            }
          }
        },
        error: () => console.warn('Failed to fetch parking details')
      });
  }

  private fetchUnits(projectId: number, wingId: number): void {
    this.loading.set(true);
    this.receiptsService.fetchUnits(projectId, wingId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const units = (res.data || []).map(item => ({
            ...item,
            full_name: `${item.floor_unit} - ${item.applicant_name}`
          }));
          this.unitList.set(units);
        },
        error: () => this.showError('Failed to fetch units')
      });
  }

  onSubmit(): void {
    if (this.allotmentForm.invalid) {
      this.allotmentForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const payload = this.allotmentForm.value;

    this.commonService.allotParking(payload)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success || res.status) {
            this.snackBar.open(res.message || 'Parking allotted successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          } else {
            this.showError(res.message || 'Failed to allot parking');
          }
        },
        error: (err) => {
          console.error(err);
          this.showError('Something went wrong');
        }
      });
  }

  unassignParking(parkingId: number): void {
    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to unassign this parking?' }, // Updated message
    });

    dialogRef.afterClosed()
      .pipe(
        switchMap((confirmed: boolean) => {
          if (!confirmed) {
            return EMPTY; // User cancelled
          }

          // Prepare payload for unassignment
          const payload = {
            parking_plan_id: [parkingId],
            floor_unit_id: null,
            created_by: this.userId
          };

          this.submitting.set(true);

          // Call the service to unassign parking
          return this.commonService.allotParking(payload)
            .pipe(
              finalize(() => this.submitting.set(false))
            );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          if (res?.success || res?.status) {
            this.snackBar.open('Parking unassigned successfully', 'Close', {
              duration: 3000
            });
            // Refresh details
            this.fetchSelectedParkings(this.data.parking_plan_ids);
            this.dialogRef.close(true);
          } else {
            this.showError(res?.message || 'Failed to unassign parking');
          }
        },
        error: (err: any) => {
          console.error(err);
          this.showError('Something went wrong');
        }
      });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
  }

  // Tracking
  trackByWingId(index: number, item: Wing): number { return item.wing_id; }
}
