import { Component, ElementRef, Input } from '@angular/core';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../../../environments/environment';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { NoDataErrorMessageComponent } from '../../../../no-data-error-message/no-data-error-message.component';

@Component({
  selector: 'app-skill-card-view',
  standalone: true,
  imports: [NoDataErrorMessageComponent, AngularMaterialModule, CommonModule, ],
  templateUrl: './skill-card-view.component.html',
  styleUrl: './skill-card-view.component.scss'
})
export class SkillCardViewComponent {
     @Input() EmployeeID!: string | number;

  applicantSkills: any = [];
    baseUrl = environment.API_URL;
    storageUrl = environment.STORAGE_URL;

      constructor(
        private elementRef: ElementRef,
        public dialog: MatDialog,
        private http: HttpClient,
        // protected dateFormatService: DateFormatService,
        private sanitizer: DomSanitizer,
        private snackbarService: SnackbarService
      ) { }

  openUpdateSkillDialog(object: any): void {
    // const dialogRef = this.dialog.open(AddUpdateSkillDialogComponent, {
    //   data: {
    //     dialogFor: 'Update',
    //     successMessage: 'Skill updated successfully',
    //     data: object,
    //     onUploadComplete: this.fetchApplicantSkills.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  }

  openAddSkillDialog(): void {
    // const dialogRef = this.dialog.open(AddUpdateSkillDialogComponent, {
    //   data: {
    //     dialogFor: 'Add',
    //     successMessage: 'Skill added successfully',
    //     onUploadComplete: this.fetchApplicantSkills.bind(this),
    //   },
    // });
    // dialogRef.disableClose = true;
  };

  async fetchApplicantSkills(resolve?: any, reject?: any) {
    const url = `${this.baseUrl}/fetch_applicant_skills`;
    const requestBody = {
      applicant_id: sessionStorage.getItem('applicant_id')
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (response: any) => {
          // console.log(response);
          this.applicantSkills = response;
        },
        error: (error) => {
          console.error(error);
          reject && reject();
        },
        complete: () => {
          resolve && resolve();
        }
      });
  }


}
