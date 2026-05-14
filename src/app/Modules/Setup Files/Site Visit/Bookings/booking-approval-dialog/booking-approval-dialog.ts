import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs/operators';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,

} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { BookingService } from '../../../../../Service/booking.service';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { CommonService } from '../../../../../Service/common/common.service';
import { EnquiryManagementService } from '../../../Enquiry/services/enquiry-management.service';

export interface BookingApprovalDialogData {
  booking_id: number;
  source_id?: number | null;
  source_detail_id?: number | null;
  source_executive_id?: number | null;
  channel_partner_id?: number | null;
  sales_executive_id?: number | null;
  booking_date?: string | null;
  source_description?: string | null;
  project_id?: number | null;
  // Display labels (resolved names from the grid row)
  source?: string;
  source_detail?: string;
  firm_name?: string;
  cp_executive?: string;
  sales_executive?: string;
  closed_by_name?: string;
  applicant_name?: string;
  project_name?: string;
  floor_unit?: string;
  wing_name?: string;
}

export interface CPExecutive {
  user_id: number | string;
  first_name: string;
  last_name: string;
  user_phone: string;
  full_name: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-booking-approval-dialog',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './booking-approval-dialog.html',
  styleUrl: './booking-approval-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingApprovalDialog {
  // ── Dependency Injection ───────────────────────────────────────────────────
  private readonly bookingService = inject(BookingService);
  private readonly commonService = inject(CommonService);
  private readonly enquiryService = inject(EnquiryManagementService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  readonly dialogRef = inject(MatDialogRef<BookingApprovalDialog>);
  readonly data: BookingApprovalDialogData = inject(MAT_DIALOG_DATA);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // ── User context ───────────────────────────────────────────────────────────
  readonly userId = Number(sessionStorage.getItem('session_id') || '0');

  readonly isSubmitting = signal<boolean>(false);
  readonly selectedFile = signal<File | null>(null);
  private readonly originalSourceId = signal<number | null>(null);
  private readonly originalSourceDetailId = signal<number | null>(null);
  private readonly originalChannelPartnerId = signal<number | null>(null);

  // ── Dropdown Data ───────────────────────────────────────────────────────────
  private readonly sourcesListData = signal<any[]>([]);
  private readonly sourceDetailListData = signal<any[]>([]);
  private readonly channelPartnersData = signal<any[]>([]);
  private readonly allCPExeuctiveListData = signal<CPExecutive[]>([]);
  private readonly salesExecutivesData = signal<any[]>([]);
  private readonly allProjectPeopleData = signal<any[]>([]);

  // ── Computed Properties ─────────────────────────────────────────────────────
  readonly sourcesList = computed(() => this.sourcesListData());
  readonly sourceDetailList = computed(() => this.sourceDetailListData());
  readonly channelPartners = computed(() => this.channelPartnersData());
  readonly allCPExeuctiveList = computed(() => this.allCPExeuctiveListData());
  readonly salesExecutives = computed(() => this.salesExecutivesData());
  readonly allProjectPeople = computed(() => this.allProjectPeopleData());

  // ── Form ───────────────────────────────────────────────────────────────────
  readonly approvalForm = new FormGroup({
    booking_date: new FormControl<string>(''),
    source_id: new FormControl<number | null>(null),
    source_detail_id: new FormControl<number | null>(null),
    channel_partner_id: new FormControl<number | null>(null),
    sales_executive_id: new FormControl<number | null>(null),
    cp_executive_id: new FormControl<string | number | null>(null),
    source_description: new FormControl<string>(''),
    request_remarks: new FormControl<string>('', [
      Validators.required,
    ]),
  });

  // Track form values for reactive UI logic
  private readonly sourceIdSignal = toSignal(
    this.approvalForm.get('source_id')!.valueChanges,
    { initialValue: this.approvalForm.get('source_id')!.value as number | null }
  );

  private readonly sourceDetailIdSignal = toSignal(
    this.approvalForm.get('source_detail_id')!.valueChanges,
    { initialValue: this.approvalForm.get('source_detail_id')!.value as number | null }
  );

  private readonly channelPartnerIdSignal = toSignal(
    this.approvalForm.get('channel_partner_id')!.valueChanges,
    { initialValue: this.approvalForm.get('channel_partner_id')!.value as number | null }
  );

  readonly isChannelPartnerSource = computed(() => {
    const sourceId = this.sourceIdSignal();
    return Number(sourceId) === 3; // 3 is Channel Partner source ID
  });

  readonly isSourceChanged = computed(() => {
    const currentSource = this.sourceIdSignal();
    const originalSource = this.originalSourceId();

    const currentDetail = this.sourceDetailIdSignal();
    const originalDetail = this.originalSourceDetailId();

    const currentCP = this.channelPartnerIdSignal();
    const originalCP = this.originalChannelPartnerId();

    // Check if any of the critical source-related fields have changed
    const sourceChanged = originalSource !== null && Number(currentSource) !== Number(originalSource);
    const detailChanged = originalDetail !== null && Number(currentDetail) !== Number(originalDetail);
    const cpChanged = originalCP !== null && Number(currentCP) !== Number(originalCP);

    return sourceChanged || detailChanged || cpChanged;
  });

  readonly canSubmit = computed(() => {
    const formValid = this.approvalForm.valid;
    const sourceInfoChanged = this.isSourceChanged();
    const hasFile = !!this.selectedFile();

    if (sourceInfoChanged && !hasFile) return false;
    return formValid;
  });

  // ── Derived display values (read-only info cards) ─────────────────────────
  readonly bookingId = this.data.booking_id;
  readonly sourceId = this.data.source_id ?? null;
  readonly sourceDetailId = this.data.source_detail_id ?? null;
  readonly sourceExecutiveId = this.data.source_executive_id ?? null;
  readonly channelPartnerId = this.data.channel_partner_id ?? null;
  readonly salesExecutiveId = this.data.sales_executive_id ?? null;
  readonly bookingDate = this.data.booking_date ?? null;
  readonly sourceDescription = this.data.source_description ?? null;

  // Labels shown in the info cards
  readonly displaySource = this.data.source || '—';
  readonly displaySourceDetail = this.data.source_detail || '—';
  readonly displayChannelPartner = this.data.firm_name || '—';
  readonly displayCpExecutive = this.data.cp_executive || '—';
  readonly displaySalesExecutive = this.data.sales_executive || '—';
  readonly displayClosedBy = this.data.closed_by_name || '—';
  readonly displayApplicant = this.data.applicant_name || '—';
  readonly displayProject = this.data.project_name || '—';
  readonly displayUnit = this.data.floor_unit || '—';
  readonly displayWing = this.data.wing_name || '—';
  readonly displayBookingDate = this.bookingDate
    ? (this.datePipe.transform(this.bookingDate, 'dd MMM yyyy') ?? this.bookingDate)
    : '—';

  constructor() {
    this.loadInitialData();
    this.setupFormSubscriptions();
    this.fetchSingleBooking();
  }

  // ── Data Loading ───────────────────────────────────────────────────────────
  private loadInitialData(): void {
    this.bookingService.fetchSources().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res)) {
          this.sourcesListData.set(res);
        }
      },
      error: () => {
        console.error('Failed to load sources');
      }
    });

    this.bookingService.fetchChannelPartners().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res)) {
          this.channelPartnersData.set(res);
        }
      },
      error: () => {
        console.error('Failed to load channel partners');
      }
    });

    // Need project_id for sales executives - using a default or getting from data
    const projectId = this.data.project_id || 1; // Default fallback
    this.bookingService.fetchSalesExecutives(projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        let executivesArray: any[] = [];

        if (res?.data && Array.isArray(res.data)) {
          executivesArray = res.data;
        } else if (res && Array.isArray(res)) {
          executivesArray = res;
        }

        // Map executive objects to ensure they have required properties
        const mappedExecutives = executivesArray.map((exec: any) => ({
          user_id: exec.user_id || exec.id || exec.user_id,
          user_name: exec.user_name || exec.name || exec.full_name || exec.first_name + ' ' + (exec.last_name || '')
        }));

        console.log('Sales executives loaded:', mappedExecutives);
        this.salesExecutivesData.set(mappedExecutives);
      },
      error: () => {
        console.error('Failed to load sales executives');
      }
    });

    // Fetch all project people for "Closed By" dropdown
    this.commonService.fetchUsers({ project_id: projectId }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        let usersArray: any[] = [];

        if (res?.data && Array.isArray(res.data)) {
          usersArray = res.data;
        } else if (res && Array.isArray(res)) {
          usersArray = res;
        }

        // Map user objects to ensure they have the required properties
        const mappedUsers = usersArray.map((user: any) => ({
          user_id: user.user_id || user.id || user.user_id,
          user_name: user.user_name || user.name || user.full_name || user.first_name + ' ' + (user.last_name || '')
        }));

        console.log('Project people loaded:', mappedUsers);
        this.allProjectPeopleData.set(mappedUsers);
      },
      error: () => {
        console.error('Failed to load project people');
      }
    });
  }
  fetchAllCPExecutives(channelPartnerID: number): void {
    if (!channelPartnerID || channelPartnerID <= 0) return;

    this.enquiryService
      .fetchCPExecutives({
        channel_partner_id: [channelPartnerID],
        active_status_id: 1,
        approve_status_id: 1,
        is_dummy: 1,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any[]) => {
          const executives: CPExecutive[] = (res || []).map(
            (item: any, index: number) => ({
              ...item,
              user_id: item.user_id ?? (`temp_null_${index}` as string | number),
              full_name: `${item.first_name} ${item.last_name} --(${item.user_phone})`,
            })
          );
          this.allCPExeuctiveListData.set(executives);
        },
        error: () => {
          console.error('Failed to fetch CP executives');
        }
      });
  }

  private isTempNullId(value: unknown): boolean {
    return typeof value === 'string' && value.startsWith('temp_null_');
  }

  // ── Form Subscriptions ───────────────────────────────────────────────────────
  private setupFormSubscriptions(): void {
    this.approvalForm.get('source_id')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged()
    ).subscribe((sourceId) => {
      // Clear dependent fields when source changes
      if (Number(sourceId) === 3) {
        this.approvalForm.get('source_detail_id')?.setValue(null);
      } else {
        this.approvalForm.get('channel_partner_id')?.setValue(null);
      }

      if (sourceId) {
        this.loadSourceDetails(sourceId);
      } else {
        this.sourceDetailListData.set([]);
      }
    });

    this.approvalForm.get('channel_partner_id')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged()
    ).subscribe((cpId) => {
      if (cpId) {
        this.fetchAllCPExecutives(Number(cpId));
      } else {
        this.allCPExeuctiveListData.set([]);
        this.approvalForm.get('cp_executive_id')?.setValue(null);
      }
    });
  }

  private loadSourceDetails(sourceId: number): void {
    this.bookingService.fetchSourceDetails(sourceId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res)) {
          this.sourceDetailListData.set(res);
        }
      },
      error: () => {
        console.error('Failed to load source details');
      }
    });
  }

  // ── Event Handlers ───────────────────────────────────────────────────────────
  onPartnerSearch(searchTerm: string, channelPartnerId?: number): void {
    if (!channelPartnerId && (!searchTerm || searchTerm.length < 3)) {
      this.loadInitialData();
      return;
    }

    this.bookingService.fetchChannelPartners(searchTerm, channelPartnerId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res)) {
          this.channelPartnersData.set(res);
        }
      },
      error: () => {
        console.error('Failed to search channel partners');
      }
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile.set(fileList[0]);
    } else {
      this.selectedFile.set(null);
    }
  }

  // ── Fetch Single Booking ─────────────────────────────────────────────────────
  private fetchSingleBooking(): void {
    if (!this.bookingId) return;

    this.bookingService.fetchSingleBooking(this.bookingId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          const bookingData = res.data;
          this.originalSourceId.set(bookingData.source_id || null);
          this.originalSourceDetailId.set(bookingData.source_detail_id || null);
          this.originalChannelPartnerId.set(bookingData.channel_partner_id || null);

          // Patch form with booking data
          const isChannelPartner = bookingData.source_id === 3;
          this.approvalForm.patchValue({
            booking_date: bookingData.booking_date || '',
            source_id: bookingData.source_id || null,
            source_detail_id: isChannelPartner ? null : (bookingData.source_detail_id || null),
            channel_partner_id: isChannelPartner ? (bookingData.channel_partner_id || null) : null,
            sales_executive_id: bookingData.sales_executive_id || null,
            cp_executive_id: bookingData.source_executive_id || null,
            source_description: bookingData.source_description || '',
          });

          if (isChannelPartner && bookingData.channel_partner_id) {
            this.onPartnerSearch('', bookingData.channel_partner_id);
            this.fetchAllCPExecutives(bookingData.channel_partner_id);
          }
        }
      },
      error: () => {
        console.error('Failed to fetch booking details');
        this.snackBar.open('Failed to load booking details.', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    const formValues = this.approvalForm.getRawValue();

    if (this.isSourceChanged() && !this.selectedFile()) {
      this.snackBar.open('Approval attachment is required when source is changed.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isSubmitting.set(true);

    const formData = new FormData();
    formData.append('booking_id', String(this.bookingId));
    formData.append('source_id', formValues.source_id ? String(formValues.source_id) : '');
    formData.append('source_detail_id', formValues.source_detail_id ? String(formValues.source_detail_id) : '');
    formData.append('source_executive_id', formValues.cp_executive_id ? String(formValues.cp_executive_id) : '');
    formData.append('channel_partner_id', formValues.channel_partner_id ? String(formValues.channel_partner_id) : '');
    formData.append('sales_executive_id', formValues.sales_executive_id ? String(formValues.sales_executive_id) : '');
    formData.append('booking_date', formValues.booking_date || '');
    formData.append('source_description', formValues.source_description || '');
    formData.append('requested_by', String(this.userId));
    formData.append('request_remarks', formValues.request_remarks || '');

    if (this.selectedFile()) {
      formData.append('approval_attachment', this.selectedFile()!);
    }

    this.bookingService
      .sendBookingForApproval(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.isSubmitting.set(false);
          this.dialog
            .open(SuccessDialogComponent, {
              data: { message: res.message || 'Booking sent for approval successfully!' },
            })
            .afterClosed()
            .subscribe(() => this.dialogRef.close(true));
        },
        error: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('Failed to send booking for approval.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
