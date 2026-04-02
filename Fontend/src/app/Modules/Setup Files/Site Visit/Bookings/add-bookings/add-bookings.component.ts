import { CommonModule, DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, signal, computed, inject, DestroyRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  FormArray,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import {
  switchMap,
  debounceTime,
  distinctUntilChanged,
  catchError,
  EMPTY,
  of,
  combineLatest,
  filter,
  tap,
  map,
  finalize,
  Observable,
  startWith,
  merge
} from 'rxjs';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { AddApplicantsComponent } from '../add-applicants/add-applicants.component';
import { BookingCalculationsComponent } from '../booking-calculations/booking-calculations.component';
import { AddPaymentsComponent } from '../add-payments/add-payments.component';
import {
  BookingService,
  BookingInfo,
  Project,
  TokenType,
  TokenItem,
  EnquiryItem,
  SalesExecutive,
  BookingFrom,
  CreateBookingPayload
} from '../../../../../Service/booking.service';

// ⚡ Performance: Interfaces for type safety
interface HistoryStateData {
  project_id?: number;
  user_id?: number;
  sales_executive_id?: number;
  token_type_id?: number;
  token_id?: number;
  project_enq_id?: number;
  [key: string]: unknown;
}

interface InitialPatchData {
  user_id?: number;
  project_id?: number;
  sales_executive_id?: number;
  booking_from_id: number;
  token_type_id?: number;
  token_id?: number;
  project_enq_id?: number;
}

@Component({
  selector: 'app-add-bookings',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    AutocompleteReusableComponent,
    AddApplicantsComponent,
    BookingCalculationsComponent,
    AddPaymentsComponent,
  ],
  templateUrl: './add-bookings.component.html',
  styleUrl: './add-bookings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Performance: OnPush change detection
})
export class AddBookingsComponent implements OnInit, OnDestroy {
  // ⚡ Dependency Injection
  private readonly bookingService = inject(BookingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ⚡ Performance: Signals for reactive state management
  readonly projectsList = signal<Project[]>([]);
  readonly allTokenType = signal<TokenType[]>([]);
  readonly allEnquiryData = signal<EnquiryItem[]>([]);
  readonly allSalesExecutive = signal<SalesExecutive[]>([]);
  readonly allBookingDropdown = signal<BookingFrom[]>([]);
  readonly allTokenNolist = signal<TokenItem[]>([]);
  readonly bookingInfo = signal<BookingInfo | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isApplicantAdded = signal<boolean>(false);
  readonly isPaymentAdded = signal<boolean>(false);

  @ViewChild(BookingCalculationsComponent) calculationComponent!: BookingCalculationsComponent;

  // ⚡ Computed signals for derived state
  readonly bookingID = signal<number>(0);
  readonly selectedProjectId = computed(() => {
    const projectId = this.addBookingForm.get('project_id')?.value;
    return projectId ? Number(projectId) : 0;
  });
  readonly tokenID = signal<number>(0);
  pipe = new DatePipe('en-US');

  // ⚡ Computed signal for BookingData to avoid template issues
  readonly bookingDataForCalculations = computed(() => {
    const bookingId = this.bookingID();
    const bookingInfoData = this.bookingInfo();

    // Get project_id from bookingInfo first (most reliable), then fallback to form
    const projectIdFromInfo = bookingInfoData?.project_id
      ? Number(bookingInfoData.project_id)
      : null;
    const projectIdFromForm = this.selectedProjectId();
    const projectId = projectIdFromInfo || projectIdFromForm || 0;

    // Get token_id from bookingInfo first, then fallback to tokenID signal
    const tokenIdFromInfo = bookingInfoData?.token_id
      ? Number(bookingInfoData.token_id)
      : null;
    const tokenId = tokenIdFromInfo || this.tokenID() || 0;

    // Return a new object only when values actually change (Angular change detection)
    return {
      booking_id: bookingId || 0,
      project_id: projectId || 0,
      token_id: tokenId || 0,
    };
  });

  // ⚡ User context (immutable after initialization)
  readonly roleId = Number(sessionStorage.getItem('role_id') || '0');
  readonly userId = Number(sessionStorage.getItem('session_id') || '0');
  private readonly datePipe = new DatePipe('en-US');

  // ⚡ Date constraints
  readonly minDate: Date | null = new Date();
  readonly maxDate = new Date();

  // ⚡ State management
  private initialPatchData: InitialPatchData | null = null;
  private shouldMaintainState = false;
  private readonly elementData: HistoryStateData | null = history.state.data || null;
  private readonly tokenElementData: HistoryStateData | null = history.state.data || null;
  private readonly extraText: string = history.state.extraText || '';

  // ⚡ Reactive Form
  readonly addBookingForm = new FormGroup({
    based_on_id: new FormControl<number | string>(''),
    applicants: new FormArray([]),
    user_id: new FormControl<number>(this.userId),
    project_id: new FormControl<number | string>('', Validators.required),
    token_type_id: new FormControl<number | string>(''),
    sales_executive_id: new FormControl<number | string | null>(null, Validators.required),
    floor_unit_id: new FormControl<number | string>(''),
    booking_date: new FormControl<string>(
      this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
      Validators.required
    ),
    project_enq_id: new FormControl<number | string | null>(null),
    booking_from_id: new FormControl<number | string | null>(null, Validators.required),
    token_id: new FormControl<number | string>(''),
    unit_type: new FormControl<string>(''),
  });

  // ⚡ Reactive form validity signal - tracks both status and value changes for better reactivity
  private readonly formValid = toSignal(
    merge(
      this.addBookingForm.statusChanges,
      this.addBookingForm.valueChanges
    ).pipe(
      map(() => this.addBookingForm.valid),
      distinctUntilChanged(),
      startWith(this.addBookingForm.valid)
    ),
    { initialValue: this.addBookingForm.valid }
  );

  // ⚡ Computed signal for submit button state
  readonly canSubmit = computed(() => {
    // Use the reactive formValid signal which tracks all form changes
    const isValid = this.formValid() ?? false;
    const isNotSubmitting = !this.isSubmitting();
    return isValid && isNotSubmitting;
  });

  constructor() {
    // ⚡ Auto-set sales executive for role 7
    if (this.roleId === 7) {
      this.addBookingForm.get('sales_executive_id')?.patchValue(this.userId);
      this.addBookingForm.get('sales_executive_id')?.disable();
    }

    // ⚡ Performance: Setup reactive form validators based on booking_from_id
    this.setupDynamicValidators();

    // ⚡ Performance: Reactive form value changes with debounce and optimization
    this.setupProjectIdChanges();
  }

  ngOnInit(): void {
    // ⚡ Initialize projects list first (uses user_project_dropdown endpoint)
    console.log(this.tokenElementData);
    this.loadProjects();

    // ⚡ Initialize route params subscription
    this.route.params
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((params: Record<string, unknown>) => Number(params['id'])),
        filter((id) => !!id),
        tap((id) => this.bookingID.set(id)),
        switchMap((id) => this.fetchSingleBooking(id))
      )
      .subscribe();

    // ⚡ Initialize booking from dropdown (cached)
    this.loadBookingFromDropdown();

    // ⚡ Handle history state for TokenBooking
    if (this.extraText === 'TokenBooking' && this.tokenElementData?.project_id) {
      this.handleTokenBooking();
    }

    // ⚡ Handle history state for EnquiryBooking
    if (this.extraText === 'EnquiryBooking' && this.elementData?.project_id) {
      this.handleEnquiryBooking();
    }
  }

