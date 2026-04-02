import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { SectionHeadingComponent } from '../../../../Common/section-heading/section-heading.component';

@Component({
  selector: 'app-add-credential-password',
  standalone: true,
  imports: [
    AngularMaterialModule,
    SectionHeadingComponent,
    CommonModule,
    RouterOutlet,
    TemplateComponent,
    BreadcrumbComponent,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
  ],

  templateUrl: './add-credential-password.component.html',
  styleUrl: './add-credential-password.component.scss',
})
export class AddCredentialPasswordComponent {
  pipe = new DatePipe('en-US');

  // URls
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  storageUrl = environment.STORAGE_URL;
  loadingState: boolean = false;

  roleId = sessionStorage.getItem('role_id');

  ngOnInit(): void {}

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  credentialForm = new FormGroup({
    institute_name: new FormControl('',[Validators.required]),
    login_id: new FormControl('' ,[Validators.required]),
    password: new FormControl('' ,[Validators.required]),
    sm_name: new FormControl('' ,[Validators.required]),
    link: new FormControl(''),
    dsa_code: new FormControl(''),
    created_by: new FormControl(sessionStorage.getItem('session_id')),
  });

  onSubmit() {
    let obj = this.credentialForm.value;
    console.log(obj);
    this.http.post(`${this.baseUrl}/add_credentials`, obj).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.success) {
          this.snackBar.open('User added');
        } else this.snackBar.open('Mobile Number is already exist');
      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open(
          'Error occurred while adding user, please try later'
        );
      },
      complete: () => {
        this.router.navigateByUrl('/credential');
      },
    });
  }
}
