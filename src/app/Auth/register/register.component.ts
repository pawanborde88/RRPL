import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { AngularMaterialModule } from '../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { CustomValidators } from '../../Common/customValidators';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [ AngularMaterialModule, ReactiveFormsModule, CommonModule],
  styleUrls: ['./register.component.scss']
})
export default  class RegisterComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  registerForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    phone_no: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      CustomValidators.PasswordStrength()
    ]),
    confirm_password: new FormControl('', [Validators.required]),
  });

  onSubmit() {
    if (this.registerForm.valid) {
      console.log(this.registerForm.value);
    }
  }

}
