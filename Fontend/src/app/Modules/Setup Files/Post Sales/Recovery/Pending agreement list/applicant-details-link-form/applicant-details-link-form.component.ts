import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { environment } from '../../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FetchFunctionsService } from '../../../../../../Service/fetch-functions.service';
import { MatDatepicker } from '@angular/material/datepicker';
import { catchError, of } from 'rxjs';
import { SuccessDialogComponent } from '../../../../../../Common/success-dialog/success-dialog.component';
import { AadharcardNoformatDirective } from '../../../../../../Common/directives/Aadhar/aadharcard-noformat.directive';
import { PANNoDirective } from '../../../../../../Common/directives/panno.directive';
interface BookingData {
  booking_date: string;
  project_id: number;
  wing_id: number;
  source_id: number;
  unit_id: number;
  project_name: string;
  project_logo: string;
  wing_name: string;
  source: string;
  floor_unit: string | null;
}
@Component({
  selector: 'app-applicant-details-link-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AadharcardNoformatDirective,
    PANNoDirective
  ],
  templateUrl: './applicant-details-link-form.component.html',
  styleUrl: './applicant-details-link-form.component.scss',
})
export class ApplicantDetailsLinkFormComponent implements OnInit {
  domainUrl = environment.domainUrl;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  bookingdata: BookingData | null = null;
  loading = false;
  roleId: number | null = Number(sessionStorage.getItem('role_id')) || null;
  userId: number | null = Number(sessionStorage.getItem('session_id')) || null;
  applicantSlug: string | null = null;
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const slug = params['slug'];
     this.applicantSlug = slug;
      if (slug) {
        this.fetchSingleApplicant(slug);
        this.fetchApplicants(slug);
        this.addApplicants();
        this.fetchAllOccupations();
        this.fetchSalutationDropdown();
      }
    });
  }

  fetchSingleApplicant(item: string): void {
    this.loading = true;
    this.http
      .post<{ data: BookingData }>(`${this.baseUrl}/fetch_booking_details`, {
        slug: item,
      })
      .subscribe({
        next: (res:any) => {
          this.bookingdata = res;
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('Unable to fetch project details.', 'Close', {
            duration: 3000,
          });
          this.loading = false;
        },
      });
  }

  getFormattedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
  pipe = new DatePipe('en-US');

  allOccupations: any[] = [];
  salutationDropdown: any[] = [];
  bookingInfo: any;

  // Add these to your component class
  dobPickers: MatDatepicker<any>[] = [];
  anniversaryPickers: MatDatepicker<any>[] = [];
  addUnitBankerForm = new FormGroup({
    project_id: new FormControl(this.userId, Validators.required),
    wing_id: new FormControl('', Validators.required),
    unit_id: new FormControl('', Validators.required), // renamed from unit_no
  });

  @ViewChildren('dobPicker') set dobPickerList(
    pickers: QueryList<MatDatepicker<any>>
  ) {
    this.dobPickers = pickers.toArray();
  }

  @ViewChildren('anniversaryPicker') set anniversaryPickerList(
    pickers: QueryList<MatDatepicker<any>>
  ) {
    this.anniversaryPickers = pickers.toArray();
  }

  getDobPicker(index: number): MatDatepicker<any> {
    return this.dobPickers[index];
  }

  getAnniversaryPicker(index: number): MatDatepicker<any> {
    return this.anniversaryPickers[index];
  }
  addBookingForm = new FormGroup({
    applicants: new FormArray([]),
  });

  fetchApplicants(item: any): void {
    this.http
      .post(`${this.baseUrl}/fetch_applicants`, {
        slug: item,
      })
      .subscribe({
        next: (res: any) => {
          // Get the booking_id from the first applicant (assuming it's the same for all)
          const bookingId = res.length > 0 ? res[0].booking_id : null;

          // Ensure we have at least 4 applicant forms (create if needed)
          while (this.applicants.length < 4) {
            const newForm = this.createApplicantForm();
            if (bookingId) {
              newForm.patchValue({ booking_id: bookingId });
            }
            this.applicants.push(newForm);
          }

          // Patch data only for the applicants we received from API
          res.data.forEach(
            (
              applicantData: {
                applicant_id: any;
                booking_id: any;
                salutation_id: any;
                first_name: any;
                middle_name: any;
                alternate_mobile_no: any;
                whatsapp_no: any;
                last_name: any;
                occupation_id: any;
                mobile_no: any;
                email: any;
                pan_no: any;
                aadhar_no: any;
                dob: any;
                anniversary_date: any;
                current_address: any;
                permanent_address: any;
              },
              index: number
            ) => {
              if (index < 4) {
                // Safety check to not exceed our 4 applicant limit
                this.applicants.at(index).patchValue({
                  applicant_id: applicantData.applicant_id || null,
                  booking_id: applicantData.booking_id || bookingId || null, // Use the specific one if available, fallback to common one
                  alternate_mobile_no:
                    applicantData.alternate_mobile_no || null,
                  salutation_id: applicantData.salutation_id || null,
                  first_name: applicantData.first_name || '',
                  middle_name: applicantData.middle_name || '',
                  last_name: applicantData.last_name || '',
                  pan_no: applicantData.pan_no || '',
                  whatsapp_no: applicantData.whatsapp_no || '',
                  aadhar_no: applicantData.aadhar_no || '',
                  occupation_id: applicantData.occupation_id || null,
                  mobile_no: applicantData.mobile_no || '',
                  email_id: applicantData.email || '',
                  dob: applicantData.dob || '',
                  anniversary_date: applicantData.anniversary_date || '',
                  current_address: applicantData.current_address || '',
                  permanent_address: applicantData.permanent_address || '',
                });
              }
            }
          );

          // Clear any remaining forms beyond what we received from API
          for (let i = res.length; i < 4; i++) {
            this.applicants.at(i).reset();
            if (bookingId) {
              this.applicants.at(i).patchValue({ booking_id: bookingId });
            }
          }
        },
        error: (err) => {
          console.error('Error fetching applicant details:', err);
          this.snackBar.open('Unable to fetch applicant details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  
  createApplicantForm(): FormGroup {
    return new FormGroup({
      applicant_id: new FormControl(null), // Add this line
      booking_id: new FormControl(null),
      salutation_id: new FormControl(null),
      first_name: new FormControl('', Validators.required),
      middle_name: new FormControl(''),
      last_name: new FormControl('', Validators.required),
      occupation_id: new FormControl(null),
      mobile_no: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d{10}$/),
      ]),
      alternate_mobile_no: new FormControl('', [
        Validators.pattern(/^\d{10}$/),
      ]),
      pan_no: new FormControl('', [Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]),

      whatsapp_no: new FormControl('', [Validators.pattern(/^\d{10}$/)]),
      email_id: new FormControl('', [Validators.required, Validators.email]),
  
      aadhar_no: new FormControl(''),
      dob: new FormControl(''),
      anniversary_date: new FormControl(''),
      current_address: new FormControl(''),
      permanent_address: new FormControl(''),
    });
  }
  // Check if the first applicant form is valid
  isFirstApplicantValid(): boolean {
    if (this.applicants.length === 0) return false;
    const firstApplicant = this.applicants.at(0);
    return firstApplicant.valid;
  }

  updateAllApplicants(): void {
    // Validate first applicant
    if (!this.isFirstApplicantValid()) {
      this.applicants.at(0).markAllAsTouched();
      this.snackBar.open('Please fill all required fields for Applicant 1', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Mark all fields as touched to show validation errors
    this.applicants.controls.forEach((control) => {
      control.markAllAsTouched();
    });

    // Get the common booking_id from the first applicant
    const commonBookingId =
      this.applicants.length > 0
        ? this.applicants.at(0).value.booking_id
        : null;

    const applicantsData = this.applicants.controls
      .filter((control) => control.value.first_name || control.value.last_name)
      .map((control) => {
        const formValue = control.value;
        return {
          applicant_id: formValue.applicant_id || null,
          booking_id: formValue.booking_id || commonBookingId || null, // Fallback to common booking_id
          first_name: formValue.first_name,
          middle_name: formValue.middle_name || '',
          last_name: formValue.last_name,
          salutation_id: formValue.salutation_id || null,
          occupation_id: formValue.occupation_id || null,
          mobile_no: formValue.mobile_no,
          alternate_mobile_no: formValue.alternate_mobile_no || '',
          whatsapp_no: formValue.whatsapp_no || '',
          email: formValue.email_id,
          pan_no: formValue.pan_no || '',
          aadhar_no: formValue.aadhar_no || '',
          dob: this.formatDate(formValue.dob),
          anniversary_date: this.formatDate(formValue.anniversary_date),
          current_address: formValue.current_address || '',
          permanent_address: formValue.permanent_address || '',
          updated_by: this.userId,
        };
      });

    if (applicantsData.length === 0) {
      this.snackBar.open('No applicant data to update', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.loading = true;
    this.http
      .post(`${this.baseUrl}/update_applicant`, applicantsData)
      .subscribe({
        next: (res: any) => {
          this.dialog.open(SuccessDialogComponent, {
            data: { message: res.message },
            
          });
          if (this.applicantSlug) {
            this.fetchSingleApplicant(this.applicantSlug);
            this.fetchApplicants(this.applicantSlug);
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error updating applicants:', err);
          this.snackBar.open('Failed to update applicants', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  get applicants(): FormArray {
    return this.addBookingForm.get('applicants') as FormArray;
  }

  addApplicants(): void {
    const applicantArray = this.applicants;
    applicantArray.clear();

    for (let i = 0; i < 4; i++) {
      applicantArray.push(this.createApplicantForm());
    }
  }

  private formatDate(date: any): string | null {
    return date ? this.pipe.transform(date, 'yyyy-MM-dd')! : null;
  }
  fetchAllOccupations(): void {
    this.http
      .get(`${this.baseUrl}/occupation_dropdown`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching occupations:', error);
          return of([]);
        })
      )
      .subscribe((res: any) => {
        this.allOccupations = res || [];
      });
  }

  fetchSalutationDropdown(): void {
    this.http
      .get(`${this.baseUrl}/salutation_dropdown`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching salutations:', error);
          return of([]);
        })
      )
      .subscribe((res: any) => {
        this.salutationDropdown = res || [];
      });
  }
}
