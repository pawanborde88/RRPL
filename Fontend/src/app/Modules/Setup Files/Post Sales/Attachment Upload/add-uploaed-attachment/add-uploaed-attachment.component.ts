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
import { catchError, combineLatest, distinctUntilChanged, EMPTY, finalize, map, of } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
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

  // Reactive form validation state
  readonly isFormValid = computed(() => this.form.valid);

  // Computed signal for selected file name
  readonly selectedFileName = computed(() => {
    const file = this.form.get('attachment')?.value;
    return file instanceof File ? file.name : null;
  });

  constructor() {
    this.initializeData();
  }

  private initializeData(): void {
    this.loading.set(true);

    combineLatest([
      this.receiptsService.fetchUserProjects(this.userId).pipe(
        catchError(() => {
          this.showError('Unable to fetch projects.');
          return of([]);
        })
      ),
      this.receiptsService.fetchDocMasters().pipe(
        catchError(() => {
          this.showError('Unable to fetch attachment types.');
          return of([]);
        })
      ),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([projects, docMasters]) => {
          this.projects.set(projects);
          this.docMasters.set(docMasters);
          this.loading.set(false);

          this.setupReactiveFormDependencies();

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
    if (!row) return;

    this.skipReset.set(true);

    const projectId = row.project_id || row.projectId;
    const wingId = row.wing_id || row.wingId;
    const unitId = row.floor_unit_id || row.unit_id || row.booking_unit_id || row.booking_id;
    const attachmentTypeId = row.attachment_type_id || row.attachmentTypeId || row.doc_master_id;

    console.log('Patching data:', { projectId, wingId, unitId, attachmentTypeId, row });

    // 1. Patch initial fields
    this.form.patchValue({
      project_unit_attachment_id: row.project_unit_attachment_id,
      project_id: projectId ? Number(projectId) : null,
      attachment_type_id: attachmentTypeId ? Number(attachmentTypeId) : null,
      created_by: this.userId
    });

    if (row.attachment) {
      this.existingFileName.set(row.attachment);
    } else if (row.document_name) {
      this.existingFileName.set(row.document_name);
    }

    // 2. Load wings and patch wing_id
    if (projectId) {
      this.receiptsService.fetchWings(Number(projectId))
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((wings) => {
          this.wings.set(wings);
          if (wingId) {
            this.form.patchValue({ wing_id: Number(wingId) });

            // 3. Load units and patch floor_unit_id
            this.receiptsService.fetchUnits(Number(projectId), Number(wingId))
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((response) => {
                const units = (response.data || []).map((item: Unit) => ({
                  ...item,
                  full_name: `${item.floor_unit} - ${item.applicant_name}`,
                }));
                this.units.set(units);
                if (unitId) {
                  this.form.patchValue({ floor_unit_id: Number(unitId) });
                }

                // Finalize patching
                setTimeout(() => this.skipReset.set(false), 500);
              });
          } else {
            this.skipReset.set(false);
          }
        });
    } else {
      this.skipReset.set(false);
    }
  }

  private setupReactiveFormDependencies(): void {
    // Project selection changes
    this.form.get('project_id')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((projectId) => {
        if (projectId && !this.skipReset()) {
          this.loadWings(Number(projectId));
          this.form.patchValue({ wing_id: null, floor_unit_id: null }, { emitEvent: false });
        } else if (!projectId) {
          this.wings.set([]);
          this.units.set([]);
        }
      });

    // Wing selection changes
    this.form.get('wing_id')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((wingId) => {
        const projectId = this.form.get('project_id')?.value;
        if (projectId && wingId && !this.skipReset()) {
          this.fetchUnits(Number(projectId), Number(wingId));
          this.form.patchValue({ floor_unit_id: null }, { emitEvent: false });
        } else if (!wingId) {
          this.units.set([]);
        }
      });
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
          const dialogSuccess = this.dialog.open(SuccessDialogComponent, {
            data: { message: response.message || 'Attachment uploaded successfully' },
          });
          dialogSuccess.afterClosed().subscribe(() => {
            this.dialogRef.close(true);
          });
        },
      });
  }

  private buildFormData(formValue: AttachmentFormValue): FormData {
    const formData = new FormData();

    if (formValue.project_unit_attachment_id) {
      formData.append('project_unit_attachment_id', formValue.project_unit_attachment_id.toString());
    }
    
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
