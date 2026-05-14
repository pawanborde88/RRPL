import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay, map, catchError, of } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import type { TableRowData } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';

export interface Project {
  project_id: number;
  property_name: string;
}

export interface Wing {
  wing_id: number;
  wing_name: string;
}

export interface Unit {
  floor_unit_id: number;
  full_name: string;
  floor_unit: string;
  applicant_name: string;
}

export interface ReceiptType {
  receipt_type_id: number;
  receipt_type: string;
}

export interface PaymentMode {
  payment_mode_id: number;
  payment_mode: string;
}

export interface Bank {
  preferred_bank_id: number;
  preferred_bank: string;
}

export interface DocMaster {
  doc_master_id: number;
  doc_name: string;
}

export interface LetterType {
  letter_type_id: number;
  letter_type: string;
}

export interface AttachmentResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface Receipt extends TableRowData {
  booking_receipt_id: number;
  project_id: number;
  wing_id: number;
  floor_unit_id: number;
  receipt_date: string;
  receipt_type_id: number;
  receipt_type?: string;
  received_amount: number;
  trn_no: string;
  trn_date: string;
  payment_mode_id?: number;
  payment_mode?: string;
  bank_id?: number;
  bank_name?: string;
  bank_details?: string;
  remark?: string;
  attachment?: string;
  cheque_status_id?: number;
  cheque_status?: string;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
  updated_by_name?: string;
  split_gst?: number | null;
  reverse_gst?: number | null;
  gst_percentage?: number | null;
  gst?: number | null;
  amount?: number | null;
  amount_type?: number | null;
  refund_amount?: number | null;
  is_deleted?: number;
}

export interface ReceiptResponse {
  success: boolean;
  message?: string;
  data?: Receipt[];
}

