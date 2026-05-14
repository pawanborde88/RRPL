import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { MatAccordion } from '@angular/material/expansion';
import {
  debounceTime,
  distinctUntilChanged,
  shareReplay,
  switchMap,
  tap,
  catchError,
  of,
  forkJoin,
  EMPTY,
  map,
  filter
} from 'rxjs';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { PreviewImagesComponent } from '../preview-images/preview-images.component';
import { environment } from '../../../../../environments/environment';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AmountDirective } from '../../../../Common/Amount Direcitve/amount.directive';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { FileSizePipe } from '../../../../Pipes/file-size.pipe';
import { AllBrokerageComponent } from '../all-brokerage/all-brokerage.component';
import { AllConfigurationComponent } from '../all-configuration/all-configuration.component';
import { AllDocumentsComponent } from '../all-documents/all-documents.component';
import { AllLinksComponent } from '../all-links/all-links.component';
import { AllPhasesComponent } from '../all-phases/all-phases.component';
import { AllProjectWingsComponent } from '../all-project-wings/all-project-wings.component';
import { AllSpecificationsComponent } from '../all-specifications/all-specifications.component';
import { AllAminitiesComponent } from '../Aminities/all-aminities/all-aminities.component';
import { FetchAllProjectSignatureComponent } from '../Project Stamp Signature/fetch-all-project-signature/fetch-all-project-signature.component';
import { AllNearbyLocations } from '../Nearby Locations/all-nearby-locations/all-nearby-locations';

// Define interfaces for better type safety
interface City {
  city_id: number;
  city_name: string;
}

interface SubRegion {
  sub_region_id: number;
  sub_region: string;
}

interface ProjectStatus {
  project_status_id: number;
  project_status: string;
}

interface ProjectImage {
  project_image_id?: number;
  project_image: string;
  project_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface ProjectData {
  user_id?: number;
  project_id: number;
  receipt_no_start: number | string;
  property_name: string;
  description: string | null;
  amenities?: string | null;
  builder: string | null;
  address: string;
  map_location: string | null;
  project_thumbnail_img: string | null;
  project_logo: string | null;
  pricing_desc: string | null;
  city?: string | null;
  city_id: number;
  sub_region_id: number;
  project_code: string | null;
  is_featured: number;
  website: string | null;
  is_retro: number;
  footer_description: string | null;
  project_slug?: string;
  parking_charges?: number | null;
  min_cost: number | null;
  event_status_id: number;
  event_date: string;
  call_masking_id: number;
  event_time: string;
  event_remark: string;
  max_cost: number | null;
  active_status_id: number;
  project_status_id: number;
  enq_otp_status: number;
  created_by?: number;
  created_at?: string;
  updated_by?: number;
  updated_at?: string;
  project_stamp?: string | null;
  project_signature?: string | null;
  booking_count?: number;
  sub_region_name?: string;
  city_name?: string;
  cp_status_id: number;
}

interface SelectedFile {
  file: File;
  preview: string;
  progress?: number;
  name: string;
  size: number;
}

interface ImagePreview {
  thumbnail: string | null;
  logo: string | null;
}

@Component({
  selector: 'app-edit-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    FileSizePipe,
    AllBrokerageComponent,
    AllConfigurationComponent,
    AllSpecificationsComponent,
    AllPhasesComponent,
    AllAminitiesComponent,
    AllDocumentsComponent,
    AllLinksComponent,
    AllProjectWingsComponent,
    AmountDirective,
    FetchAllProjectSignatureComponent,
    AllNearbyLocations
  ],
  templateUrl: './edit-projects.component.html',
  styleUrl: './edit-projects.component.scss'
})
export class EditProjectComponent implements OnInit {
  @ViewChild('accordion') accordion!: MatAccordion;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Modern Angular dependency injection
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // Constants
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_FILES = 10;
  private readonly DEBOUNCE_TIME = 300;
  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly roleId = Number(sessionStorage.getItem('role_id')) || null;
  readonly userId = Number(sessionStorage.getItem('session_id')) || null;

