import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { PermissionService } from '../../../Service/permission.service';
import { AutocompleteReusableComponent, SelectOption } from '../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

export interface AddEditUserRoleDialogData {
  mode: 'add' | 'edit';
  userRoleId?: string | number;
}

@Component({
  selector: 'app-add-edit-user-role-dialog',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AutocompleteReusableComponent
  ],
  templateUrl: './add-edit-user-role-dialog.component.html',
  styleUrl: './add-edit-user-role-dialog.component.scss',
})
export class AddEditUserRoleDialogComponent implements OnInit {
  private readonly pipe = new DatePipe('en-US');
  readonly baseUrl = environment.API_URL;
  loadingState = false;
  readonly isEditMode: boolean;

  UserList: SelectOption[] = [];
  RoleList: SelectOption[] = [];

  form = new FormGroup({
    account_id: new FormControl(sessionStorage.getItem('account_id')),
    active_status_id: new FormControl<string | null>(null, [Validators.required]),
    role_id: new FormControl(''),
    user_id: new FormControl(''),
    valid_from: new FormControl(''),
    valid_till: new FormControl(''),
    created_by: new FormControl(sessionStorage.getItem('session_id')),
    user_role_id: new FormControl<string | number | null>(null),
  });

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private permissionApi: PermissionService,
    @Inject(MAT_DIALOG_DATA) public data: AddEditUserRoleDialogData,
    private dialogRef: MatDialogRef<AddEditUserRoleDialogComponent>
  ) {
    this.isEditMode = data.mode === 'edit';
  }

  ngOnInit(): void {
    this.fetchAllUsers();
    this.fetchAllRoles();
    if (this.isEditMode && this.data.userRoleId != null) {
      this.fetchSingleUserRole();
    }
  }

  fetchAllUsers(): void {
    this.permissionApi.fetchAllUsers().subscribe({
      next: (res: any) => {
        this.UserList = Array.isArray(res) ? res : res?.data ?? [];
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Unable to fetch users.');
      },
    });
  }

  fetchAllRoles(): void {
    this.permissionApi.fetchAllRoles().subscribe({
      next: (res: any) => {
        this.RoleList = Array.isArray(res) ? res : res?.data ?? [];
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Unable to fetch roles.');
      },
    });
  }

  fetchSingleUserRole(): void {
    if (this.data.userRoleId == null) return;
    this.snackBar.open('Loading...', undefined, { duration: undefined });
    const obj = {
      user_role_id: this.data.userRoleId,
      account_id: sessionStorage.getItem('account_id'),
    };
    this.http
      .post<{
        role_id?: string | number;
        valid_from?: string;
        valid_till?: string;
        active_status_id?: string | number;
        user_role_id?: string | number;
        user_id?: string | number;
      }>(`${this.baseUrl}/fetch_assigned_role_to_single_user`, obj)
      .subscribe({
        next: (res) => {
          this.form.patchValue({
            role_id: res.role_id != null ? String(res.role_id) : '',
            valid_from: res.valid_from ?? '',
            valid_till: res.valid_till ?? '',
            active_status_id: res.active_status_id != null ? String(res.active_status_id) : null,
            user_role_id: res.user_role_id ?? null,
            user_id: res.user_id != null ? String(res.user_id) : '',
          });
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error occurred while fetching data, please try later.');
        },
        complete: () => {
          this.snackBar.dismiss();
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loadingState = true;
    const raw = this.form.getRawValue();
    const obj: Record<string, unknown> = {
      account_id: raw.account_id,
      active_status_id: raw.active_status_id,
      role_id: raw.role_id || undefined,
      user_id: raw.user_id || undefined,
      valid_from: this.pipe.transform(raw.valid_from, 'yyyy-MM-dd') ?? undefined,
      valid_till: this.pipe.transform(raw.valid_till, 'yyyy-MM-dd') ?? undefined,
      created_by: raw.created_by,
    };

    if (this.isEditMode && raw.user_role_id != null) {
      obj['user_role_id'] = raw.user_role_id;
      this.http.post(`${this.baseUrl}/update_user_role`, obj).subscribe({
        next: (res: unknown) => {
          if ((res as { success?: boolean })?.success !== false) {
            this.snackBar.open('User role updated.');
            this.dialogRef.close(true);
          } else {
            this.snackBar.open((res as { message?: string })?.message || 'Update failed.');
          }
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error occurred while updating, please try later.');
        },
        complete: () => {
          this.loadingState = false;
        },
      });
    } else {
      this.http.post(`${this.baseUrl}/assign_role_to_user`, obj).subscribe({
        next: (res: unknown) => {
          if ((res as { success?: boolean })?.success !== false) {
            this.snackBar.open('User role assigned.');
            this.dialogRef.close(true);
          } else {
            this.snackBar.open((res as { message?: string })?.message || 'Assign failed.');
          }
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error occurred while assigning, please try later.');
        },
        complete: () => {
          this.loadingState = false;
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
