import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class LoanFileService {

  baseUrl = environment.API_URL;
  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}
  fetchObj = {
    session_id: sessionStorage.getItem('session_id'),
    account_id: sessionStorage.getItem('account_id'),
  };

  singleLoanCase(ID:any) {
    return this.http.post( `${this.baseUrl}/loan_case_details`, {loan_case_id: ID});
  }

  singlePersonalInformation(ID:any) {
    return this.http.post( `${this.baseUrl}/get_personal_info`, {loan_case_id: ID});
  }

  singlePersonalDetails(ID:any) {
    return this.http.post( `${this.baseUrl}/fetch_business_detail`, {loan_case_id: ID});
  }
  singleBankDetails(ID:any) {
    return this.http.post( `${this.baseUrl}/fetch_bank_detail`, {loan_case_id: ID});
  }

  ///change name persoonal information to personal details
  updatePersonalInformation(obj:any) {
    return this.http.post( `${this.baseUrl}/add_personal_detail`, obj);
  }

    ///change name persoonal information to business_details
  updatePersonalDetails(obj:any) {
    return this.http.post( `${this.baseUrl}/add_business_details`, obj);
  }
  addBankDetails(obj:any) {
    return this.http.post(`${this.baseUrl}/add_bank_details`, obj);
  }
  editBankDetails(obj:any) {
    return this.http.post(`${this.baseUrl}/edit_bank_details`, obj);
  }

  fetchApplicantDetails(obj:any) {
    return this.http.post( `${this.baseUrl}/fetch_applicant`, {loan_case_id: obj});
  }

  fetchCoApplicantData(obj:any) {
    return this.http.post( `${this.baseUrl}/fetch_co_applicants`, {loan_case_id: obj});
  }

  updateApplicantDetails(obj:any) {
    return this.http.post( `${this.baseUrl}/add_primary_applicant`, obj);
  }
  updateCoApplicants(obj:any) {
    return this.http.post( `${this.baseUrl}/add_co_applicant`, obj);
  }


  singleCaseDetails(ID:any) {
    return this.http.post( `${this.baseUrl}/fetch_case_details`, {loan_case_id: ID});
  }
  updatedCaseDetails(obj:any) {
    return this.http.post( `${this.baseUrl}/add_case_details`,obj);
  }

  singleBusinessDetails(ID:any) {
    return this.http.post( `${this.baseUrl}/fetch_business_detail`, {loan_case_id: ID});
  }
  updatedBusinessDetails(obj:any) {
    return this.http.post( `${this.baseUrl}/add_business_details`,obj);
  }


  singleGstDetails(ID:any) {
    return this.http.post( `${this.baseUrl}/fetch_gst`, {loan_case_id: ID});
  }

  updateGstDetails(obj:any) {
    return this.http.post( `${this.baseUrl}/add_gst`, obj);
  }

}
