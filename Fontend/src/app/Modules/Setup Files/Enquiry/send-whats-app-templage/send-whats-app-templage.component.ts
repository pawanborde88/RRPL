import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { AssignProjectDialogComponent } from '../assign-project-dialog/assign-project-dialog.component';

@Component({
  selector: 'app-send-whats-app-templage',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './send-whats-app-templage.component.html',
  styleUrl: './send-whats-app-templage.component.scss',
})
export class SendWhatsAppTemplageComponent  implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');
  allTelecallerlist: any[] = [];
  allSalesExecutive: any[] = [];
  allModuleList: any[] = [];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AssignProjectDialogComponent> // Reference to the dialog
  ) {}

  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllModules();
  }

  whatAppTemplageForm = new FormGroup({
    project_id: new FormControl(this.data.rowData[0].project_id),
    module_id: new FormControl(1,[Validators.required]),
    users: new FormControl([]),
  });

onSubmit(): void {


  const apiUrl = 'send_bulk_whatsapp_template';

  // Prepare the users array from rowData
  const users = this.data.rowData.map((item: any) => ({
    phone: item.mobile_no.toString(), // Convert to string if needed
    name: item.full_name,
    email: item.email_id
  }));

  // Prepare the payload
  const payload = {
    project_id: this.whatAppTemplageForm.value.project_id,
    module_id: this.whatAppTemplageForm.value.module_id,
    users: users
  };

  this.http.post(`${this.baseUrl}/${apiUrl}`, payload).subscribe(
    (res: any) => {
      this.dialog.open(SuccessDialogComponent, {
        autoFocus: false,
        data: { message: res.message },
      });
      this.dialogRef.close(true);
    },
    (error) => {
      console.error(error);
      this.snackBar.open('Something went wrong. Please try again.', 'Close', {
        duration: 3000,
      });
    }
  );
}

  fetchAllModules(): void {
    this.http.get(`${this.baseUrl}/fetch_msg_module`).subscribe({
      next: (res: any) => {
        if (res) {
          this.allModuleList = res;
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
}
