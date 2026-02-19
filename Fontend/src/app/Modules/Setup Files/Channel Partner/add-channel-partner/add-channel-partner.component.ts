import { Component, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { CommonModule, DatePipe } from '@angular/common';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ReceiptPreviewDialogComponent } from '../../Post Sales/Recovery/receipt-preview-dialog/receipt-preview-dialog.component';
import { PANNoDirective } from '../../../../Common/directives/panno.directive';

@Component({
  selector: 'app-add-channel-partner',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    PANNoDirective,
  ],
  templateUrl: './add-channel-partner.component.html',
  styleUrl: './add-channel-partner.component.scss',
})
export class AddChannelPartnerComponent implements OnInit {
  baseUrl = environment.API_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  storageUrl = environment.STORAGE_URL;
  accountID = Number(sessionStorage.getItem('account_id'));
  channelPartnerID: string | null = null;
  minDate: Date = new Date();
  isEditMode = false;
  pipe = new DatePipe('en-US');

  imagePreview: {
    passbook_photo: string | null;
    rera_certificate: string | null;
  } = {
    passbook_photo: null,
    rera_certificate: null,
  };

  selectedFiles: { passbook_photo?: File; rera_certificate?: File } = {};

  constructor(
    private http: HttpClient,
        private dialog: MatDialog,
    
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.channelPartnerID = params['channel_partner_id'] || null;
      this.isEditMode = !!this.channelPartnerID;
      
      if (this.isEditMode) {
        this.fetchSingleChannelPartner();
      }
    });
  }

  addChannelPartnerForm = new FormGroup({
    user_id: new FormControl(this.userId),
    created_by: new FormControl(this.userId),
    firm_name: new FormControl('', [Validators.required]),
    firm_address: new FormControl(''),
    firm_city: new FormControl(''),
    state: new FormControl('Maharashtra'),
    country: new FormControl('India'),
    gst: new FormControl('', [
      Validators.pattern(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[A-Z]{1}[A-Z0-9]{1}$/
      ),
    ]),
    pan: new FormControl('', [
      Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
      Validators.required,
    ]),
    bank_name: new FormControl(''),
    active_status_id: new FormControl(1),
    team_size: new FormControl(0, [Validators.min(0)]),
    firm_email: new FormControl('', [
      Validators.email,
      Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/),
    ]),
    updated_by: new FormControl(this.userId),
    firm_phone: new FormControl('', [
      Validators.pattern(/^\d{10}$/),
      Validators.minLength(10),
      Validators.maxLength(10),
    ]),
    firm_website: new FormControl(''),
    bank_account_no: new FormControl(''),
    bank_type_id: new FormControl(1),
    pin_code: new FormControl(''),
    bank_address: new FormControl(''),
    passbook_photo: new FormControl<string | null>(null),
    rera_certificate: new FormControl<string | null>(null),
    rera_expiry_date: new FormControl<Date | null>(null),
    branch_name: new FormControl(''),
    bank_account_name: new FormControl(''),
    ifsc_code: new FormControl(''),
    rera: new FormControl('', [Validators.required]),
    channel_partner_id: new FormControl(''),
  });

  fetchSingleChannelPartner(): void {
    if (!this.channelPartnerID) return;

    this.http
      .post(`${this.baseUrl}/fetch_single_channel_partner`, {
        channel_partner_id: this.channelPartnerID,
      })
      .subscribe({
        next: (res: any) => {
          if (!res) return;

          const { 
            passbook_photo, 
            rera_certificate, 
            rera_expiry_date,
            firm_phone,
            channel_partner_id,
            ...formData 
          } = res;

          // Format date if it exists
          const formattedDate = rera_expiry_date 
            ? new Date(rera_expiry_date) 
            : null;

          // Convert firm_phone to string if it's a number
          const phoneValue = firm_phone !== null && firm_phone !== undefined 
            ? String(firm_phone) 
            : '';

          // Update form with fetched data
          this.addChannelPartnerForm.patchValue({
            ...formData,
            channel_partner_id: channel_partner_id || this.channelPartnerID,
            firm_phone: phoneValue,
            rera_expiry_date: formattedDate,
            passbook_photo: passbook_photo
              ? `${this.storageUrl}/${passbook_photo}`
              : null,
            rera_certificate: rera_certificate
              ? `${this.storageUrl}/${rera_certificate}`
              : null,
          });

          // Update image preview
          this.imagePreview = {
            passbook_photo: passbook_photo
              ? `${this.storageUrl}/${passbook_photo}`
              : null,
            rera_certificate: rera_certificate
              ? `${this.storageUrl}/${rera_certificate}`
              : null,
          };
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open(
            'Error occurred while fetching data, please try later',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }
  isImage(filePath: string): boolean {
    return filePath.match(/\.(jpeg|jpg|gif|png)$/) != null;
  }

  onChangeFile(
    event: Event,
    fieldName: 'passbook_photo' | 'rera_certificate'
  ): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Check file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('File size should be less than 5MB', 'Close', {
          duration: 3000,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview[fieldName] = reader.result as string;
      };
      reader.readAsDataURL(file);

      this.selectedFiles[fieldName] = file;
    }
  }

  onSubmit(): void {
    if (this.addChannelPartnerForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
      });
      return;
    }

    const formData = new FormData();
    const formValue = this.addChannelPartnerForm.value;

    // Append all form values except files
    Object.keys(formValue).forEach((key: string) => {
      const typedKey = key as keyof typeof formValue;
      let value = formValue[typedKey];
      
      // Handle date formatting
      if (typedKey === 'rera_expiry_date' && value) {
        value = this.pipe.transform(value, 'yyyy-MM-dd') || '';
      }

      // Skip file fields and null/undefined values
      if (
        value !== null && 
        value !== undefined && 
        typedKey !== 'passbook_photo' && 
        typedKey !== 'rera_certificate'
      ) {
        formData.append(typedKey, value.toString());
      }
    });

    // Append files if they exist
    if (this.selectedFiles.passbook_photo) {
      formData.append('passbook_photo', this.selectedFiles.passbook_photo);
    }
    if (this.selectedFiles.rera_certificate) {
      formData.append('rera_certificate', this.selectedFiles.rera_certificate);
    }
    if(this.channelPartnerID){
      formData.append('updated_by', this.userId.toString());
    }

    const apiUrl = this.isEditMode 
      ? `${this.baseUrl}/edit_channel_partner`
      : `${this.baseUrl}/add_channel_partner`;

    this.http.post(apiUrl, formData).subscribe({
      next: (response: any) => {
        this.snackBar.open(
          `Channel partner ${this.isEditMode ? 'updated' : 'added'} successfully!`, 
          'Close', 
          { duration: 3000 }
        );
        
      },
      error: (error) => {
        console.error(error);
        this.snackBar.open(
          `Failed to ${this.isEditMode ? 'update' : 'add'} channel partner. Please try again.`,
          'Close',
          { duration: 3000 }
        );
      },
    });
  }

  onDeleteImage(fieldName: 'passbook_photo' | 'rera_certificate'): void {
    this.imagePreview[fieldName] = null;
    delete this.selectedFiles[fieldName];
    this.addChannelPartnerForm.patchValue({ [fieldName]: null });
  }
   openReceiptDialog(receiptData: any): void {
    if (receiptData) {
      console.log(receiptData);
      

      this.dialog.open(ReceiptPreviewDialogComponent, {
        width: '80%',
        maxWidth: '900px',
        data: {
          title: 'Receipt Details',
          fileUrl: receiptData,
        },
      });
    } 
  }
}