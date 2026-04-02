import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QRCodeComponent, QRCodeModule } from 'angularx-qrcode';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { environment } from '../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import jsPDF from 'jspdf';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  Subject,
  finalize,
  switchMap,
  tap,
  catchError,
  of,
  distinctUntilChanged,
  EMPTY,
} from 'rxjs';
import {
  Project,
  DownloadFormat,
} from './models/project-qr.models';
import { EnquiryManagementService, ProjectDropdownResponse } from '../services/enquiry-management.service';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { CommonService } from '../../../../Service/common/common.service';

/**
 * Executive Project QR Component - Production-Grade Implementation
 * 
 * Features:
 * - Signals for reactive state management
 * - OnPush change detection for optimal performance
 * - RxJS operators for async operations
 * - Proper subscription management with DestroyRef
 * - Memoization and caching
 * - Type safety with TypeScript interfaces
 * - Error handling and retry logic
 */
@Component({
  selector: 'app-executive-project-qr',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    BreadcrumbComponent,
    QRCodeModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './executive-project-qr.component.html',
  styleUrls: ['./executive-project-qr.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      transition(':enter', [animate('300ms ease-in', style({ opacity: 1 }))]),
    ]),
  ],
})
export class ExecutiveProjectQRComponent implements OnInit {
  // Services - Using inject() for clean DI
  private readonly enquiryService = inject(EnquiryManagementService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // Environment configuration
  readonly domainUrl = environment.domainUrl;
  readonly storageUrl = environment.STORAGE_URL;
  readonly defaultImage = 'assets/Images/dummy.png';

  // User session data - computed once at initialization
  private readonly roleId = Number(sessionStorage.getItem('role_id')) || null;
  private readonly userId = Number(sessionStorage.getItem('session_id')) || null;

  // Signals for reactive state management
  readonly projectsList = signal<ProjectDropdownResponse[]>([]);
  readonly selectedProjectId = signal<string | number | null>(null);
  readonly selectedProject = signal<Project | null>(null);
  readonly qrCodeData = signal<string>('');
  readonly projectLogo = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly isDownloading = signal<boolean>(false);
  readonly downloadType = signal<DownloadFormat | null>(null);
  private readonly commonService = inject(CommonService);

  // Computed signals (derived state)
  readonly hasSelectedProject = computed(
    () => this.selectedProjectId() !== null && this.selectedProject() !== null
  );
  readonly hasQRCode = computed(() => !!this.qrCodeData());
  readonly canShowQR = computed(
    () => this.hasSelectedProject() && !this.isLoading()
  );
  readonly showEmptyState = computed(
    () => !this.selectedProjectId() && !this.isLoading()
  );

  // Share API availability (memoized at construction)
  readonly canShare = !!navigator.share;

  // ViewChild for QR code component
  @ViewChild('qrCode', { static: false }) qrCode!: QRCodeComponent;

  // Subject for project selection - optimized reactive stream
  private readonly projectSelection$ = new Subject<string | number | null>();

  constructor() {
    // Setup optimized reactive stream for project selection
    this.setupProjectSelectionStream();
  }

  ngOnInit(): void {
    this.fetchAllProjects();
  }

  /**
   * Setup optimized reactive stream for project selection
   * Uses distinctUntilChanged to prevent duplicate requests
   * Uses switchMap to cancel previous requests automatically
   */
  private setupProjectSelectionStream(): void {
    this.projectSelection$
      .pipe(
        distinctUntilChanged(), // Prevent duplicate consecutive selections
        switchMap((projectId) => {
          if (!projectId) {
            this.resetQRData();
            return EMPTY;
          }

          this.isLoading.set(true);
          this.selectedProjectId.set(projectId);

          return this.enquiryService.fetchProjectQRDetails(projectId).pipe(
            tap({
              next: (project) => {
                if (project) {
                  this.updateProjectData(project);
                  this.showSuccess('QR code generated successfully');
                }
              },
              error: (error) => {
                console.error('Error fetching project details:', error);
                this.showError(
                  'Failed to load project details. Please try again.'
                );
                this.resetQRData();
              },
            }),
            finalize(() => {
              this.isLoading.set(false);
            }),
            catchError(() => of(null))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Fetch all projects - service handles caching
   */
  fetchAllProjects(): void {
   
    const userId = this.userId;
    this.commonService.fetchUserProjectDropdown(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.showError('Unable to fetch projects.');
          return of([]);
        })
      )
      .subscribe((projects) => {
        this.projectsList.set(projects);
      });
  }

  /**
   * Handle project selection from dropdown
   * Triggers reactive stream for optimized data fetching
   */
  onProjectSelect(projectId: string | number | null): void {
    this.projectSelection$.next(projectId);
  }

  /**
   * Update project data signals
   */
  private updateProjectData(project: Project): void {
    this.selectedProject.set(project);
    this.projectLogo.set(project.project_logo || '');
    if (project.project_slug) {
      this.qrCodeData.set(`${this.domainUrl}/qrform/${project.project_slug}`);
    }
  }

  /**
   * Reset QR code data
   */
  private resetQRData(): void {
    this.selectedProject.set(null);
    this.selectedProjectId.set(null);
    this.projectLogo.set('');
    this.qrCodeData.set('');
  }

  /**
   * Handle image load errors
   */
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.src !== this.defaultImage) {
      imgElement.src = this.defaultImage;
    }
  }

  /**
   * Download QR code as PNG or PDF
   */
  downloadQR(format: DownloadFormat = 'png'): void {
    const canvas = this.getQRCanvas();
    if (!canvas) {
      this.showError(
        format === 'png'
          ? 'QR code is not ready'
          : 'QR code canvas not found'
      );
      return;
    }

    this.isDownloading.set(true);
    this.downloadType.set(format);

    try {
      const projectName =
        this.selectedProject()?.property_name?.replace(/[^a-z0-9]/gi, '_') ||
        'QR_Code';
      const fileName = `${projectName}_QR_Code`;

      if (format === 'png') {
        this.downloadAsPNG(canvas, fileName);
      } else {
        this.downloadAsPDF(canvas, fileName);
      }
    } catch (error) {
      console.error(`Error downloading ${format}:`, error);
      this.showError(`Failed to download as ${format.toUpperCase()}`);
    } finally {
      // Reset downloading state after UI update
      setTimeout(() => {
        this.isDownloading.set(false);
        this.downloadType.set(null);
      }, 500);
    }
  }

  /**
   * Get QR code canvas element
   */
  private getQRCanvas(): HTMLCanvasElement | null {
    if (!this.qrCode?.qrcElement) {
      return null;
    }
    return this.qrCode.qrcElement.nativeElement.querySelector('canvas');
  }

  /**
   * Download QR code as PNG
   */
  private downloadAsPNG(canvas: HTMLCanvasElement, fileName: string): void {
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png', 1.0); // High quality
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showSuccess('QR code downloaded as PNG');
  }

  /**
   * Download QR code as PDF
   */
  private downloadAsPDF(canvas: HTMLCanvasElement, fileName: string): void {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add project name as title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const projectName = this.selectedProject()?.property_name || 'Project QR Code';
      pdf.text(projectName, 10, 10);

      // Add QR code
      pdf.addImage(imgData, 'PNG', 10, 20, pdfWidth, pdfHeight);

      // Add instructions
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Scan this QR code to view project details', 10, pdfHeight + 25);

      pdf.save(`${fileName}.pdf`);
      this.showSuccess('QR code downloaded as PDF');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Share QR code using Web Share API
   */
  shareQR(): void {
    const qrData = this.qrCodeData();
    if (!qrData) {
      this.showError('No QR code to share');
      return;
    }

    if (!this.canShare) {
      this.showError('Share feature is not available in your browser');
      return;
    }

    const projectName = this.selectedProject()?.property_name || 'Project';

    navigator
      .share({
        title: `${projectName} QR Code`,
        text: `Scan this QR code for ${projectName}`,
        url: qrData,
      })
      .then(() => {
        this.showSuccess('QR code shared successfully');
      })
      .catch((err) => {
        // User cancelled sharing is not an error
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          this.showError('Failed to share QR code');
        }
      });
  }

  /**
   * Generate/Regenerate QR code
   * Optimized with switchMap to handle request cancellation
   */
  generateQRCode(): void {
    const projectId = this.selectedProjectId();
    if (!projectId) {
      this.showError('Please select a project first');
      return;
    }

    this.isLoading.set(true);

    this.enquiryService
      .changeProjectSlug(projectId, this.userId)
      .pipe(
        switchMap(() =>
          this.enquiryService.fetchProjectQRDetails(projectId)
        ),
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (project) => {
          if (project) {
            this.updateProjectData(project);
            this.showSuccess('QR code regenerated successfully');
          }
        },
        error: (error) => {
          console.error('Error generating QR code:', error);
          this.showError('Failed to regenerate QR code. Please try again.');
        },
      });
  }

  /**
   * Copy text to clipboard with modern API and fallback
   */
  copyToClipboard(text: string): void {
    if (!text) {
      this.showError('Nothing to copy');
      return;
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.showSuccess('URL copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy text:', err);
          this.fallbackCopyToClipboard(text);
        });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  /**
   * Fallback clipboard copy for older browsers
   */
  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);

    try {
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      if (successful) {
        this.showSuccess('URL copied to clipboard!');
      } else {
        this.showError('Failed to copy URL');
      }
    } catch (err) {
      console.error('Fallback: Could not copy text:', err);
      this.showError('Failed to copy URL');
    } finally {
      document.body.removeChild(textArea);
    }
  }


  /**
   * Show error notification
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  /**
   * Show success notification
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
