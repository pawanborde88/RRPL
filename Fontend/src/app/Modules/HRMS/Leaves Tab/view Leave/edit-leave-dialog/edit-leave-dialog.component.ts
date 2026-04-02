import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterOutlet } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';






    @Component({
      selector: 'app-edit-leave-dialog',
      standalone: true,
      imports: [ AngularMaterialModule,ReactiveFormsModule, CommonModule],
      templateUrl: './edit-leave-dialog.component.html',
      styleUrl: './edit-leave-dialog.component.scss'
    })
    export class EditLeaveDialogComponent {


  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<EditLeaveDialogComponent>,
    private snackBar: MatSnackBar,
 private fetch: FetchFunctionsService,
 @Inject(MAT_DIALOG_DATA) public data: any // Inject the data
  ) {

    console.log('Received data:', data);


    this.addCustomerForm.patchValue({
      account_id: this.data.account_id || sessionStorage.getItem('account_id'),
      user_id: this.data.user_id || '',
      leave_type_id: this.data.leave_type_id || '',
      leave_date: this.data.leave_date || '',
      return_to_office: this.data.return_to_office || '',
      crdr: this.data.crdr || null,
      amount: this.data.amount || null,
      leave_status_id: this.data.leave_status_id || null,
      reason: this.data.reason || '',
      comments: this.data.comments || '',
      leave_transaction_id: this.data.leave_transaction_id || '',
      updated_by: this.data.updated_by || sessionStorage.getItem('session_id'),
    });
  }

  ngOnInit(): void {
    this.fetchLeaveStatus();
    this.fetchUsers();
    this.fetchLeaveType();
  }


  LeaveStatus: any = [];
  AccountUsers:any[]=[];
  leaveType:any[]=[];
  fetchLeaveStatus() {

    let obj = {
      account_id: sessionStorage.getItem('account_id'),
    };
    console.log(obj);

    this.http.post(`${this.baseUrl}/fetch_leave_status`, obj).subscribe({
      next: (res: any) => {
        console.log(res);
        this.LeaveStatus = res.data;
      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {},
    });
  }
  fetchLeaveType() {

    let obj = {
      account_id: sessionStorage.getItem('account_id'),
    };
    console.log(obj);

    this.http.post(`${this.baseUrl}/fetch_leave_types`, obj).subscribe({
      next: (res: any) => {
        console.log(res);
        this.leaveType = res.data;
      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {},
    });
  }


  fetchUsers() {
    this.fetch.FetchUsers().subscribe({
      next: (res: any) => {
        // console.log(res);
        this.AccountUsers = res;
      }, error: (err: any) => {
        console.log(err);
        this.snackBar.open('Unable to fetch account users.');
      }, complete: () => {

      }
    })
  }

  pipe = new DatePipe('en-US');
  loadingState: boolean = false;
  baseUrl = environment.API_URL;

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  userIdData: number| null =
  this.roleId === 1 || this.roleId === 10  ?  null : this.userId;

  CRDR :any[]=[
    {crdr:2, name:'DR'},
    {crdr:1, name:'CR'},

  ];

  addCustomerForm = new FormGroup({
    account_id: new FormControl(sessionStorage.getItem('account_id')),
    user_id: new FormControl('' ,[Validators.required]),
    leave_type_id: new FormControl('' ,[Validators.required]),
    leave_date: new FormControl(''),
    return_to_office:  new FormControl(''),
    crdr: new FormControl(''),
    amount: new FormControl(),
    leave_status_id: new FormControl(),
    reason: new FormControl('' ,[Validators.required]),
    comments: new FormControl(''),
    leave_transaction_id: new FormControl(''),
    updated_by: new FormControl(sessionStorage.getItem('session_id')),
  });

  onSubmit() {


    if (this.addCustomerForm.valid) {
      this.loadingState = true;
      let obj = this.addCustomerForm.value;
      obj['leave_date'] = this.pipe.transform(this.addCustomerForm.value['leave_date'], 'yyyy-MM-dd')!;
      obj['return_to_office'] = this.pipe.transform(this.addCustomerForm.value['return_to_office'], 'yyyy-MM-dd')!;
      console.log(obj);
      this.http.post(`${this.baseUrl}/update_leave_transaction`, obj).subscribe({
        next: (res: any) => {
          console.log(res);
          this.dialogRef.close(res.success);
        },
        error: (err: any) => {
          console.log(err);
          this.loadingState = false;
          this.dialogRef.close(false);
        },
        complete: () => {
          this.loadingState = false;
        },
      });
    }
  }


}
