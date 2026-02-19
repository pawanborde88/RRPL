import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { AmountDirective } from '../../../../../Common/Amount Direcitve/amount.directive';
import {
  BookingService,
  AddBookingPaymentPayload,
  PaymentMode,
  Bank,
} from '../../../../../Service/booking.service';

interface PaymentFormValue {
  booking_date: string | null;
  booking_amount: string | null;
  bank_details: string | null;
  payment_mode_id: number | null;
  cheque_date: string | null;
  cheque_no: string | null;
  bank_name_id: number | null;
  created_by: number | null;
  booking_id: number | null;
  updated_by: number;
}

@Component({
  selector: 'app-add-payments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    AmountDirective,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-payments.component.html',
  styleUrl: './add-payments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPaymentsComponent {
  // ============================================================================
  // Dependency Injection
  // ============================================================================
  private readonly bookingService = inject(BookingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private datePipe: DatePipe = new DatePipe('en-US');
  // ============================================================================
  // Inputs & Outputs
  // ============================================================================
  @Input({ required: false }) bookingId: number | undefined;
  @Output() isPaymentAdded = new EventEmitter<boolean>();

  // ============================================================================
  // Signals
  // ============================================================================
  private readonly bookingIdSignal = signal<number | undefined>(undefined);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly isSubmittingSignal = signal<boolean>(false);
  private readonly hasPaymentBeenAddedSignal = signal<boolean>(false);

  // ============================================================================
  // Computed Signals
  // ============================================================================
  readonly isAddPaymentDisabled = computed(() => 
    this.isSubmittingSignal() || this.isLoadingSignal() || this.hasPaymentBeenAddedSignal()
  );

  readonly buttonText = computed(() => 
    this.hasPaymentBeenAddedSignal() ? 'Payment Added' : 'Add Payment'
  );

  readonly buttonIcon = computed(() => 
    this.hasPaymentBeenAddedSignal() ? 'check_circle' : 'payments'
  );

  readonly minDate = computed(() => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - 7);
    return minDate;
  });

  readonly maxDate = computed(() => new Date());

  // ============================================================================
  // Observable to Signal Conversions
  // ============================================================================
  readonly paymentModes = toSignal(
    this.bookingService.fetchPaymentModes().pipe(
      catchError(() => {
        this.snackBar.open('Failed to load payment modes', 'Close', { duration: 3000 });
        return EMPTY;
      })
    ),
    { initialValue: [] as PaymentMode[] }
  )!;

  readonly banks = toSignal(
    this.bookingService.fetchBanks().pipe(
      catchError(() => {
        this.snackBar.open('Failed to load banks', 'Close', { duration: 3000 });
        return EMPTY;
      })
    ),
    { initialValue: [] as Bank[] }
  )!;

  // ============================================================================
  // Form
  // ============================================================================
  readonly addBookingPaymentForm = new FormGroup<{
    booking_date: FormControl<string | null>;
    booking_amount: FormControl<string | null>;
    bank_details: FormControl<string | null>;
    payment_mode_id: FormControl<number | null>;
    cheque_date: FormControl<string | null>;
    cheque_no: FormControl<string | null>;
    bank_name_id: FormControl<number | null>;
    created_by: FormControl<number | null>;
    booking_id: FormControl<number | null>;
    updated_by: FormControl<number | null>;
  }>({
    booking_date: new FormControl(this.getFormattedDate(new Date())),
    booking_amount: new FormControl<string | null>(null, Validators.required),
    bank_details: new FormControl<string | null>(null),
    payment_mode_id: new FormControl<number | null>(null, Validators.required),
    cheque_date: new FormControl(this.getFormattedDate(new Date())),
    cheque_no: new FormControl<string | null>(null, Validators.required),
    bank_name_id: new FormControl<number | null>(null),
    created_by: new FormControl<number | null>(null),
    booking_id: new FormControl<number | null>(null),
    updated_by: new FormControl<number | null>(this.getUserId()),
  });

  // ============================================================================
  // Effects
  // ============================================================================
  constructor() {
    // Watch for bookingId changes and load payment details
    effect(() => {
      const bookingId = this.bookingIdSignal();
      if (bookingId) {
        this.loadBookingPaymentDetails(bookingId);
      }
    }, { allowSignalWrites: true });
  }

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================
  ngOnChanges(changes: { bookingId?: { currentValue: number | undefined } }): void {
    if (changes['bookingId']?.currentValue !== undefined) {
      this.bookingIdSignal.set(changes['bookingId'].currentValue);
      this.addBookingPaymentForm.patchValue({ booking_id: changes['bookingId'].currentValue });
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================
  addPayment(): void {
    if (this.addBookingPaymentForm.invalid || this.isSubmittingSignal()) {
      return;
    }

    const bookingId = this.bookingIdSignal();
    if (!bookingId) {
      this.snackBar.open('Booking ID is required', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmittingSignal.set(true);
    const formValue = this.addBookingPaymentForm.getRawValue();

    const payload: AddBookingPaymentPayload = {
      booking_amount: formValue.booking_amount?.toString() || '0',
      payment_mode: formValue.payment_mode_id ?? null,
      transaction_no: formValue.cheque_no || '',
      transaction_date: formValue.cheque_date 
        ? this.datePipe.transform(formValue.cheque_date, 'yyyy-MM-dd') || null
        : null,
      booking_id: bookingId,
      bank_id: formValue.bank_name_id ?? null,
      created_by: this.getUserId(),
      bank_details: formValue.bank_details || null,
    };

    this.bookingService
      .addBookingPayment(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success || response.message) {
            this.dialog.open(SuccessDialogComponent, {
              data: { message: response.message || 'Payment added successfully' },
            });
            this.isPaymentAdded.emit(true);
            this.hasPaymentBeenAddedSignal.set(true);
          }
          this.isSubmittingSignal.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to add payment', 'Close', { duration: 3000 });
          this.isSubmittingSignal.set(false);
        },
      });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================
  private loadBookingPaymentDetails(bookingId: number): void {
    this.isLoadingSignal.set(true);
    
    this.bookingService
      .fetchBookingPaymentDetails(bookingId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.isLoadingSignal.set(false)),
        catchError(() => {
          this.isLoadingSignal.set(false);
          this.snackBar.open('Failed to load payment details', 'Close', { duration: 3000 });
          return EMPTY;
        })
      )
      .subscribe((payments) => {
        if (payments && payments.length > 0) {
          const latestPayment = payments.sort(
            (a, b) => b.payment_deatil_id - a.payment_deatil_id
          )[0];

          this.addBookingPaymentForm.patchValue({
            booking_amount: latestPayment.booking_amount?.toString() || null,
            payment_mode_id: latestPayment.payment_mode,
            cheque_no: latestPayment.transaction_no,
            cheque_date: latestPayment.transaction_date,
            bank_name_id: latestPayment.bank_id,
            created_by: latestPayment.created_by,
            bank_details: latestPayment.bank_details,
          });
        }
      });
  }

  private getFormattedDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  private getUserId(): number {
    return Number(sessionStorage.getItem('session_id')) || 0;
  }
}
