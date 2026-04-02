import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-resume-card-view',
  standalone: true,
  imports: [AngularMaterialModule, CommonModule],
  templateUrl: './resume-card-view.component.html',
  styleUrl: './resume-card-view.component.scss'
})
export class ResumeCardViewComponent implements OnInit {
  resumeUrl?: string = '';
  resumeLabel: string = 'View Resume';
  resumeFile?: File | null;
  hideFileInput: boolean = false;
  loadingState: boolean = false;
  applicantDetails:any[]=[];
    @Input() EmployeeID!: string | number;
    baseUrl = environment.API_URL;
    storageUrl = environment.STORAGE_URL;



    constructor(
      public dialog: MatDialog,
      private http: HttpClient,
      private snackbarService: SnackbarService
    ) { }
  ngOnInit(): void {
  this.fetchEmployeeDetails();
  }

  handleFileInput(event: any) {
    const file = event.target.files[0]; // Get the selected file
    if (file.size <= 2 * 1024 * 1024) {
      this.resumeFile = file;
      this.hideFileInput = true;
    } else {
      alert('File size exceeds the limit. Please choose a file smaller than 2 MB.');
    }
  }


  deleteFile(): void {
    this.resumeFile = null;
    this.hideFileInput = false;
  }

  formatFileSize(size: number): string {
    if (size === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  uploadResume() {
debugger
    this.snackbarService.showLoadingSnackbar();
    this.loadingState = true;

    const formData = new FormData();
    formData.append('employee_id', this.EmployeeID!.toString());
    formData.append('file', this.resumeFile!);

    this.http.post(`${this.baseUrl}/upload_resume`, formData)
      .subscribe({
        next: (res: any) => {
          // console.log(res);
          if (res.success) {
            this.fetchEmployeeDetails().then(() => {
              this.resumeFile = null;
              this.hideFileInput = false;
              this.snackbarService.showDataSnackbar('Resume Uploaded');
            });
          }
          else {
            this.snackbarService.showDataSnackbar('An error occurred, please try later');
            this.resumeFile = null;
            this.hideFileInput = false;
          }
        },
        error: (err: any) => {
          console.log(err);
          this.loadingState = false;
          this.resumeFile = null;
          this.hideFileInput = false;
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        },
        complete: () => {
          this.loadingState = false;
        }
      });
  }



    async fetchEmployeeDetails(): Promise<void> {
    const url = `${this.baseUrl}/fetch_single_employee`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    try {
      const res: any = await this.http.post(url, requestBody).toPromise();
      if (res && res.length > 0) {
        const response = res[0];
        this.applicantDetails = response;
        this.resumeUrl = response.resume ? `${this.storageUrl}/${response.resume}` : '';
      } else {
        this.applicantDetails = [];
        this.resumeUrl = '';
      }
    } catch (error) {
      console.error(error);
    }
  }

}


