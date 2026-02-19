import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnquiryService {
  baseUrl = environment.API_URL;
  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }


  FetchEnquiryDropdowns() {
    return this.http.get(`${this.baseUrl}/enquiry_dropdown/${sessionStorage.getItem('account_id')}`);
  }

  FetchState() {
    return this.http.get(`${this.baseUrl}/fetch_states`);
  }

  FetchCity(obj:any) {
    return this.http.post(`${this.baseUrl}/fetch_city`, obj);
  }
  FetchDistrict(obj:any) {
    return this.http.post(`${this.baseUrl}/fetch_district`, obj);
  }


  addEnquiry(obj:any) {
    return this.http.post(`${this.baseUrl}/add_enquiry`, obj);
  }

  editEnquiry(obj:any) {
    return this.http.post(`${this.baseUrl}/edit_enquiry`, obj);
  }
  singleEnquiry(ID:any){
    return this.http.post(`${this.baseUrl}/enquiry_details`,{enquiry_id:ID} );

  }

  FetchCustomerType() {
    return this.http.get(`${this.baseUrl}/fetch_customer_type`);
  }
}
