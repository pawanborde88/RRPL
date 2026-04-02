

import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, forkJoin, tap } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ChangeProfilePictureDialogComponent } from '../Employee Details/Profile/change-profile-picture-dialog/change-profile-picture-dialog.component';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    TemplateComponent,
    BreadcrumbComponent,
    // EmployeeDetailsComponent
  ],
  templateUrl: './add-employee.component.html',
  styleUrl: './add-employee.component.scss',
})
export class AddEmployeeComponent {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  designationList: any[] = [];
  employeeTypes: any[] = [];
  managerList: any[] = [];
  RoleList: any[] = [];
  logoSet: boolean = false;
  profilePicture: string = '';
  dummyImagePath: string = 'assets/Images/avatar.png';
  photoName: string = '';
  departmentList: any[] = [];
  statusList: any[] = [];
  pipe = new DatePipe('en-US');
  genderList: any[] = [];
  selectedFile: File | null = null;
  PartnerLogoPath = 'assets/Images/avatar.png';
  activeStatus: any = [];
  loadingState: boolean = true;
  loading = false;

  previewUrl: string | ArrayBuffer | null = null;
  previewEducationDocUrl: string | ArrayBuffer | null = null;
  previewCertificateUrl: string | ArrayBuffer | null = null;
  previewLetterUrl: string | ArrayBuffer | null = null;
  previewOtherUrl: string | ArrayBuffer | null = null;

  uploadedEducationDocName: string | null = null;
  uploadedCertificateName: string | null = null;
  uploadedLetterName: string | null = null;
  uploadedOtherName: string | null = null;

  uploadedEducationDocUrl: string | null = null;
  uploadedCertificateUrl: string | null = null;
  uploadedLetterUrl: string | null = null;
  uploadedOtherUrl: string | null = null;

