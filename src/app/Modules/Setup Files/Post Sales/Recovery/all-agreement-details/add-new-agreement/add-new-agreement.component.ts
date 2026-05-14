import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, EMPTY, finalize, map, of, startWith, switchMap, tap, throwError } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../../Common/success-dialog/success-dialog.component';
import { ReceiptsService, type Project, type Wing, type Unit } from '../../Recipts/receipts.service';
import { environment } from '../../../../../../../environments/environment';
import { ReceiptPreviewDialogComponent } from '../../receipt-preview-dialog/receipt-preview-dialog.component';

export interface AddNewAgreementDialogData {
  booking_id?: number | null;
  project_id?: number | null;
  wing_id?: number | string | null;
  unit_id?: number | string | null;
}

interface AgreementCopyStatus {
  agreement_copy_status_id: number;
  agreement_copy_status: string;
}

interface RegistrationOffice {
  registration_office_id: number;
  registration_office_name: string;
}

interface BookingAgreementData {
  [key: string]: any;
}

@Component({
  selector: 'app-add-new-agreement',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-new-agreement.component.html',
  styleUrl: './add-new-agreement.component.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddNewAgreementComponent implements OnInit {
  private readonly receiptsService = inject(ReceiptsService);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<AddNewAgreementComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly baseUrl = environment.API_URL;
  public readonly data = inject<AddNewAgreementDialogData>(MAT_DIALOG_DATA);
  readonly storageUrl = environment.STORAGE_URL;

  readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  // Signals for reactive state management
  readonly loading = signal<boolean>(false);
  readonly projects = signal<Project[]>([]);
  readonly wings = signal<Wing[]>([]);
  readonly units = signal<Unit[]>([]);
  readonly agreementCopyStatusList = signal<AgreementCopyStatus[]>([]);
  readonly registrationOfficeList = signal<RegistrationOffice[]>([]);
  readonly currentBookingId = signal<number | null>(null);
  readonly isEditMode = signal<boolean>(false);

  // Form for project/unit selection
  readonly addUnitBankerForm = this.fb.group({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | string | null>('', Validators.required),
    unit_id: new FormControl<number | string | null>('', Validators.required),
  });

  // Form for agreement details
  readonly addUpdateAgreementDetailsForm = this.fb.group({
    agreement_copy_status_id: ['', Validators.required],
    agreement_no: ['', Validators.required],
    agreement_date: ['', Validators.required],
    registration_office: ['', Validators.required],
    remark: [''],
    created_by: [this.userId],
    index_attachment: [null as File | null, Validators.required],
  });

  // Signals for reactive form values
  readonly selectedProjectId = toSignal(
    this.addUnitBankerForm.controls.project_id.valueChanges.pipe(startWith(null))
  );

  readonly selectedWingId = toSignal(
    this.addUnitBankerForm.controls.wing_id.valueChanges.pipe(startWith(null))
  );

  readonly selectedUnitId = toSignal(
    this.addUnitBankerForm.controls.unit_id.valueChanges.pipe(startWith(null))
  );

  // Computed signals for UI state
  readonly isFormValid = toSignal(
    this.addUpdateAgreementDetailsForm.statusChanges.pipe(
      map(status => status === 'VALID'),
      startWith(false)
    )
  );

  readonly selectedFileName = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeData();
    this.initializeFormData();
    this.setupReactiveListeners();
  }

  private initializeData(): void {
    this.loading.set(true);
    this.receiptsService
      .fetchUserProjects(this.userId)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          this.showError('Unable to fetch projects.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((projects) => this.projects.set(projects));

    this.fetchAllAgreementStatusList();
    this.fetchAllRegistraionOfficeDropdown();
  }

  private initializeFormData(): void {
    if (this.data?.booking_id) {
      this.isEditMode.set(true);
      this.fetchBookingAgreementData(this.data.booking_id);
      return;
    }

    if (this.data) {
      this.addUnitBankerForm.patchValue({
        project_id: this.data.project_id || null,
        wing_id: this.data.wing_id || '',
        unit_id: this.data.unit_id || '',
      }, { emitEvent: true });
    }
  }

  private setupReactiveListeners(): void {
    // Project -> Wings
    this.addUnitBankerForm.controls.project_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(projectId => {
        if (projectId) {
          this.loadWings(projectId);
          this.addUnitBankerForm.patchValue({ wing_id: '', unit_id: '' }, { emitEvent: false });
          this.units.set([]);
          this.resetAgreementForm();
        } else {
          this.wings.set([]);
          this.units.set([]);
        }
      });

    // Wing -> Units
    this.addUnitBankerForm.controls.wing_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(wingId => {
        const projectId = this.addUnitBankerForm.controls.project_id.value;
        if (projectId && wingId) {
          this.fetchUnits(projectId, Number(wingId));
          this.addUnitBankerForm.patchValue({ unit_id: '' }, { emitEvent: false });
          this.resetAgreementForm();
        } else {
          this.units.set([]);
        }
      });

    // Unit -> Agreement Data
    this.addUnitBankerForm.controls.unit_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(unitId => {
        if (unitId) {
          const selectedUnit = this.units().find(u => u.floor_unit_id === unitId);
          const bookingId = (selectedUnit as any)?.booking_id;
          if (bookingId) {
            this.currentBookingId.set(bookingId);
            if (this.isEditMode()) {
              this.fetchBookingAgreementData(bookingId);
            }
          }
        } else {
          this.currentBookingId.set(null);
        }
      });
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
      .subscribe((wings) => this.wings.set(wings));
  }

  private fetchUnits(projectId: number, wingId: number): void {
    this.loading.set(true);
    this.receiptsService
      .fetchUnitsWithAgreementStatusNotDone(projectId, wingId, 0)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.showError('No units found');
          return of({ data: [] });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        const units = (response.data || []).map((item: Unit) => ({
          ...item,
          full_name: `${item.floor_unit} - ${item.applicant_name}`,
        }));
        this.units.set(units);
      });
  }

  private fetchAllAgreementStatusList(): void {
    this.http
      .get<{ data: AgreementCopyStatus[] }>(`${this.baseUrl}/agreement_copy_statues_dropdown`)
      .pipe(
        catchError(() => {
          this.showError('Unable to fetch agreement status.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.agreementCopyStatusList.set(res.data || []));
  }

  private fetchAllRegistraionOfficeDropdown(): void {
    this.http
      .get<{ data: RegistrationOffice[] }>(`${this.baseUrl}/registration_offices_dropdown`)
      .pipe(
        catchError(() => {
          this.showError('Unable to fetch registration offices.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.registrationOfficeList.set(res.data || []));
  }

  private fetchBookingAgreementData(bookingId: number): void {
    this.loading.set(true);
    this.currentBookingId.set(bookingId);

    this.http
      .post<{ status: boolean; data: BookingAgreementData }>(`${this.baseUrl}/fetch_booking_agreement`, {
        booking_id: bookingId,
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.showError('Agreement not found for this booking');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.status && res.data) {
          this.patchAgreementForm(res.data);
          if (this.isEditMode() && this.projects().length > 0) {
            this.ensureDependentDropdowns(res.data);
          }
        }
      });
  }

  private ensureDependentDropdowns(data: any): void {
    const projectId = data.project_id;
    const wingId = data.wing_id;
    const unitId = data.floor_unit_id || data.unit_id;

    if (projectId) {
      this.loadWings(projectId);
      this.addUnitBankerForm.patchValue({ project_id: projectId }, { emitEvent: false });
      if (wingId) {
        this.fetchUnits(projectId, wingId);
        this.addUnitBankerForm.patchValue({ wing_id: wingId }, { emitEvent: false });
        if (unitId) {
          this.addUnitBankerForm.patchValue({ unit_id: unitId }, { emitEvent: false });
        }
      }
    }
  }

  readonly existingAttachment = signal<string | null>(null);

  private patchAgreementForm(data: BookingAgreementData): void {
    const parseDate = (val: any) => (!val || val === '0000-00-00' || val === '' ? null : new Date(val));
    const getValue = (val: any, fallback: any = '') => (val === null || val === undefined || val === '' ? fallback : val);

    if (data['index_attachment']) {
      const cleanPath = data['index_attachment'].replace(/\\/g, '');
      this.existingAttachment.set(`${this.storageUrl}/${cleanPath}`);
      this.addUpdateAgreementDetailsForm.get('index_attachment')?.clearValidators();
      this.addUpdateAgreementDetailsForm.get('index_attachment')?.updateValueAndValidity();

      // Extract filename from path if possible, or just use a generic name
      const attachmentPath = data['index_attachment'];
      const fileName = attachmentPath.split('/').pop() || 'Existing Attachment';
      this.selectedFileName.set(fileName);
    } else {
      this.existingAttachment.set(null);
      this.addUpdateAgreementDetailsForm.get('index_attachment')?.setValidators(Validators.required);
      this.addUpdateAgreementDetailsForm.get('index_attachment')?.updateValueAndValidity();
    }

    this.addUpdateAgreementDetailsForm.patchValue({
      agreement_copy_status_id: getValue(data['agreement_copy_status_id']),
      registration_office: getValue(data['registration_office']),
      agreement_date: parseDate(data['agreement_date']) as any,
      agreement_no: getValue(data['agreement_no']),
      remark: getValue(data['remark']),
    });
  }

  private resetAgreementForm(): void {
    this.addUpdateAgreementDetailsForm.reset();
    this.currentBookingId.set(null);
    this.selectedFileName.set(null);
    this.existingAttachment.set(null);

    // Reset validator
    this.addUpdateAgreementDetailsForm.get('index_attachment')?.setValidators(Validators.required);
    this.addUpdateAgreementDetailsForm.get('index_attachment')?.updateValueAndValidity();
  }

  onFileChange(event: Event, field: 'index_attachment'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const allowed = ['pdf', 'jpg', 'jpeg', 'png'];
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext && allowed.includes(ext)) {
        this.addUpdateAgreementDetailsForm.get(field)?.setValue(file);
        this.selectedFileName.set(file.name);
      } else {
        this.showError('Invalid file format. Please select a PDF or an Image.');
        this.addUpdateAgreementDetailsForm.get(field)?.setValue(null);
        this.selectedFileName.set(null);
        input.value = '';
      }
    }
  }

  onSubmit(): void {
    if (!this.currentBookingId()) {
      this.showError('Please select a unit first');
      return;
    }

    if (this.addUpdateAgreementDetailsForm.invalid) {
      this.showError('Please fill all required fields');
      this.addUpdateAgreementDetailsForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formData = this.buildFormData();

    this.http
      .post<{ message?: string }>(`${this.baseUrl}/add_booking_agreement`, formData)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((error) => {
          this.showError(error.error?.message || 'Failed to submit agreement.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.dialog.open(SuccessDialogComponent, {
          data: { message: res.message || 'Agreement submitted successfully' },
        });
        this.dialogRef.close({ success: true, message: res.message });
      });
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const val = this.addUpdateAgreementDetailsForm.value;
    const format = (d: any) => this.datePipe.transform(d, 'yyyy-MM-dd') || '';

    formData.append('booking_id', String(this.currentBookingId()));
    formData.append('agreement_copy_status_id', String(val.agreement_copy_status_id || ''));
    formData.append('agreement_date', format(val.agreement_date));
    formData.append('registration_office', String(val.registration_office || ''));
    formData.append('remark', val.remark || '');
    formData.append('agreement_no', val.agreement_no || '');
    formData.append('created_by', String(this.userId));
    formData.append('updated_by', String(this.userId));

    if (val.index_attachment) {
      formData.append('index_attachment', val.index_attachment);
    }

    return formData;
  }

  previewExistingAttachment(): void {
    const url = this.existingAttachment();
    if (url) {
      this.dialog.open(ReceiptPreviewDialogComponent, {
        width: '80%',
        maxWidth: '900px',
        data: {
          title: 'Index Attachment Preview',
          fileUrl: url,
        },
      });
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
