







import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../../../../environments/environment';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddUpdateWorkExperienceDialogComponent } from '../../Experiance Section/add-update-work-experience-dialog/add-update-work-experience-dialog.component';
import { AddEditFamilyDetailsDialogComponent } from '../add-edit-family-details-dialog/add-edit-family-details-dialog.component';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { NoDataErrorMessageComponent } from '../../../../no-data-error-message/no-data-error-message.component';




@Component({
  selector: 'app-view-card-family-details',
  standalone: true,
  imports: [AngularMaterialModule, CommonModule, NoDataErrorMessageComponent, ReactiveFormsModule, FormsModule ],
  templateUrl: './view-card-family-details.component.html',
  styleUrl: './view-card-family-details.component.scss'
})
export class ViewCardFamilyDetailsComponent {



  @Input() EmployeeID!: string | number;

  applicantKnownLanguages: Array<any> = [];
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  deleteLoading:boolean =false;

  constructor(public dialog: MatDialog, private http: HttpClient , private snackbarService : SnackbarService) {}
    ngOnInit(): void {
      this.fetchEmployeeFamilyDetails();
    }

    openFamilyDetailsDialog(action: string , Item?: any): void {
      const dialogRef = this.dialog.open(AddEditFamilyDetailsDialogComponent, {
        data: {
          title: action === 'add' ? 'Add Family Details' : 'Update Family Details',
          apiUrl: action === 'add' ? 'add_employee_family' : 'update_employee_family',
          successMessage: action === 'add' ? 'Family Details added successfully' : 'Family Details updated successfully',
          onUploadComplete: Item,
          employeeData : this.EmployeeID
        },
      });
      dialogRef.disableClose = true;
      dialogRef.afterClosed().subscribe((result) => {
        debugger
        if (result && result.success) {
          console.log('Dialog closed with result:', result);
          this.fetchEmployeeFamilyDetails();
        } else {
          console.log('Dialog closed without a successful result.');
        }
      });
    }



  async fetchEmployeeFamilyDetails(): Promise<void> {
    const url = `${this.baseUrl}/fetch_employee_family`;
    const requestBody = {
      employee_id: this.EmployeeID,
    };

    this.http.post(url, requestBody).subscribe({
      next: (response: any) => {
        this.applicantKnownLanguages = response || [];
        console.log( this.applicantKnownLanguages);

      },
      error: (error) => {
        console.error('Error fetching work experiences:', error);
        this.applicantKnownLanguages = [];
      },
    });
  }


  deleteFamily(ID:any): void {
    this.deleteLoading = true;
    const url = `${this.baseUrl}/delete_employee_family`;

    this.http.post(url, { employee_family_id: ID }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackbarService.showDataSnackbar('Work experience deleted');
          this.fetchEmployeeFamilyDetails();
        } else {
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        }
      },
      error: () => {
        this.snackbarService.showDataSnackbar('An error occurred, please try later');

      },
      complete: () => (this.deleteLoading = false),
    });
  }
}
