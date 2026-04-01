import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { CommonService } from '../../../../../Service/common/common.service';
import { TagPlaceholderStore } from '../../tag-placeholder.store';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-add-edit-email-template-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    AutocompleteReusableComponent,
    QuillModule
  ],
  templateUrl: './add-edit-email-template-dialog.html',
  styleUrl: './add-edit-email-template-dialog.scss',
})
export class AddEditEmailTemplateDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  public readonly dialogRef = inject(MatDialogRef<AddEditEmailTemplateDialog>);
  private readonly data = inject(MAT_DIALOG_DATA);
  private readonly snackBar = inject(MatSnackBar);
  private readonly store = inject(TagPlaceholderStore);
  private readonly commonService = inject(CommonService);

  private readonly baseUrl = environment.API_URL;

  emailForm!: FormGroup;
  isEdit = false;
  isLoading = false;

  readonly modules = this.store.modules;
  projects = this.commonService.fetchUserProjectDropdown();

  ngOnInit(): void {
    this.isEdit = !!(this.data?.row && this.data.row.email_template_setup_id);
    this.initForm();
  }

  private initForm(): void {
    this.emailForm = this.fb.group({
      module_id: [this.data?.row?.module_id || null, Validators.required],
      project_id: [this.data?.row?.project_id || null, Validators.required],
      subject: [this.data?.row?.subject || '', Validators.required],
      body: [this.data?.row?.body || '', Validators.required],
    });
  }

  onSave(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const payload: any = {
      ...this.emailForm.value
    };

    if (this.isEdit) {
      payload.email_template_setup_id = this.data.row.email_template_setup_id;
      payload.updated_by = Number(sessionStorage.getItem('session_id')) || 1;
    } else {
      payload.created_by = Number(sessionStorage.getItem('session_id')) || 1;
    }

    const endpoint = this.isEdit
      ? 'update_email_template'
      : 'add_email_template';

    this.http.post(`${this.baseUrl}/${endpoint}`, payload)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.showSnackBar(
              this.isEdit
                ? 'Email Template updated successfully'
                : 'Email Template added successfully'
            );
            this.dialogRef.close(true);
          } else {
            this.showSnackBar(res?.message || 'Something went wrong');
          }
        },
        error: () => {
          this.showSnackBar('Internal Server Error');
        }
      });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000
    });
  }
}
