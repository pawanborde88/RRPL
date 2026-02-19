
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
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { SectionHeadingComponent } from '../../../Common/section-heading/section-heading.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { PermissionService } from '../../../Service/permission.service';



@Component({
  selector: 'app-add-role-permissions',
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
  templateUrl: './add-role-permissions.component.html',
  styleUrl: './add-role-permissions.component.scss'
})
export class AddRolePermissionsComponent {
  pipe = new DatePipe('en-US');

  // URls
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  storageUrl = environment.STORAGE_URL;
  loadingState: boolean = false;

  roleId = sessionStorage.getItem('role_id');

  ngOnInit(): void {
    this.fetchAllRolePermission();
    this.fetchAllRoles();
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private permissionApi: PermissionService
  ) {}

  addPermissionForm = new FormGroup({
    account_id: new FormControl(sessionStorage.getItem('account_id')),
    active_status_id: new FormControl('', [Validators.required]),
    permission_id: new FormControl(''),
    role_id: new FormControl(),
    valid_from: new FormControl(''),
    valid_till: new FormControl(''),
    created_by: new FormControl(sessionStorage.getItem('session_id')),




  });

  // atLeastOneRequired() {
  //   const moduleName = this.addPermissionForm.get('module_name')?.value;
  //   const parentModule =this.addPermissionForm.get('parent_module')?.value;

  //   return moduleName || parentModule ? null : { atLeastOneRequired: true };
  // }

  RolePermission: any;
  fetchAllRolePermission() {
    this.permissionApi.fetchAllRolePermission().subscribe({
      next: (res: any) => {
        this.RolePermission = res;
        console.log(res.message);
      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open('Unable to fetch Role Permissions.');
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

  onSubmit() {
    let obj = this.addPermissionForm.value;
    obj['valid_from'] = this.pipe.transform(this.addPermissionForm.value['valid_from'], 'yyyy-MM-dd')!;
    obj['valid_till'] = this.pipe.transform(this.addPermissionForm.value['valid_till'], 'yyyy-MM-dd')!;


    console.log(obj);
    this.http.post(`${this.baseUrl}/assign_permissions_to_role`, obj).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.success) {
          this.snackBar.open('role Permission added');
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
