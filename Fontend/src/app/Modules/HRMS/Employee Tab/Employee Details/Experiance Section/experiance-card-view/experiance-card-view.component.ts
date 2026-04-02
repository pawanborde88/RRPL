




import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../../../../environments/environment';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { AddUpdateWorkExperienceDialogComponent } from '../add-update-work-experience-dialog/add-update-work-experience-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoDataErrorMessageComponent } from '../../../../no-data-error-message/no-data-error-message.component';

  @Component({
    selector: 'app-experiance-card-view',
    standalone: true,
    imports: [AngularMaterialModule, CommonModule, NoDataErrorMessageComponent, ReactiveFormsModule, FormsModule ],
    templateUrl: './experiance-card-view.component.html',
    styleUrl: './experiance-card-view.component.scss'
  })
  export class ExperianceCardViewComponent implements OnInit {
  @Input() EmployeeID!: string | number;

  applicantWorkExperiences: Array<any> = [];
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;

  constructor(public dialog: MatDialog, private http: HttpClient) {}
    ngOnInit(): void {
      this.fetchApplicantWorkExperience();
    }

    openWorkExperienceDialog(action: string , Item?: any): void {
      const dialogRef = this.dialog.open(AddUpdateWorkExperienceDialogComponent, {
        data: {
          title: action === 'add' ? 'Add Work experience' : 'Update Work experience',
          apiUrl: action === 'add' ? 'add_employee_work_experience' : 'update_employee_work_experience',
          successMessage: action === 'add' ? 'Work experience added successfully' : 'Work experience updated successfully',
          onUploadComplete: Item,
          employeeData : this.EmployeeID
        },
      });
      dialogRef.disableClose = true;
      dialogRef.afterClosed().subscribe((result) => {
        debugger
        if (result && result.success) {
          console.log('Dialog closed with result:', result);
          this.fetchApplicantWorkExperience();
        } else {
          console.log('Dialog closed without a successful result.');
        }
      });
    }



  async fetchApplicantWorkExperience(): Promise<void> {
    const url = `${this.baseUrl}/fetch_employee_work_experience`;
    const requestBody = {
      employee_id: this.EmployeeID,
    };

    this.http.post(url, requestBody).subscribe({
      next: (response: any) => {
        this.applicantWorkExperiences = response || [];
        console.log( this.applicantWorkExperiences);

      },
      error: (error) => {
        console.error('Error fetching work experiences:', error);
        this.applicantWorkExperiences = [];
      },
    });
  }
}
