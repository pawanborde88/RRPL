
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuestionListService {
  baseUrl = environment.API_URL;
  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

  fetchQuestionList(ID:any){
    return this.http.post(`${this.baseUrl}/quiz_questions`, {loan_case_id:ID});
  }
  updateAnswer(obj:any){
    return this.http.post(`${this.baseUrl}/add_user_ans`,obj);
  }
}


