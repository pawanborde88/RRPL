import { HttpClient } from '@angular/common/http';
import { Component, Inject, ViewChild, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QuillEditorComponent } from 'ngx-quill';
import Quill from 'quill';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../../../environments/environment';
import { SnackbarService } from '../../../../../../Service/snackbar.service';


@Component({
  selector: 'app-update-cover-letter-data-dialog',
  standalone: true,
  imports: [AngularMaterialModule, CommonModule, ReactiveFormsModule, FormsModule, QuillEditorComponent],
  templateUrl: './update-cover-letter-data-dialog.component.html',
  styleUrls: ['./update-cover-letter-data-dialog.component.scss']
})
export class UpdateCoverLetterDataDialogComponent implements OnInit {

  coverLetterForm: FormGroup;
  quillContent: FormControl;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;

  uploading = false;
  maxCharLimit: number = 2000;
  downValue: number = 2000; // this will decrease as one types in the editor

  quillModules = {
    toolbar: [
      ['bold', 'underline', 'italic'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }]
    ]
  };

  @ViewChild('editor') editor: any;  // Assuming you're referencing the editor DOM element
  quillInstance: Quill | undefined;

  constructor(
    private dialogRef: MatDialogRef<UpdateCoverLetterDataDialogComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackbarService: SnackbarService
  ) {
    this.quillContent = new FormControl(this.data.data);
    this.coverLetterForm = new FormGroup({
      content: this.quillContent
    });
  }

  ngOnInit(): void {
    // Initialize the quill instance after view initialization
    this.initializeQuillEditor();
  }

  ngAfterViewInit(): void {
    this.quillInstance = this.editor.quillEditor as Quill;
    console.log(this.quillInstance);  // Access Quill instance for additional functionalities
  }

  private initializeQuillEditor(): void {
    if (this.editor) {
      const quillInstance = this.editor.quillEditor as Quill;
      quillInstance.on('text-change', () => this.onContentChanged());
    }
  }

  uploadCoverLetter() {
    this.uploading = true;
    const url = `${this.baseUrl}/edit_applicant`; // Replace with your API endpoint URL

    const body = {
      applicant_id: sessionStorage.getItem('session_id'),
      cover_letter: this.coverLetterForm.value.content,
    };

    this.http.patch(url, body).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.data.onUploadComplete().then(() => {
            this.snackbarService.showDataSnackbar('Cover letter updated');
          });
        } else {
          this.snackbarService.showDataSnackbar('Error occurred while updating, please try later');
        }
      },
      error: (error: any) => {
        this.snackbarService.showDataSnackbar('Error occurred while updating, please try later');
        this.uploading = false;
      },
      complete: () => {
        this.uploading = false;
        this.dialogRef.close();
      }
    });
  }

  onContentChanged() {
    if (this.editor) {
      const quillInstance = this.editor.quillEditor as Quill;
      const currentLength = quillInstance.getLength() - 1; // -1 to remove the newline by default
      this.downValue = this.maxCharLimit - currentLength;

      if (currentLength > this.maxCharLimit) {
        const excessCharacters = currentLength - this.maxCharLimit;
        quillInstance.deleteText(this.maxCharLimit, excessCharacters);
      }
    }
  }
}
