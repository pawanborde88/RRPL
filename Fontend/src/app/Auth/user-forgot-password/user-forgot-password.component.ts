import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar} from '@angular/material/snack-bar';
import { Router, RouterOutlet } from '@angular/router';
import { AngularMaterialModule } from '../../../angular-material.module';
import { environment } from '../../../environments/environment';
import { CustomValidators } from '../../Common/customValidators';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-user-forgot-password',
  templateUrl: './user-forgot-password.component.html',
  standalone: true,
  imports: [ AngularMaterialModule, FormsModule, ReactiveFormsModule, CommonModule],
  styleUrls: ['./user-forgot-password.component.scss']
})
export class UserForgotPasswordComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,

  ) {}

  ngOnInit(): void {}
  baseUrl = environment.API_URL;
  enterUsernameDiv: boolean = true;
  enterOtpDiv: boolean = false;
  disableButton : boolean = false;
  showRegistration:boolean=false;

  usernameForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
  });

  usernameSubmit() {
    this.disableButton=true;
    if (this.usernameForm.valid) {
      let obj = this.usernameForm.value;

      this.http.post(`${this.baseUrl}/send_otp_forgot_password`, obj).subscribe({
        next: (res: any) => {
          console.log(res);
          if (res.success) {
            if(res.code==200){
              this.snackBar.open(res.message);
              this.enterUsernameDiv = false;
              this.enterOtpDiv = true;
              this.disableButton=false;
            }else{
              this.snackBar.open(res.message);
              this.disableButton=false;
            }
          } else {
            console.log(res);
            this.snackBar.open('An error occurred, please try again');
          }
        },
        error: (err: any) => {
          console.log(err);
          this.snackBar.open('An error occurred, please try again');
        },
      });
    }
  }

  ResendOTP() {
    let obj = this.usernameForm.value;
    this.http.post(`${this.baseUrl}/send_otp_forgot_password`, obj).subscribe({
      next: (res: any) => {
        if (res.success) {
          console.log(res);
          this.snackBar.open('OTP sent successfully');
        } else {
          console.log(res);
          this.snackBar.open('An error occurred, please try again');
        }
      },
    });
  }

  otpForm = new FormGroup(
    {
      otp: new FormControl('', [Validators.required]),
      username: new FormControl(''),
      confirm_password:new FormControl('', [Validators.required]),
      new_password:new FormControl('', [
        Validators.required,
        CustomValidators.PasswordStrength()
      ]),
    },
    {
      validators: [
        CustomValidators.MatchValidator('new_password', 'confirm_password'),
      ],
    }
  );

  passwordMatchError() {
    this.otpForm;
    return this.otpForm.hasError('mismatch') && this.otpForm.controls.confirm_password.touched
  }
  public showPassword: boolean = false;
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  public showPassword1: boolean = false;
  public togglePasswordVisibility1(): void {
    this.showPassword1 = !this.showPassword1;
  }
  otpSubmit() {
    console.log('hello');
    this.disableButton=true;

    if (this.otpForm.valid) {

      let username = this.usernameForm.controls['username'].value;
      this.otpForm.patchValue({ username: username });
      let obj = this.otpForm.value;
      console.log(obj);
      this.http.post(`${this.baseUrl}/verify_otp_forgot_password`, obj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.disableButton=false;
            this.snackBar.open('Password Change Successfully');
            this.showRegistration=res.success;

            this.router.navigate(['/']);
          } else {
            console.log(res);
            this.disableButton=false;
            this.snackBar.open('The OTP entered is incorrect. Please enter correct OTP ');
          }
        },
        error: (err: any) => {
          console.log(err);
          this.snackBar.open('OTP was incorrect, please try again');
        },
      });
    }
    // else {
    //   if (
    //     this.otpForm.controls.otp.value !== '' &&
    //     this.otpForm.hasError('mismatch')
    //   )
    //     this.snackBar.open("otp didn't match");
    // }
  }
}
