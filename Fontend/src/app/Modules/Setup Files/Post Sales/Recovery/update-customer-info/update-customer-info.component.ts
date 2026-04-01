import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  OnInit,
  signal,
  ViewChildren,
  QueryList,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatTableDataSource } from '@angular/material/table';
import {
  catchError,
  distinctUntilChanged,
  filter,
  finalize,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { AadharcardNoformatDirective } from '../../../../../Common/directives/Aadhar/aadharcard-noformat.directive';
import { PANNoDirective } from '../../../../../Common/directives/panno.directive';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { BookingService, Applicant, Project } from '../../../../../Service/booking.service';

interface DisplayColumn {
  key: string;
  label: string;
  type?: 'date' | 'sensitive';
}

interface Wing {
  wing_id: number;
  wing_name: string;
}

interface Unit {
  floor_unit_id: number;
  booking_id: number;
  floor_unit: string;
  applicant_name: string;
  full_name: string;
}

interface Occupation {
  occupation_id: number;
  occupation: string;
}

interface Salutation {
  salution_id: number;
  salution: string;
}

interface ApplicantFormValue {
  applicant_id: number | null;
  booking_id: number | null;
  salutation_id: number | null;
  first_name: string;
  middle_name: string;
  last_name: string;
  occupation_id: number | null;
  mobile_no: string;
  alternate_mobile_no: string;
  whatsapp_no: string;
  email_id: string;
  pan_no: string;
  aadhar_no: string;
  dob: Date | null;
  gender: number | null;
  anniversary_date: Date | null;
  current_address: string;
  permanent_address: string;
}

const MOBILE_PATTERN = /^\d{10}$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MAX_APPLICANTS = 4;

const DISPLAYED_COLUMNS: DisplayColumn[] = [
  { key: 'first_name', label: 'First Name' },
  { key: 'middle_name', label: 'Middle Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'occupation_string', label: 'Occupation' },
  { key: 'mobile_no', label: 'Mobile', type: 'sensitive' },
  { key: 'whatsapp_no', label: 'WhatsApp', type: 'sensitive' },
  { key: 'email', label: 'Email ID', type: 'sensitive' },
  { key: 'alternate_mobile_no', label: 'Alternate Mobile', type: 'sensitive' },
  { key: 'pan_no', label: 'PAN' },
  { key: 'aadhar_no', label: 'Aadhar' },
  { key: 'dob', label: 'Date of Birth', type: 'date' },
  { key: 'anniversary_date', label: 'Anniversary Date', type: 'date' },
  { key: 'current_address', label: 'Current Address' },
  { key: 'permanent_address', label: 'Permanent Address' },
  { key: 'created_at', label: 'Created At', type: 'date' },
  { key: 'updated_at', label: 'Updated At', type: 'date' },
  { key: 'created_by_name', label: 'Created By' },
  { key: 'updated_by_name', label: 'Updated By' }
];

@Component({
  selector: 'app-update-customer-info',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    AutocompleteReusableComponent,
    ReusableTableComponent,
    AadharcardNoformatDirective,
    PANNoDirective
  ],
  templateUrl: './update-customer-info.component.html',
  styleUrl: './update-customer-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class UpdateCustomerInfoComponent implements OnInit {
  // Signals for reactive state
  readonly loading = signal(false);
  readonly projectsList = signal<Project[]>([]);
  readonly allWingslist = signal<Wing[]>([]);
  readonly allUnitNoList = signal<Unit[]>([]);
  readonly allOccupations = signal<Occupation[]>([]);
  readonly salutationDropdown = signal<Salutation[]>([]);
  readonly dataSource = signal<MatTableDataSource<Applicant>>(new MatTableDataSource<Applicant>([]));
  readonly currentUnitID = signal<number | null>(null);
  readonly currentBookingID = signal<number | null>(null);
  readonly currentProjectID = signal<number | null>(null);
  readonly roleId = signal(Number(sessionStorage.getItem('role_id')) || 0);

  // Computed signals
  readonly hasData = computed(() => this.dataSource().data.length > 0);
  readonly userId = signal<number>(Number(sessionStorage.getItem('session_id')) || 0);

  // Form groups
  readonly addUnitBankerForm = new FormGroup({
    project_id: new FormControl<number | null>(this.userId(), Validators.required),
    wing_id: new FormControl<number | null>(null, Validators.required),
    unit_id: new FormControl<number | null>(null, Validators.required),
  });

  readonly addBookingForm = new FormGroup({
    applicants: new FormArray<FormGroup>([]),
  });

  // View children
  @ViewChildren('dobPicker') dobPickers!: QueryList<MatDatepicker<any>>;
  @ViewChildren('anniversaryPicker') anniversaryPickers!: QueryList<MatDatepicker<any>>;

  // Constants
  readonly displayedColumns = DISPLAYED_COLUMNS;
  private readonly datePipe = new DatePipe('en-US');
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly bookingService: BookingService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
    private readonly destroyRef: DestroyRef
  ) {
    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
    this.setupFormSubscriptions();
  }

  ngOnInit(): void {
    this.fetchAllProjects();
    this.initializeApplicants();
  }

  get applicants(): FormArray<FormGroup> {
    return this.addBookingForm.get('applicants') as FormArray<FormGroup>;
  }

  /**
   * Set up reactive form subscriptions with optimized RxJS operators
   */
  private setupFormSubscriptions(): void {
    // Project selection with debounce and distinctUntilChanged
    this.addUnitBankerForm.get('project_id')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(),
      filter((projectId): projectId is number => typeof projectId === 'number' && projectId !== null),
      tap((projectId) => {
        this.currentProjectID.set(projectId);
        this.addUnitBankerForm.patchValue({ wing_id: null, unit_id: null }, { emitEvent: false });
      }),
      switchMap((projectId) => {
        this.fetchAllWings(projectId);
        this.fetchAllOccupations();
        this.fetchSalutationDropdown();
        return of(null);
      })
    ).subscribe();

    // Wing selection
    this.addUnitBankerForm.get('wing_id')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(),
      filter((wingId): wingId is number => typeof wingId === 'number' && wingId !== null),
      switchMap((wingId) => {
        const projectId = this.currentProjectID();
        if (projectId) {
          this.fetchTokenFloorUnitDropdown(projectId, wingId);
        }
        return of(null);
      })
    ).subscribe();

    // Unit selection
    this.addUnitBankerForm.get('unit_id')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(),
      filter((unitId): unitId is number => typeof unitId === 'number' && unitId !== null),
      tap((unitId) => {
        const selectedUnit = this.allUnitNoList().find(unit => unit.floor_unit_id === unitId);
        if (selectedUnit) {
          this.currentUnitID.set(selectedUnit.floor_unit_id);
          this.currentBookingID.set(selectedUnit.booking_id);
          this.fetchApplicants(selectedUnit.floor_unit_id);
        }
      })
    ).subscribe();
  }

  /**
   * Fetch all projects for the current user
   */
  private fetchAllProjects(): void {
    this.loading.set(true);
    this.bookingService.fetchProjects(this.userId())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('Error fetching projects:', err);
          this.showSnackBar('Unable to fetch projects.', 'error');
          return of([]);
        })
      )
      .subscribe({
        next: (projects) => this.projectsList.set(projects)
      });
  }

  /**
   * Fetch all wings for a project
   */
  private fetchAllWings(projectId: number): void {
    this.bookingService.fetchWings(projectId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.showSnackBar('No wings available for selection', 'error');
          return of([]);
        })
      )
      .subscribe({
        next: (wings) => this.allWingslist.set(wings)
      });
  }

  /**
   * Fetch all units for a project and wing
   */
  private fetchTokenFloorUnitDropdown(projectId: number, wingId: number): void {
    this.loading.set(true);
    this.bookingService.fetchBookingUnits(projectId, wingId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.showSnackBar('Unable to fetch units.', 'error');
          return of([]);
        })
      )
      .subscribe({
        next: (units) => this.allUnitNoList.set(units)
      });
  }

  /**
   * Fetch all occupations
   */
  private fetchAllOccupations(): void {
    this.bookingService.fetchOccupations()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      )
      .subscribe({
        next: (occupations) => this.allOccupations.set(occupations)
      });
  }

  /**
   * Fetch salutation dropdown
   */
  private fetchSalutationDropdown(): void {
    this.bookingService.fetchSalutations()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      )
      .subscribe({
        next: (salutations) => this.salutationDropdown.set(salutations)
      });
  }

  /**
   * Fetch applicants for a unit
   */
  private fetchApplicants(unitID: number): void {
    this.loading.set(true);
    this.bookingService.fetchApplicantsByUnit(unitID)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('Error fetching applicant details:', err);
          this.showSnackBar('Unable to fetch applicant details. Please try again.', 'error');
          return of([]);
        })
      )
      .subscribe({
        next: (res) => {
          if (!res || res.length === 0) {
            this.showSnackBar('No applicants found for this unit', 'info');
            this.dataSource.set(new MatTableDataSource<Applicant>([]));
            this.initializeApplicants();
            return;
          }

          this.dataSource.set(new MatTableDataSource<Applicant>(res));
          this.populateApplicantForms(res);
        }
      });
  }

  /**
   * Populate applicant forms with fetched data
   */
  private populateApplicantForms(applicants: Applicant[]): void {
    this.applicants.clear();
    const bookingIdToUse = this.currentBookingID() || (applicants[0]?.booking_id ?? null);
    const applicantsToShow = Math.min(applicants.length, MAX_APPLICANTS);

    // Create forms for existing applicants
    for (let i = 0; i < applicantsToShow; i++) {
      const applicantData = applicants[i];
      const newForm = this.createApplicantForm();

      newForm.patchValue({
        applicant_id: applicantData.applicant_id || null,
        booking_id: bookingIdToUse,
        salutation_id: applicantData.salutation_id || applicantData.salution_id || null,
        first_name: applicantData.first_name || '',
        middle_name: applicantData.middle_name || '',
        last_name: applicantData.last_name || '',
        occupation_id: applicantData.occupation_id || null,
        mobile_no: applicantData.mobile_no || '',
        alternate_mobile_no: applicantData.alternate_mobile_no || '',
        whatsapp_no: applicantData.whatsapp_no || '',
        email_id: applicantData.email || '',
        pan_no: applicantData.pan_no || '',
        aadhar_no: applicantData.aadhar_no || '',
        dob: applicantData.dob ? new Date(applicantData.dob) : null,
        gender: applicantData.gender || null,
        anniversary_date: applicantData.anniversary_date ? new Date(applicantData.anniversary_date) : null,
        current_address: applicantData.current_address || '',
        permanent_address: applicantData.permanent_address || ''
      });

      this.applicants.push(newForm);
    }

    // Add empty forms if we have fewer than MAX_APPLICANTS
    for (let i = applicantsToShow; i < MAX_APPLICANTS; i++) {
      const newForm = this.createApplicantForm();
      if (bookingIdToUse) {
        newForm.patchValue({ booking_id: bookingIdToUse });
      }
      this.applicants.push(newForm);
    }
  }

  /**
   * Initialize empty applicant forms
   */
  private initializeApplicants(): void {
    this.applicants.clear();
    for (let i = 0; i < MAX_APPLICANTS; i++) {
      this.applicants.push(this.createApplicantForm());
    }
  }

  /**
   * Create a new applicant form group with validators
   */
  private createApplicantForm(): FormGroup {
    return new FormGroup({
      applicant_id: new FormControl<number | null>(null),
      booking_id: new FormControl<number | null>(null),
      salutation_id: new FormControl<number | null>(null),
      first_name: new FormControl<string>('', Validators.required),
      middle_name: new FormControl<string>(''),
      last_name: new FormControl<string>('', Validators.required),
      occupation_id: new FormControl<number | null>(null),
      mobile_no: new FormControl<string>('', [
        Validators.required,
        Validators.pattern(MOBILE_PATTERN),
      ]),
      alternate_mobile_no: new FormControl<string>('', [
        Validators.pattern(MOBILE_PATTERN),
      ]),
      whatsapp_no: new FormControl<string>('', [Validators.pattern(MOBILE_PATTERN)]),
      email_id: new FormControl<string>('', [Validators.required, Validators.email]),
      pan_no: new FormControl<string>('', [Validators.pattern(PAN_PATTERN)]),
      aadhar_no: new FormControl<string>(''),
      dob: new FormControl<Date | null>(null),
      gender: new FormControl<number | null>(null),
      anniversary_date: new FormControl<Date | null>(null),
      current_address: new FormControl<string>(''),
      permanent_address: new FormControl<string>(''),
    });
  }

  /**
   * Update all applicants
   */
  updateAllApplicants(): void {
    const bookingId = this.currentBookingID();
    if (!bookingId) {
      this.showSnackBar('No booking selected. Please select a unit first.', 'error');
      return;
    }

    // Validate only the first applicant (index 0) - it's required
    const firstApplicant = this.applicants.at(0);
    firstApplicant.markAllAsTouched();

    const firstApplicantValue = firstApplicant.value;
    if (!firstApplicantValue.first_name?.trim() || !firstApplicantValue.last_name?.trim() ||
      !firstApplicantValue.mobile_no || !firstApplicantValue.email_id) {
      this.showSnackBar('Please fill all required fields for the first applicant', 'error');
      return;
    }

    // Filter active applicants (those with at least first or last name)
    const activeApplicants = this.applicants.controls.filter(control => {
      const value = control.value;
      return value.first_name?.trim() || value.last_name?.trim();
    });

    if (activeApplicants.length === 0) {
      this.showSnackBar('At least the first applicant must have a first or last name', 'error');
      return;
    }

    // Prepare data for API - only first applicant needs all required fields, others are optional
    const applicantsData: Partial<Applicant>[] = activeApplicants.map((control, index) => {
      const formValue = control.value;
      return {
        applicant_id: formValue.applicant_id || null,
        booking_id: bookingId,
        salutation_id: formValue.salutation_id || null,
        first_name: formValue.first_name?.trim() || '',
        middle_name: formValue.middle_name?.trim() || '',
        last_name: formValue.last_name?.trim() || '',
        occupation_id: formValue.occupation_id || null,
        mobile_no: formValue.mobile_no || '',
        alternate_mobile_no: formValue.alternate_mobile_no || '',
        whatsapp_no: formValue.whatsapp_no || '',
        email: formValue.email_id || '',
        pan_no: formValue.pan_no || '',
        aadhar_no: formValue.aadhar_no || '',
        dob: this.formatDate(formValue.dob) || undefined,
        gender: formValue.gender || undefined,
        anniversary_date: this.formatDate(formValue.anniversary_date) || undefined,
        current_address: formValue.current_address || '',
        permanent_address: formValue.permanent_address || '',
        updated_by: this.userId() as unknown,
        created_by: this.userId() as unknown
      };
    });

    this.loading.set(true);
    this.bookingService.updateApplicants(applicantsData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('Error updating applicants:', err);
          const errorMessage = err.error?.message ||
            (err.status === 0 ? 'Network error - please check your connection' : 'Failed to update applicants');
          this.showSnackBar(errorMessage, 'error');
          return of({ success: false, message: errorMessage });
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success || (res as any).status) {
            const unitId = this.currentUnitID();
            if (unitId) {
              this.fetchApplicants(unitId);
            }
            const message = res.message || 'Applicant details updated successfully';
            this.dialog.open(SuccessDialogComponent, {
              data: { message },
            });
          } else {
            this.showSnackBar(res.message || 'Update failed', 'error');
          }
        }
      });
  }

  /**
   * Delete applicant at the specified index
   */
  deleteApplicant(index: number): void {
    // Prevent deleting the first applicant
    if (index === 0) {
      this.showSnackBar('Cannot delete the first applicant', 'error');
      return;
    }

    // Validate index
    if (index < 0 || index >= this.applicants.length) {
      this.showSnackBar('Invalid applicant index', 'error');
      return;
    }

    const applicant = this.applicants.at(index);
    if (!applicant) {
      this.showSnackBar('Applicant not found', 'error');
      return;
    }

    const applicantId = applicant.get('applicant_id')?.value;

    // If applicant doesn't have an ID (new/unsubmitted applicant), just clear/reset the form
    if (!applicantId || applicantId === null) {
      const bookingId = this.currentBookingID();
      // Reset the form to empty state
      applicant.reset();
      if (bookingId) {
        applicant.patchValue({ booking_id: bookingId });
      }
      this.showSnackBar('Applicant cleared', 'info');
      return;
    }

    // For existing applicants with ID, show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this applicant?' },
    });

    dialogRef.afterClosed()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          // Check if user confirmed the deletion
          // Dialog returns { confirmed: true, reason?: string } or { confirmed: false }
          const isConfirmed = result === true || (result && (result as any).confirmed === true);

          if (!isConfirmed) {
            // User cancelled or closed dialog without confirming
            return;
          }

          // User confirmed, proceed with deletion
          this.loading.set(true);

          this.bookingService.deleteApplicant(applicantId)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => this.loading.set(false)),
              catchError((err) => {
                console.error('Error deleting applicant:', err);
                this.showSnackBar('Unable to delete applicant. Please try again.', 'error');
                return of({ success: false, message: 'Delete failed' });
              })
            )
            .subscribe({
              next: (res) => {
                if (res && (res.success || (res as any).status)) {
                  // Always refetch applicants from server to get updated data
                  const unitId = this.currentUnitID();
                  if (unitId) {
                    // Refetch will repopulate all forms correctly based on server data
                    this.fetchApplicants(unitId);
                  } else {
                    // Fallback: if no unit selected, just reset the form
                    const bookingId = this.currentBookingID();
                    applicant.reset();
                    if (bookingId) {
                      applicant.patchValue({ booking_id: bookingId });
                    }
                  }
                  this.showSnackBar('Applicant deleted successfully', 'success');
                } else {
                  const errorMsg = (res as any)?.message || res?.message || 'Failed to delete applicant';
                  this.showSnackBar(errorMsg, 'error');
                }
              },
              error: (err) => {
                console.error('API call error:', err);
                this.showSnackBar('An error occurred while deleting applicant', 'error');
              }
            });
        },
        error: (err) => {
          console.error('Dialog subscription error:', err);
        }
      });
  }

  /**
   * Format date for API
   */
  private formatDate(date: Date | null): string | null {
    return date ? this.datePipe.transform(date, 'yyyy-MM-dd')! : null;
  }

  /**
   * Show snackbar message
   */
  private showSnackBar(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'error' ? ['error-snackbar'] : type === 'success' ? ['success-snackbar'] : []
    });
  }
}
