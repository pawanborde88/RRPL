import { Component, Input } from '@angular/core';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../../../../../environments/environment';
import { UpdateCoverLetterDataDialogComponent } from '../update-cover-letter-data-dialog/update-cover-letter-data-dialog.component';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cover-letter-card-view',
  standalone: true,
  imports: [AngularMaterialModule, CommonModule],
  templateUrl: './cover-letter-card-view.component.html',
  styleUrl: './cover-letter-card-view.component.scss'
})
export class CoverLetterCardViewComponent {

    @Input() EmployeeID!: string | number;
  coverLetterContent: SafeHtml = '';
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  employeeDetails: any = {};  // Initialize as an object (not an array) for employee details
  employeeCoverLetter: SafeHtml = '';  // Change to SafeHtml if it's meant to store sanitized HTML content

  constructor(
    public dialog: MatDialog,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private snackbarService: SnackbarService
  ) { }

  openUpdateCoverLetterDialog(): void {
    const dialogRef = this.dialog.open(UpdateCoverLetterDataDialogComponent, {
      data: {
        data: this.employeeCoverLetter,  // Pass the sanitized cover letter HTML
        onUploadComplete: this.fetchEmployeeDetails.bind(this),  // Use the correct method name
      },
    });
    dialogRef.disableClose = true;
  };

  async fetchEmployeeDetails(): Promise<void> {
    const url = `${this.baseUrl}/fetch_single_employee`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    try {
      const res: any = await this.http.post(url, requestBody).toPromise();
      if (res && res.length > 0) {
        const response = res[0];
        this.employeeDetails = response;
        this.employeeCoverLetter = this.sanitizer.bypassSecurityTrustHtml(this.employeeDetails.cover_letter);
      } else {
        this.employeeDetails = {};  // Ensure it's an empty object when no data is found
        this.employeeCoverLetter = '';  // Clear the cover letter if no data
      }
    } catch (error) {
      console.error(error);
      this.snackbarService.showDataSnackbar('Failed to fetch employee details');
    }
  }
}
