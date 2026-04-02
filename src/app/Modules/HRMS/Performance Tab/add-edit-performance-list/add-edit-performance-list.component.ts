import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AddEditLeaveCreditComponent } from '../../Leaves Tab/Credit/add-edit-leave-credit/add-edit-leave-credit.component';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { SnackbarService } from '../../../../Service/snackbar.service';


@Component({
  selector: 'app-add-edit-performance-list',
  standalone: true,
  imports: [AngularMaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './add-edit-performance-list.component.html',
  styleUrl: './add-edit-performance-list.component.scss'
})
export class AddEditPerformanceListComponent {
  baseUrl = environment.API_URL;
  uploading = false;
  deleteLoading = false;
  loadingState = false;
  invalidDateRange = false;

  addHolidayForm!: FormGroup;
  title: string;
  apiUrl: string;
  successMessage: string;
  updateData: any;
  employeeData: any;

  pipe = new DatePipe('en-US');
  leaveType: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<AddEditLeaveCreditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackbarService: SnackbarService,
    private fetch: FetchFunctionsService
  ) {
    this.title = data?.title || '';
    this.apiUrl = data?.apiUrl || '';
    this.successMessage = data?.successMessage || '';
    this.updateData = data?.onUploadComplete || {};
    this.employeeData = data?.employeeData || '';
  }

  ngOnInit(): void {
    this.fetchParamenterType();
    this.initializeForm();
    this.fetchUsers() ;
    if(this.updateData?.parameter_id){
      this.getRating(this.updateData?.parameter_id);
    }
  }

  private initializeForm(): void {
    this.addHolidayForm = new FormGroup({

      user_id :  new FormControl(this.updateData?.user_id || '', Validators.required),
      parameter_id :  new FormControl(this.updateData?.parameter_id || '', Validators.required),
      rating :  new FormControl(this.updateData?.rating || '', Validators.required),
      date :   new FormControl(this.updateData?.date || '', Validators.required),
      comment :  new FormControl(this.updateData?.comment || '', Validators.required),

   ...(this.title ===  'Update Performance' && { user_performance_id: new FormControl(this.updateData?.user_performance_id), }),
   ...(this.title !==  'Update Performance' && {  created_by: new FormControl(sessionStorage.getItem('session_id'))}),
   ...(this.title ===  'Update Performance' && {  updated_by: new FormControl(sessionStorage.getItem('session_id') ) }),
    });
  }


  AccountUsers: any[] = [];
  fetchUsers() {
    this.fetch.FetchUsers().subscribe({
      next: (res: any) => {
        // console.log(res);
        this.AccountUsers = res;
      }, error: (err: any) => {
        console.log(err);
        this.snackbarService.showDataSnackbar('An error occurred, please try later');
      }, complete: () => {

      }
    })
  }


  parameter:any[]=[];
  fetchParamenterType(): void {
    this.http.get(`${this.baseUrl}/fetch_performance_parameter`).subscribe({
      next: (res: any) => {
        this.parameter = res || [];
      },
      error: (err: any) => {
        console.error(err);
      },
    });
  }


  rating:any[]=[];
  getRating(parameterId: any): void {
    if (!parameterId) {
      console.error('Parameter ID is missing.');
      return;
    }

    this.http.post(`${this.baseUrl}/fetch_scale`, { parameter_id: parameterId }).subscribe({
      next: (res: any) => {
        this.rating = res || [];
      },
      error: (err: any) => {
        console.error('Error fetching rating scale:', err);
      },
    });
  }


  onSubmit(): void {
    if (this.addHolidayForm.invalid) return;

    this.uploading = true;
    const url = `${this.baseUrl}/${this.apiUrl}`;
    const body = {
      ...this.addHolidayForm.value,
    };

    this.http.post(url, body).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackbarService.showDataSnackbar(this.successMessage);
          this.dialogRef.close({ success: true });
        } else {
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        }
      },
      error: () => {
        this.snackbarService.showDataSnackbar('An error occurred, please try later');
      },
      complete: () => {
        this.uploading = false;
      },
    });
  }




}
