
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
import { TemplateComponent } from '../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';
import { PermissionService } from '../../../Service/permission.service';




@Component({
  selector: 'app-add-permission',
  standalone: true,
  imports: [
    AngularMaterialModule,
    TemplateComponent,
    BreadcrumbComponent,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './add-permission.component.html',
  styleUrl: './add-permission.component.scss',
})
export class AddPermissionComponent {
  pipe = new DatePipe('en-US');

  // URls
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  storageUrl = environment.STORAGE_URL;
  loadingState: boolean = false;

  roleId = sessionStorage.getItem('role_id');

  ngOnInit(): void {
    this.fetchAllModules();
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private permissionApi: PermissionService
  ) { }

  addPermissionForm = new FormGroup({
    module_id: new FormControl('', [Validators.required]),
    sub_module_id: new FormControl(''),
    permission_code: new FormControl(''),
    permission_name: new FormControl(''),
    active_status_id: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    account_id: new FormControl(sessionStorage.getItem('account_id')),
    created_by: new FormControl(sessionStorage.getItem('session_id')),
  });

  // atLeastOneRequired() {
  //   const moduleName = this.addPermissionForm.get('module_name')?.value;
  //   const parentModule =this.addPermissionForm.get('parent_module')?.value;

  //   return moduleName || parentModule ? null : { atLeastOneRequired: true };
  // }

  modulesList: any;
  fetchAllModules() {
    this.permissionApi.fetchAllModules().subscribe({
      next: (res: any) => {
        this.modulesList = res.data;
        console.log(res.message);
      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open('Unable to fetch District.');
      },
      complete: () => { },
    });
  }
  subModulesList: any;
  fetchSubModules(event: any) {
    this.permissionApi.fetchSubModules(event.value).subscribe({
      next: (res: any) => {
        this.subModulesList = res.data;
        console.log(res.data);
      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open('Unable to fetch Sub Module.');
      },
      complete: () => { },
    });
  }

  onSubmit() {


    const moduleID = this.addPermissionForm.controls['sub_module_id'].value ? this.addPermissionForm.controls['sub_module_id'].value : this.addPermissionForm.controls['module_id'].value;

    let obj = {
      permission_name: this.addPermissionForm.controls['permission_name'].value,
      permission_code: this.addPermissionForm.controls['permission_code'].value,
      module_id: moduleID,
      description: this.addPermissionForm.controls['description'].value,
      active_status_id: this.addPermissionForm.controls['active_status_id'].value,
      created_by: sessionStorage.getItem('session_id')

    }
    console.log(obj);
    this.http.post(`${this.baseUrl}/add_permission`, obj).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.success) {
          this.snackBar.open('Permission added');
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
