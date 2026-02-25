import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, shareReplay, timeout } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
    BookingData,
    DemandData,
    LetterData,
    TemplateResponse,
    ApiResponse,
    ReceiptData,
    TokenData,
    ReceiptApiResponse
} from './unified-document-dialog.interfaces';

@Injectable({
    providedIn: 'root'
})
export class UnifiedDocumentDialogService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.API_URL;

    // Cache for template HTML to avoid redundant requests - using shareReplay for automatic caching
    private readonly templateCache = new Map<string, Observable<TemplateResponse>>();

    fetchBookingDetails(bookingId: number): Observable<BookingData> {
        return this.http.post<BookingData>(`${this.baseUrl}/fetch_booking_details`, {
            booking_id: bookingId
        }).pipe(
            timeout(30000), // 30 second timeout
            retry({ count: 2, delay: 1000 }),
            shareReplay({ bufferSize: 1, refCount: true }),
            catchError(this.handleError<BookingData>('fetchBookingDetails'))
        );
    }

    fetchDemandDetails(demandId: number | number[]): Observable<ApiResponse<DemandData[]>> {
        return this.http.post<ApiResponse<DemandData[]>>(`${this.baseUrl}/fetch_demand_details`, {
            demand_id: demandId
        }).pipe(
            timeout(30000),
            retry({ count: 2, delay: 1000 }),
            shareReplay({ bufferSize: 1, refCount: true }),
            catchError(this.handleError<ApiResponse<DemandData[]>>('fetchDemandDetails'))
        );
    }

    fetchLetterDetails(letterId: number): Observable<ApiResponse<LetterData[]>> {
        return this.http.post<ApiResponse<LetterData[]>>(`${this.baseUrl}/fetch_letter_details`, {
            letter_generation_id: letterId
        }).pipe(
            timeout(30000),
            retry({ count: 2, delay: 1000 }),
            shareReplay({ bufferSize: 1, refCount: true }),
            catchError(this.handleError<ApiResponse<LetterData[]>>('fetchLetterDetails'))
        );
    }

    fetchBookingReceiptDetails(bookingReceiptIds: number[]): Observable<ReceiptApiResponse> {
        return this.http.post<ReceiptApiResponse>(`${this.baseUrl}/fetch_booking_single_receipt`, {
            booking_receipt_id: bookingReceiptIds
        }).pipe(
            timeout(30000),
            retry({ count: 2, delay: 1000 }),
            shareReplay({ bufferSize: 1, refCount: true }),
            catchError(this.handleError<ReceiptApiResponse>('fetchBookingReceiptDetails'))
        );
    }

    generateBill(bookingId: number, channelPartnerId?: number, projectId?: number): Observable<BookingData> {
        const payload: Record<string, number> = { booking_id: bookingId };
        if (channelPartnerId) payload['channel_partner_id'] = channelPartnerId;
        if (projectId) payload['project_id'] = projectId;

        return this.http.post<BookingData>(`${this.baseUrl}/genrate_bill`, payload).pipe(
            timeout(30000),
            retry({ count: 2, delay: 1000 }),
            shareReplay({ bufferSize: 1, refCount: true }),
            catchError(this.handleError<BookingData>('generateBill'))
        );
    }

    fetchTemplateHTML(projectId: number, moduleId: number): Observable<TemplateResponse> {
        const cacheKey = `template_${projectId}_${moduleId}`;

        if (!this.templateCache.has(cacheKey)) {
            const request = this.http.post<TemplateResponse>(`${this.baseUrl}/show_template_html`, {
                project_id: projectId,
                module_id: moduleId
            }).pipe(
                retry({ count: 2, delay: 1000 }),
                shareReplay({ bufferSize: 1, refCount: false }),
                catchError(this.handleError<TemplateResponse>('fetchTemplateHTML'))
            );

            this.templateCache.set(cacheKey, request);
        }

        return this.templateCache.get(cacheKey)!;
    }

    fetchLetterFormat(projectId: number, letterTypeId: number, bankId?: number | null): Observable<TemplateResponse> {
        const cacheKey = `letter_${projectId}_${letterTypeId}_${bankId ?? 'null'}`;

        if (!this.templateCache.has(cacheKey)) {
            const payload: Record<string, number> = {
                project_id: projectId,
                letter_type_id: letterTypeId
            };
            if (bankId) payload['bank_id'] = bankId;

            const request = this.http.post<TemplateResponse>(`${this.baseUrl}/fetch_letter_format`, payload).pipe(
                retry({ count: 2, delay: 1000 }),
                shareReplay({ bufferSize: 1, refCount: false }),
                catchError(this.handleError<TemplateResponse>('fetchLetterFormat'))
            );

            this.templateCache.set(cacheKey, request);
        }

        return this.templateCache.get(cacheKey)!;
    }

    fetchTokenDetails(tokenId: number): Observable<TokenData[]> {
        return this.http.post<TokenData[]>(`${this.baseUrl}/fetch_token_detail`, {
            token_id: tokenId
        }).pipe(
            timeout(30000),
            retry({ count: 2, delay: 1000 }),
            shareReplay({ bufferSize: 1, refCount: true }),
            catchError(this.handleError<TokenData[]>('fetchTokenDetails'))
        );
    }

    fetchLedgerReport(bookingId: number): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/fetch_leger_deatils`, {
            booking_id: bookingId
        }).pipe(
            timeout(30000),
            retry({ count: 2, delay: 1000 }),
            shareReplay({ bufferSize: 1, refCount: true }),
            catchError(this.handleError<any>('fetchLedgerReport'))
        );
    }

    fetchQuotationDetails(quotationLogId: number): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/fetch_quotation_details`, {
            quotation_log_id: quotationLogId
        }).pipe(
            timeout(30000),
            retry({ count: 2, delay: 1000 }),
            shareReplay({ bufferSize: 1, refCount: true }),
            catchError(this.handleError<any>('fetchQuotationDetails'))
        );
    }

    clearCache(): void {
        this.templateCache.clear();
    }

    private handleError<T>(operation: string) {
        return (error: HttpErrorResponse | Error): Observable<T> => {
            const errorMessage = error instanceof HttpErrorResponse
                ? `Server returned code ${error.status}: ${error.message}`
                : `An error occurred: ${error.message}`;

            if (!environment.production) {
                console.error(`${operation} failed:`, errorMessage, error);
            }

            return throwError(() => error) as Observable<T>;
        };
    }
}