  ngOnDestroy(): void {
    // ⚡ Cleanup handled by takeUntilDestroyed in Angular 17+
  }

  // ⚡ Helper method to apply validators based on booking_from_id
  private applyValidatorsForBookingFrom(bookingFromId: number | string | null): void {
    const tokenTypeControl = this.addBookingForm.get('token_type_id');
    const tokenIdControl = this.addBookingForm.get('token_id');
    const projectEnqIdControl = this.addBookingForm.get('project_enq_id');

    if (bookingFromId == 1) {
      // Clear enquiry-related fields and set token validators
      projectEnqIdControl?.setValue(null, { emitEvent: false });
      projectEnqIdControl?.clearValidators();
      tokenTypeControl?.setValidators([Validators.required]);
      tokenIdControl?.setValidators([Validators.required]);
    } else if (bookingFromId == 2) {
      // Clear token-related fields and set enquiry validator
      tokenTypeControl?.setValue('', { emitEvent: false });
      tokenIdControl?.setValue('', { emitEvent: false });
      tokenTypeControl?.clearValidators();
      tokenIdControl?.clearValidators();
      projectEnqIdControl?.setValidators([Validators.required]);
    } else {
      // Clear all conditional validators if booking_from_id is not set
      tokenTypeControl?.clearValidators();
      tokenIdControl?.clearValidators();
      projectEnqIdControl?.clearValidators();
    }

    // Update validity for all affected controls and trigger form status update
    tokenTypeControl?.updateValueAndValidity({ emitEvent: false });
    tokenIdControl?.updateValueAndValidity({ emitEvent: false });
    projectEnqIdControl?.updateValueAndValidity({ emitEvent: false });

    // Use queueMicrotask to ensure form validation updates after all control updates
    queueMicrotask(() => {
      this.addBookingForm.updateValueAndValidity({ emitEvent: true });
    });
  }

