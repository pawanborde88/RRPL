import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Interfaces
export interface WhatsAppTemplate {
  whatsapp_template_setup_id: number;
  template_name: string;
  project_id: number;
  module_id: number;
  language_code: string;
  created_by: number;
  created_at: string;
  updated_by: number;
  updated_at: string;
  project_name: string;
  created_by_name: string;
  module_name: string;
  status?: string;
}

export interface ChatMessage {
  id?: number;
  message_id?: string;
  message_text?: string;
  message_type?: string;
  message_from?: string | null;
  contact_name?: string;
  message_timestamp?: number;
  created_at?: string;
  status?: string;
  direction?: 'incoming' | 'outgoing';
  media_id?: string;
  media_url?: string;
  image_url?: string;
  file_name?: string;
  mime_type?: string;
  location_data?: any;
  buttons?: any[];
  interactive_data?: any;
  parent_question?: any;
  is_question?: boolean;
  question_text?: string;
}

export interface FetchChatResponse {
  status: boolean;
  data: ChatMessage[];
}

export interface TemplatesResponse {
  success: boolean;
  data: WhatsAppTemplate[];
}

export interface SendMessageResponse {
  status: boolean;
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsAppServiceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  /**
   * Fetch chat history by phone number
   * @param phone Phone number to fetch chat history for
   * @returns Observable of chat messages with error handling and retry logic
   */
  fetchChatByPhone(phone: string): Observable<FetchChatResponse> {
    return this.http.post<FetchChatResponse>(
      `${this.baseUrl}/fetch_chat_by_phone`,
      { phone }
    ).pipe(
      retry({ count: 2, delay: 1000 }),
      shareReplay({ bufferSize: 1, refCount: true }),
      catchError(this.handleError<FetchChatResponse>('fetchChatByPhone'))
    );
  }

  /**
   * Get all WhatsApp templates for a project
   * @param projectId Project ID to fetch templates for
   * @returns Observable of templates array with caching
   */
  getAllWhatsAppTemplates(projectId: number): Observable<TemplatesResponse> {
    return this.http.post<TemplatesResponse>(
      `${this.baseUrl}/get_all_whatsapp_templates`,
      { project_id: projectId }
    ).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
      catchError(this.handleError<TemplatesResponse>('getAllWhatsAppTemplates'))
    );
  }

  /**
   * Send a template message
   * @param requestData Template message data
   * @returns Observable of send response
   */
  sendTemplate(requestData: {
    to: string;
    customer_name: string;
    project_name: string;
    telecaller_name: string;
    template_name: string;
    language_code: string;
    project_lead_id: number;
    created_by: number;
  }): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(
      `${this.baseUrl}/send_template`,
      requestData
    ).pipe(
      catchError(this.handleError<SendMessageResponse>('sendTemplate'))
    );
  }

  /**
   * Send a custom message or media message
   * @param requestData Custom message data or FormData for media
   * @returns Observable of send response
   */
  sendMessage(requestData: any): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(
      `${this.baseUrl}/send_messages`,
      requestData
    ).pipe(
      catchError(this.handleError<SendMessageResponse>('sendMessage'))
    );
  }

  /**
   * Handle HTTP errors
   * @param operation Name of the operation that failed
   * @returns Error handler function
   */
  private handleError<T>(operation: string) {
    return (error: HttpErrorResponse): Observable<T> => {
      const errorMessage = error.error?.message || error.message || 'An unknown error occurred';
      console.error(`${operation} failed:`, errorMessage);
      return throwError(() => new Error(`${operation} failed: ${errorMessage}`));
    };
  }
}