  // Route params observable for initialization
  private readonly routeParams$ = this.route.params.pipe(
    map(params => params['project_id'] as string),
    filter((projectId): projectId is string => !!projectId),
    distinctUntilChanged()
  );

  // Signals for reactive state management (OnPush optimization)
  projectData = signal<ProjectData | null>(null);
  allCities = signal<City[]>([]);
  allSubregions = signal<SubRegion[]>([]);
  allProjectImages = signal<ProjectImage[]>([]);
  allProjectStatus = signal<ProjectStatus[]>([]);
  selectedFiles = signal<SelectedFile[]>([]);
  imagePreview = signal<ImagePreview>({ thumbnail: null, logo: null });
  isLoading = signal<boolean>(false);
  saveInProgress = signal<boolean>(false);
  uploadInProgress = signal<boolean>(false);

  // Computed signals for derived state (better performance)
  hasImageUploads = computed(() => {
    const preview = this.imagePreview();
    const data = this.projectData();
    const hasThumbnail = !!preview.thumbnail || !!data?.project_thumbnail_img;
    const hasLogo = !!preview.logo || !!data?.project_logo;
    const hasGallery = this.allProjectImages().length > 0;
    return hasThumbnail && hasLogo && hasGallery;
  });

  imageStatus = computed(() => {
    const preview = this.imagePreview();
    const data = this.projectData();
    const hasThumbnail = !!preview.thumbnail || !!data?.project_thumbnail_img;
    const hasLogo = !!preview.logo || !!data?.project_logo;

    if (hasThumbnail && hasLogo) return 'Complete';
    if (hasThumbnail || hasLogo) return 'Partial';
    return 'Pending';
  });

  totalImages = computed(() =>
    this.allProjectImages().length + this.selectedFiles().length
  );

  remainingImageSlots = computed(() =>
    Math.max(0, 9 - this.totalImages())
  );

  isBasicInfoComplete = computed(() => {
    const requiredFields = ['property_name', 'builder', 'project_code', 'project_status_id'];
    return requiredFields.every(field => {
      const control = this.editProjectForm.get(field);
      return control?.valid && control?.value;
    });
  });

  // Form and state management
  editProjectForm: FormGroup;
  projectID = signal<string>('');
  private originalFormData: Record<string, unknown> | null = null;
  private lastInitializedProjectId: string | null = null;

  // Cache for API responses (using signals instead of BehaviorSubject)
  private citiesCache = signal<City[] | null>(null);
  private projectStatusCache = signal<ProjectStatus[] | null>(null);

  constructor() {
    // Initialize form with proper validators
    this.editProjectForm = this.createForm();
    this.setupFormOptimizations();
  }