  // ⚡ Performance: Setup dynamic validators reactively
  private setupDynamicValidators(): void {
    this.addBookingForm
      .get('booking_from_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged()
      )
      .subscribe((value) => {
        this.applyValidatorsForBookingFrom(value);
      });
  }

  // ⚡ Performance: Reactive project ID changes with optimized API calls
  private setupProjectIdChanges(): void {
    this.addBookingForm
      .get('project_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300), // ⚡ Debounce to avoid excessive API calls
        distinctUntilChanged(),
        filter((projectId) => !!projectId),
        switchMap((projectId) => {
          const effectiveProjectId = projectId || this.elementData?.project_id;
          if (!effectiveProjectId) return EMPTY;

          // ⚡ Parallel API calls for better performance
          return combineLatest([
            this.bookingService.fetchSalesExecutives(effectiveProjectId),
            this.bookingService.fetchEnquiries(effectiveProjectId),
            this.bookingService.fetchTokenTypes(effectiveProjectId),
          ]).pipe(
            tap(([salesExecutives, enquiries, tokenTypes]) => {
              this.allSalesExecutive.set(salesExecutives);
              this.allEnquiryData.set(enquiries);
              this.allTokenType.set(tokenTypes);

              // ⚡ Load tokens if token_type_id exists
              const tokenTypeId = this.addBookingForm.get('token_type_id')?.value;
              if (tokenTypeId && tokenTypeId !== 'null') {
                this.loadTokens(effectiveProjectId, tokenTypeId);
              }
            })
          );
        })
      )
      .subscribe();

    // ⚡ Reactive token type changes
    this.addBookingForm
      .get('token_type_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter((tokenTypeId) => tokenTypeId !== null && tokenTypeId !== 'null'),
        switchMap((tokenTypeId) => {
          const projectId = this.addBookingForm.get('project_id')?.value;
          if (!projectId) return EMPTY;
          return this.loadTokens(projectId, tokenTypeId);
        })
      )
      .subscribe();
  }

