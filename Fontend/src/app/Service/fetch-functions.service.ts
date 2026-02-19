import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClientModule } from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class FetchFunctionsService {
  baseUrl = environment.API_URL;
  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }
  fetchObj = {
    session_id: sessionStorage.getItem('session_id'),
    account_id: sessionStorage.getItem('account_id'),
  };

  FetchEnquiryDropdowns() {
    return this.http.get(
      `${this.baseUrl}/enquiry_dropdown/${sessionStorage.getItem('account_id')}`
    );
  }

  FetchDocumentDropdowns() {
    return this.http.post(`${this.baseUrl}/doc_dropdown`, {
      account_id: sessionStorage.getItem('account_id'),
    });
  }

  FetchDocumentCategory(obj: any) {
    return this.http.post(`${this.baseUrl}/fetch_doc_category`, obj)
  }


  FetchUsers() {
    return this.http.get(
      `${this.baseUrl}/account_users/${sessionStorage.getItem('account_id')}`
    );
  }




  // FetchCustomers() {
  //   return this.http.get(
  //     `${this.baseUrl}/customers_list/${sessionStorage.getItem('account_id')}`
  //   );
  // }
  FetchPartners() {
    return this.http.post(
      `${this.baseUrl}/partner_list`, { user_id: sessionStorage.getItem('session_id') });
  }


  FetchCustomers(status: number | any) {
    return this.http.post(`${this.baseUrl}/get_customer_by_active_status`, {
      account_id: sessionStorage.getItem('account_id'),
      active_status_id: status,
    });
  }

  FetchProfilePicturePath() {
    return this.http.post(`${this.baseUrl}/account/account_users.php`, {
      ...this.fetchObj,
      flag: true,
    });
  }


  private userDetailsId = new BehaviorSubject<any>('');
  public userDetailsId$ = this.userDetailsId.asObservable();

  setUserDetailsId(array: number[]): void {

    this.userDetailsId.next(array);
  }



  private userName = new BehaviorSubject<any>('');
  public userName$ = this.userName.asObservable();
  setUserName(name: string): void {

    this.userName.next(name);
  }
  private userAssignId = new BehaviorSubject<any>('');
  public userAssignId$ = this.userAssignId.asObservable();

  setAssignId(array: number[]): void {

    this.userAssignId.next(array);
  }

  AddEventUser(data: any) {
    return this.http.post(`${this.baseUrl}/add_event_user`, data);
  }

  markAttendance(data: any) {
    return this.http.post(`${this.baseUrl}/add_event_user_attendance`, data);
  }
}
