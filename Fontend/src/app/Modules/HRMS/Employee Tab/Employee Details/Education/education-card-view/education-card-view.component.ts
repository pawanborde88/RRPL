import { Component, Input, OnInit } from '@angular/core';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { AddUpdateEducationDialogComponent } from '../add-update-education-dialog/add-update-education-dialog.component';
import { environment } from '../../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { NoDataErrorMessageComponent } from '../../../../no-data-error-message/no-data-error-message.component';

@Component({
  selector: 'app-education-card-view',
  standalone: true,
  imports: [AngularMaterialModule, CommonModule, NoDataErrorMessageComponent],
  templateUrl: './education-card-view.component.html',
  styleUrl: './education-card-view.component.scss',
})
export class EducationCardViewComponent implements OnInit {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  applicantEducation: any = [];
  @Input() EmployeeID!: string | number;

  constructor(public dialog: MatDialog, private http: HttpClient) {}
  ngOnInit(): void {
    this.fetchApplicantEducation();
  }

  openEducationDialog(action: string, Item?: any): void {
    const dialogRef = this.dialog.open(AddUpdateEducationDialogComponent, {
      data: {
        title:
          action === 'add'
            ? 'Add Education Details'
            : 'Update Education Details',
        apiUrl:
          action === 'add'
            ? 'add_education_information'
            : 'update_education_information',
        successMessage:
          action === 'add'
            ? 'Education Details added successfully'
            : 'Education Details updated successfully',
        onUploadComplete: Item,
        employeeData: this.EmployeeID,
      },
    });
    dialogRef.disableClose = true;
    dialogRef.afterClosed().subscribe((result) => {
      debugger;
      if (result && result.success) {
        console.log('Dialog closed with result:', result);
        this.fetchApplicantEducation();
      } else {
        console.log('Dialog closed without a successful result.');
      }
    });
  }



  checkGradeType = (number: any) => {
    let num = Number(number);
    if (num <= 10) {
      return num.toString() + ' (CGPA)';
    } else {
      return num.toString() + ' (Percentage)';
    }
  };

  async fetchApplicantEducation(): Promise<void> {
    const url = `${this.baseUrl}/education_information`;
    const requestBody = {
      employee_id: this.EmployeeID,
    };

    this.http.post(url, requestBody).subscribe({
      next: (response: any) => {
        // console.log(response);
        this.applicantEducation = response;
      },
      error: (error) => {
        console.error(error);
      },
      complete: () => {},
    });
  }

  openDeleteEducationDialog(): void {
    const dialogRef = this.dialog.open(AddUpdateEducationDialogComponent, {

    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchApplicantEducation();
      }
    });
  }
}
