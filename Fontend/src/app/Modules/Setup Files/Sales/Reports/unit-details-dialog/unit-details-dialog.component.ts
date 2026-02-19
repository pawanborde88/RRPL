import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { 
  ChangeDetectionStrategy, 
  Component, 
  computed, 
  DestroyRef, 
  inject, 
  signal 
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { AngularMaterialModule } from '../../../../../../angular-material.module';

interface UnitDetails extends Record<string, any> {
  project_name?: string;
  wing_name?: string;
  floor_unit?: string;
  unit_type?: string;
  flat_type?: string;
  floor_order?: string | number;
  floor_no?: string | number;
  floor_sanctioned_status?: string;
  booking_status?: string;
  ownership?: string;
  landowner_name?: string;
  unit_id?: string | number;
  carpet_sqft?: number;
  carpet_sqm?: number;
  balcony_sqft?: number;
  balcony_sqm?: number;
  garden_sqft?: number;
  garden_sqm?: number;
  enclosed_balcony_sqft?: number;
  enclosed_balcony_sqm?: number;
  dry_balcony_sqft?: number;
  dry_balcony_sqm?: number;
  terrace_sqft?: number;
  terrace_sqm?: number;
  mezzanine_sqft?: number;
  mezzanine_sqm?: number;
  loft_area_sqft?: number;
  loft_area_sqm?: number;
  sitout_area_sqft?: number;
  sitout_area_sqm?: number;
  total_carpet_area_sqft?: number;
  total_carpet_area_sqm?: number;
  parking_avail?: string;
  package_total?: number;
  booking_details?: BookingDetails;
  recovery_deatils?: RecoveryDetails;
  token_deatils?: TokenDetails;
}

interface BookingDetails extends Record<string, any> {
  booking_date?: string;
  package_total?: number;
  booking_amount?: string | number;
  payment_mode?: string;
  transaction_no?: string;
  transaction_date?: string;
  sales_executive_name?: string;
  basic_cost?: string | number;
  agreement_cost?: string | number;
  idc?: string | number;
  gst?: string | number;
  gst_per?: string | number;
  stamp_duty?: string | number;
  reg?: string | number;
  reg_per?: string | number;
  carpet?: string | number;
  rate?: string | number;
  floor_rise_amt?: string | number;
  society_for?: string;
  ocr?: string | number;
  applicant_name1?: string;
  applicant_name2?: string;
  applicant_name3?: string;
  remark?: string;
}

interface RecoveryDetails extends Record<string, any> {
  package_total?: number;
  installment_received?: string | number;
  installment_pending?: string | number;
}

interface TokenDetails extends Record<string, any> {
  token_no?: string;
  token_type?: string;
  sales_executive_name?: string;
}

interface ApiResponse {
  success: boolean;
  data: UnitDetails[];
}

@Component({
  selector: 'app-unit-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    AngularMaterialModule,
  ],
  templateUrl: './unit-details-dialog.component.html',
  styleUrl: './unit-details-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitDetailsDialogComponent {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly dialogRef = inject(MatDialogRef<UnitDetailsDialogComponent>);
  protected readonly data = inject<{ floor_unit_id?: number }>(MAT_DIALOG_DATA);

  private readonly baseUrl = environment.API_URL;

  // Signals for reactive state management
  private readonly unitDetailsList = signal<UnitDetails[]>([]);
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  // Computed signal for the current unit details (first item in list)
  protected readonly unitDetails = computed<UnitDetails>(() => {
    const list = this.unitDetailsList();
    return list.length > 0 ? list[0] : ({} as UnitDetails);
  });

  // Computed signal to check if booking details exist
  protected readonly hasBookingDetails = computed(() => 
    !!this.unitDetails()?.booking_details
  );

  // Computed signal to check if recovery details exist
  protected readonly hasRecoveryDetails = computed(() => 
    !!this.unitDetails()?.recovery_deatils
  );

  // Computed signal to check if token details exist
  protected readonly hasTokenDetails = computed(() => 
    !!this.unitDetails()?.token_deatils
  );

  constructor() {
    // Initialize data fetch on component construction
    const floorUnitId = this.data?.floor_unit_id;
    if (floorUnitId) {
      this.fetchFloorUnits(floorUnitId);
    } else {
      this.loading.set(false);
    }
  }

  private fetchFloorUnits(floorUnitId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.post<ApiResponse>(
      `${this.baseUrl}/fetch_floor_unit_info`, 
      { floor_unit_id: floorUnitId }
    ).pipe(
      map((response: ApiResponse) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('Invalid response format');
        }
        return response.data;
      }),
      catchError((error) => {
        console.error('Error fetching floor units:', error);
        this.error.set('Unable to fetch unit details.');
        this.snackBar.open('Unable to fetch unit details.', 'Close', {
          duration: 3000,
        });
        return of([]);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.unitDetailsList.set(data);
        this.loading.set(false);
      }
    });
  }

  // Format currency in Indian format
  protected formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined || amount === '' || amount === '-') {
      return '-';
    }
  
    const numAmount = typeof amount === 'string' ? Number(amount) : amount;
  
    if (isNaN(numAmount)) {
      return '-';
    }
  
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  }
  
  // Format area in SqFt / Sqm
  protected formatArea(sqft: number | null | undefined, sqm: number | null | undefined): string {
    const sqftVal = sqft ?? 0;
    const sqmVal = sqm ?? 0;
    
    if (sqftVal === 0 && sqmVal === 0) {
      return '-';
    }
    
    return `${sqftVal} SqFt / ${sqmVal} Sqm`;
  }

  // Get formatted applicants list
  protected getApplicantsList(): string {
    const applicant1 = this.unitDetails()?.booking_details?.applicant_name1;
    const applicant2 = this.unitDetails()?.booking_details?.applicant_name2;
    const applicant3 = this.unitDetails()?.booking_details?.applicant_name3;
    
    const applicants = [applicant1, applicant2, applicant3]
      .filter(name => name && name.trim() !== '')
      .map(name => name!.trim().replace(/\s+/g, ' ')); // Normalize multiple spaces to single space
    
    return applicants.length > 0 ? applicants.join(', ') : '-';
  }

  // Get individual applicant by number
  protected getApplicant(num: number): string {
    const bookingDetails = this.unitDetails()?.booking_details;
    if (!bookingDetails) return '-';
    
    let applicantName: string | undefined;
    
    switch(num) {
      case 1:
        applicantName = bookingDetails.applicant_name1;
        break;
      case 2:
        applicantName = bookingDetails.applicant_name2;
        break;
      case 3:
        applicantName = bookingDetails.applicant_name3;
        break;
      default:
        return '-';
    }
    
    if (!applicantName || applicantName.trim() === '') {
      return '-';
    }
    
    // Normalize multiple spaces to single space and trim
    return applicantName.trim().replace(/\s+/g, ' ');
  }
}
