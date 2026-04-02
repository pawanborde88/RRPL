import { CommonModule } from '@angular/common';
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
import { AutocompleteReusableComponent } from '../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

export interface AddEditModuleDialogData {
  mode: 'add' | 'edit';
  moduleId?: string;
}

@Component({
  selector: 'app-add-edit-module-dialog',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AutocompleteReusableComponent,

  ],
  templateUrl: './add-edit-module-dialog.component.html',
  styleUrl: './add-edit-module-dialog.component.scss',
})
export class AddEditModuleDialogComponent implements OnInit {
  baseUrl = environment.API_URL;
  loadingState = false;
  modulesList: { module_id: string; module_name: string }[] = [];

  readonly isEditMode: boolean;

  form = new FormGroup({
    module_name: new FormControl('', [Validators.required]),
    parent_module: new FormControl(''),
    module_id: new FormControl(''),
    active_status_id: new FormControl<string | null>(null, [Validators.required]),
    description: new FormControl(''),
    account_id: new FormControl(sessionStorage.getItem('account_id')),
    user_id: new FormControl(sessionStorage.getItem('session_id')),
  });

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private permissionApi: PermissionService,
    @Inject(MAT_DIALOG_DATA) public data: AddEditModuleDialogData,
    private dialogRef: MatDialogRef<AddEditModuleDialogComponent>
  ) {
    this.isEditMode = data.mode === 'edit';
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.moduleId) {
      this.fetchSingleModule();
    } else {
      this.fetchAllModules();
    }
  }

  fetchAllModules(): void {
    this.permissionApi.fetchAllModules().subscribe({
      next: (res: any) => {
        this.modulesList = res?.data ?? res ?? [];
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Unable to fetch modules.');
      },
    });
  }

  fetchSingleModule(): void {
    if (!this.data.moduleId) return;
    this.snackBar.open('Loading...', undefined, { duration: undefined });
    this.http
      .post(`${this.baseUrl}/fetch_single_module`, { module_id: this.data.moduleId })
      .subscribe({
        next: (res: any) => {
          this.form.patchValue({
            module_name: res.module_name,
            active_status_id: res.active_status_id != null ? String(res.active_status_id) : null,
            description: res.description ?? '',
            module_id: res.module_id,
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
    const payload: Record<string, unknown> = {
      module_name: raw.module_name,
      active_status_id: raw.active_status_id,
      description: raw.description ?? '',
      account_id: raw.account_id,
      user_id: raw.user_id,
    };
    if (this.isEditMode) {
      payload['module_id'] = raw.module_id;
    } else if (raw.parent_module) {
      payload['parent_module'] = raw.parent_module;
    }

    const apiUrl = this.isEditMode ? 'update_module' : 'add_module';
    this.http.post(`${this.baseUrl}/${apiUrl}`, payload).subscribe({
      next: (res: any) => {
        if (res?.success !== false) {
          this.snackBar.open(this.isEditMode ? 'Module updated.' : 'Module added.');
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res?.message || 'Operation failed.');
        }
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error occurred, please try later.');
      },
      complete: () => {
        this.loadingState = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