  ngOnInit(): void {
    // Initialize project from route params
    this.routeParams$
      .pipe(
        tap(projectId => {
          if (projectId !== this.lastInitializedProjectId) {
            this.projectID.set(projectId);
            this.lastInitializedProjectId = projectId;
            this.initializeProject(projectId);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Setup form optimizations with debouncing and smart change detection
   */
  private setupFormOptimizations(): void {
    // Listen for city changes to fetch subregions with switchMap for cancellation
    this.editProjectForm.get('city_id')?.valueChanges
      .pipe(
        debounceTime(this.DEBOUNCE_TIME),
        distinctUntilChanged(),
        filter((cityId): cityId is number => !!cityId),
        switchMap((cityId: number) => {
          this.isLoading.set(true);
          return this.http.post<SubRegion[]>(`${this.baseUrl}/sub_region_dropdown`, { city_id: cityId })
            .pipe(
              tap(subregions => {
                this.allSubregions.set(subregions);
                this.isLoading.set(false);
              }),
              catchError(error => {
                console.error('Error fetching subregions:', error);
                this.snackBar.open('Unable to fetch sub-regions.', 'Close', { duration: 3000 });
                this.isLoading.set(false);
                return of([]);
              })
            );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  // Helper methods for UI
  getStatusName(id: any): string {
    if (!id && id !== 0) return 'Select Status';
    const numericId = Number(id);
    const status = this.allProjectStatus().find(s => s.project_status_id === numericId);
    return status ? status.project_status : 'Select Status';
  }

  /**
   * Initialize project with optimized parallel data fetching
   */
  private initializeProject(projectId: string): void {
    if (!projectId) {
      this.snackBar.open('Invalid project ID', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);

    // Parallel data fetching for better performance
    forkJoin({
      cities: this.getCachedCities(),
      projectStatus: this.getCachedProjectStatus(),
      project: this.http.post<ProjectData>(`${this.baseUrl}/fetch_single_project`, {
        project_id: projectId,
        user_id: this.userId
      }),
      images: this.http.post<ProjectImage[]>(`${this.baseUrl}/fetch_project_images`, {
        project_id: projectId
      })
    }).pipe(
      switchMap(data => {
        this.allCities.set(data.cities);
        this.allProjectStatus.set(data.projectStatus);
        this.projectData.set(data.project);
        this.allProjectImages.set(data.images);

        // Fetch subregions based on project's city_id before patching form
        if (data.project.city_id) {
          return this.http.post<SubRegion[]>(`${this.baseUrl}/sub_region_dropdown`, {
            city_id: data.project.city_id
          }).pipe(
            map(subregions => ({ ...data, subregions })),
            catchError(() => {
              console.error('Error fetching subregions');
              return of({ ...data, subregions: [] });
            })
          );
        }
        return of({ ...data, subregions: [] });
      }),
      catchError(error => {
        console.error('Error initializing project:', error);
        this.snackBar.open('Failed to load project data', 'Close', { duration: 3000 });
        this.isLoading.set(false);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => {
      this.allSubregions.set(data.subregions);
      this.patchFormValues(data.project);
      this.originalFormData = { ...this.editProjectForm.value };
      this.isLoading.set(false);
    });
  }

  /**
   * Get cached cities or fetch if not available (smart caching)
   */
  private getCachedCities() {
    const cached = this.citiesCache();
    if (cached) return of(cached);

    return this.http.get<City[]>(`${this.baseUrl}/city_dropdown`).pipe(
      tap(cities => this.citiesCache.set(cities)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Get cached project status or fetch if not available
   */
  private getCachedProjectStatus() {
    const cached = this.projectStatusCache();
    if (cached) return of(cached);

    return this.http.get<ProjectStatus[]>(`${this.baseUrl}/project_status_dropdown`).pipe(
      tap(statuses => this.projectStatusCache.set(statuses)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private createForm(): FormGroup {
    return new FormGroup({
      property_name: new FormControl('', [
        Validators.required,
        Validators.maxLength(100)
      ]),
      description: new FormControl('', [
        Validators.maxLength(500)
      ]),
      builder: new FormControl('', [
        Validators.maxLength(50)
      ]),
      receipt_no_start: new FormControl('', [
        Validators.pattern('^[0-9]*$')
      ]),
      address: new FormControl('', [
        Validators.required,
        Validators.maxLength(200)
      ]),
      map_location: new FormControl('', [
        Validators.maxLength(500)
      ]),
      project_thumbnail_img: new FormControl<File | string | null>(
        null,
        [Validators.required]
      ),
      project_logo: new FormControl<File | string | null>(
        null,
        [Validators.required]
      ),
      event_status_id: new FormControl(0),
      event_description: new FormControl('', [
      ]),
      call_masking_id: new FormControl(0),
      enq_otp_status: new FormControl(0),

      event_remark: new FormControl('', [
        Validators.maxLength(200)
      ]),
      event_date: new FormControl(''),
      event_time: new FormControl(''),
      pricing_desc: new FormControl('', [
        Validators.maxLength(1000)
      ]),
      project_status_id: new FormControl('', [
        Validators.required
      ]),
      city_id: new FormControl('', [
        Validators.required
      ]),
      sub_region_id: new FormControl('', [
        Validators.required
      ]),
      max_cost: new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      min_cost: new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      is_featured: new FormControl(0),
      website: new FormControl('', [
        Validators.pattern('^(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?$')
      ]),
      project_code: new FormControl('', [
        Validators.required,
        Validators.maxLength(20),
        Validators.pattern('^[A-Z0-9-_]+$')
      ]),
      active_status_id: new FormControl('', [
        Validators.required
      ]),
      is_retro: new FormControl(0),
      footer_description: new FormControl('', [
        Validators.maxLength(200)
      ]),
      updated_at: new FormControl(''),
      project_id: new FormControl(''),
      cp_status_id: new FormControl(0),
      project_image: new FormControl<File[]>([])
    });
  }


  /**
   * Patch form values with optimized destructuring
   */
  private patchFormValues(projectData: ProjectData): void {
    const {
      property_name,
      description,
      receipt_no_start,
      builder,
      event_status_id,
      event_date,
      event_time,
      event_remark,
      address,
      map_location,
      pricing_desc,
      max_cost,
      min_cost,
      active_status_id,
      project_status_id,
      city_id,
      sub_region_id,
      is_featured,
      website,
      is_retro,
      footer_description,
      project_code,
      project_thumbnail_img,
      project_logo,
      call_masking_id,
      enq_otp_status,
      cp_status_id
    } = projectData;

    // Convert receipt_no_start to string if it's a number
    const receiptNoStart = receipt_no_start !== null && receipt_no_start !== undefined
      ? String(receipt_no_start)
      : '';

    // Handle invalid dates (like "0002-11-30")
    const formattedEventDate = event_date && event_date !== '0002-11-30' && event_date !== '0000-00-00'
      ? event_date
      : '';

    // Handle event_time - extract time part if it includes microseconds
    const formattedEventTime = event_time
      ? event_time.split('.')[0] // Remove microseconds if present
      : '';

    this.editProjectForm.patchValue({
      property_name: property_name || '',
      description: description || '',
      receipt_no_start: receiptNoStart,
      builder: builder || '',
      event_status_id: event_status_id ?? 0,
      event_date: formattedEventDate,
      event_time: formattedEventTime,
      event_remark: event_remark || '',
      address: address || '',
      call_masking_id: call_masking_id ?? 0,
      map_location: map_location || '',
      pricing_desc: pricing_desc || '',
      max_cost: max_cost !== null && max_cost !== undefined ? max_cost : '',
      min_cost: min_cost !== null && min_cost !== undefined ? min_cost : '',
      active_status_id: active_status_id ?? 0,
      project_status_id: project_status_id ?? '',
      city_id: city_id ?? '',
      sub_region_id: sub_region_id ?? '',
      is_featured: is_featured ?? 0,
      website: website || '',
      is_retro: is_retro ?? 0,
      footer_description: footer_description || '',
      project_code: project_code || '',
      enq_otp_status: enq_otp_status ?? 0,
      project_id: projectData.project_id || '',
      cp_status_id: cp_status_id ?? 0,
      updated_at: projectData.updated_at || ''
    }, { emitEvent: false }); // Prevent unnecessary value change events

    // Update image previews using signals
    this.imagePreview.set({
      thumbnail: project_thumbnail_img ? `${this.storageUrl}/${project_thumbnail_img}` : null,
      logo: project_logo ? `${this.storageUrl}/${project_logo}` : null
    });
  }

  // ============================================================================
  // IMAGE HANDLING METHODS (OPTIMIZED)
  // ============================================================================

  /**
   * Optimized image change handler with validation and compression
   */
  onImageChange(event: Event, type: keyof ImagePreview, fieldName: string): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) return;

    const file = input.files[0];

    // Validate file
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      this.snackBar.open(validation.error!, 'Close', { duration: 3000 });
      return;
    }

    // Use createImageBitmap for better performance (when available)
    if ('createImageBitmap' in window) {
      this.processImageWithBitmap(file, type, fieldName);
    } else {
      this.processImageWithFileReader(file, type, fieldName);
    }
  }

  /**
   * Validate image file
   */
  private validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please select an image file' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'Image size should be less than 5MB' };
    }

    return { valid: true };
  }

  /**
   * Process image using createImageBitmap (faster)
   */
  private async processImageWithBitmap(file: File, type: keyof ImagePreview, fieldName: string): Promise<void> {
    try {
      const imageBitmap = await createImageBitmap(file);
      const reader = new FileReader();

      reader.onload = () => {
        const currentPreview = this.imagePreview();
        this.imagePreview.set({ ...currentPreview, [type]: reader.result as string });
        this.editProjectForm.patchValue({ [fieldName]: file }, { emitEvent: false });
        this.editProjectForm.get(fieldName)?.markAsDirty();
      };

      reader.onerror = () => {
        this.snackBar.open('Error reading image file', 'Close', { duration: 3000 });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      this.processImageWithFileReader(file, type, fieldName);
    }
  }

  /**
   * Fallback: Process image using FileReader
   */
  private processImageWithFileReader(file: File, type: keyof ImagePreview, fieldName: string): void {
    const reader = new FileReader();

    reader.onload = () => {
      const currentPreview = this.imagePreview();
      this.imagePreview.set({ ...currentPreview, [type]: reader.result as string });
      this.editProjectForm.patchValue({ [fieldName]: file }, { emitEvent: false });
      this.editProjectForm.get(fieldName)?.markAsDirty();
    };

    reader.onerror = () => {
      this.snackBar.open('Error reading image file', 'Close', { duration: 3000 });
    };

    reader.readAsDataURL(file);
  }

  /**
   * Optimized file selection with batch processing
   */
  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files?.length) return;

    const currentFiles = this.selectedFiles();
    const remainingSlots = this.MAX_FILES - currentFiles.length;

    if (files.length > remainingSlots) {
      this.snackBar.open(`You can only upload ${remainingSlots} more files`, 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    // Process files in batch for better performance
    this.processFileBatch(Array.from(files));

    // Reset input to allow selecting same files again
    input.value = '';
  }

  /**
   * Process multiple files in batch with optimized validation
   */
  private async processFileBatch(files: File[]): Promise<void> {
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate all files first
    for (const file of files) {
      const validation = this.validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      this.snackBar.open(errors[0], 'Close', { duration: 3000 });
      if (validFiles.length === 0) return;
    }

    // Process valid files in parallel
    const filePromises = validFiles.map(file => this.createFilePreview(file));

    try {
      const selectedFiles = await Promise.all(filePromises);
      const currentFiles = this.selectedFiles();
      this.selectedFiles.set([...currentFiles, ...selectedFiles]);

      // Update form control
      this.editProjectForm.patchValue({
        project_image: this.selectedFiles().map(f => f.file)
      }, { emitEvent: false });
      this.editProjectForm.get('project_image')?.markAsDirty();
    } catch (error) {
      console.error('Error processing files:', error);
      this.snackBar.open('Error processing some files', 'Close', { duration: 3000 });
    }
  }

  /**
   * Create file preview asynchronously
   */
  private createFilePreview(file: File): Promise<SelectedFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve({
          file,
          preview: reader.result as string,
          name: file.name,
          size: file.size
        });
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Remove file by index (optimized with signals)
   */
  removeFile(index: number): void {
    const currentFiles = this.selectedFiles();
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    this.selectedFiles.set(updatedFiles);

    this.editProjectForm.patchValue({
      project_image: updatedFiles.map(f => f.file)
    }, { emitEvent: false });
  }

  /**
   * Clear all selected files with confirmation
   */
  clearSelectedFiles(): void {
    const currentFiles = this.selectedFiles();
    if (currentFiles.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Clear Files',
        message: `Are you sure you want to clear all ${currentFiles.length} selected files?`,
        confirmText: 'Clear All',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (result) {
            this.selectedFiles.set([]);
            this.editProjectForm.patchValue({ project_image: [] }, { emitEvent: false });
          }
        }
      });
  }

  /**
   * Upload project images with progress tracking
   */
  addProjectImages(): void {
    const filesToUpload = this.selectedFiles();
    if (filesToUpload.length === 0) {
      this.snackBar.open('No files selected', 'Close', { duration: 3000 });
      return;
    }

    this.uploadInProgress.set(true);
    const formData = new FormData();

    formData.append('project_id', this.projectID());
    formData.append('user_id', this.userId?.toString() || '');

    filesToUpload.forEach((fileObj, index) => {
      formData.append(`project_image[${index}]`, fileObj.file);
    });

    this.http.post(`${this.baseUrl}/add_project_images`, formData)
      .pipe(
        tap((response: { message?: string }) => {
          this.snackBar.open(response.message || 'Images uploaded successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }),
        switchMap(() =>
          this.http.post<ProjectImage[]>(`${this.baseUrl}/fetch_project_images`, {
            project_id: this.projectID()
          })
        ),
        catchError(error => {
          console.error('Error uploading images:', error);
          this.snackBar.open(error.error?.message || 'Failed to upload images', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (images) => {
          this.selectedFiles.set([]);
          this.editProjectForm.patchValue({ project_image: [] }, { emitEvent: false });
          this.allProjectImages.set(images);
          this.uploadInProgress.set(false);
        },
        error: () => {
          this.uploadInProgress.set(false);
        }
      });
  }

  /**
   * Delete project thumbnail or logo with optimized flow
   */
  deleteProjectImage(projectImageID: number | undefined, imageType: 'thumbnail' | 'logo'): void {
    if (!projectImageID) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Image',
        message: `Are you sure you want to delete this ${imageType}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        warning: true
      }
    });

    dialogRef.afterClosed()
      .pipe(
        switchMap(confirmed => {
          if (!confirmed) return of(null);

          const requestPayload = {
            project_id: projectImageID,
            user_id: this.userId
          };

          const deleteUrl = imageType === 'thumbnail'
            ? `${this.baseUrl}/delete_thumbnail_img`
            : `${this.baseUrl}/delete_project_logo`;

          return this.http.post<{ message: string }>(deleteUrl, requestPayload);
        }),
        switchMap(response => {
          if (!response) return EMPTY;

          const deleteResponse = response as { message: string };
          this.dialog.open(SuccessDialogComponent, {
            data: { message: deleteResponse.message }
          });

          // Refetch project data
          return this.http.post<ProjectData>(`${this.baseUrl}/fetch_single_project`, {
            project_id: this.projectID(),
            user_id: this.userId
          });
        }),
        catchError(error => {
          console.error('Error deleting image:', error);
          this.snackBar.open('Unable to delete the image.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projectData) => {
          if (projectData) {
            this.projectData.set(projectData);
            this.patchFormValues(projectData);
          }
        }
      });
  }

  /**
   * Delete gallery image with optimized flow
   */
  deleteGalleryImage(image: ProjectImage): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Image',
        message: 'Are you sure you want to delete this image from the gallery?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        warning: true
      }
    });

    dialogRef.afterClosed()
      .pipe(
        switchMap(confirmed => {
          if (!confirmed) return of(null);

          return this.http.post(`${this.baseUrl}/delete_project_image`, {
            project_image_id: image.project_image_id,
            user_id: this.userId
          }).pipe(
            tap(() => {
              this.snackBar.open('Image deleted successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
            }),
            switchMap(() =>
              this.http.post<ProjectImage[]>(`${this.baseUrl}/fetch_project_images`, {
                project_id: this.projectID()
              })
            )
          );
        }),
        catchError(error => {
          console.error('Error deleting gallery image:', error);
          this.snackBar.open('Unable to delete image', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (images) => {
          if (images) {
            this.allProjectImages.set(images);
          }
        }
      });
  }

  // ============================================================================
  // FORM SUBMISSION (OPTIMIZED)
  // ============================================================================

  /**
   * Submit form with optimized validation and error handling
   */
  onSubmit(): void {
    if (this.editProjectForm.pristine) {
      this.snackBar.open('No changes to save', 'Close', {
        duration: 3000,
        panelClass: ['info-snackbar']
      });
      return;
    }


    this.saveInProgress.set(true);
    const formData = this.prepareFormData();

    this.http.post<{ message: string }>(`${this.baseUrl}/edit_project_details`, formData)
      .pipe(
        tap(response => {
          this.dialog.open(SuccessDialogComponent, {
            data: { message: response.message }
          });
        }),
        switchMap(() =>
          this.http.post<ProjectData>(`${this.baseUrl}/fetch_single_project`, {
            project_id: this.projectID(),
            user_id: this.userId
          })
        ),
        catchError(error => {
          console.error('Error updating project:', error);
          this.snackBar.open(error.error?.message || 'Failed to update project', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projectData) => {
          this.projectData.set(projectData);
          this.patchFormValues(projectData);
          this.originalFormData = { ...this.editProjectForm.value };
          this.editProjectForm.markAsPristine();
          this.saveInProgress.set(false);
        },
        error: () => {
          this.saveInProgress.set(false);
        }
      });
  }

  private prepareFormData(): FormData {
    const formData = new FormData();
    const formValue = this.editProjectForm.getRawValue();

    // Process form values efficiently
    for (const [key, value] of Object.entries(formValue)) {
      if (value === null || value === undefined) {
        formData.append(key, '');
        continue;
      }

      // Handle special fields
      if (key === 'event_date' && value) {
        const dateValue = value as string | number | Date;
        const formattedDate = this.datePipe.transform(dateValue, 'yyyy-MM-dd');
        formData.append(key, formattedDate || '');
      } else if ((key === 'project_logo' || key === 'project_thumbnail_img') && value) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'string') {
          formData.append(key, value);
        }
      } else {
        formData.append(key, String(value));
      }
    }

    // Add metadata
    formData.append('project_id', this.projectID());
    formData.append('updated_by', String(this.userId ?? ''));
    formData.append('updated_at', new Date().toISOString());

    return formData;
  }

  /**
   * Discard changes with confirmation
   */
  discardChanges(): void {
    if (!this.editProjectForm.dirty) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Discard Changes',
        message: 'Are you sure you want to discard all unsaved changes?',
        confirmText: 'Discard',
        cancelText: 'Continue Editing',
        warning: true
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (result && this.originalFormData) {
            this.editProjectForm.reset(this.originalFormData);
            this.editProjectForm.markAsPristine();

            // Reset image previews
            const data = this.projectData();
            if (data) {
              this.imagePreview.set({
                thumbnail: data.project_thumbnail_img
                  ? `${this.storageUrl}/${data.project_thumbnail_img}`
                  : null,
                logo: data.project_logo
                  ? `${this.storageUrl}/${data.project_logo}`
                  : null
              });
            }
          }
        }
      });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Preview images in dialog
   */
  previewImages(images: string | ProjectImage[] | ProjectImage | null | undefined, title?: string, initialIndex?: number): void {
    if (!images) {
      this.snackBar.open('No image available to preview', 'Close', { duration: 3000 });
      return;
    }

    // For ProjectImage objects, pass them directly so the component can handle project_image_id for deletion
    const isProjectImageArray = Array.isArray(images) && images.length > 0 && typeof images[0] === 'object' && 'project_image' in images[0];
    const isSingleProjectImage = !Array.isArray(images) && typeof images === 'object' && images !== null && 'project_image' in images;

    let imageArray: (string | ProjectImage)[];
    let imageKey = 'image'; // default key

    if (isProjectImageArray) {
      // Pass ProjectImage objects directly
      imageArray = images as ProjectImage[];
      imageKey = 'project_image'; // key to extract image path from ProjectImage object
    } else if (isSingleProjectImage) {
      // Pass single ProjectImage object
      imageArray = [images as ProjectImage];
      imageKey = 'project_image';
    } else {
      // Convert to string array for backward compatibility
      if (Array.isArray(images)) {
        imageArray = images.map(img => typeof img === 'string' ? img : (img as ProjectImage).project_image);
      } else {
        imageArray = [typeof images === 'string' ? images : (images as ProjectImage).project_image];
      }
    }

    this.dialog.open(PreviewImagesComponent, {
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      panelClass: 'image-preview-dialog',
      data: {
        images: imageArray,
        title: title || 'Project Images',
        name: imageKey,
        storageUrl: this.storageUrl,
        initialIndex: initialIndex !== undefined ? initialIndex : 0
      }
    });
  }

  /**
   * Preview gallery images starting from a specific image
   */
  previewGalleryImage(clickedImage: ProjectImage, clickedIndex: number): void {
    const allImages = this.allProjectImages();
    if (allImages.length === 0) {
      this.snackBar.open('No gallery images available', 'Close', { duration: 3000 });
      return;
    }
    this.previewImages(allImages, 'Project Gallery', clickedIndex);
  }

  /**
   * Toggle all accordion panels
   */
  toggleAllPanels(state: 'expanded' | 'collapsed'): void {
    if (state === 'expanded') {
      this.accordion.openAll();
    } else {
      this.accordion.closeAll();
    }
  }




  // ============================================================================
  // GETTERS & COMPUTED PROPERTIES
  // ============================================================================

  get formControls() {
    return this.editProjectForm.controls;
  }

  get isFormDirty(): boolean {
    return this.editProjectForm.dirty;
  }

  get isFormValid(): boolean {
    return this.editProjectForm.valid;
  }

  readonly basicInfoFields = [
    'property_name',
    'description',
    'builder',
    'receipt_no_start',
    'address',
    'map_location',
    'event_status_id',
    'call_masking_id',
    'event_remark',
    'event_date',
    'event_time',
    'pricing_desc',
    'project_status_id',
    'city_id',
    'sub_region_id',
    'max_cost',
    'min_cost',
    'is_featured',
    'website',
    'project_code',
    'active_status_id',
    'is_retro',
    'footer_description',
    'enq_otp_status',
    'cp_status_id',
  ] as const;

  /**
   * Count filled fields (optimized)
   */
  countFilledFields(fields: readonly string[]): number {
    if (!this.editProjectForm) return 0;

    return fields.reduce((count, field) => {
      const control = this.editProjectForm.get(field);
      const value = control?.value;
      return count + (value !== null && value !== undefined && value !== '' ? 1 : 0);
    }, 0);
  }

  /**
   * Preview selected files before upload
   */
  previewSelectedFiles(): void {
    const files = this.selectedFiles();
    if (files.length === 0) {
      this.snackBar.open('No files selected for preview', 'Close', { duration: 3000 });
      return;
    }

    this.dialog.open(PreviewImagesComponent, {
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      panelClass: 'image-preview-dialog',
      data: {
        images: files.map(file => file.preview),
        title: 'Selected Files Preview',
        storageUrl: null
      }
    });
  }


  /**
   * Open map location in new tab
   */
  openMapLink(): void {
    const mapLocation = this.editProjectForm.get('map_location')?.value;
    if (mapLocation) {
      window.open(mapLocation, '_blank', 'noopener,noreferrer');
    } else {
      this.snackBar.open('Map location not available', 'Close', { duration: 3000 });
    }
  }

  /**
   * Handle project code input
   */
  onProjectCodeInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value.toUpperCase();
    inputElement.value = value;
    this.editProjectForm.patchValue({ project_code: value }, { emitEvent: false });
  }


  /**
   * Trigger file input click
   */
  triggerFileInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  // ============================================================================
  // TRACKBY FUNCTIONS (PERFORMANCE OPTIMIZATION)
  // ============================================================================

  /**
   * TrackBy function for cities
   */
  trackByCity(index: number, city: City): number {
    return city.city_id;
  }

  /**
   * TrackBy function for sub regions
   */
  trackBySubRegion(index: number, region: SubRegion): number {
    return region.sub_region_id;
  }

  /**
   * TrackBy function for project status
   */
  trackByProjectStatus(index: number, status: ProjectStatus): number {
    return status.project_status_id;
  }

  /**
   * TrackBy function for project images
   */
  trackByProjectImage(index: number, image: ProjectImage): number | undefined {
    return image.project_image_id || index;
  }

  /**
   * TrackBy function for selected files
   */
  trackBySelectedFile(index: number, file: SelectedFile): string {
    return file.name + file.size;
  }

  /**
   * TrackBy function for basic info fields
   */
  trackByField(index: number, field: string): string {
    return field;
  }
}