  employeeForm = new FormGroup({
    account_id: new FormControl(sessionStorage.getItem('account_id')),
    created_by: new FormControl(sessionStorage.getItem('session_id')),
    emp_photo: new FormControl(),
    emp_id: new FormControl('', [ Validators.required]),
    first_name: new FormControl('', [ Validators.required]),
    last_name: new FormControl('', [ Validators.required]),
    active_status_id: new FormControl('' , [ Validators.required]),
    gender: new FormControl('', [ Validators.required]),
    date_of_birth: new FormControl('', [ Validators.required]),
    role_id: new FormControl('', [ Validators.required]),
    loan_type_id: new FormControl(''),


    description: new FormControl(''),
    designation_id: new FormControl(null),
    employee_type_id: new FormControl(null),
    reporting_manager_id: new FormControl(null),
    reporting_manager: new FormControl(null),
    department: new FormControl(null),
    permanent_address: new FormControl(''),
    current_address: new FormControl(''),
    join_date: new FormControl(''),
    exit_date: new FormControl(''),
    exit_reason: new FormControl(''),
    anniversary_date: new FormControl(''),
    blood_group: new FormControl(''),
    allergy: new FormControl(''),
    qualification: new FormControl(''),
    bank_name: new FormControl(''),
    branch: new FormControl(''),
    ifsc_no: new FormControl(''),
    account_no: new FormControl(''),
    phone: new FormControl('', [Validators.pattern('^[0-9]+$')]),
    alternate_phone: new FormControl(''),
    official_email: new FormControl('', [Validators.email, Validators.required]),
    personal_email: new FormControl(''),
    emergency_contact_person: new FormControl(''),
    emergency_contact_no: new FormControl(''),
    relation: new FormControl(''),
    aadhaar_no: new FormControl('', [
      Validators.pattern('^[0-9]{12}$'),
      Validators.maxLength(12),
    ]),
    perm_add_pin: new FormControl(''),
    perm_add_city: new FormControl(''),
    curr_add_pin: new FormControl(''),
    curr_add_city: new FormControl(''),
    state: new FormControl(''),
    country: new FormControl(''),
    education_doc: new FormControl(''),
    work_exp: new FormControl(''),
    certificates: new FormControl(''),
    letters: new FormControl(''),
    other: new FormControl(''),
    pan_no: new FormControl('', [
      Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
    ]),

  });

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}
  ngOnInit(): void {
    this.fetchAllData();
    this.fetchProductTypes();
    this.fetchApplicantDetails();
  }
  fetchAllData() {
    const role_id = sessionStorage.getItem('role_id');
    const roles$ = this.http.get<any[]>(
      `${this.baseUrl}/fetch_role_for_employee`
    );
    const designation$ = this.http.get<any[]>(
      `${this.baseUrl}/designation_dropdown`
    );
    const department$ = this.http.get<any[]>(
      `${this.baseUrl}/department_dropdown`
    );
    const employeeTypes$ = this.http.get<any[]>(
      `${this.baseUrl}/employee_type_dropdown`
    );
    const gender$ = this.http.get<any[]>(`${this.baseUrl}/gender_dropdown`);
    const activeStatus$ = this.http.get<any[]>(
      `${this.baseUrl}/featch_active_statuses`
    );
    const reportingManagers$ = this.http.get<any[]>(
      `${this.baseUrl}/reporting_manager_dropdown`
    );

    // Combine all observables using forkJoin
    forkJoin({
      roles: roles$,
      designation: designation$,
      department: department$,
      employeeTypes: employeeTypes$,
      gender: gender$,
      statusList: activeStatus$,
      reportingManagers: reportingManagers$,
    })
      .pipe(
        tap(
          ({
            roles,
            designation,
            department,
            employeeTypes,
            gender,
            statusList,
            reportingManagers,
          }) => {
            // Handle successful responses
            console.log('Data fetched successfully');
            this.RoleList = roles;
            this.designationList = designation;
            this.departmentList = department;
            this.employeeTypes = employeeTypes;
            this.genderList = gender;
            this.statusList = statusList;
            this.managerList = reportingManagers;
          }
        ),
        catchError((err) => {
          // Handle error
          this.snackBar.open('Unable to fetch data.', '', {
            duration: 3000,
          });
          console.error('Error fetching data:', err);
          return []; // Return an empty array or handle error as needed
        })
      )
      .subscribe();
  }



  Products: any[] = [];
  fetchProductTypes(): void {
    this.loadingState = true;

    this.http
      .post(`${this.baseUrl}/fetch_loan_type`, {
        account_id: sessionStorage.getItem('account_id'),
      })
      .subscribe({
        next: (res: any) => {
          this.Products = res || [];
        },
        error: () => {
          this.snackBar.open('Unable to fetch Products.', '', {
            duration: 3000,
          });
        },
        complete: () => {
          this.loadingState = false;
        },
      });
  }



  onSubmit() {
    if (this.employeeForm.invalid) {
      this.snackBar.open('Please fill out all required fields with valid data.', '', {
        duration: 3000,
      });
      return;
    }

    const formData = new FormData();

    // Define date fields to format
    const dateFields = [
      'date_of_birth',
      'exit_date',
      'join_date',
      'anniversary_date',
    ];

    // Append form values
    Object.keys(this.employeeForm.controls).forEach((key) => {
      const control = this.employeeForm.get(key);
      if (control) {
        let value = control.value;

        // Format date values using DatePipe
        if (dateFields.includes(key) && value) {
          value = this.pipe.transform(value, 'yyyy-MM-dd');
        }

        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      }
    });

    // Append file values
    const fileControls = [
      'emp_photo',
      'education_doc',
      'certificates',
      'letters',
      'other',
    ];
    fileControls.forEach((controlName) => {
      const file = this.employeeForm.get(controlName)?.value as File;
      if (file && file instanceof File) {
        formData.append(controlName, file, file.name);
      }
    });

    this.loading = true; // Start the loading state

    // Submit the form data
    this.http.post(`${this.baseUrl}/add_employee`, formData).subscribe({
      next: (res: any) => {
        this.loading = false; // Stop the loading state
        if (res.success) {
          this.snackBar.open('Employee Added Successfully', '', {
            duration: 3000,
          });
          this.router.navigate(['/employee-list']); // Navigate to the employee screen
        } else {
          this.snackBar.open('Error occurred while adding Employee.', '', {
            duration: 3000,
          });
        }
      },
      error: (err: any) => {
        this.loading = false; // Stop the loading state on error
        console.log(err);
        this.snackBar.open('Error occurred while adding Employee.', '', {
          duration: 3000,
        });
      },
    });
  }



  onChangeFile(event: any, controlName: string) {
    const file = event.target.files[0];
    if (file) {
      if (file.size <= 500000) {
        // max size 500 KB
        const reader = new FileReader();

        reader.onload = () => {
          switch (controlName) {
            case 'emp_photo':
              this.previewUrl = reader.result;
              break;
            case 'education_doc':
              this.previewEducationDocUrl = reader.result;
              this.uploadedEducationDocName = file.name;
              this.uploadedEducationDocUrl = URL.createObjectURL(file);
              break;
            case 'certificates':
              this.previewCertificateUrl = reader.result;
              this.uploadedCertificateName = file.name;
              this.uploadedCertificateUrl = URL.createObjectURL(file);
              break;
            case 'letters':
              this.previewLetterUrl = reader.result;
              this.uploadedLetterName = file.name;
              this.uploadedLetterUrl = URL.createObjectURL(file);
              break;
            case 'other':
              this.previewOtherUrl = reader.result;
              this.uploadedOtherName = file.name;
              this.uploadedOtherUrl = URL.createObjectURL(file);
              break;
          }
        };

        reader.readAsDataURL(file);
        this.employeeForm.get(controlName)?.setValue(file);
      } else {
        alert('File size exceeds 500 KB.');
      }
    }
  }

  onDeleteFile(controlName: string) {
    switch (controlName) {
      case 'emp_photo':
        this.previewUrl = null;
        this.selectedFile = null;
        break;
      case 'education_doc':
        this.previewEducationDocUrl = null;
        this.uploadedEducationDocName = null;
        this.uploadedEducationDocUrl = null;
        break;
      case 'certificates':
        this.previewCertificateUrl = null;
        this.uploadedCertificateName = null;
        this.uploadedCertificateUrl = null;
        break;
      case 'letters':
        this.previewLetterUrl = null;
        this.uploadedLetterName = null;
        this.uploadedLetterUrl = null;
        break;
      case 'other':
        this.previewOtherUrl = null;
        this.uploadedOtherName = null;
        this.uploadedOtherUrl = null;
        break;
    }

    // Reset the form control value for the file
    this.employeeForm.get(controlName)?.setValue(null);
  }
  openProfilePictureDialog(): void {
    const dialogRef = this.dialog.open(ChangeProfilePictureDialogComponent, {
      // width: '400px', // Adjust the width as per your needs
      data: {
        onUploadComplete: this.fetchApplicantDetails.bind(this),
      },
    });
    dialogRef.disableClose = true;
  };

  async fetchApplicantDetails(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/fetch_single_employee`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (res: any) => {
          console.log(res);
          let response = res[0];

          if (response.profile_picture) {
            this.profilePicture = `${this.storageUrl}/${response.profile_picture}`;
            sessionStorage.setItem('profile_picture_path', this.profilePicture);
          } else {
            this.profilePicture = '';
            sessionStorage.setItem('profile_picture_path', this.profilePicture);
          }

        },
        error: (error) => {
          console.error(error);
          reject && reject();
        },
        complete: () => {
          resolve && resolve();
        }
      });
  }



}
