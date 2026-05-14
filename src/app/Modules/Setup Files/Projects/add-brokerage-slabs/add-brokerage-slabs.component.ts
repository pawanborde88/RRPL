import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { BrokerageSlabStore } from './add-brokerage-slabs.state';

@Component({
  selector: 'app-add-brokerage-slabs',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  providers: [BrokerageSlabStore, DatePipe],
  templateUrl: './add-brokerage-slabs.component.html',
  styleUrl: './add-brokerage-slabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddBrokerageSlabsComponent implements OnInit {
  // Dependency Injection using inject()
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<AddBrokerageSlabsComponent>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);
  readonly store = inject(BrokerageSlabStore);
  readonly data = inject(MAT_DIALOG_DATA);

  // State
  private readonly baseUrl = environment.API_URL;
  readonly roleId = Number(sessionStorage.getItem('role_id'));
  readonly userId = Number(sessionStorage.getItem('session_id'));

  // Forms
  addBrokerageSlabsList: FormGroup[] = [];

  ngOnInit(): void {
    this.store.loadBaseData(this.userId);
    this.initForms();
    this.setupProjectChangeListeners();
  }

  private initForms(): void {
    this.addBrokerageSlabsList = [];
    if (this.data?.rowData?.brokerage_slab_id) {
      this.addNewForm(this.data.rowData);
    } else {
      this.addNewForm();
    }

    if (this.data.projectid) {
      this.store.loadProjectData(this.data.projectid);
    }
  }

  private setupProjectChangeListeners(): void {
    // Listen to the first form's project change to reload project-specific data
    const firstForm = this.addBrokerageSlabsList[0];
    firstForm?.get('project_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectID) => {
        const id = projectID || this.data.projectid;
        if (id) {
          this.store.loadProjectData(id);
        }
      });
  }

  addNewForm(rowData: any = null): void {
    const form = new FormGroup({
      user_id: new FormControl(this.userId),
      phase_id: new FormControl(rowData?.phase_id || this.data?.phaseID || null),
      project_config_id: new FormControl(
        rowData?.project_config_id
          ? (Array.isArray(rowData.project_config_id) ? rowData.project_config_id : [rowData.project_config_id])
          : [],

      ),
      project_id: new FormControl(rowData ? rowData.project_id : (this.data.projectid || null), [Validators.required]),
      wing_id: new FormControl(rowData?.wing_id || null,),
      cp_type_id: new FormControl(rowData?.cp_type_id || this.data.cpTypeID || null),
      valid_from: new FormControl(rowData?.valid_from || null, [Validators.required]),
      valid_till: new FormControl(rowData?.valid_till || null, [Validators.required]),
      brokerage_slab_from: new FormControl(rowData?.brokerage_slab_from || null, [Validators.required]),
      retro_type_id: new FormControl(rowData?.retro_type_id === 1),
      brokerage_slab_to: new FormControl(rowData?.brokerage_slab_to || null, [Validators.required]),
      brokerage_unit_id: new FormControl(rowData?.brokerage_unit_id || null, [Validators.required]),
      value: new FormControl(rowData?.value || null, [Validators.required]),
      value_unit_id: new FormControl(rowData?.value_unit_id || null, [Validators.required]),
      extra_bonus: new FormControl(rowData?.extra_bonus || null),
      deal_value: new FormControl(null),
      active_status_id: new FormControl(rowData?.active_status_id ?? 1, [Validators.required]),
      brokerage_type_id: new FormControl(rowData?.brokerage_type_id || null, [Validators.required]),
    });

    this.addBrokerageSlabsList.push(form);
  }

  removeForm(index: number): void {
    if (this.addBrokerageSlabsList.length > 1) {
      this.addBrokerageSlabsList.splice(index, 1);
    }
  }

  isFormInvalid(): boolean {
    return this.addBrokerageSlabsList.some(f => f.invalid);
  }

  onSubmit(): void {
    if (this.addBrokerageSlabsList.some(f => f.invalid)) {
      this.snackBar.open('Please fill all required fields.', 'Close', { duration: 3000 });
      return;
    }

    const { apiUrl, successMessage, project_config_id } = this.data;
    const formData = new FormData();
    const isUpdate = !!this.data?.rowData?.brokerage_slab_id;

    this.addBrokerageSlabsList.forEach((form, index) => {
      const vals = form.value;

      // Handle non-array numeric/string fields
      const simpleKeys = [
        'user_id', 'phase_id', 'project_id', 'wing_id',
        'extra_bonus', 'cp_type_id', 'brokerage_type_id'
      ];

      simpleKeys.forEach(key => {
        if (vals[key] != null && vals[key] !== '') {
          formData.append(key, vals[key].toString());
        }
      });

      // Special cases
      formData.append('retro_type_id', vals.retro_type_id ? '1' : '0');

      if (project_config_id) {
        formData.append('project_config_id', project_config_id.toString());
      } else if (vals.project_config_id?.length) {
        // If it's an array and not update, handle indexing if needed, but usually it's just passed
        vals.project_config_id.forEach((id: any) => formData.append('project_config_id', id.toString()));
      }

      if (isUpdate) {
        formData.append('brokerage_slab_id', this.data.rowData.brokerage_slab_id.toString());
        formData.append('updated_by', this.userId.toString());
      }

      // Dates
      ['valid_from', 'valid_till'].forEach(key => {
        if (vals[key]) {
          const dateStr = this.datePipe.transform(new Date(vals[key]), 'yyyy-MM-dd');
          if (dateStr) formData.append(key, dateStr);
        }
      });

      // Dynamic keys (indexed for bulk add, non-indexed for update)
      const indexedKeys = ['brokerage_slab_from', 'brokerage_slab_to', 'brokerage_unit_id', 'value', 'value_unit_id', 'active_status_id'];
      indexedKeys.forEach(key => {
        const value = vals[key];
        const fieldName = isUpdate ? key : `${key}[${index}]`;
        if (value != null && value !== '') {
          formData.append(fieldName, value.toString());
        } else {
          formData.append(fieldName, '');
        }
      });
    });

    this.http.post(`${this.baseUrl}/${apiUrl}`, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.dialog.open(SuccessDialogComponent, {
            data: { status: res.success, message: res.message || successMessage }
          });
          if (res.success) this.dialogRef.close(true);
        },
        error: () => this.snackBar.open('Operation failed. Please try again.', 'Close', { duration: 3000 })
      });
  }
}
