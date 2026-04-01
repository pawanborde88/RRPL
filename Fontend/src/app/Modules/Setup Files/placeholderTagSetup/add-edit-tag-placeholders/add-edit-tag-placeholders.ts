import { Component, OnInit, signal, inject, ChangeDetectionStrategy, DestroyRef, viewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { distinctUntilChanged, finalize } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { TagPlaceholderStore } from '../tag-placeholder.store';

@Component({
  selector: 'app-add-edit-tag-placeholders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule, AutocompleteReusableComponent],
  templateUrl: './add-edit-tag-placeholders.html',
  styleUrl: './add-edit-tag-placeholders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditTagPlaceholders implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddEditTagPlaceholders>);
  private readonly data = inject(MAT_DIALOG_DATA);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(TagPlaceholderStore);

  private readonly baseUrl = environment.API_URL;

  readonly tagForm: FormGroup = this.fb.group({
    module_id: ['', Validators.required],
    tag_name: ['', Validators.required],
    colum_name: ['', Validators.required],
    description: ['']
  });

  readonly isEditMode = signal(false);
  readonly allModules = this.store.modules;
  readonly loading = signal(false);
  readonly columnOptions = signal<{ colum_name: string }[]>([]);
  readonly userId = signal(Number(sessionStorage.getItem('session_id')) || 0);

  private rowData: any = null;

  ngOnInit() {
    this.rowData = this.data?.row ? this.data.row : this.data;
    const isEdit = !!(this.rowData && this.rowData.tag_setup_id);
    this.isEditMode.set(isEdit);

    if (isEdit) {
      this.tagForm.patchValue(this.rowData, { emitEvent: false });
      // Wait for modules to be loaded in store if they aren't already
      // In a real production app, we might use an effect or a specific selector
      // Here we can subscribe to allModules() until it's not empty
    }

    this.listenModuleChange();

    // If modules are already loaded, we might need to trigger the initial API call for edit mode
    const checkModulesInterval = setInterval(() => {
      if (this.allModules().length > 0) {
        if (this.isEditMode() && this.rowData?.module_id) {
          const selectedModule = this.allModules().find(m => m.module_id == this.rowData.module_id);
          if (selectedModule?.api_name) {
            this.callDynamicAPI(selectedModule.api_name, selectedModule.request_data);
          }
        }
        clearInterval(checkModulesInterval);
      }
    }, 100);

    // Ensure we clear the interval on destroy
    this.destroyRef.onDestroy(() => clearInterval(checkModulesInterval));
  }

  private listenModuleChange() {
    this.tagForm.get('module_id')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((moduleId) => {
        if (!moduleId) {
          this.columnOptions.set([]);
          return;
        }

        const selectedModule = this.allModules().find(m => m.module_id == moduleId);
        if (selectedModule?.api_name) {
          this.callDynamicAPI(selectedModule.api_name, selectedModule.request_data);
        } else {
          this.columnOptions.set([]);
        }
      });
  }

  private callDynamicAPI(apiName: string, requestData: string) {
    let parsedData: any = {};
    try {
      parsedData = requestData ? JSON.parse(requestData) : {};
    } catch (error) {
      console.error('Invalid JSON in request_data', error);
      return;
    }

    this.loading.set(true);
    this.http.post(`${this.baseUrl}/${apiName}`, parsedData)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const flatResponse = this.flattenObject(response);
          const keys = Object.keys(flatResponse);
          this.columnOptions.set(keys.map(k => ({ colum_name: k })));
        },
        error: (err) => {
          console.error('Dynamic API failed', err);
          this.showSnackBar('Failed to fetch module data');
        }
      });
  }

  private flattenObject(obj: any, parentKey: string = '', result: any = {}) {
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

      const newKey = parentKey ? `${parentKey}.${key}` : key;

      if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any, index: number) => {
          if (typeof item === 'object' && item !== null) {
            this.flattenObject(item, `${newKey}[${index}]`, result);
          } else {
            result[`${newKey}[${index}]`] = item;
          }
        });
        if (obj[key].length === 0) {
          result[newKey] = [];
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
    return result;
  }

  private formatTagName(tag: string): string {
    if (!tag) return tag;
    const cleanTag = tag.replace(/^#|#$/g, '');
    return `#${cleanTag}#`;
  }

  onSubmit() {
    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = { ...this.tagForm.value };
    payload.tag_name = this.formatTagName(payload.tag_name);

    const userId = this.userId();
    const endpoint = this.isEditMode() ? 'update_tag_setup' : 'add_tag_setup';

    if (this.isEditMode()) {
      payload.tag_setup_id = this.rowData.tag_setup_id;
      payload.updated_by = userId;
    } else {
      payload.created_by = userId;
    }

    this.http.post(`${this.baseUrl}/${endpoint}`, payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.showSnackBar(`Tag ${this.isEditMode() ? 'updated' : 'added'} successfully`);
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          this.showSnackBar(`Failed to ${this.isEditMode() ? 'update' : 'add'} tag`);
          console.error(err);
        }
      });
  }

  onCancel() {
    this.dialogRef.close();
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
