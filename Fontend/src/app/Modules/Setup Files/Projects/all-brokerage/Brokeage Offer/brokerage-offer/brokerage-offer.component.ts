import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../../Pipes/truncate.pipe';
import { environment } from '../../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FetchFunctionsService } from '../../../../../../Service/fetch-functions.service';
import { ConfirmDialogComponent } from '../../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { BrokerageImagesComponent } from '../../../brokerage-images/brokerage-images.component';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-brokerage-offer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    TruncatePipe, // Add the pipe here
  ],
  templateUrl: './brokerage-offer.component.html',
  styleUrl: './brokerage-offer.component.scss',
})
export class BrokerageOfferComponent implements OnInit {
  @Input() projectID!: string;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  projectData: any = {};
  allBrokerageImages: any;
  roleId = Number(sessionStorage.getItem('role_id')) || null;
  userId = Number(sessionStorage.getItem('session_id')) || null;
  pipe = new DatePipe('en-US');
  projectsList: any[] = [];
  selectedProjectId: number | null = null;

  brokerageForm: FormGroup = new FormGroup({
    project_id: new FormControl(null),
  });

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
    private route: ActivatedRoute
  ) { }
  ngOnInit(): void {
    this.fetchAllProjects();

    // Sync form with selectedId if needed, though onProjectChange handles it
    this.brokerageForm.get('project_id')?.valueChanges.subscribe(id => {
      if (id) {
        this.onProjectChange(id);
      }
    });
  }
  fetchAllProjects(): void {

    const payload = {
      user_id: this.userId,
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.projectsList = res;
        }
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  onProjectChange(projectId: number): void {
    if (projectId !== null && projectId !== undefined) {
      this.selectedProjectId = projectId;
      this.fetchAllBrokerageImageOffer(this.selectedProjectId);
    }
  }
  fetchAllBrokerageImageOffer(projectId: any) {
    if (!projectId) return;

    this.http.post(`${this.baseUrl}/fetch_brokerage_image`, { project_id: projectId }).subscribe({
      next: (res: any) => {
        // Handle cases where the response might be an empty array or null
        if (res && (Array.isArray(res) ? res.length > 0 : Object.keys(res).length > 0)) {
          this.allBrokerageImages = Array.isArray(res) ? res[0] : res;
        } else {
          this.allBrokerageImages = null;
        }
      },
      error: () => {
        this.allBrokerageImages = null;
        this.snackBar.open('Unable to fetch brokerage offer images.', 'Close', { duration: 3000 });
      },
    });
  }

  deleteBrokerageImage(projectImageID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Brokerage Offer?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const requestPayload = {
          brokerage_slab_image_id: projectImageID,
        };

        this.http
          .post(`${this.baseUrl}/delete_brokerage_image`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Brokerage Offer deleted successfully', 'Close', {
                duration: 3000,
              });

              this.fetchAllBrokerageImageOffer(this.selectedProjectId);
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
  openBrokerageOfferDialog(action: string, row?: any): void {
    const dialogRef = this.dialog.open(BrokerageImagesComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: (action = 'Add Brokerage offer'),
        apiUrl: (action = 'add_brokerage_image'),
        successMessage: (action = 'Brokerage Offer added successfully'),
        rowData: row,
        projectid: this.selectedProjectId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.fetchAllBrokerageImageOffer(this.selectedProjectId);
    });
  }
}
