import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Inject,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { CostomLoadingComponent } from '../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';

@Component({
  selector: 'app-project-wise-template',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CostomLoadingComponent
  ],
  templateUrl: './project-wise-template.component.html',
  styleUrls: ['./project-wise-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectWiseTemplateComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly baseUrl = environment.API_URL;
  private readonly storageUrl = environment.STORAGE_URL;
  readonly userId = Number(sessionStorage.getItem('session_id'));
  readonly pipe = new DatePipe('en-US');
  readonly selectedFiles = new Map<number, File>();

  readonly projectId = this.data.rowData?.[0]?.project_id ?? 0;
  allProjectTemplate: ProjectTemplate[] = [];
  loading = false;
  searchTerm = '';
  private abortController: AbortController | null = null;

  // HTML file validation settings
  private readonly allowedFileTypes = [
    'text/html',
    'application/xhtml+xml'
  ];

  private readonly allowedFileExtensions = ['.html', '.htm'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB for HTML files

  constructor(
    private readonly dialogRef: MatDialogRef<ProjectWiseTemplateComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ProjectWiseTemplateDialogData
  ) { }

  ngOnInit(): void {
    if (!this.projectId) {
      this.showError('Missing project identifier.');
      this.close(false);
      return;
    }
    this.fetchProjectTemplate();
  }

  ngOnDestroy(): void {
    // Abort any ongoing file downloads
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Clean up any other resources if needed
    this.selectedFiles.clear();
  }

  onFileSelected(event: Event, moduleId?: number): void {
    const { files } = event.target as HTMLInputElement;
    const file = files?.[0];
    if (!file) {
      return;
    }

    if (moduleId == null) {
      this.showError('Missing module identifier.');
      return;
    }

    // Validate file
    const validationResult = this.validateHtmlFile(file);
    if (!validationResult.isValid) {
      this.showError(validationResult.errorMessage || 'Invalid file.');
      // Reset the file input
      (event.target as HTMLInputElement).value = '';
      return;
    }

    this.selectedFiles.set(moduleId, file);
    this.uploadFile(moduleId, file);
  }

  private validateHtmlFile(file: File): { isValid: boolean; errorMessage?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        errorMessage: `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit.`
      };
    }

    // Check by file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.allowedFileExtensions.some(ext =>
      fileName.endsWith(ext)
    );

    // Check by MIME type (browser may not always detect HTML correctly)
    const hasValidMimeType = this.allowedFileTypes.includes(file.type.toLowerCase());

    // Some browsers may report empty or generic MIME types for HTML files
    // So we check extension as primary, MIME type as secondary
    if (!hasValidExtension) {
      // If extension doesn't match, check if MIME type matches
      if (!hasValidMimeType && file.type !== '') {
        // If browser reports a specific MIME type and it's not HTML
        return {
          isValid: false,
          errorMessage: 'Only HTML files (.html, .htm) are allowed.'
        };
      }

    }

    return { isValid: true };
  }

  private async checkFileContent(file: File): Promise<{ isValid: boolean; errorMessage?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result as string;

        // Check if content starts with HTML doctype or contains HTML tags
        if (content) {
          const htmlPattern = /^\s*<!DOCTYPE\s+html|<html\s|<head|<body|<!\-\-|<\?xml/i;
          if (htmlPattern.test(content.substring(0, 200))) {
            resolve({ isValid: true });
          } else {
            resolve({
              isValid: false,
              errorMessage: 'File does not appear to be a valid HTML file.'
            });
          }
        } else {
          resolve({
            isValid: false,
            errorMessage: 'Unable to read file content.'
          });
        }
      };

      reader.onerror = () => {
        resolve({
          isValid: false,
          errorMessage: 'Error reading file.'
        });
      };

      // Read only first 200 characters for validation
      const blob = file.slice(0, 200);
      reader.readAsText(blob);
    });
  }

  fetchProjectTemplate(): void {
    if (!this.projectId) {
      return;
    }

    const payload = { project_id: this.projectId };
    this.loading = true;
    this.cdr.markForCheck();

    this.http
      .post<ProjectTemplateResponse>(`${this.baseUrl}/fetch_project_template_by_project`, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.allProjectTemplate = res.data ?? [];
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching templates:', error);
          this.showError('Unable to fetch template list. Please try again.');
        },
      });
  }

  uploadFile(moduleId: number, file: File): void {
    if (!this.projectId) {
      this.showError('Missing project identifier.');
      return;
    }

    const formData = new FormData();
    formData.append('project_id', this.projectId.toString());
    formData.append('module_id', moduleId.toString());
    formData.append('file', file, file.name);
    formData.append('created_by', this.userId.toString());

    this.loading = true;
    this.cdr.markForCheck();

    this.http
      .post<{ success: boolean; message: string; data?: any }>(`${this.baseUrl}/add_project_template`, formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.showSuccess(response.message || 'HTML file uploaded successfully!');
          this.selectedFiles.delete(moduleId); // Clear from map
          this.close(true, response.message || 'HTML file uploaded successfully!');
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.showError(error.error?.message || 'Error uploading HTML file. Please try again.');
          this.selectedFiles.delete(moduleId); // Clear on error
        },
      });
  }

  getFileUrl(filePath?: string | null): string {
    if (!filePath) {
      return '';
    }
    return `${this.storageUrl}/${filePath}`;
  }

  getFileName(filePath?: string | null): string {
    if (!filePath) {
      return 'No file';
    }
    return filePath.split('/').pop() ?? filePath;
  }

  getFileExtension(filePath?: string | null): string {
    if (!filePath) {
      return '';
    }
    const fileName = this.getFileName(filePath);
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex).toLowerCase() : '';
  }

  isHtmlFile(filePath?: string | null): boolean {
    if (!filePath) {
      return false;
    }
    const extension = this.getFileExtension(filePath);
    return this.allowedFileExtensions.includes(extension);
  }

  async downloadFile(module: ProjectTemplate): Promise<void> {
    const filePath = module.file;
    if (!filePath) {
      this.showError('No file available for download.');
      return;
    }

    // Check if it's an HTML file
    if (!this.isHtmlFile(filePath)) {
      this.showError('Only HTML files can be downloaded.');
      return;
    }

    const fileUrl = this.getFileUrl(filePath);
    const fileName = this.getFileName(filePath);

    this.loading = true;
    this.cdr.markForCheck();

    // Create abort controller for cancelling download
    this.abortController = new AbortController();

    try {
      const response = await fetch(fileUrl, {
        signal: this.abortController.signal
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('HTML file not found on server.');
        } else if (response.status === 403) {
          throw new Error('Access denied to HTML file.');
        } else {
          throw new Error(`Failed to fetch HTML file: ${response.status} ${response.statusText}`);
        }
      }

      const blob = await response.blob();

      // Check if blob is empty
      if (blob.size === 0) {
        throw new Error('HTML file is empty or corrupted.');
      }

      // For HTML files, we might want to add .html extension if missing
      let downloadName = fileName;
      if (!downloadName.toLowerCase().endsWith('.html') && !downloadName.toLowerCase().endsWith('.htm')) {
        downloadName += '.html';
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      link.style.display = 'none';

      // Add to DOM, click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke object URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      // Show success message
      this.showSuccess(`Downloaded HTML file: ${downloadName}`);

    } catch (error: any) {
      console.error('Download failed:', error);

      if (error.name === 'AbortError') {
        console.log('Download was cancelled by user.');
        return;
      }

      // Show error to user
      this.showError(`Download failed: ${error.message}`);

      // Fallback to opening in new tab for HTML files (they can be viewed in browser)
      console.log('Attempting to open HTML file in new tab...');
      window.open(fileUrl, '_blank', 'noopener,noreferrer');

    } finally {
      this.loading = false;
      this.abortController = null;
      this.cdr.markForCheck();
    }
  }

  cancelDownload(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.loading = false;
      this.cdr.markForCheck();
      this.showError('Download cancelled');
    }
  }

  previewHtmlFile(module: ProjectTemplate): void {
    const filePath = module.file;
    if (!filePath) {
      this.showError('No HTML file available for preview.');
      return;
    }

    if (!this.isHtmlFile(filePath)) {
      this.showError('Only HTML files can be previewed.');
      return;
    }

    const fileUrl = this.getFileUrl(filePath);
    // Open HTML file in new tab for preview
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }

  trackByModuleId(_: number, module: ProjectTemplate): number | undefined {
    return module.module_id;
  }

  trackByFileName(_: number, module: ProjectTemplate): string {
    return module.file || '';
  }

  get filteredTemplates(): ProjectTemplate[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.allProjectTemplate;
    }
    return this.allProjectTemplate.filter((template) =>
      template.module_name?.toLowerCase().includes(term) ||
      template.file?.toLowerCase().includes(term)
    );
  }

  hasFiles(): boolean {
    return this.allProjectTemplate.some(template => template.file);
  }

  hasHtmlFiles(): boolean {
    return this.allProjectTemplate.some(template =>
      template.file && this.isHtmlFile(template.file)
    );
  }

  close(success: boolean = false, message?: string): void {
    const result = {
      success,
      message,
      refreshed: success,
      timestamp: new Date(),
      htmlFilesUploaded: this.hasHtmlFiles()
    };
    this.dialogRef.close(result);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}

interface ProjectTemplate {
  module_id?: number;
  module_name?: string;
  file?: string | null;
  uploaded_at?: string;
  uploaded_by?: number;
  file_size?: number;
  mime_type?: string;
}

interface ProjectTemplateResponse {
  success: boolean;
  message?: string;
  data: ProjectTemplate[];
}

interface ProjectWiseTemplateDialogData {
  rowData: Array<{ project_id: number; property_name: string } & ProjectTemplate>;
  projectName?: string;
}