


import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, forkJoin, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { AddressCardViewComponent } from '../Employee Details/Address/address-card-view/address-card-view.component';
import { CoverLetterCardViewComponent } from '../Employee Details/Cover Letter/cover-letter-card-view/cover-letter-card-view.component';
import { EducationCardViewComponent } from '../Employee Details/Education/education-card-view/education-card-view.component';
import { ExperianceCardViewComponent } from '../Employee Details/Experiance Section/experiance-card-view/experiance-card-view.component';
import { ViewCardFamilyDetailsComponent } from '../Employee Details/Family Details/view-card-family-details/view-card-family-details.component';
import { LanguagesCardViewComponent } from '../Employee Details/Language Section/languages-card-view/languages-card-view.component';
import { ResumeCardViewComponent } from '../Employee Details/Resume/resume-card-view/resume-card-view.component';
import { SkillCardViewComponent } from '../Employee Details/Skill Section/skill-card-view/skill-card-view.component';


@Component({
  selector: 'app-edit-employee',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    TemplateComponent,
    BreadcrumbComponent,
    AddressCardViewComponent,
    ResumeCardViewComponent,
    CoverLetterCardViewComponent,
    EducationCardViewComponent,
    LanguagesCardViewComponent,
    SkillCardViewComponent,
    ViewCardFamilyDetailsComponent,
    ExperianceCardViewComponent,
  ],

  templateUrl: './edit-employee.component.html',
  styleUrl: './edit-employee.component.scss',
})
export class EditEmployeeComponent {

  employeeId: any;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  Products: any[] = [];
  designationList: any[] = [];
  employeeTypes: any[] = [];
  managerList: any[] = [];
  RoleList: any[] = [];
  logoSet: boolean = false;

  photoName: string = '';
  departmentList: any[] = [];
  statusList: any[] = [];
  genderList: any[] = [];
  selectedFile: File | null = null;
  PartnerLogoPath = 'assets/Images/avatar.png';
  activeStatus: any = [];

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

  loadingState: boolean = false;
  isEmpIdReadonly: boolean = false; // Default value
  roleId: string | null = null;

  editEmployeeForm = new FormGroup({
    account_id: new FormControl(sessionStorage.getItem('account_id')),
    created_by: new FormControl(sessionStorage.getItem('session_id')),
    emp_photo: new FormControl(),
    emp_id: new FormControl('', [Validators.required]),
    first_name: new FormControl('', [Validators.required]),
    last_name: new FormControl('', [Validators.required]),
    active_status_id: new FormControl('', [Validators.required]),
    gender: new FormControl('', [Validators.required]),
    date_of_birth: new FormControl('', [Validators.required]),
    role_id: new FormControl('', [Validators.required]),
    loan_type_id: new FormControl(''),
    employee_id: new FormControl(''),
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
    official_email: new FormControl('', [Validators.email]),
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
    private route: ActivatedRoute,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('role_id');
    this.isEmpIdReadonly = this.roleId !== '10';
    this.route.paramMap.subscribe((params) => {
      this.employeeId = params.get('id');
      this.fetchEmployeeData(this.employeeId);
      this.fetchAllData();
      this.fetchProductTypes();
    });
  }

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
  fetchEmployeeData(employeeId: number): void {
    const requestData = {
      employee_id: employeeId,
      account_id: sessionStorage.getItem('account_id'),
    };

    this.http
      .post(`${this.baseUrl}/fetch_single_employee`, requestData)
      .subscribe({
        next: (res: any) => {
          console.log('Employee Details: ', res);
          this.editEmployeeForm.patchValue({
            role_id: res.role_id,
            first_name: res.first_name,
            last_name: res.last_name,
            loan_type_id: res.loan_type_id,
            emp_id: res.emp_id,
            emp_photo: res.emp_photo,
            description: res.description,
            designation_id: res.designation_id,
            employee_type_id: res.employee_type_id,
            reporting_manager_id: res.reporting_manager_id,
            reporting_manager: res.reporting_manager,
            department: res.department,
            permanent_address: res.permanent_address,
            current_address: res.current_address,
            join_date: res.join_date,
            exit_date: res.exit_date,
            exit_reason: res.exit_reason,
            anniversary_date: res.anniversary_date,
            blood_group: res.blood_group,
            allergy: res.allergy,
            qualification: res.qualification,
            bank_name: res.bank_name,
            branch: res.branch,
            ifsc_no: res.ifsc_no,
            account_no: res.account_no,
            phone: res.phone,
            alternate_phone: res.alternate_phone,
            official_email: res.official_email,
            personal_email: res.personal_email,
            emergency_contact_person: res.emergency_contact_person,
            emergency_contact_no: res.emergency_contact_no,
            relation: res.relation,
            aadhaar_no: res.aadhaar_no,
            perm_add_pin: res.perm_add_pin,
            perm_add_city: res.perm_add_city,
            curr_add_pin: res.curr_add_pin,
            curr_add_city: res.curr_add_city,
            state: res.state,
            country: res.country,
            education_doc: res.education_doc,
            work_exp: res.work_exp,
            certificates: res.certificates,
            letters: res.letters,
            other: res.other,
            pan_no: res.pan_no,
            active_status_id: res.active_status_id,
            gender: res.gender,

            date_of_birth: res.date_of_birth,
          });

          console.log(this.editEmployeeForm.value);
          console.log('Form values patched successfully.');
        },
        error: (error) => {
          console.error('Error: ', error);
        },
        complete: () => {
          console.log('Employee data fetching complete.');
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
        this.editEmployeeForm.get(controlName)?.setValue(file);
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
    this.editEmployeeForm.get(controlName)?.setValue(null);
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
  onSubmit(): void {
    const formData = new FormData();
    Object.keys(this.editEmployeeForm.value).forEach((key) => {
      const value =
        this.editEmployeeForm.value[
          key as keyof typeof this.editEmployeeForm.value
        ];
      formData.append(key, value);
    });
    if (this.selectedFile) {
      formData.append('emp_photo', this.selectedFile, this.selectedFile.name);
    } else {
      formData.append(
        'emp_photo',
        this.editEmployeeForm.get('emp_photo')?.value
      );
    }
    formData.append('employee_id', this.employeeId);

    this.http.post(`${this.baseUrl}/edit_employee`, formData).subscribe({
      next: (res: any) => {
        this.snackBar.open('Employee Update Successfully', '', {
          duration: 3000,
        });
        console.log('Employee updated successfully:', res);
      },
      error: (error) => {
        console.error('Error updating employee:', error);
      },
      complete: () => {
        console.log('Employee update process completed.');
      },
    });
  }
}
