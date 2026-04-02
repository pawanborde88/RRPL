import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { AddSOPStepsComponent } from '../add-sopsteps/add-sopsteps.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-add-edit-sopsteps',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    QuillModule
  ],
  templateUrl: './add-edit-sopsteps.component.html',
  styleUrl: './add-edit-sopsteps.component.scss',
})



export class AddEditSOPStepsComponent implements OnInit {


    public quillconfig = {
      toolbar: {
        container: [
          ['bold', 'italic', 'underline', 'strike', 'image', 'video'],
          [{'size': ['xsmall', 'small', 'medium', 'large', 'xlarge']}],
          [{'align': []}],
          ['clean'],
          ['link']
        ]
      }
    };

  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  purpose: string = '';

  userId: number | null = Number(sessionStorage.getItem('session_id'));
  roleId: number = Number(sessionStorage.getItem('role_id'));
  allEmployees: any[] = [];
  teamData: any[] = [];
  allSOPStepsList: any;
  sopCategoryData: any[] = [];
  selectedFile: File | null = null;
  imageSize: string | null = null;
  PartnerLogoPath = 'assets/Images/dummy.png';
  storageUrl = environment.STORAGE_URL;
  logoSet: Boolean = false;
  SOPId: any = null;
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,

    private router: Router,
    private snackBar: MatSnackBar,
    private activateRoute: ActivatedRoute,
    private fetch: FetchFunctionsService
  ) {}

  addSOPForm = new FormGroup({
    title: new FormControl('', Validators.required),
    team_id: new FormControl(''),
    user_id: new FormControl(''),
    sop_category_id: new FormControl('', Validators.required),
    sop_detail: new FormControl('', Validators.required),
    featured_image: new FormControl(null),
    sop_detail_id: new FormControl(this.SOPId), // Initialize with null
  });

  ngOnInit(): void {
    this.fetchTeams();
    this.fetchSopCategory(); 
    this.activateRoute.paramMap.subscribe((params) => {
      this.SOPId = params.get('id');
      this.fetchSingleSOP(this.SOPId);
      this.fetchSOPSteps(this.SOPId);
    });

    this.addSOPForm.get('team_id')?.valueChanges.subscribe(() => {
      this.fetchUsersTeam();
    });
  }
  onSubmit() {

    if (this.SOPId === null || this.SOPId === undefined) {
      this.addSOPForm.get('sop_detail_id')?.disable();
    } else {
      this.addSOPForm.get('sop_detail_id')?.enable();
    }

    // Prepare FormData to submit
    const formData = new FormData();
    formData.append('title', this.addSOPForm.get('title')?.value || '');
    formData.append('team_id', this.addSOPForm.get('team_id')?.value || '');
    formData.append('user_id', this.userId?.toString() || '');
    formData.append(
      'sop_category_id',
      this.addSOPForm.get('sop_category_id')?.value || ''
    );
    formData.append(
      'sop_detail',
      this.addSOPForm.get('sop_detail')?.value || ''
    );

    // Add the sop_detail_id based on SOPId
    if (this.SOPId) {
      formData.append('sop_detail_id', this.SOPId); // Use SOPId as sop_detail_id
    } else {
      formData.append(
        'sop_detail_id',
        this.addSOPForm.get('sop_detail_id')?.value || ''
      ); // If SOPId is not present, take the form value
    }

    // Append featured image if selected
    if (this.selectedFile) {
      formData.append('featured_image', this.selectedFile);
    }

    // Make the HTTP POST request to save the SOP
    this.http.post(`${this.baseUrl}/add_sop_details`, formData).subscribe({
      next: () => {
        // Show success message
        this.snackBar.open('SOP saved successfully', 'Close', {
          duration: 3000,
        });
        this.addSOPForm.reset();
        this.deleteFile();
      },
      error: (err) => {
        // Show error message
        console.error('Error saving SOP:', err);
        this.snackBar.open('Failed to save SOP', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.router.navigateByUrl('/all-sop');
      },
    });
  }

  fetchTeams() {
    this.http.get(`${this.baseUrl}/fetch_team_details`).subscribe({
      next: (res: any) => (this.teamData = res),
      error: (err) => console.error('Error fetching teams:', err),
    });
  }

  fetchSopCategory() {
    this.http.get(`${this.baseUrl}/fetch_sop_category`).subscribe({
      next: (res: any) => (this.sopCategoryData = res),
      error: (err) => console.error('Error fetching SOP categories:', err),
    });
  }

  fetchSOPSteps(SOPID: number) {
    this.http
      .post(`${this.baseUrl}/fetch_sop_step`, { sop_detail_id: SOPID })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.allSOPStepsList = res; // Assuming the response contains sop_steps and sop_detail.
          }
        },
        error: (err) => console.error('Error fetching fetch_sop_step:', err),
      });
  }

  fetchUsersTeam() {
    const teamId = this.addSOPForm.get('team_id')?.value;

    const obj = {team_id: teamId };

    this.http.post(`${this.baseUrl}/fetch_users_as_team`, obj).subscribe({
      next: (res: any) => (this.allEmployees = res),
      error: (err) => console.error('Error fetching employees:', err),
    });
  }

  onChangeFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.imageSize = (file.size / 1024).toFixed(2) + ' KB';
    }
  }

  deleteFile() {
    this.selectedFile = null;
    this.imageSize = null;
    this.addSOPForm.patchValue({ featured_image: null });
  }

  editorConfig: AngularEditorConfig = {
    editable: true,
    showToolbar: true,
    placeholder: 'Enter SOP description here...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    toolbarHiddenButtons: [[]],
  };

  // Method to determine the image URL to display
  featuredImageUrl(): string {
    // Use the selected file's URL if a file is chosen
    if (this.selectedFile) {
      return URL.createObjectURL(this.selectedFile);
    }
    // Use the `featured_image` value from the form if available
    const featuredImage = this.addSOPForm.get('featured_image')?.value;
    if (featuredImage) {
      return `${this.storageUrl}/${featuredImage}`;
    }
    // Fallback image or default placeholder
    return 'assets/Images/dummy.png';
  }

  fetchSingleSOP(ID: any) {
    if (!ID) {
      console.error('No SOP ID found');
      return;
    }

    const obj = { sop_detail_id: ID };

    this.http.post(`${this.baseUrl}/fetch_signal_sop_details`, obj).subscribe({
      next: (res: any) => {
        if (res) {
          const sopData = res;

          // Patch the form with API data
          this.addSOPForm.patchValue({
            title: sopData.title || '',
            team_id: sopData.team_id || '',
            user_id: sopData.user_id || '',
            sop_category_id: res.sop_category_id || '',
            sop_detail: sopData.sop_detail || '',
            featured_image: sopData.featured_image || null,
            sop_detail_id: sopData.sop_detail_id || null,
          });

          // Set image and additional properties
          this.logoSet = !!sopData.featured_image;
          this.PartnerLogoPath = sopData.featured_image
            ? `${this.storageUrl}/${sopData.featured_image}`
            : 'assets/Images/fallback.webp';
        } else {
          console.error('Invalid response data:', res);
        }
      },
      error: (err) => {
        console.error('Error fetching SOP details:', err);
      },
    });
  }

  addSOPStep(item?: any): void {
    this.dialog
      .open(AddSOPStepsComponent, {
        autoFocus: false,
        minWidth: '50vw',
        maxWidth: '50vh',
        maxHeight: '100vh',

        data: { item, sop_detail_id: this.SOPId },
      })
      .afterClosed()
      .subscribe((result: boolean) => {
        if (result) {
          this.fetchSOPSteps(this.SOPId);
        }
      });
  }

  deleteStep(sopId: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this Step?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          sop_step_id: sopId,
        };
        this.http
          .post(`${this.baseUrl}/delete_step`, requestPayload)
          .subscribe({
            next: (data: any) => {
              console.log(data);
              this.snackBar.open('SOP deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchSOPSteps(this.SOPId); // Ensure this is called here to update the plans
            },
            error: (err: any) => {
              console.log(err);
              this.snackBar.open('Unable to Delete Records.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