@Injectable({ providedIn: 'root' })
export class ReceiptsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  // Cache dropdowns with shareReplay for better performance
  private projectsCache$?: Observable<Project[]>;
  private userProjectsCache$?: Observable<Project[]>;
  private receiptTypesCache$?: Observable<ReceiptType[]>;
  private paymentModesCache$?: Observable<PaymentMode[]>;
  private banksCache$?: Observable<Bank[]>;
  private docMastersCache$?: Observable<DocMaster[]>;
  private letterTypesCache$?: Observable<LetterType[]>;


  fetchProjects(userId: number | null = null): Observable<any[]> {
    const payload = {
      user_id: userId,
    };

    return this.http
      .post<any[]>(`${this.baseUrl}/user_project_dropdown`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching user project dropdown:', error);
          return of([]);
        })
      );
  }

  fetchWings(projectId: number): Observable<Wing[]> {
    return this.http.post<Wing[]>(`${this.baseUrl}/wing_dropdown`, {
      project_id: projectId,
    });
  }

  fetchUnits(projectId: number, wingId: number): Observable<{ data: Unit[] }> {
    return this.http.post<{ data: Unit[] }>(
      `${this.baseUrl}/booking_unit_dropdown`,
      {
        project_id: projectId,
        wing_id: wingId,
      }
    );
  }


  fetchUnitsWithAgreementStatus(
    projectId: number,
    wingId: number,
    agreementStatusId: number,
    stageId: number
  ): Observable<{ data: Unit[] }> {
    return this.http.post<{ data: Unit[] }>(
      `${this.baseUrl}/booking_unit_dropdown`,
      {
        project_id: projectId,
        wing_id: wingId,
        agreement_status_id: agreementStatusId,
        payment_stage_id: stageId,
      }
    );
  }
  fetchUnitsWithAgreementStatusDone(
    projectId: number,
    wingId: number,
    agreementStatusId: number = 1,
  ): Observable<{ data: Unit[] }> {
    return this.http.post<{ data: Unit[] }>(
      `${this.baseUrl}/booking_unit_dropdown`,
      {
        project_id: projectId,
        wing_id: wingId,
        agreement_status_id: agreementStatusId,
      }
    );
  }
  fetchUnitsWithAgreementStatusNotDone(
    projectId: number,
    wingId: number,
    agreementStatusId: number = 0,
  ): Observable<{ data: Unit[] }> {
    return this.http.post<{ data: Unit[] }>(
      `${this.baseUrl}/booking_unit_dropdown`,
      {
        project_id: projectId,
        wing_id: wingId,
        agreement_status_id: agreementStatusId,
      }
    );
  }

  fetchReceiptTypes(): Observable<ReceiptType[]> {
    if (!this.receiptTypesCache$) {
      this.receiptTypesCache$ = this.http
        .get<ReceiptType[] | { data: ReceiptType[] }>(
          `${this.baseUrl}/receipt_types_dropdown`
        )
        .pipe(
          map((res) => (Array.isArray(res) ? res : res.data || [])),
          shareReplay({ bufferSize: 1, refCount: true })
        );
    }
    return this.receiptTypesCache$;
  }

  fetchPaymentModes(): Observable<PaymentMode[]> {
    if (!this.paymentModesCache$) {
      this.paymentModesCache$ = this.http
        .get<PaymentMode[]>(`${this.baseUrl}/payment_mode_dropdown`)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.paymentModesCache$;
  }

  fetchBanks(): Observable<Bank[]> {
    if (!this.banksCache$) {
      this.banksCache$ = this.http
        .get<Bank[]>(`${this.baseUrl}/preferred_bank_dropdown`)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.banksCache$;
  }

  fetchReceipts(floorUnitId: number): Observable<ReceiptResponse | Receipt[]> {
    return this.http.post<ReceiptResponse | Receipt[]>(
      `${this.baseUrl}/fetch_all_booking_receipt`,
      { floor_unit_id: floorUnitId }
    );
  }

  createReceipt(formData: FormData): Observable<ReceiptResponse> {
    return this.http.post<ReceiptResponse>(
      `${this.baseUrl}/add_booking_receipt`,
      formData
    );
  }

  updateReceipt(formData: FormData): Observable<ReceiptResponse> {
    return this.http.post<ReceiptResponse>(
      `${this.baseUrl}/edit_booking_receipt`,
      formData
    );
  }

  deleteReceipt(
    bookingReceiptId: number,
    floorUnitId: number,
    createdBy: number,
    reason: string
  ): Observable<ReceiptResponse> {
    return this.http.post<ReceiptResponse>(
      `${this.baseUrl}/delete_booking_receipt`,
      {
        booking_receipt_id: bookingReceiptId,
        floor_unit_id: floorUnitId,
        created_by: createdBy,
        reason: reason
      }
    );
  }

  changeChequeStatus(
    bookingReceiptId: number,
    chequeStatusId: number
  ): Observable<ReceiptResponse> {
    return this.http.post<ReceiptResponse>(
      `${this.baseUrl}/change_cheque_status`,
      {
        booking_receipt_id: bookingReceiptId,
        cheque_status_id: chequeStatusId,
      }
    );
  }

  fetchUserProjects(userId: number): Observable<Project[]> {
    if (!this.userProjectsCache$) {
      this.userProjectsCache$ = this.http
        .post<Project[]>(`${this.baseUrl}/user_project_dropdown`, {
          user_id: userId,
        })
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.userProjectsCache$;
  }

  fetchDocMasters(): Observable<DocMaster[]> {
    if (!this.docMastersCache$) {
      this.docMastersCache$ = this.http
        .get<{ data: DocMaster[] }>(`${this.baseUrl}/doc_master_dropdown`)
        .pipe(
          map((res) => res.data || []),
          shareReplay({ bufferSize: 1, refCount: true })
        );
    }
    return this.docMastersCache$;
  }

  uploadUnitAttachment(formData: FormData): Observable<AttachmentResponse> {
    return this.http.post<AttachmentResponse>(
      `${this.baseUrl}/add_unit_attachment`,
      formData
    );
  }

  fetchLetterTypes(): Observable<LetterType[]> {
    if (!this.letterTypesCache$) {
      this.letterTypesCache$ = this.http
        .get<{ data: LetterType[] }>(`${this.baseUrl}/letter_type_dropdown`)
        .pipe(
          map((res) => res.data || []),
          shareReplay({ bufferSize: 1, refCount: true })
        );
    }
    return this.letterTypesCache$;
  }
}

