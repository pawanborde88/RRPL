import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';

import { environment } from '../../../../../../../environments/environment';
import { AddUpdateLanguageDialogComponent } from '../add-update-language-dialog/add-update-language-dialog.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { promises } from 'dns';
import { NoDataErrorMessageComponent } from '../../../../no-data-error-message/no-data-error-message.component';

@Component({
  selector: 'app-languages-card-view',
  standalone: true,
  imports: [AngularMaterialModule, NoDataErrorMessageComponent, CommonModule],
  templateUrl: './languages-card-view.component.html',
  styleUrl: './languages-card-view.component.scss'
})
export class LanguagesCardViewComponent implements OnInit {
     @Input() EmployeeID!: string | number;
    baseUrl = environment.API_URL;
    storageUrl = environment.STORAGE_URL;
  applicantKnownLanguages: any = [];
  deleteLoading: boolean = false;

   constructor(
      public dialog: MatDialog,
      private http: HttpClient,

      private snackbarService: SnackbarService
    ) { }
  ngOnInit(): void {
    this.fetchApplicantKnownLanguages();
    }




      openLanguageDialog(action: string , Item?: any): void {
          const dialogRef = this.dialog.open(AddUpdateLanguageDialogComponent, {
            data: {
              title: action === 'add' ? 'Add Language' : 'Update Language',
              apiUrl: action === 'add' ? 'add_employee_language' : 'edit_employee_language',
              successMessage: action === 'add' ? 'Language added successfully' : 'Language updated successfully',
              onUploadComplete: Item,
              employeeData : this.EmployeeID
            },
          });
          dialogRef.disableClose = true;
          dialogRef.afterClosed().subscribe((result) => {
            debugger
            if (result && result.success) {
              console.log('Dialog closed with result:', result);
              this.fetchApplicantKnownLanguages();
            } else {
              console.log('Dialog closed without a successful result.');
            }
          });
        }







  async fetchApplicantKnownLanguages(): Promise<void> {
    const url = `${this.baseUrl}/fetch_employee_language`;
    const requestBody = {
      employee_id: this.EmployeeID
    };

    this.http.post(url, requestBody)
      .subscribe({
        next: (response: any) => {
          this.applicantKnownLanguages = response;
        },
        error: (error) => {
          console.log(error);

        },
        complete: () => {

        }
      });
  }
}
