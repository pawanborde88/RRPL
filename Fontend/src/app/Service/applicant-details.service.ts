import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ApplicantDetailsService {
  baseUrl = environment.API_URL;
  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}
  fetchObj = {
    session_id: sessionStorage.getItem('session_id'),
    account_id: sessionStorage.getItem('account_id'),
  };

  FetchContactType() {
    return this.http.get(`${this.baseUrl}/fetch_contact_type`);
  }
  FetchContactTypeList(ID:any) {
    return this.http.post(`${this.baseUrl}/fetch_loan_case_contact`, { loan_case_id:ID });
  }
  AddContactList(obj:any) {
    return this.http.post(`${this.baseUrl}/add_loan_case_contact`, obj);
  }
  deleteContact(ID:any){
    return this.http.post(`${this.baseUrl}/delete_contact`, { contact_id:ID });
  }


  ///RTR



  FetchBankAccountType() {
    return this.http.get(`${this.baseUrl}/fetch_bank_account_type`);
  }
  FetchLoanType() {
    return this.http.post(`${this.baseUrl}/fetch_loan_type`, {account_id: sessionStorage.getItem('account_id')});
  }
  FetchRTRDetails(ID:any) {
    return this.http.post(`${this.baseUrl}/fetch_rtr`, { loan_case_id:ID });
  }
  editRTRDetails(obj:any) {
    return this.http.post(`${this.baseUrl}/add_rtr`, obj);
  }
  deleteRTR(ID:any){
    return this.http.post(`${this.baseUrl}/delete_rtr`, { rtr_id:ID });
  }

//itr
FetchyearWiseITR(ID: any , year:any) {
  return this.http.post(`${this.baseUrl}/fetch_itr_year` ,{loan_case_id:ID , year:year});
}
FetchItrStatus(obj:any){
  return this.http.post(`${this.baseUrl}/update_itr_status`, obj);
}

editITRDetails(obj:any) {
  return this.http.post(`${this.baseUrl}/add_itr`, obj);
}

//abb
fetchBankDetails(ID:any) {
  return this.http.post(`${this.baseUrl}/fetch_single_bank_detail`,{banking_detail_id:ID });
}

addedBankAccountList(ID:any) {
  return this.http.post(`${this.baseUrl}/fetch_bank_detail`,{loan_case_id:ID });
}

FetchABBList(obj: any) {
  return this.http.post(`${this.baseUrl}/fetch_abb_details` ,obj);
}
addABBDetails(obj:any) {
  return this.http.post(`${this.baseUrl}/add_abb_details`, obj);
}

}
