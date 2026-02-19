
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
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { SectionHeadingComponent } from '../../../Common/section-heading/section-heading.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { FetchFunctionsService } from '../../../Service/fetch-functions.service';



@Component({
  selector: 'app-edit-permission',
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
  templateUrl: './edit-permission.component.html',
  styleUrl: './edit-permission.component.scss'
})
export class EditPermissionComponent {
  pipe = new DatePipe('en-US');

  // URls
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  storageUrl = environment.STORAGE_URL;
  loadingState: boolean = false;

  roleId = sessionStorage.getItem('role_id');
  constructor(private http: HttpClient,  private router: Router, private snackBar: MatSnackBar, private _activatedRoute: ActivatedRoute, private fetch: FetchFunctionsService) { }

  ngOnInit(): void {
    this.fetchSingleModule();
  }


  editPermissionForm = new FormGroup({
    module_name: new FormControl(''),
    active_status_id: new FormControl(null ,[Validators.required]),
    description: new FormControl(''),
    permission_name:  new FormControl(''),
    permission_id:  new FormControl(''),
    permission_code : new FormControl(''),
    account_id: new FormControl(sessionStorage.getItem('account_id')),
    updated_by: new FormControl(sessionStorage.getItem('session_id')),
  });

  permissionId:any;
    fetchSingleModule() {

      this.snackBar.open('Loading...', undefined, { duration: undefined });
      this._activatedRoute.paramMap.subscribe((params: any) => {
        this.permissionId = params.get('id')!;
        let obj = { permission_id: this.permissionId};

        this.http.post(`${this.baseUrl}/fetch_single_permission`, obj)
          .subscribe({
            next: (res: any) => {
              this.editPermissionForm.patchValue({
                module_name:res.module_name,
                active_status_id: res.active_status_id,
                description: res.description,
                permission_name:  res.permission_name,
                permission_code : res.permission_code ,
                permission_id: res.permission_id



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
    let obj = {...this.editPermissionForm.value}
    console.log(obj);
    this.http.post(`${this.baseUrl}/update_permission`, obj).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.success) {
          this.snackBar.open('Module Updated');
        }
      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open(
          'Error occurred while adding user, please try later'
        );
      },
      complete: () => {
        this.router.navigate(['/setup/permission']);
      },
    });
  }
}
