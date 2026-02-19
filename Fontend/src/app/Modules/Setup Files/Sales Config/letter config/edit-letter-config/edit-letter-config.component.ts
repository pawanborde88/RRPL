import { Component, computed, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, filter, Observable, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Components
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

// Modules
import { AngularMaterialModule } from '../../../../../../angular-material.module';

// Service
import { 
  LetterConfigService, 
  LetterType, 
  Project, 
  Wing, 
  PreferredBank 
} from '../../../../../Service/letter-config.service';

// Interfaces
interface LetterConfigForm {
  letter_type_id: FormControl<number | null>;
  wing_id: FormControl<number | null>;
  effective_date: FormControl<string | null>;
  project_id: FormControl<number | null>;
  bank_id: FormControl<number | null>;
  letter_config_id: FormControl<number | null>;
  html_file: FormControl<File | null>;
  word_file: FormControl<File | null>;
  updated_by: FormControl<number | null>;
  created_by: FormControl<number | null>;
}

@Component({
  selector: 'app-edit-letter-config',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent
  ],
  providers: [DatePipe],
  templateUrl: './edit-letter-config.component.html',
  styleUrls: ['./edit-letter-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditLetterConfigComponent {
  // Services
  private readonly letterConfigService = inject(LetterConfigService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<EditLetterConfigComponent>);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly datePipe = inject(DatePipe);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject<{ rowData: any }>(MAT_DIALOG_DATA);

  // Signals
  readonly isLoading = signal(false);
  readonly selectedHtmlFileName = signal<string | null>(null);
  readonly selectedWordFileName = signal<string | null>(null);
  readonly letterTypes = signal<LetterType[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly wings = signal<Wing[]>([]);
  readonly preferredBanks = signal<PreferredBank[]>([]);
  readonly shouldShowBankDropdown = signal(false);
  readonly isEditMode = computed(() => !!this.data?.rowData?.letter_config_id);

  // Form
  readonly letterConfigForm = new FormGroup<LetterConfigForm>({
    letter_type_id: new FormControl<number | null>(null, [Validators.required]),
    wing_id: new FormControl<number | null>(null, [Validators.required]),
    effective_date: new FormControl<string | null>(
      this.datePipe.transform(new Date(), 'yyyy-MM-dd') || null,
      [Validators.required]
    ),
    project_id: new FormControl<number | null>(null, [Validators.required]),
    bank_id: new FormControl<number | null>(null),
    letter_config_id: new FormControl<number | null>(null),
    html_file: new FormControl<File | null>(null),
    updated_by: new FormControl<number | null>(null),
    created_by: new FormControl<number | null>(null),
    word_file: new FormControl<File | null>(null),
  });

  // Computed signals
  readonly showHtmlEditor = computed(() => 
    this.letterConfigForm.controls.letter_type_id.value !== 5
  );

  readonly showFileUpload = computed(() => 
    this.letterConfigForm.controls.letter_type_id.value === 5
  );

  // Form control signals for reactive template
  readonly letterTypeId = toSignal(
    this.letterConfigForm.controls.letter_type_id.valueChanges,
    { initialValue: null }
  );

  constructor() {
    this.initializeForm();
    this.setupFormReactions();
    this.loadInitialData();
    
    if (this.isEditMode()) {
      this.fetchLetterConfig(this.data.rowData.letter_config_id);
    }
  }

  private initializeForm(): void {
    const userId = Number(sessionStorage.getItem('session_id'));
    this.letterConfigForm.patchValue({
      updated_by: userId,
      created_by: userId
    });
  }

  private setupFormReactions(): void {
    // Handle letter type changes with debouncing
    this.letterConfigForm.controls.letter_type_id.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(100),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(typeId => this.handleLetterTypeChange(typeId));

    // Load dependent data when project changes
    this.letterConfigForm.controls.project_id.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(projectId => {
        // Reset wing_id when project changes
        this.letterConfigForm.controls.wing_id.setValue(null, { emitEvent: false });
        this.wings.set([]);
        
        // Fetch wings only if project_id is valid
        if (projectId && typeof projectId === 'number') {
          this.fetchWings(projectId);
        }
        
        // Fetch letter types and banks (these don't depend on project)
        this.fetchLetterTypes();
        this.fetchPreferredBanks();
      });
  }

  private handleLetterTypeChange(typeId: number | null): void {
    if (typeId === null) return;

    const bankControl = this.letterConfigForm.controls.bank_id;
    const htmlFileControl = this.letterConfigForm.controls.html_file;
    const wordFileControl = this.letterConfigForm.controls.word_file;

    // Reset all conditional controls
    bankControl.clearValidators();
    bankControl.setValue(null);
    wordFileControl.clearValidators();
    wordFileControl.setValue(null);

    // Configure based on letter type
    if (typeId === 2) {
      this.shouldShowBankDropdown.set(true);
      bankControl.setValidators([Validators.required]);
    } else {
      this.shouldShowBankDropdown.set(false);
    }

    if (typeId === 5) {
      wordFileControl.setValidators([Validators.required]);
    } else {
      wordFileControl.clearValidators();
      wordFileControl.setValue(null);
      this.selectedWordFileName.set(null);
    }

    bankControl.updateValueAndValidity({ emitEvent: false });
    wordFileControl.updateValueAndValidity({ emitEvent: false });
  }

  private loadInitialData(): void {
    const roleId = Number(sessionStorage.getItem('role_id'));
    const userId = roleId === 2 ? null : Number(sessionStorage.getItem('session_id'));
    
    this.fetchProjects(userId);
  }

  private fetchProjects(userId: number | null): void {
    this.isLoading.set(true);
    this.letterConfigService.fetchProjects(userId)
      .pipe(
        catchError(err => {
          this.isLoading.set(false);
          this.showError('Unable to fetch projects');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projects) => {
          this.isLoading.set(false);
          this.projects.set(Array.isArray(projects) ? projects : []);
        },
        error: () => this.isLoading.set(false)
      });
  }

  private fetchWings(projectId: number, autoSubscribe: boolean = true): Observable<Wing[]> {
    if (!projectId || typeof projectId !== 'number') {
      this.wings.set([]);
      return EMPTY;
    }

    this.isLoading.set(true);
    const wings$ = this.letterConfigService.fetchWings(projectId)
      .pipe(
        catchError(err => {
          this.isLoading.set(false);
          this.wings.set([]);
          this.showError('No wings available for selected project');
          return EMPTY;
        })
      );

    // Auto-subscribe if called from form reactions
    if (autoSubscribe) {
      wings$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (wings) => {
            this.isLoading.set(false);
            this.wings.set(Array.isArray(wings) ? wings : []);
          },
          error: () => {
            this.isLoading.set(false);
            this.wings.set([]);
          }
        });
    }

    return wings$;
  }

  private fetchLetterTypes(): void {
    this.isLoading.set(true);
    this.letterConfigService.fetchLetterTypes()
      .pipe(
        catchError(err => {
          this.isLoading.set(false);
          this.showError('Unable to fetch letter types');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.letterTypes.set(response.data || []);
        },
        error: () => this.isLoading.set(false)
      });
  }

  private fetchPreferredBanks(): void {
    this.isLoading.set(true);
    this.letterConfigService.fetchPreferredBanks()
      .pipe(
        catchError(err => {
          this.isLoading.set(false);
          this.showError('Unable to fetch bank options');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (banks) => {
          this.isLoading.set(false);
          this.preferredBanks.set(Array.isArray(banks) ? banks : []);
        },
        error: () => this.isLoading.set(false)
      });
  }

  private fetchLetterConfig(letterConfigId: number): void {
    this.isLoading.set(true);
    this.letterConfigService.fetchLetterConfig(letterConfigId)
      .pipe(
        catchError(err => {
          this.isLoading.set(false);
          this.showError('Unable to fetch letter configuration');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.status && response.data?.length > 0) {
            const letterConfig = response.data[0];
            this.shouldShowBankDropdown.set(letterConfig.letter_type_id === 2);

            const effectiveDate = letterConfig.effective_date === '0000-00-00' 
              ? null 
              : letterConfig.effective_date;
            
            // First, set project_id and fetch wings for that project
            if (letterConfig.project_id) {
              this.letterConfigForm.patchValue({
                project_id: letterConfig.project_id
              }, { emitEvent: false });
              
              // Fetch wings for the selected project (don't auto-subscribe, we'll handle it)
              this.fetchWings(letterConfig.project_id, false)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                  next: (wings) => {
                    // After wings are loaded, patch the rest of the form values
                    this.letterConfigForm.patchValue({
                      letter_config_id: letterConfig.letter_config_id,
                      letter_type_id: letterConfig.letter_type_id,
                      wing_id: letterConfig.wing_id,
                      bank_id: letterConfig.bank_id,
                      effective_date: effectiveDate
                    }, { emitEvent: false });

                  },
                  error: () => {
                    // Even if wings fail, still patch other values
                    this.letterConfigForm.patchValue({
                      letter_config_id: letterConfig.letter_config_id,
                      letter_type_id: letterConfig.letter_type_id,
                      wing_id: letterConfig.wing_id,
                      bank_id: letterConfig.bank_id,
                      effective_date: effectiveDate
                    }, { emitEvent: false });

                  }
                });
            } else {
              // If no project_id, just patch other values
              this.letterConfigForm.patchValue({
                letter_config_id: letterConfig.letter_config_id,
                letter_type_id: letterConfig.letter_type_id,
                wing_id: letterConfig.wing_id,
                bank_id: letterConfig.bank_id,
                effective_date: effectiveDate
              }, { emitEvent: false });

            }
          }
        },
        error: () => this.isLoading.set(false)
      });
  }

  onHtmlFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
        this.showError('Please select a valid HTML file (.html or .htm)');
        input.value = '';
        return;
      }

      this.selectedHtmlFileName.set(file.name);
      this.letterConfigForm.patchValue({ html_file: file });
      this.letterConfigForm.controls.html_file.markAsTouched();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedWordFileName.set(file.name);
      this.letterConfigForm.patchValue({ word_file: file });
      this.letterConfigForm.controls.word_file.markAsTouched();
    }
  }

  onSubmit(): void {

  
    this.isLoading.set(true);
  
    const formData = new FormData();
    const formValue = this.letterConfigForm.getRawValue();
    const letterTypeId = formValue.letter_type_id;
  
    // Append form values to FormData
    Object.keys(formValue).forEach(key => {
      const value = formValue[key as keyof typeof formValue];

      // Handle file uploads (html_file and word_file) - always pass if file is present
      if ((key === 'html_file' || key === 'word_file') && value instanceof File) {
        formData.append(key, value, value.name);
      } else if (key === 'effective_date' && value) {
        formData.append(key, this.datePipe.transform(value as string, 'yyyy-MM-dd') || '');
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
  
    if (this.isEditMode()) {
      formData.set('letter_config_id', String(this.data.rowData.letter_config_id));
    }
  
    const request$ = this.isEditMode()
      ? this.letterConfigService.editLetterConfig(formData)
      : this.letterConfigService.addLetterConfig(formData);
  
    request$
      .pipe(
        catchError(err => {
          this.isLoading.set(false);
          this.showError('Something went wrong. Please try again.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.showSuccess(res.message);
          this.dialogRef.close(true);
        },
        error: () => this.isLoading.set(false)
      });
  }


  private showSuccess(message: string): void {
    this.dialog.open(SuccessDialogComponent, {
      autoFocus: false,
      data: { message }
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
    });
  }
}
