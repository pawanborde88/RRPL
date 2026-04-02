import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { environment } from '../../../../../../environments/environment';
import { QRCodeComponent, QRCodeModule } from 'angularx-qrcode';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-projectwise-qr',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    BreadcrumbComponent,
    QRCodeModule,
  ],
  templateUrl: './projectwise-qr.component.html',
  styleUrl: './projectwise-qr.component.scss',
})
export class ProjectwiseQRComponent implements OnInit {
  domainUrl = environment.domainUrl;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;

  roleId: number | null = Number(sessionStorage.getItem('role_id')) || null;
  userId: number | null = Number(sessionStorage.getItem('session_id')) || null;

  Qrlink: string = '';
  projectLogo: string = '';
  projectName: string = '';

  @ViewChild('qrCode', { static: false }) qrCode!: QRCodeComponent; // Reference to QR code component

  projectForm: FormGroup;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ProjectwiseQRComponent>,
    private fb: FormBuilder
  ) {
    this.projectForm = this.fb.group({
      projectName: ['', Validators.required],
      projectDescription: [''],
      startDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data?.rowData?.length > 0) {
      const project = this.data.rowData[0];
      this.projectName = project.property_name || '';
      this.projectLogo = project.project_logo || '';
      this.Qrlink = `${this.domainUrl}/qrform/${project.project_slug}`;
    }
  }

  // Download QR Code
  downloadQR() {
    if (this.qrCode && this.qrCode.qrcElement) {
      const canvasElement = this.qrCode.qrcElement.nativeElement.querySelector('canvas');
      if (canvasElement) {
        const link = document.createElement('a');
        link.href = canvasElement.toDataURL('image/png');
        link.download = `${this.projectName.replace(/\s+/g, '_')}_QR_Code.png`;
        link.click();
        this.snackBar.open('✓ QR code downloaded successfully!', 'Close', { 
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      } else {
        this.snackBar.open('QR code not found', 'Close', { duration: 3000 });
      }
    } else {
      this.snackBar.open('QR code component is not ready', 'Close', { duration: 3000 });
    }
  }

  // Copy Link to Clipboard
  copyLink() {
    navigator.clipboard.writeText(this.Qrlink).then(() => {
      this.snackBar.open('✓ Project link copied to clipboard!', 'Close', { 
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }).catch(err => {
      console.error('Could not copy text: ', err);
      this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
    });
  }

  // Share QR Code
  shareQR() {
    if (navigator.share) {
      navigator.share({
        title: this.projectName,
        text: `Scan this QR Code for ${this.projectName}:`,
        url: this.Qrlink
      }).then(() => {
        this.snackBar.open('✓ Shared successfully!', 'Close', { 
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }).catch((error) => {
        console.error('Error sharing', error);
        this.snackBar.open('Error sharing QR code', 'Close', { duration: 3000 });
      });
    } else {
      // Fallback: Copy link to clipboard
      this.copyLink();
    }
  }

  onSubmit() {
    if (this.projectForm.valid) {
      const formData = this.projectForm.value;
      console.log('Form Data:', formData);
      this.snackBar.open('Form submitted successfully!', 'Close', { duration: 3000 });
      this.dialogRef.close();
    } else {
      this.snackBar.open('Please fill out the form correctly.', 'Close', { duration: 3000 });
    }
  }
}
