import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MasterService  {

  private apiUrl = 'https://rrpl-dev.portalwiz.in/api/public/api/fetch_report';  // API URL

  constructor(private http: HttpClient) { }

  // Method to get chart data dynamically
  Getchartinfo(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }
}