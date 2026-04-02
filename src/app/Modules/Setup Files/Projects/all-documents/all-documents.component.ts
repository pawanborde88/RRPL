import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { AddDocumentComponent } from '../add-document/add-document.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AllLinksComponent } from '../all-links/all-links.component';

@Component({
  selector: 'app-all-documents',
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
    AllLinksComponent,
  ],
  templateUrl: './all-documents.component.html',
  styleUrl: './all-documents.component.scss',
})
export class AllDocumentsComponent {
  @Input() projectID!: string;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  allProjectDocuments: any[] = [];
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    console.log('Received Project ID:', this.projectID);
    if (this.projectID) {
      this.fetchAllDocuments();
    }
  }

  fetchAllDocuments(): void {
    this.http
      .post(`${this.baseUrl}/fetch_project_attachments`, {
        project_id: this.projectID,
      })
      .subscribe({
        next: (res: any) => (this.allProjectDocuments = res),
        error: () =>
          this.snackBar.open('Unable to fetch CP type.', 'Close', {
            duration: 3000,
          }),
      });
  }
  addDocument(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddDocumentComponent, {
      minWidth: '350px',
      maxWidth: '500px',
      maxHeight: '90vh',
      data: {
        title: action === 'add' ? 'Add Document' : 'Edit Document',
        apiUrl: 'add_project_attachments',
        successMessage: action === 'add'
          ? 'Document Added successfully'
          : 'Document updated successfully',
        rowData: row,
        projectid: this.projectID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllDocuments();
      }
    });
  }
  deleteDocument(docID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete this Document?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .post(`${this.baseUrl}/delete_attachment`, {
            project_attachment_id: docID,
          })
          .subscribe({
            next: (data: any) => {
              this.fetchAllDocuments();

              this.snackBar.open(` Document deleted successfully`, 'Close', {
                duration: 3000,
              });
            },
            error: (err: any) => {
              console.error(err);
              this.snackBar.open('Unable to delete the image.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
