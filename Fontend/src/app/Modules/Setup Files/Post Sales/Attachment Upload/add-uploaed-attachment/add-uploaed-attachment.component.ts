import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, EMPTY, finalize, map, of } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { AllUploadedAttachmentComponent } from '../all-uploaded-attachment/all-uploaded-attachment.component';
import { ReceiptsService, type Project, type Wing, type Unit, type DocMaster } from '../../Recovery/Recipts/receipts.service';

interface AttachmentFormValue {
  project_unit_attachment_id: number | null;
  project_id: number | null;
  wing_id: number | null;
  floor_unit_id: number | null;
  attachment_type_id: number | null;
  created_by: number;
  attachment: File | null;
}

@Component({
  selector: 'app-add-uploaed-attachment',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    AllUploadedAttachmentComponent,
  ],
  templateUrl: './add-uploaed-attachment.component.html',
  styleUrl: './add-uploaed-attachment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddUploaedAttachmentComponent {
  private readonly receiptsService = inject(ReceiptsService);
  private readonly dialogRef = inject(MatDialogRef<AddUploaedAttachmentComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly data = inject<{ row: any }>(MAT_DIALOG_DATA, { optional: true });

  private readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  @ViewChild('attachmentList') attachmentList!: AllUploadedAttachmentComponent;

  // Signals for reactive state management
  readonly loading = signal<boolean>(false);
  readonly projects = signal<Project[]>([]);
  readonly wings = signal<Wing[]>([]);
  readonly units = signal<Unit[]>([]);
  readonly docMasters = signal<DocMaster[]>([]);
  readonly existingFileName = signal<string | null>(null);
  private readonly skipReset = signal<boolean>(false);

  // Form with proper typing
  readonly form = new FormGroup({
    project_unit_attachment_id: new FormControl<number | null>(null),
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null, Validators.required),
    floor_unit_id: new FormControl<number | null>(null, Validators.required),
    attachment_type_id: new FormControl<number | null>(null, Validators.required),
    created_by: new FormControl<number>(this.userId),
    attachment: new FormControl<File | null>(null),
  });

  // Computed signals for reactive dependencies
  readonly selectedProjectId = toSignal(
    this.form.get('project_id')!.valueChanges,
    { initialValue: null }
  );

  readonly selectedWingId = toSignal(
    this.form.get('wing_id')!.valueChanges,
    { initialValue: null }
  );

  // Reactive form validation state
  readonly isFormValid = computed(() => this.form.valid);

  // Computed signal for selected file name
  readonly selectedFileName = computed(() => {
    const file = this.form.get('attachment')?.value;
    return file instanceof File ? file.name : null;
  });

  constructor() {
    this.initializeData();
    this.setupReactiveFormDependencies();
  }

  private initializeData(): void {
    // Load initial data
    this.loading.set(true);

    combineLatest([
      this.receiptsService.fetchUserProjects(this.userId).pipe(
        catchError(() => {
          this.showError('Unable to fetch projects.');
          return EMPTY;
        })
      ),
      this.receiptsService.fetchDocMasters().pipe(
        catchError(() => {
          this.showError('Unable to fetch attachment types.');
          return EMPTY;
        })
      ),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([projects, docMasters]) => {
          this.projects.set(projects);
          this.docMasters.set(docMasters);
          this.loading.set(false);

          // If editing, patch data after initial load
          if (this.data?.row) {
            this.patchData(this.data.row);
          }
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  private patchData(row: any): void {
    this.skipReset.set(true);

    // Manually trigger loads before patching to ensure lists are populated (or will be)
    // Note: The effects will trigger loads when we patch IDs, but we need skipReset true during that.
    // However, the lists need to be populated for the values to show correctly in dropdowns?
    // Actually, setting value works even if list empty, but display might be weak until list loads.

    // We rely on the effects to call loadWings/fetchUnits. 
    // We just keep skipReset = true for a bit.

    this.form.patchValue({
      project_unit_attachment_id: row.project_unit_attachment_id,
      project_id: row.project_id,
      wing_id: row.wing_id,
      floor_unit_id: row.floor_unit_id || row.unit_id, // check which one is used
      attachment_type_id: row.attachment_type_id,
      created_by: this.userId
    });

    if (row.attachment) {
      this.existingFileName.set(row.attachment); // Or document_name if that's the display name
    }

    // Reset the flag after a short delay to allow effects to run without wiping data
    setTimeout(() => {
      this.skipReset.set(false);
    }, 500);
  }

  private setupReactiveFormDependencies(): void {
    // React to project selection changes
    effect(() => {
      const projectId = this.selectedProjectId();
      if (projectId) {
        this.loadWings(projectId);
        // Reset dependent fields only if not skipping reset (e.g. during patching)
        if (!this.skipReset()) {
          this.form.patchValue({ wing_id: null, floor_unit_id: null }, { emitEvent: false });
        }
      } else {
        this.wings.set([]);
        this.units.set([]);
      }
    }, { allowSignalWrites: true });

    // React to wing selection changes
    effect(() => {
      const projectId = this.selectedProjectId();
      const wingId = this.selectedWingId();
      if (projectId && wingId) {
        this.fetchUnits(projectId, wingId);
        // Reset dependent field only if not skipping reset
        if (!this.skipReset()) {
          this.form.patchValue({ floor_unit_id: null }, { emitEvent: false });
        }
      } else {
        this.units.set([]);
      }
    }, { allowSignalWrites: true });
  }

  private loadWings(projectId: number): void {
    this.receiptsService
      .fetchWings(projectId)
      .pipe(
        catchError(() => {
          this.showError('No wings available for selection.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((wings) => {
        this.wings.set(wings);
      });
  }

  private fetchUnits(projectId: number, wingId: number): void {
    if (!projectId || !wingId) return;

    this.loading.set(true);
    this.receiptsService
      .fetchUnits(projectId, wingId)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.snackBar.open('Unable to fetch units.', 'Close', {
            duration: 3000,
          });
          return of({ data: [] });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        const units = (response.data || []).map((item: Unit) => ({
          ...item,
          full_name: `${item.floor_unit} - ${item.applicant_name}`,
        }));
        this.units.set(units);
      });
  }


  onTabChange(event: MatTabChangeEvent): void {
    if (event.index === 1 && this.attachmentList) {
      this.attachmentList.fetchAllAttachments();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.showError('Please fill all required fields');
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value as AttachmentFormValue;
    const formData = this.buildFormData(formValue);

    this.loading.set(true);

    this.receiptsService
      .uploadUnitAttachment(formData)
      .pipe(
        catchError((error) => {
          this.showError(error.error?.message || 'Failed to upload attachment');
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.form.reset({ created_by: this.userId });
          this.dialog.open(SuccessDialogComponent, {
            data: { message: response.message || 'Attachment uploaded successfully' },
          });
        },
      });
  }

  private buildFormData(formValue: AttachmentFormValue): FormData {
    const formData = new FormData();

    formData.append(
      'project_unit_attachment_id',
      formValue.project_unit_attachment_id?.toString() || 'null'
    );
    formData.append('project_id', formValue.project_id?.toString() || '');
    formData.append('wing_id', formValue.wing_id?.toString() || '');
    formData.append('floor_unit_id', formValue.floor_unit_id?.toString() || '');
    formData.append('attachment_type_id', formValue.attachment_type_id?.toString() || '');
    formData.append('created_by', formValue.created_by?.toString() || '');

    if (formValue.attachment) {
      formData.append('attachment', formValue.attachment);
    }

    return formData;
  }

  onFileChange(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.form.get(field)?.setValue(file);
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
