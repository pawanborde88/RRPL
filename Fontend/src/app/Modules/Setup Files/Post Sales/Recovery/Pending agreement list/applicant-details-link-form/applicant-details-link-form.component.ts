import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BookingService, Applicant } from '../../../../../../Service/booking.service';
import { environment } from '../../../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../../../Common/success-dialog/success-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { finalize, forkJoin, Subject, takeUntil } from 'rxjs';
import { AadharcardNoformatDirective } from '../../../../../../Common/directives/Aadhar/aadharcard-noformat.directive';
import { PANNoDirective } from '../../../../../../Common/directives/panno.directive';
import { ReceiptsService, DocMaster, AttachmentResponse } from '../../Recipts/receipts.service';
import { catchError, EMPTY, of } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';

interface AttachmentFormValue {
  project_unit_attachment_id: number | null;
  project_id: number | null;
  wing_id: number | null;
  floor_unit_id: number | null;
  attachment_type_id: number | null;
  created_by: number;
  attachment: File | null;
}

@Component({
  selector: 'app-applicant-details-link-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    RouterModule,
    AadharcardNoformatDirective,
    PANNoDirective
  ],
  templateUrl: './applicant-details-link-form.component.html',
  styleUrl: './applicant-details-link-form.component.scss'
})
export class ApplicantDetailsLinkFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly receiptsService = inject(ReceiptsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly destroy$ = new Subject<void>();

  private readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  readonly storageUrl = environment.STORAGE_URL;
  readonly loading = signal(false);
  readonly slug = signal<string | null>(null);

  bookingdata: any = null;
  applicantForm: FormGroup;
  salutationDropdown: any[] = [];
  allOccupations: any[] = [];
  docMasters = signal<DocMaster[]>([]);
  readonly uploadTypes: ('aadhar' | 'pan')[] = ['aadhar', 'pan'];

  readonly documentForm = this.fb.group({
    project_unit_attachment_id: [null as number | null],
    project_id: [null as number | null, Validators.required],
    wing_id: [null as number | null, Validators.required],
    floor_unit_id: [null as number | null, Validators.required],
    attachment_type_id: [null as number | null, Validators.required],
    created_by: [this.userId],
    attachment: [null as File | null, Validators.required],
  });

  constructor() {
    this.applicantForm = this.fb.group({
      applicants: this.fb.array([])
    });
  }

  get applicants(): FormArray {
    return this.applicantForm.get('applicants') as FormArray;
  }

  ngOnInit(): void {
    const slugParam = this.route.snapshot.paramMap.get('slug');
    this.slug.set(slugParam);

    if (this.slug()) {
      this.loadInitialData();
    } else {
      this.showError('Invalid link. Please check your URL.');
    }
  }

  private fetchDocMasters(): void {
    this.receiptsService.fetchDocMasters().pipe(
      catchError(() => {
        this.showError('Unable to fetch attachment types.');
        return of([] as DocMaster[]);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data: DocMaster[]) => this.docMasters.set(data));
  }
  private buildFormData(file: File, docMasterId: number): FormData {
    const formData = new FormData();

    formData.append('project_id', this.bookingdata?.project_id?.toString() || '');
    formData.append('wing_id', this.bookingdata?.wing_id?.toString() || '');
    formData.append('floor_unit_id', this.bookingdata?.floor_unit_id?.toString() || '');
    formData.append('attachment_type_id', docMasterId.toString());
    formData.append('created_by', this.userId.toString());
    formData.append('attachment', file);

    return formData;
  }

  getDocMasterId(type: 'aadhar' | 'pan', index: number): number | null {
    const masters = this.docMasters();
    if (!masters.length) return null;

    let targetName = '';
    if (type === 'aadhar') {
      targetName = `Applicant Adhar ${index + 1}`;
    } else {
      targetName = `Applicant Pan ${index + 1}`;
    }

    const match = masters.find(m => m.doc_name.toLowerCase() === targetName.toLowerCase());
    return match ? match.doc_master_id : null;
  }

  uploadApplicantFile(index: number, type: 'aadhar' | 'pan'): void {
    const applicant = this.applicants.at(index);
    const file = applicant.get(type === 'aadhar' ? 'aadhar_file' : 'pan_file')?.value;
    const docMasterId = this.getDocMasterId(type, index);

    if (!file || !docMasterId) {
      this.showError(`Missing ${type} file or attachment type configuration`);
      return;
    }

    const formData = this.buildFormData(file, docMasterId);
    this.loading.set(true);

    this.receiptsService
      .uploadUnitAttachment(formData)
      .pipe(
        catchError((error) => {
          this.showError(error.error?.message || `Failed to upload ${type} for Applicant ${index + 1}`);
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.snackBar.open(`${type === 'aadhar' ? 'Aadhar' : 'PAN'} uploaded successfully for Applicant ${index + 1}`, 'Close', { duration: 3000 });
        },
      });
  }

  private uploadAllPendingDocuments(): void {
    this.applicants.controls.forEach((_, index) => {
      const applicant = this.applicants.at(index);
      ['aadhar_file', 'pan_file'].forEach(field => {
        const file = applicant.get(field)?.value;
        if (file instanceof File) {
          const type = field === 'aadhar_file' ? 'aadhar' : 'pan';
          this.uploadApplicantFile(index, type);
        }
      });
    });
  }
  sendcustomerDocuments(): void {
    if (this.documentForm.invalid) {
      this.showError('Please fill all required fields for document upload');
      this.documentForm.markAllAsTouched();
      return;
    }

    const formValue = this.documentForm.value as AttachmentFormValue;
    if (!formValue.attachment || !formValue.attachment_type_id) {
      this.showError('Please select a file and attachment type');
      return;
    }
    const formData = this.buildFormData(formValue.attachment, formValue.attachment_type_id);

    this.loading.set(true);

    this.receiptsService
      .uploadUnitAttachment(formData)
      .pipe(
        catchError((error) => {
          this.showError(error.error?.message || 'Failed to upload attachment');
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: AttachmentResponse) => {
          this.loading.set(false);
          this.documentForm.reset({ created_by: this.userId });
          this.dialog.open(SuccessDialogComponent, {
            data: { message: response.message || 'Attachment uploaded successfully' },
          });
        },
      });
  }
  private loadInitialData(): void {
    this.loading.set(true);


    forkJoin({
      booking: this.bookingService.fetchBookingBySlug(this.slug()!),
      salutations: this.bookingService.fetchSalutations(),
      occupations: this.bookingService.fetchOccupations()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (val: any) => {
          this.loading.set(false);
          // The API might return data directly or wrapped in success/data
          const bookingResponse = val.booking;
          const booking = bookingResponse.success ? bookingResponse.data : bookingResponse;

          if (booking && (booking.booking_id || bookingResponse.success)) {
            this.bookingdata = booking;
            this.salutationDropdown = val.salutations || [];
            this.allOccupations = val.occupations || [];

            // Map flattened applicant fields if 'applicants' array is missing
            const applicantList = booking.applicants || this.mapFlattenedApplicants(booking);
            this.setupApplicants(applicantList);

            // Fetch doc masters and patch documentForm with booking info
            this.fetchDocMasters();
            this.fetchApplicants(booking.floor_unit_id);
            this.documentForm.patchValue({
              project_id: booking.project_id,
              wing_id: booking.wing_id,
              floor_unit_id: booking.floor_unit_id
            });
          } else {
            this.showError(bookingResponse.message || 'Unable to load booking data.');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.showError('Failed to load initial data.');
          console.error(err);
        }
      });
  }
  private fetchApplicants(unitID: number): void {
    this.loading.set(true);
    this.bookingService.fetchApplicantsByUnit(unitID)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('Error fetching applicant details:', err);
          return of([]);
        })
      )
      .subscribe({
        next: (res) => {
          if (res && res.length > 0) {
            this.setupApplicants(res);
          }
        }
      });
  }
  private mapFlattenedApplicants(data: any): Applicant[] {
    const applicants: Applicant[] = [];

    const prefixes = [
      { key: 'applicant', label: 'Primary' },
      { key: 'coapplicant', label: 'Joint' },
      { key: 'applicant3', label: 'Third' },
      { key: 'applicant4', label: 'Fourth' }
    ];

    prefixes.forEach(p => {
      const name = data[`${p.key}_name`];
      if (name && name.trim()) {
        const nameParts = this.splitName(name);

        // Find occupation ID by string match if occupation_id is string or missing
        let occId = data[`${p.key}_occupation_id`];
        if (!occId && data[`${p.key}_occupation`]) {
          const occStr = data[`${p.key}_occupation`].toLowerCase();
          const match = this.allOccupations.find(o =>
            (o.occupation || o.occupation_string || '').toLowerCase() === occStr
          );
          occId = match ? (match.occupation_id || match.id) : null;
        }

        applicants.push({
          first_name: nameParts.first,
          middle_name: nameParts.middle,
          last_name: nameParts.last,
          mobile_no: data[`${p.key}_mobile`] || '',
          email: data[`${p.key}_email`] || '',
          current_address: data[`${p.key}_current_address`] || '',
          gender: data[`${p.key}_gender`] || '',
          dob: data[`${p.key}_dob`] || null,
          aadhar_no: data[`${p.key}_aadhar_no`] || '',
          pan_no: data[`${p.key}_pan_no`] || '',
          occupation_id: occId
        } as Applicant);
      }
    });

    return applicants;
  }

  private splitName(fullName: string): { first: string, middle: string, last: string } {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { first: parts[0], middle: '', last: '' };
    } else if (parts.length === 2) {
      return { first: parts[0], middle: '', last: parts[1] };
    } else {
      return {
        first: parts[0],
        middle: parts.slice(1, -1).join(' '),
        last: parts[parts.length - 1]
      };
    }
  }

  private setupApplicants(data: Applicant[]): void {
    this.applicants.clear();
    const targetCount = 4;
    for (let i = 0; i < targetCount; i++) {
      this.addApplicant(data[i] || undefined, i === 0);
    }
  }

  private addApplicant(data?: Applicant, isMandatory: boolean = false): void {
    const group = this.fb.group({
      applicant_id: [data?.applicant_id || null],
      booking_id: [this.bookingdata?.booking_id || null],
      salutation_id: [data?.salutation_id || data?.salution_id || null, Validators.required],
      first_name: [data?.first_name || '', Validators.required],
      middle_name: [data?.middle_name || ''],
      last_name: [data?.last_name || '', Validators.required],
      occupation_id: [data?.occupation_id || null],
      mobile_no: [data?.mobile_no || '', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      alternate_mobile_no: [data?.alternate_mobile_no || ''],
      whatsapp_no: [data?.whatsapp_no || ''],
      email: [data?.['email'] || (data as any)?.email || '', [Validators.required, Validators.email]],
      aadhar_no: [data?.aadhar_no || '', isMandatory ? [Validators.required, Validators.pattern('^[0-9]{4}-[0-9]{4}-[0-9]{4}$')] : [Validators.pattern('^[0-9]{4}-[0-9]{4}-[0-9]{4}$')]],
      pan_no: [data?.pan_no || '', isMandatory ? [Validators.required, Validators.pattern('[A-Z]{5}[0-9]{4}[A-Z]{1}')] : [Validators.pattern('[A-Z]{5}[0-9]{4}[A-Z]{1}')]],
      dob: [data?.dob || null, isMandatory ? [Validators.required] : []],
      gender: [data?.gender || null, isMandatory ? [Validators.required] : []],
      anniversary_date: [data?.anniversary_date || null],
      current_address: [data?.current_address || ''],
      permanent_address: [data?.permanent_address || ''],
      aadhar_file: [null, isMandatory ? [Validators.required] : []],
      aadhar_preview: [null],
      pan_file: [null, isMandatory ? [Validators.required] : []],
      pan_preview: [null]
    });
    this.applicants.push(group);
  }

  onFileChange(event: any, index: number, field: string): void {
    const file = event.target.files[0];
    if (file) {
      const applicant = this.applicants.at(index);
      applicant.get(field)?.setValue(file);

      // Generate preview if it's an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.ngZone.run(() => {
            const previewField = field === 'aadhar_file' ? 'aadhar_preview' : 'pan_preview';
            applicant.get(previewField)?.setValue(reader.result as string);
            this.cdr.detectChanges();
          });
        };
        reader.readAsDataURL(file);
      } else {
        // Clear preview for non-image files (like PDFs)
        const previewField = field === 'aadhar_file' ? 'aadhar_preview' : 'pan_preview';
        applicant.get(previewField)?.setValue(null);
      }
    }
  }

  removeApplicantFile(index: number, type: 'aadhar' | 'pan'): void {
    const applicant = this.applicants.at(index);
    const fileField = type === 'aadhar' ? 'aadhar_file' : 'pan_file';
    const previewField = type === 'aadhar' ? 'aadhar_preview' : 'pan_preview';

    applicant.get(fileField)?.setValue(null);
    applicant.get(previewField)?.setValue(null);

    // Reset the native file input if possible
    // (Optional: requires @ViewChildren if we want to be thorough, but setValue(null) handles form state)
  }

  isFirstApplicantValid(): boolean {
    if (this.applicants.length === 0) return false;
    const first = this.applicants.at(0);
    return first.valid;
  }

  updateAllApplicants(): void {
    if (!this.isFirstApplicantValid()) {
      this.showError('Please fill in required fields for the primary applicant.');
      return;
    }

    this.loading.set(true);
    const payload = this.applicants.value.map((app: any) => ({
      ...app,
      // Handle file uploads separately if needed, but for now assuming updateApplicants takes this structure
      // Note: Real implementation might need FormData if files are included
    }));

    this.bookingService.updateApplicants(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success || (res as any).status) {
            // Upload all documents if present
            this.uploadAllPendingDocuments();

            this.dialog.open(SuccessDialogComponent, {
              data: { message: res.message || 'Applicants details updated successfully!' }
            });
          } else {
            this.loading.set(false);
            this.showError(res.message || 'Update failed.');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.showError('An error occurred while updating.');
          console.error(err);
        }
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }
}
