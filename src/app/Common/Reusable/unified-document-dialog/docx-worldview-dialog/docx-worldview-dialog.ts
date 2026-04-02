import { Component, inject, Inject, OnInit, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UnifiedDocumentDialogService } from '../unified-document-dialog.service';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-docx-worldview-dialog',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule, NgxDocViewerModule],
  templateUrl: './docx-worldview-dialog.html',
  styleUrl: './docx-worldview-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocxWorldviewDialog implements OnInit {
  private readonly documentService = inject(UnifiedDocumentDialogService);
  private readonly dialogRef = inject(MatDialogRef<DocxWorldviewDialog>);
  private readonly destroyRef = inject(DestroyRef);
  public readonly data = inject<any>(MAT_DIALOG_DATA);

  readonly letterData = signal<any>(null);
  readonly loading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);

  ngOnInit(): void {
    this.fetchLetterData();
  }

  fetchLetterData(): void {
    const { project_id, letter_type_id, letter_generation_id, file_url } = this.data;

    // Proactively use file_url if already provided in data to speed up display
    if (file_url) {
      this.letterData.set({ file_url });
      return;
    }

    if (project_id && letter_type_id && letter_generation_id) {
      this.loading.set(true);
      this.hasError.set(false);
      
      this.documentService.fetchAgreementLetter(project_id, letter_type_id, letter_generation_id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            if (res && res.file_url) {
              this.letterData.set(res);
            } else {
              this.hasError.set(true);
            }
            this.loading.set(false);
          },
          error: (err) => {
            console.error('API Error:', err);
            this.hasError.set(true);
            this.loading.set(false);
          }
        });
    } else {
      console.warn('Missing required data for API call:', { project_id, letter_type_id, letter_generation_id });
      this.hasError.set(true);
    }
  }
}
