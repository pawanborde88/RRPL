

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
import { PermissionService } from '../../../Service/permission.service';





@Component({
  selector: 'app-edit-role-permissions',
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
  templateUrl: './edit-role-permissions.component.html',
  styleUrl: './edit-role-permissions.component.scss'
})
export class EditRolePermissionsComponent {
  pipe = new DatePipe('en-US');

  // URls
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  storageUrl = environment.STORAGE_URL;
  loadingState: boolean = false;

  roleId = sessionStorage.getItem('role_id');

  ngOnInit(): void {
    this.fetchAllUsers();
    this.fetchAllRoles();
    this.fetchSingleModule();
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private permissionApi: PermissionService,
    private _activatedRoute: ActivatedRoute,
  ) {}

  editPermissionForm = new FormGroup({

    account_id: new FormControl(sessionStorage.getItem('account_id')),
    active_status_id: new FormControl('', [Validators.required]),
    role_name: new FormControl(''),
    permission_name: new FormControl(),
    valid_from: new FormControl(''),
    valid_till: new FormControl(''),
    role_permission_id: new FormControl(''),
    updated_by: new FormControl(sessionStorage.getItem('session_id')),
  });



  UserList: any;
  fetchAllUsers() {
    this.permissionApi.fetchAllUsers().subscribe({
      next: (res: any) => {
        this.UserList = res;
        console.log(res.message);
      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open('Unable to fetch Roles.');
      },
      complete: () => {},
    });
  }

  RoleList: any;
  fetchAllRoles() {
    this.permissionApi.fetchAllRoles().subscribe({
      next: (res: any) => {
        this.RoleList = res;
        console.log(res.message);
      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open('Unable to fetch ROles.');
      },
      complete: () => {},
    });
  }
  permissionRoleID:any;
    fetchSingleModule() {

      this.snackBar.open('Loading...', undefined, { duration: undefined });
      this._activatedRoute.paramMap.subscribe((params: any) => {
        this.permissionRoleID = params.get('id')!;
        let obj = { role_permission_id: this.permissionRoleID, account_id: sessionStorage.getItem('account_id')};

        this.http.post(`${this.baseUrl}/fetch_assigned_permissions_to_single_role`, obj)
          .subscribe({
            next: (res: any) => {
              this.editPermissionForm.patchValue({
                role_name:res.role_name,
                valid_from:res.valid_from,
                valid_till:res.valid_till,
                active_status_id: res.active_status_id,
                permission_name: res.permission_name,
                role_permission_id: res.role_permission_id,
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
    let obj = this.editPermissionForm.value;
    obj['valid_from'] = this.pipe.transform(this.editPermissionForm.value['valid_from'], 'yyyy-MM-dd')!;
    obj['valid_till'] = this.pipe.transform(this.editPermissionForm.value['valid_till'], 'yyyy-MM-dd')!;


    console.log(obj);
    this.http.post(`${this.baseUrl}/update_assigned_permission`, obj).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.success) {
          this.snackBar.open('updated Role Permission');
        }
      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open(
          'Error occurred while adding user, please try later'
        );
      },
      complete: () => {
        this.router.navigate(['/setup/role-permission']);
      },
    });
  }
}
