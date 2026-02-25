import { Component, OnInit, signal, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-add-edit-tag-placeholders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule, AutocompleteReusableComponent],
  templateUrl: './add-edit-tag-placeholders.html',
  styleUrl: './add-edit-tag-placeholders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditTagPlaceholders implements OnInit {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<AddEditTagPlaceholders>);
  public data = inject(MAT_DIALOG_DATA);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  tagForm!: FormGroup;
  isEditMode = signal(false);
  baseUrl = environment.API_URL;
  allModules = signal<any[]>([]);
  loading = signal(false);
  rowData: any = null;
  readonly userId = signal(Number(sessionStorage.getItem('session_id')) || 0);

  constructor() {
    this.initForm();
  }

  ngOnInit() {
    this.rowData = this.data?.row ? this.data.row : this.data;
    const isEdit = !!(this.rowData && this.rowData.tag_setup_id);
    this.isEditMode.set(isEdit);

    this.fetchModules();
    if (isEdit) {
      this.tagForm.patchValue(this.rowData);
    }
  }

  fetchModules() {
    this.http.get<any[]>(`${this.baseUrl}/fetch_tag_module`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.allModules.set(res || []);
        },
        error: (err) => console.error('Failed to load modules', err)
      });
  }

  initForm() {
    this.tagForm = this.fb.group({
      module_id: [''],
      tag_name: ['', Validators.required],
      colum_name: [''],
      api_name: [''],
      description: ['']
    });
  }

  onSubmit() {
    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.tagForm.value;
    const userId = this.userId();

    let request;
    if (this.isEditMode()) {
      payload.tag_setup_id = this.rowData.tag_setup_id;
      payload.updated_by = userId;
      request = this.http.post(`${this.baseUrl}/update_tag_setup`, payload);
    } else {
      payload.created_by = userId;
      request = this.http.post(`${this.baseUrl}/add_tag_setup`, payload);
    }

    request.pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snackBar.open(`Tag ${this.isEditMode() ? 'updated' : 'added'} successfully`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.snackBar.open(`Failed to ${this.isEditMode() ? 'update' : 'add'} tag`, 'Close', { duration: 3000 });
        console.error(err);
      }
    });
  }
}