  // ⚡ Performance: Load projects with caching (uses user_project_dropdown endpoint)
  private loadProjects(): void {
    const userId = this.userId;
    this.isLoading.set(true);

    // Calls user_project_dropdown endpoint via bookingService.fetchProjects()
    this.bookingService
      .fetchProjects(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (projects: Project[]) => {
          this.projectsList.set(projects);
        },
        error: () => {
          this.showError('Unable to fetch projects.');
        },
      });
  }

  // ⚡ Performance: Load booking from dropdown (cached)
  private loadBookingFromDropdown(): void {
    this.bookingService
      .fetchBookingFromDropdown()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items: BookingFrom[]) => {
          this.allBookingDropdown.set(items);
        },
        error: () => {
          this.showError('Unable to fetch booking from options.');
        },
      });
  }

  // ⚡ Performance: Load tokens
  private loadTokens(projectId: number | string, tokenTypeId: number | string | null): Observable<TokenItem[]> {
    return this.bookingService.fetchTokens(projectId, tokenTypeId).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((tokens: TokenItem[]) => {
        this.allTokenNolist.set(tokens);
      }),
      catchError(() => {
        this.showError('Unable to fetch token list.');
        return of([]);
      })
    );
  }

  // ⚡ Handle Token Booking initialization
  private handleTokenBooking(): void {
    if (!this.tokenElementData?.project_id) return;

    this.shouldMaintainState = true;
    const projectId = this.tokenElementData.project_id as number;
    const tokenTypeId = this.tokenElementData.token_type_id as number;
    const tokenId = this.tokenElementData.token_id as number;

    const { token_id, ...otherData } = {
      user_id: this.tokenElementData.user_id as number,
      project_id: projectId,
      sales_executive_id: this.roleId === 7 ? this.userId : (this.tokenElementData.sales_executive_id as number),
      booking_from_id: 1,
      token_type_id: tokenTypeId,
      token_id: tokenId,
    };

    this.initialPatchData = { ...otherData, token_id };

    // Patch everything EXCEPT token_id first
    this.addBookingForm.patchValue(otherData, { emitEvent: false });

    // Apply validators manually since emitEvent is false
    this.applyValidatorsForBookingFrom(1);

    // ⚡ Manually load dependencies to control the order and patch token_id after tokens are loaded
    combineLatest([
      this.bookingService.fetchSalesExecutives(projectId),
      this.bookingService.fetchEnquiries(projectId),
      this.bookingService.fetchTokenTypes(projectId),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([salesExecutives, enquiries, tokenTypes]) => {
          this.allSalesExecutive.set(salesExecutives);
          this.allEnquiryData.set(enquiries);
          this.allTokenType.set(tokenTypes);

          // Now load tokens and patch token_id
          if (tokenTypeId) {
            this.loadTokens(projectId, tokenTypeId).subscribe(() => {
              // ⚡ Emit event to trigger form validation status update
              this.addBookingForm.patchValue({ token_id: tokenId }, { emitEvent: true });

              // ⚡ Auto-submit for non-admin roles
              if (this.roleId !== 2) {
                queueMicrotask(() => {
                  if (this.addBookingForm.valid) {
                    this.submitFirstData();
                  }
                });
              }
            });
          }
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  // ⚡ Handle Enquiry Booking initialization
  private handleEnquiryBooking(): void {
    if (!this.elementData?.project_id) return;

    this.shouldMaintainState = true;
    this.initialPatchData = {
      user_id: this.elementData.user_id as number,
      project_id: this.elementData.project_id as number,
      sales_executive_id: this.roleId === 7 ? this.userId : (this.elementData.sales_executive_id as number),
      booking_from_id: 2,
      project_enq_id: this.elementData.project_enq_id as number,
    };

    this.addBookingForm.patchValue(this.initialPatchData, { emitEvent: false });
    // Apply validators manually since emitEvent is false
    this.applyValidatorsForBookingFrom(2);
    this.loadDependentData(this.elementData.project_id as number);

    // ⚡ Disable fields for EnquiryBooking (non-admin)
    if (this.roleId !== 2) {
      this.disableEnquiryBookingFields();
      queueMicrotask(() => {
        if (this.addBookingForm.valid) {
          this.submitFirstData();
        }
      });
    }
  }

  // ⚡ Performance: Load all dependent data in parallel
  private loadDependentData(projectId: number): void {
    combineLatest([
      this.bookingService.fetchSalesExecutives(projectId),
      this.bookingService.fetchEnquiries(projectId),
      this.bookingService.fetchTokenTypes(projectId),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([salesExecutives, enquiries, tokenTypes]: [SalesExecutive[], EnquiryItem[], TokenType[]]) => {
          this.allSalesExecutive.set(salesExecutives);
          this.allEnquiryData.set(enquiries);
          this.allTokenType.set(tokenTypes);

          // Load tokens if needed
          const tokenTypeId = this.addBookingForm.get('token_type_id')?.value;
          if (tokenTypeId && tokenTypeId !== 'null') {
            this.loadTokens(projectId, tokenTypeId);
          }
        },
      });
  }

  // ⚡ Disable enquiry booking fields
  private disableEnquiryBookingFields(): void {
    const fieldsToDisable = [
      'project_id',
      'sales_executive_id',
      'booking_from_id',
      'project_enq_id',
      'booking_date',
    ];

    fieldsToDisable.forEach((field) => {
      this.addBookingForm.get(field)?.disable({ emitEvent: false });
    });
  }

  // ⚡ Fetch single booking
  private fetchSingleBooking(bookingId: number): Observable<void> {
    this.isLoading.set(true);
    return this.bookingService.fetchSingleBooking(bookingId).pipe(
      finalize(() => this.isLoading.set(false)),
      tap((response) => {
        if (response.success && response.data) {
          const data = response.data;
          this.bookingInfo.set(data);
          this.tokenID.set(data.token_id as number || 0);

          // Format dates for form
          const formatToDate = (date: unknown): string | null => {
            if (!date) return null;
            try {
              return new Date(date as string).toISOString().split('T')[0];
            } catch {
              return null;
            }
          };

          const formattedData = {
            ...data,
            anniversary_date: formatToDate(data['anniversary_date']),
            booking_date: formatToDate(data['booking_date']) || this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
            cheque_date: formatToDate(data['cheque_date']),
            dob: formatToDate(data['dob']),
          };

          this.addBookingForm.patchValue(formattedData, { emitEvent: false });
        }
      }),
      map(() => void 0),
      catchError(() => {
        this.showError('Unable to fetch booking details.');
        return of(void 0);
      })
    );
  }

  // ⚡ Submit first booking data
  submitFirstData(): void {
    if (this.isSubmitting() || !this.addBookingForm.valid) return;

    const formValue = this.addBookingForm.getRawValue();
    const bookingData: CreateBookingPayload = {
      project_id: formValue.project_id!,
      sales_executive_id: formValue.sales_executive_id!,
      booking_date: formValue.booking_date!,
      booking_from_id: formValue.booking_from_id!,
      created_by: this.userId,
    };

    // Conditionally add fields based on booking_from_id
    if (formValue.booking_from_id == 1) {
      bookingData.token_type_id = formValue.token_type_id!;
      bookingData.token_id = formValue.token_id!;
    } else if (formValue.booking_from_id == 2) {
      bookingData.project_enq_id = formValue.project_enq_id!;
    }

    this.isSubmitting.set(true);

    this.bookingService
      .createBooking(bookingData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response: { success: boolean; booking_id?: number; data?: BookingInfo; message?: string }) => {
          if (response.success && response.booking_id) {
            // Set bookingID immediately so bookingDataForCalculations has the correct value
            this.bookingID.set(response.booking_id);

            // Set bookingInfo if data is available
            if (response.data) {
              this.bookingInfo.set(response.data);
            }

            if (this.shouldMaintainState && this.initialPatchData) {
              const newFormData = {
                ...this.initialPatchData,
                ...response.data,
                booking_id: response.booking_id,
              };
              this.initialPatchData = newFormData;
              this.addBookingForm.patchValue(newFormData, { emitEvent: false });
            }
            this.router.navigate(['/add-bookings', response.booking_id]);
          } else {
            this.showError(response.message || 'Failed to process booking.');
          }
        },
        error: () => {
          this.showError('Failed to process booking.');
        },
      });
  }

  // ⚡ Event handlers
  onApplicantBooked(booked: boolean): void {
    this.isApplicantAdded.set(booked);
  }

  onPaymentAdded(booked: boolean): void {
    this.isPaymentAdded.set(booked);
  }

  onApplicantSaveSuccess(): void {
    if (this.calculationComponent) {
      this.calculationComponent.fetchAllAgreementPercentage();
    }
  }

  // ⚡ Performance: TrackBy functions for *ngFor optimization
  trackByProjectId(_index: number, item: Project): number {
    return item.project_id;
  }

  trackByTokenTypeId(_index: number, item: TokenType): number {
    return item.token_type_id;
  }

  trackByTokenId(_index: number, item: TokenItem): number {
    return item.token_id;
  }

  trackByEnquiryId(_index: number, item: EnquiryItem): number {
    return item.project_enq_id;
  }

  trackBySalesExecutiveId(_index: number, item: SalesExecutive): number {
    return item.user_id;
  }

  trackByBookingFromId(_index: number, item: BookingFrom): number {
    return item.booking_from_id;
  }

  // ⚡ Helper method for error handling
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  // ⚡ Getters for template access (form controls trigger change detection automatically)
  get bookingFromIdValue(): number | string | null {
    return this.addBookingForm.get('booking_from_id')?.value ?? null;
  }

  get bookingIdValue(): number {
    return this.bookingID();
  }
}
