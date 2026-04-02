import { Component, Inject } from '@angular/core';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { AddPreffedLocationComponent } from '../../Preferred Location/add-preffed-location/add-preffed-location.component';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';

@Component({
  selector: 'app-add-new-bank',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AngularEditorModule
  ],
  templateUrl: './add-new-bank.component.html',
  styleUrl: './add-new-bank.component.scss'
})
export class AddNewBankComponent {
  htmlContent: string = '';
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddNewBankComponent> // Reference to the dialog
  ) {}
  ngOnInit(): void {
    console.log(this.data);
  }

 
  addPreffedBank = new FormGroup({
    preferred_bank: new FormControl(this.data?.rowData?.preferred_bank),
    preferred_bank_id: new FormControl(this.data?.rowData?.preferred_bank_id),
    bank_name: new FormControl(this.data?.rowData?.bank_name),
    html_content: new FormControl(this.data?.rowData?.html_content),

    created_by: new FormControl(this.userId),
  });
  
  onSubmit(): void {
    const payload = { ...this.addPreffedBank.value }; // Extract form values
  
    const { apiUrl, successMessage } = this.data;
  
    if (this.data?.rowData?.preferred_bank_id) {
      payload.preferred_bank_id = this.data.rowData.preferred_bank_id;
      payload.created_by = this.userId;
    }
  
    this.http.post(`${this.baseUrl}/${apiUrl}`, payload).subscribe(
      (res:any) => {
        this.snackBar.open(successMessage, 'Close', { duration: 3000 });
        this.dialog.open(SuccessDialogComponent, {
          autoFocus: false,
          data: { message: res.message },
        });
        this.dialogRef.close(true);
      },
      () => {
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }
  config: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '15rem',
    minHeight: '5rem',
    placeholder: 'Enter text here...',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    toolbarHiddenButtons: [
      ['bold']
      ],
      
    customClasses: [
      {
        name: "quote",
        class: "quote",
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: "titleText",
        class: "titleText",
        tag: "h1",
      },
    ]
  };
}
