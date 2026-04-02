import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, EMPTY, finalize, of } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { ReceiptsService, type Project, type Wing, type Unit, type LetterType } from '../../Recovery/Recipts/receipts.service';
import { environment } from '../../../../../../environments/environment';

interface LetterFormValue {
  project_id: number | null;
  wing_id: number | null;
  floor_unit_id: number | null;
  letter_type_id: number | null;
  letter_date: Date | null;
  remark: string;
  created_by: number;
}

@Component({
  selector: 'app-add-letter-generation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-letter-generation-dialog.component.html',
  styleUrl: './add-letter-generation-dialog.component.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddLetterGenerationDialogComponent {
  private readonly receiptsService = inject(ReceiptsService);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<AddLetterGenerationDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);
  private readonly baseUrl = environment.API_URL;

  readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  // Signals for reactive state management
  readonly loading = signal<boolean>(false);
  readonly projects = signal<Project[]>([]);
  readonly wings = signal<Wing[]>([]);
  readonly units = signal<Unit[]>([]);
  readonly letterTypes = signal<LetterType[]>([]);

  // Form with proper typing
  readonly form = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null, Validators.required),
    floor_unit_id: new FormControl<number | null>(null, Validators.required),
    letter_type_id: new FormControl<number | null>(null, Validators.required),
    letter_date: new FormControl<Date | null>(null, Validators.required),
    remark: new FormControl<string>('', Validators.required),
    created_by: new FormControl<number>(this.userId),
  });

  // Computed signals for reactive dependencies
  readonly selectedProjectId = toSignal(
    this.form.get('project_id')!.valueChanges,
    { initialValue: null }
  );

  readonly selectedWingId = toSignal(
    this.form.get('wing_id')!.valueChanges,
    { initialValue: null }
  );

  // Reactive form validation state
  readonly isFormValid = computed(() => this.form.valid);

  constructor() {
    this.initializeData();
    this.setupReactiveFormDependencies();
  }

  private initializeData(): void {
    // Load initial data
    this.loading.set(true);
    
    combineLatest([
      this.receiptsService.fetchUserProjects(this.userId).pipe(
        catchError(() => {
          this.showError('Unable to fetch projects.');
          return EMPTY;
        })
      ),
      this.receiptsService.fetchLetterTypes().pipe(
        catchError(() => {
          this.showError('Unable to fetch letter types.');
          return EMPTY;
        })
      ),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([projects, letterTypes]) => {
          this.projects.set(projects);
          this.letterTypes.set(letterTypes);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  private setupReactiveFormDependencies(): void {
    // React to project selection changes
    effect(() => {
      const projectId = this.selectedProjectId();
      if (projectId) {
        this.loadWings(projectId);
        // Reset dependent fields
        this.form.patchValue({ wing_id: null, floor_unit_id: null }, { emitEvent: false });
      } else {
        this.wings.set([]);
        this.units.set([]);
      }
    }, { allowSignalWrites: true });

    // React to wing selection changes
    effect(() => {
      const projectId = this.selectedProjectId();
      const wingId = this.selectedWingId();
      if (projectId && wingId) {
        this.fetchUnits(projectId, wingId);
        // Reset dependent field
        this.form.patchValue({ floor_unit_id: null }, { emitEvent: false });
      } else {
        this.units.set([]);
      }
    }, { allowSignalWrites: true });
  }

  private loadWings(projectId: number): void {
    this.receiptsService
      .fetchWings(projectId)
      .pipe(
        catchError(() => {
          this.showError('No wings available for selection.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((wings) => {
        this.wings.set(wings);
      });
  }

  private fetchUnits(projectId: number, wingId: number, agreementStatusId: number = 1): void {
    if (!projectId || !wingId) return;

    this.loading.set(true);
    this.receiptsService
      .fetchUnitsWithAgreementStatusDone(projectId, wingId, agreementStatusId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch units.', 'Close', {
            duration: 3000,
          });
          return of({ data: [] });
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response: any) => {
        const units = (response.data || []).map((item: Unit) => ({
          ...item,
          full_name: `${item.floor_unit} - ${item.applicant_name}`,
        }));
        this.units.set(units);
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.showError('Please fill all required fields');
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value as LetterFormValue;
    const payload = { ...formValue };

    // Format date
    if (formValue.letter_date instanceof Date) {
      const formattedDate = this.datePipe.transform(formValue.letter_date, 'yyyy-MM-dd');
      if (formattedDate) {
        (payload as any).letter_date = formattedDate;
      }
    }

    payload.created_by = this.userId;

    this.loading.set(true);

    this.http.post(`${this.baseUrl}/add_letter`, payload)
      .pipe(
        catchError((error) => {
          this.showError(error.error?.message || 'Something went wrong. Please try again.');
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.loading.set(false);
  
          if (response.success) {
            this.form.reset({ created_by: this.userId });
            this.dialog.open(SuccessDialogComponent, {
              data: { message: response.message || 'Letter generated successfully' },
            });
            this.dialogRef.close(true);
          } else {
            this.dialog.open(SuccessDialogComponent, {
              data: { status: false, message: response.message, title: 'Error' },
              maxWidth: '90vw',
              width: '400px',
              panelClass: 'custom-dialog-container'
            }).afterClosed().subscribe(() => {
              this.form.reset();
            });
          }
        },
      });
  }


  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
