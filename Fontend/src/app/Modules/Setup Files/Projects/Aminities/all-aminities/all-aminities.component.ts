import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { 
  Component, 
  Input, 
  signal, 
  computed, 
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../../environments/environment';
import { AddAminitiesComponent } from '../add-aminities/add-aminities.component';
import { PreviewImagesComponent } from '../../preview-images/preview-images.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { Subject, finalize, takeUntil, catchError, of } from 'rxjs';
import { Amenity, FetchAmenitiesRequest, DeleteAmenityRequest, PreviewImagesDialogData } from './amenity.models';

/**
 * High-performance Amenities component using Angular 17+ advanced features:
 * - Signals for reactive state management
 * - OnPush change detection for optimal performance
 * - Optimized RxJS with proper subscription management
 * - Clean dependency injection using constructor injection
 * - Type-safe interfaces
 * - Production-grade error handling
 */
@Component({
  selector: 'app-all-aminities',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './all-aminities.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [], // Using Tailwind CSS only
  // Explicitly mark as AOT-compatible
  preserveWhitespaces: false
})
export class AllAminitiesComponent implements OnInit, OnChanges, OnDestroy {
  // Input for project ID
  @Input({ required: true }) projectID!: string;

  // Environment configuration
  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;

  // Reactive state using signals (initialized at field level for AOT compatibility)
  private readonly amenitiesSignal = signal<Amenity[]>([]);
  private readonly currentSlideSignal = signal<number>(0);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Cleanup subject for subscriptions
  private readonly destroy$ = new Subject<void>();

  // Computed signals for derived state - using explicit function syntax for AOT compatibility
  readonly amenities = this.amenitiesSignal.asReadonly();
  readonly currentSlide = this.currentSlideSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  
  readonly hasAmenities = computed((): boolean => {
    return this.amenitiesSignal().length > 0;
  });
  
  readonly canNavigate = computed((): boolean => {
    return this.amenitiesSignal().length > 1;
  });
  
  readonly totalAmenities = computed((): number => {
    return this.amenitiesSignal().length;
  });

  // Computed for carousel transform
  readonly carouselTransform = computed((): string => {
    return `translateX(-${this.currentSlideSignal() * 100}%)`;
  });

  // Traditional constructor injection for maximum AOT compatibility
  constructor(
    private readonly http: HttpClient,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {
    if (this.projectID) {
      this.fetchAllProjectAminities();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectID'] && !changes['projectID'].firstChange && this.projectID) {
      this.fetchAllProjectAminities();
    }
  }

  /**
   * Fetch all amenities for the current project
   * Uses optimized RxJS with proper error handling
   */
  fetchAllProjectAminities(): void {
    if (!this.projectID) {
      this.errorSignal.set('Project ID is required');
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const request: FetchAmenitiesRequest = { project_id: this.projectID };

    this.http
      .post<Amenity[]>(`${this.baseUrl}/fetch_project_amenities`, request)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.errorSignal.set('Unable to fetch project amenities.');
          this.snackBar.open('Unable to fetch project amenities.', 'Close', {
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
          const amenities = Array.isArray(res) ? res : [];
          this.amenitiesSignal.set(amenities);
          
          // Reset slide if current slide is out of bounds
          const currentSlide = this.currentSlideSignal();
          const totalAmenities = amenities.length;
          if (totalAmenities === 0) {
            this.currentSlideSignal.set(0);
          } else if (currentSlide >= totalAmenities) {
            this.currentSlideSignal.set(Math.max(0, totalAmenities - 1));
          }
          
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Preview amenity images in a dialog
   */
  previewImages(amenity: Amenity): void {
    const dialogData: PreviewImagesDialogData = {
      images: amenity,
      name: 'amenty_photo'
    };

    this.dialog.open(PreviewImagesComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: dialogData,
    });
  }

  /**
   * Open add/edit amenities dialog
   */
  openConfiguration(action: 'add' | 'edit', row?: Amenity): void {
    const dialogRef = this.dialog.open(AddAminitiesComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Amenities' : 'Edit Amenities',
        apiUrl: action === 'add' ? 'add_amenities' : 'edit_amenities',
        successMessage: action === 'add' 
          ? 'Amenities added successfully' 
          : 'Amenities updated successfully',
        rowData: row,
        projectid: this.projectID,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.fetchAllProjectAminities();
        }
      });
  }

  /**
   * Delete amenity with confirmation dialog
   * Uses optimized RxJS and proper error handling
   */
  deleteAmenity(amenityId: number, index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete this amenity?'
      }
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.snackBar.open('Failed to delete amenity.', 'Close', { 
            duration: 3000 
          });
          return of(null);
        })
      )
      .subscribe((result: ConfirmDialogResult | null) => {
        if (result?.confirmed) {
          this.executeDelete(amenityId, index);
        }
      });
  }

  /**
   * Execute the actual deletion
   */
  private executeDelete(amenityId: number, index: number): void {
    const request: DeleteAmenityRequest = { amenity_id: amenityId };

    this.http
      .post(`${this.baseUrl}/delete_amenities`, request)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.snackBar.open('Failed to delete amenity.', 'Close', { 
            duration: 3000 
          });
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response !== null) {
            this.snackBar.open('Amenity deleted successfully!', 'Close', { 
              duration: 3000 
            });
            
            // Optimistic UI update using signals
            const currentAmenities = this.amenitiesSignal();
            const updatedAmenities = currentAmenities.filter(
              (_, i) => i !== index
            );
            this.amenitiesSignal.set(updatedAmenities);

            // Adjust current slide to stay within bounds
            const newLength = updatedAmenities.length;
            if (this.currentSlideSignal() >= newLength) {
              this.currentSlideSignal.set(Math.max(0, newLength - 1));
            }
            
            this.cdr.markForCheck();
          }
        }
      });
  }

  /**
   * Navigate to previous slide
   */
  prevSlide(): void {
    const total = this.totalAmenities();
    if (total <= 1) return;
    
    const current = this.currentSlideSignal();
    const newSlide = current === 0 ? total - 1 : current - 1;
    this.currentSlideSignal.set(newSlide);
    this.cdr.markForCheck();
  }

  /**
   * Navigate to next slide
   */
  nextSlide(): void {
    const total = this.totalAmenities();
    if (total <= 1) return;
    
    const current = this.currentSlideSignal();
    const newSlide = (current + 1) % total;
    this.currentSlideSignal.set(newSlide);
    this.cdr.markForCheck();
  }

  /**
   * Navigate to specific slide
   */
  goToSlide(index: number): void {
    const total = this.totalAmenities();
    if (index >= 0 && index < total && index !== this.currentSlideSignal()) {
      this.currentSlideSignal.set(index);
      this.cdr.markForCheck();
    }
  }

  /**
   * TrackBy function for ngFor optimization
   */
  trackByAmenityId(index: number, amenity: Amenity): number {
    return amenity.amenity_id;
  }

  /**
   * Get full image URL
   * Handles both string and array formats
   */
  getImageUrl(photoPath: string | string[]): string {
    if (!photoPath) {
      return 'assets/Images/null_image.png'; // Fallback image
    }
    
    // If it's an array, get the first image
    if (Array.isArray(photoPath)) {
      return photoPath.length > 0 
        ? `${this.storageUrl}/${photoPath[0]}` 
        : 'assets/Images/null_image.png';
    }
    
    // If it's a string, check if it contains commas (multiple images)
    const path = photoPath.toString().trim();
    if (path.includes(',')) {
      const firstImage = path.split(',')[0].trim();
      return firstImage ? `${this.storageUrl}/${firstImage}` : 'assets/Images/null_image.png';
    }
    
    // Single image path
    return path ? `${this.storageUrl}/${path}` : 'assets/Images/null_image.png';
  }

  /**
   * Handle image load error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/Images/null_image.png'; // Fallback to default image
  }

  /**
   * Cleanup subscriptions
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
