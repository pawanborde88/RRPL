
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { SectionHeadingComponent } from '../../../../Common/section-heading/section-heading.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';

    @Component({
      selector: 'app-edit-credential-password',
      standalone: true,
    imports: [AngularMaterialModule, SectionHeadingComponent, CommonModule, RouterOutlet, TemplateComponent, BreadcrumbComponent, ReactiveFormsModule, RouterModule],
      templateUrl: './edit-credential-password.component.html',
      styleUrl: './edit-credential-password.component.scss'
    })
    export class EditCredentialPasswordComponent {
  pipe = new DatePipe('en-US');


  roleId = Number(sessionStorage.getItem('role_id')); // Use the new service
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  storageUrl = environment.STORAGE_URL;
  loadingState: boolean = false;
  showInviteButton: boolean = false;
  updateUserLoading: boolean = false;
  deleteButtonDisabled: boolean = true;
  showAddManagerField: boolean = false;

  credentialForm = new FormGroup({
    institute_name: new FormControl('',[Validators.required]),
    login_id: new FormControl('' ,[Validators.required]),
    password: new FormControl('' ,[Validators.required]),
    sm_name: new FormControl('' ,[Validators.required]),
    link: new FormControl(''),
    dsa_code: new FormControl(''),
    updated_by: new FormControl(sessionStorage.getItem('session_id')),
  });

  constructor(private http: HttpClient,  private router: Router, private snackBar: MatSnackBar, private _activatedRoute: ActivatedRoute, private fetch: FetchFunctionsService) { }

  ngOnInit(): void {
    this.fetchCredentialDetails();
  }
  credentialID:any;
    fetchCredentialDetails() {

      this.snackBar.open('Loading...', undefined, { duration: undefined });
      this._activatedRoute.paramMap.subscribe((params: any) => {
        this.credentialID = params.get('id')!;
        let obj = {
          credential_id: this.credentialID
        };

        this.http.post(`${this.baseUrl}/fetch_single_credentials`, obj)
          .subscribe({
            next: (res: any) => {

              this.credentialForm.patchValue({
                institute_name: res.institute_name,
                link: res.link,
                login_id: res.login_id,
                password: res.password,
                sm_name: res.sm_name,
                dsa_code: res.dsa_code,
              });

            }, error: (err: any) => {
              console.log(err);
              this.snackBar.open('Error occurred while fetching data, please try later');
            }, complete: () => {
              this.snackBar.dismiss();
            }
          })
      })
    }

    onSubmit() {
      this.updateUserLoading = true;
      let obj = {...this.credentialForm.value,
      credential_id:this.credentialID,
      updated_by:sessionStorage.getItem('session_id'),
      }

      console.log(obj);
      this.http.post(`${this.baseUrl}/edit_credentials`, obj)
        .subscribe({
          next: (res: any) => {
            console.log(res);
            if (res.success) {
              this.snackBar.open('Credentials updated');
            } else this.snackBar.open('Mobile Number is already exist');


          },
          error: (err: any) => {
            console.log(err);
            this.updateUserLoading = false;
            this.snackBar.open('Error occurred while adding user, please try later');

          },
          complete: () => {
            this.updateUserLoading = false;
            this.router.navigateByUrl('/credential');
          }
        });

    }

}
