import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { AmenityCategory } from '../all-aminities/amenity.models';

/**
 * Type-safe dialog data interface
 */
export interface AddAmenitiesDialogData {
  title: string;
  apiUrl: 'add_amenities' | 'edit_amenities';
  successMessage: string;
  rowData?: {
    amenity_id?: number;
    name?: string;
    category_id?: number;
    amenty_photo?: string;
  };
  projectid: string | number;
}

/**
 * File with preview interface
 */
interface FileWithPreview extends File {
  preview?: string;
}

/**
 * High-performance Add Amenities component using Angular 17+ advanced features:
 * - Signals for reactive state management
 * - OnPush change detection for optimal performance
 * - Optimized RxJS with takeUntilDestroyed
 * - Clean dependency injection using inject()
 * - Type-safe interfaces
 * - Production-grade error handling
 */
@Component({
  selector: 'app-add-aminities',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './add-aminities.component.html',
  styleUrl: './add-aminities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAminitiesComponent implements OnInit {
  // Environment configuration
  private readonly baseUrl = environment.API_URL;

  // Dependency injection using inject()
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<AddAminitiesComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<AddAmenitiesDialogData>(MAT_DIALOG_DATA);

  // User session data
  private readonly userId = Number(sessionStorage.getItem('session_id'));

  // Reactive state using signals
  private readonly categoriesSignal = signal<AmenityCategory[]>([]);
  private readonly selectedFilesSignal = signal<FileWithPreview[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly categories = this.categoriesSignal.asReadonly();
  readonly selectedFiles = this.selectedFilesSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed signals
  readonly hasFiles = computed(() => this.selectedFilesSignal().length > 0);
  readonly hasCategories = computed(() => this.categoriesSignal().length > 0);

  // Reactive form
  readonly addAminitiesForm: FormGroup = this.fb.group({
    user_id: [this.userId],
    project_id: [this.data.projectid],
    name: ['', [Validators.required]],
    category_id: ['', [Validators.required]],
    amenty_photo: [[]],
  });

  ngOnInit(): void {
    this.fetchAllAmenitiesCategories();
    this.initializeEditMode();
  }

  /**
   * Initialize form for edit mode if rowData is provided
   */
  private initializeEditMode(): void {
    const rowData = this.data.rowData;
    if (rowData) {
      this.addAminitiesForm.patchValue({
        name: rowData.name || '',
        category_id: rowData.category_id || '',
      });
      this.cdr.markForCheck();
    }
  }

  /**
   * Fetch all amenity categories
   * Uses optimized RxJS with proper error handling
   */
  fetchAllAmenitiesCategories(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<AmenityCategory[]>(`${this.baseUrl}/fetch_amenity_categories`)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.errorSignal.set('Unable to fetch amenity categories.');
          this.snackBar.open('Unable to fetch amenity categories.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        finalize(() => {
          this.loadingSignal.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.categoriesSignal.set(Array.isArray(res) ? res : []);
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Handle file selection
   * Creates preview for image files
   */
  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const newFiles: FileWithPreview[] = [];
    const currentFiles = this.selectedFilesSignal();

    // Process each selected file
    Array.from(input.files).forEach((file) => {
      // Check if file is already selected (prevent duplicates)
      const isDuplicate = currentFiles.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (isDuplicate) return;

      const fileWithPreview = file as FileWithPreview;

      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          fileWithPreview.preview = reader.result as string;
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(fileWithPreview);
    });

    // Update signal with new files
    this.selectedFilesSignal.set([...currentFiles, ...newFiles]);
    this.cdr.markForCheck();

    // Reset input to allow selecting the same file again
    input.value = '';
  }

  /**
   * Remove file from selection
   */
  removeFile(index: number): void {
    const currentFiles = this.selectedFilesSignal();
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    this.selectedFilesSignal.set(updatedFiles);
    this.addAminitiesForm.patchValue({
      amenty_photo: updatedFiles,
    });
    this.cdr.markForCheck();
  }

  /**
   * Submit form
   * Uses optimized RxJS with proper error handling
   */
  onSubmit(): void {
    if (this.addAminitiesForm.invalid) {
      this.markFormGroupTouched(this.addAminitiesForm);
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const formData = new FormData();
    const formValues = this.addAminitiesForm.value;
    const selectedFiles = this.selectedFilesSignal();

    // Validate files are selected
    if (selectedFiles.length === 0 && !this.data.rowData) {
      this.snackBar.open('Please select at least one file.', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Append form fields
    ['user_id', 'project_id', 'name', 'category_id'].forEach((field) => {
      const value = formValues[field];
      if (value !== undefined && value !== null && value !== '') {
        formData.append(`${field}[0]`, value.toString());
      }
    });

    // Append files
    selectedFiles.forEach((file, i) => {
      formData.append(`amenty_photo[${i}]`, file, file.name);
    });

    // If editing, might need to append amenity_id
    if (this.data.rowData?.amenity_id) {
      formData.append('amenity_id[0]', this.data.rowData.amenity_id.toString());
    }

    this.loadingSignal.set(true);

    this.http
      .post(`${this.baseUrl}/${this.data.apiUrl}`, formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.snackBar.open(
            'Something went wrong. Please try again.',
            'Close',
            { duration: 3000 }
          );
          return of(null);
        }),
        finalize(() => {
          this.loadingSignal.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          if (response !== null) {
            this.snackBar.open(this.data.successMessage, 'Close', {
              duration: 3000,
            });
            this.dialogRef.close(true);
          }
        },
      });
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * TrackBy function for ngFor optimization
   */
  trackByCategoryId(index: number, category: AmenityCategory): number {
    return category.category_id;
  }

  /**
   * TrackBy function for files
   */
  trackByFileIndex(index: number): number {
    return index;
  }
}
