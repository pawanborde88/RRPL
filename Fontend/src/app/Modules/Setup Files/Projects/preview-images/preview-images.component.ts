import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectionStrategy,
  AfterViewInit,
  signal,
  computed,
  effect,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { environment } from '../../../../../environments/environment';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, switchMap } from 'rxjs/operators';
import {
  ImageSource,
  PreviewImagesDialogData,
  ScrollState
} from './preview-images.models';
import {
  ResolveImagePipe,
  IsImageSelectedPipe,
  ImageUrlPipe
} from './preview-images.pipes';

/**
 * High-performance image preview component with Angular 17+ advanced patterns:
 * - Signals for reactive state management
 * - Computed signals for derived state
 * - OnPush change detection strategy
 * - Clean dependency injection with inject()
 * - Optimized RxJS with takeUntilDestroyed
 * - Image preloading
 * - Type safety
 */
@Component({
  selector: 'app-preview-images',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    ResolveImagePipe,
    IsImageSelectedPipe,
    ImageUrlPipe,
  ],
  templateUrl: './preview-images.component.html',
  styleUrl: './preview-images.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewImagesComponent implements OnInit, OnDestroy, AfterViewInit {
  // Dependency injection using inject()
  private readonly snackBar = inject(MatSnackBar);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  public readonly dialogRef = inject(MatDialogRef<PreviewImagesComponent>);
  public readonly data = inject<PreviewImagesDialogData>(MAT_DIALOG_DATA);
  private readonly destroyRef = inject(DestroyRef);

  // Environment configuration
  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;

  // View child with typed element
  @ViewChild('scrollContainer', { static: false, read: ElementRef })
  scrollContainer!: ElementRef<HTMLDivElement>;

  // Signal-based state management
  private readonly imagesSignal = signal<ImageSource[]>([]);
  private readonly imageKeySignal = signal<string>('');
  private readonly selectedImageSignal = signal<string>('');
  private readonly imageLoadedSignal = signal<boolean>(false);
  private readonly scrollStateSignal = signal<ScrollState>({
    canScrollLeft: false,
    canScrollRight: false,
  });

  // Exposed signals for template
  readonly images = this.imagesSignal.asReadonly();
  readonly imageKey = this.imageKeySignal.asReadonly();
  readonly selectedImage = this.selectedImageSignal.asReadonly();
  readonly imageLoaded = this.imageLoadedSignal.asReadonly();
  readonly scrollState = this.scrollStateSignal.asReadonly();

  // Computed signals for derived state
  readonly currentImageIndex = computed(() => {
    const selectedImage = this.selectedImageSignal();
    const images = this.imagesSignal();

    if (!selectedImage || images.length === 0) return 0;

    const imageKey = this.imageKeySignal();
    return images.findIndex(img =>
      this.resolveImagePath(img, imageKey) === selectedImage
    ) || 0;
  });

  readonly hasMultipleImages = computed(() => this.imagesSignal().length > 1);

  readonly currentImage = computed(() => {
    const index = this.currentImageIndex();
    const images = this.imagesSignal();
    return index >= 0 && index < images.length ? images[index] : null;
  });

  readonly canDeleteCurrentImage = computed(() => {
    const current = this.currentImage();
    return current !== null &&
      typeof current === 'object' &&
      'project_image_id' in current &&
      current.project_image_id !== undefined;
  });

  readonly currentProjectImageId = computed(() => {
    const current = this.currentImage();
    return current !== null && typeof current === 'object' && 'project_image_id' in current
      ? current.project_image_id as number
      : undefined;
  });

  // Preloaded images cache
  private readonly preloadedImages = new Set<string>();

  constructor() {
    // Effect for preloading adjacent images when selection changes
    effect(() => {
      const currentIndex = this.currentImageIndex();
      const images = this.imagesSignal();
      if (images.length > 0 && currentIndex >= 0) {
        this.preloadAdjacentImages(currentIndex);
      }
    });

    // Effect for scrolling thumbnail into view when selection changes
    effect(() => {
      const currentIndex = this.currentImageIndex();
      if (currentIndex >= 0) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => this.scrollToThumbnail(currentIndex), 0);
      }
    });
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupKeyboardNavigation();
  }

  /**
   * Initialize component state with type-safe data
   */
  private initializeComponent(): void {
    this.imageKeySignal.set(this.data.name);

    // Ensure images is always an array with type safety
    const images = Array.isArray(this.data.images)
      ? this.data.images
      : [this.data.images];

    this.imagesSignal.set(images);

    // Set initial selected image - use initialIndex if provided, otherwise use first image
    if (images.length > 0) {
      const initialIndex = this.data.initialIndex !== undefined && this.data.initialIndex >= 0 && this.data.initialIndex < images.length
        ? this.data.initialIndex
        : 0;
      const initialImage = this.resolveImagePath(images[initialIndex], this.data.name);
      this.selectedImageSignal.set(initialImage);
    }
  }

  /**
   * Setup keyboard navigation for better UX
   */
  private setupKeyboardNavigation(): void {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((event: KeyboardEvent) => ['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key))
      )
      .subscribe((event: KeyboardEvent) => {
        event.preventDefault();
        switch (event.key) {
          case 'ArrowLeft':
            this.navigateImages('prev');
            break;
          case 'ArrowRight':
            this.navigateImages('next');
            break;
          case 'Escape':
            this.closeDialog();
            break;
        }
      });
  }

  /**
   * Delete project image with optimized RxJS
   */
  deleteProjectImage(projectImageID: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete image?' },
    });

    dialogRef.afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(result => !!result),
        switchMap(() =>
          this.http.post(`${this.baseUrl}/delete_project_image`, {
            project_image_id: projectImageID
          })
        )
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Project image deleted successfully', 'Close', {
            duration: 3000,
          });
          this.handleImageDeletionSuccess(projectImageID);
        },
        error: (err) => {
          if (!environment.production) {
            console.error('Image deletion error:', err);
          }
          this.snackBar.open('Unable to delete the image.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  /**
   * Handle successful image deletion and update state
   */
  private handleImageDeletionSuccess(projectImageID: number): void {
    const updatedImages = this.imagesSignal().filter(
      (img) => typeof img === 'object' && img.project_image_id !== projectImageID
    );

    this.imagesSignal.set(updatedImages);

    if (updatedImages.length > 0) {
      const firstImage = this.resolveImagePath(updatedImages[0], this.imageKeySignal());
      this.selectedImageSignal.set(firstImage);
    } else {
      this.closeDialog();
    }
  }

  /**
   * View a specific image with optimized state updates
   */
  viewImage(imagePath: string): void {
    if (imagePath === this.selectedImageSignal()) return;

    this.selectedImageSignal.set(imagePath);
    this.imageLoadedSignal.set(false);
  }

  /**
   * Close dialog
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  ngAfterViewInit(): void {
    this.initializeScrollContainer();
    this.setupScrollListener();
  }

  /**
   * Initialize scroll container with calculated dimensions
   */
  private initializeScrollContainer(): void {
    if (!this.scrollContainer) return;

    const container = this.scrollContainer.nativeElement;
    const cardElement = container.querySelector('.thumbnail-card') as HTMLElement;
    const cardWidth = cardElement ? cardElement.offsetWidth + 12 : 112;

    container.style.setProperty('--card-width', `${cardWidth}px`);
    this.updateScrollButtons();
  }

  /**
   * Setup scroll listener with debouncing for performance
   */
  private setupScrollListener(): void {
    if (!this.scrollContainer) return;

    fromEvent(this.scrollContainer.nativeElement, 'scroll')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(50)
      )
      .subscribe(() => this.updateScrollButtons());
  }

  /**
   * Scroll thumbnails in specified direction
   */
  scroll(direction: 'left' | 'right'): void {
    if (!this.scrollContainer) return;

    const container = this.scrollContainer.nativeElement;
    const cardWidth = parseInt(
      getComputedStyle(container).getPropertyValue('--card-width') || '112'
    );
    const visibleCardsCount = Math.floor(container.offsetWidth / cardWidth);
    const scrollAmount = (direction === 'left' ? -1 : 1) * visibleCardsCount * cardWidth;

    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  }

  /**
   * Update scroll button states reactively
   */
  private updateScrollButtons(): void {
    if (!this.scrollContainer) return;

    const el = this.scrollContainer.nativeElement;
    const newState: ScrollState = {
      canScrollLeft: el.scrollLeft > 0,
      canScrollRight: el.scrollLeft + el.clientWidth < el.scrollWidth,
    };

    // Only update if state changed
    const currentState = this.scrollStateSignal();
    if (
      newState.canScrollLeft !== currentState.canScrollLeft ||
      newState.canScrollRight !== currentState.canScrollRight
    ) {
      this.scrollStateSignal.set(newState);
    }
  }

  /**
   * Handle manual scroll events
   */
  onScroll(): void {
    this.updateScrollButtons();
  }

  /**
   * Navigate between images with circular navigation
   */
  navigateImages(direction: 'prev' | 'next'): void {
    const images = this.imagesSignal();
    if (images.length === 0) return;

    const currentIndex = this.currentImageIndex();
    const totalImages = images.length;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : totalImages - 1;
    } else {
      newIndex = currentIndex < totalImages - 1 ? currentIndex + 1 : 0;
    }

    const imageKey = this.imageKeySignal();
    const newImagePath = this.resolveImagePath(images[newIndex], imageKey);
    this.selectedImageSignal.set(newImagePath);
    this.imageLoadedSignal.set(false);
  }

  /**
   * Scroll to make the selected thumbnail visible with optimization
   */
  private scrollToThumbnail(index: number): void {
    if (!this.scrollContainer?.nativeElement) return;

    requestAnimationFrame(() => {
      const thumbnails = this.scrollContainer.nativeElement.querySelectorAll('.thumbnail-card');
      const thumbnail = thumbnails[index] as HTMLElement;

      if (thumbnail) {
        thumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    });
  }

  /**
   * Download the currently selected image
   */
  downloadImage(): void {
    const selectedImage = this.selectedImageSignal();
    if (!selectedImage) return;

    const imageUrl = `${this.storageUrl}/${selectedImage}`;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.setAttribute('download', this.getFileNameFromUrl(selectedImage));
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Handle image load event
   */
  onImageLoad(): void {
    this.imageLoadedSignal.set(true);
  }

  /**
   * TrackBy function for ngFor optimization
   */
  trackByImage(index: number, image: ImageSource): string | number {
    if (typeof image === 'object' && 'project_image_id' in image) {
      return image.project_image_id as number;
    }
    return typeof image === 'string' ? image : index;
  }

  /**
   * Get resolved image path for template usage
   */
  getResolvedImagePath(image: ImageSource): string {
    return this.resolveImagePath(image, this.imageKeySignal());
  }

  /**
   * Check if image is selected (for template usage)
   */
  isImageSelected(image: ImageSource): boolean {
    const imageKey = this.imageKeySignal();
    return this.resolveImagePath(image, imageKey) === this.selectedImageSignal();
  }

  /**
   * Resolve image path from ImageSource (object or string)
   */
  private resolveImagePath(image: ImageSource, imageKey: string): string {
    return typeof image === 'object' && imageKey in image
      ? (image[imageKey] as string)
      : (image as string);
  }

  /**
   * Preload adjacent images for smooth navigation
   */
  private preloadAdjacentImages(currentIndex: number): void {
    const images = this.imagesSignal();
    const imageKey = this.imageKeySignal();

    const indicesToPreload = [
      currentIndex - 1 >= 0 ? currentIndex - 1 : images.length - 1,
      currentIndex + 1 < images.length ? currentIndex + 1 : 0,
    ];

    indicesToPreload.forEach(index => {
      const imagePath = this.resolveImagePath(images[index], imageKey);
      const fullUrl = `${this.storageUrl}/${imagePath}`;

      if (!this.preloadedImages.has(fullUrl)) {
        const img = new Image();
        img.src = fullUrl;
        this.preloadedImages.add(fullUrl);
      }
    });
  }

  /**
   * Extract filename from URL
   */
  private getFileNameFromUrl(url: string): string {
    try {
      return url.split('/').pop() || 'image';
    } catch {
      return 'image';
    }
  }

  /**
   * Cleanup resources
   */
  ngOnDestroy(): void {
    this.preloadedImages.clear();
  }
}
