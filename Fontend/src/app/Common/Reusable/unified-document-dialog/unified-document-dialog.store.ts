import { Injectable, inject, signal, computed } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    catchError,
    finalize,
    tap,
    switchMap,
    of,
    EMPTY,
    Observable,
    shareReplay,
    debounceTime,
    distinctUntilChanged
} from 'rxjs';
import {
    DocumentDialogType,
    DocumentDialogData,
    BookingData,
    DemandData,
    LetterData,
    ReceiptData,
    TokenData,
    ReceiptApiResponse,
    ApiResponse,
    TemplateResponse,
    MODULE_ID_MAP,
    TITLE_MAP
} from './unified-document-dialog.interfaces';
import { UnifiedDocumentDialogService } from './unified-document-dialog.service';
import { PlaceholderReplacerService } from './placeholder-replacer.service';
import { environment } from '../../../../environments/environment';

const LOADING_DEBOUNCE_MS = 200;
const SNACKBAR_DURATION_MS = 3000;
const LARGE_HTML_THRESHOLD = 50000;

@Injectable()
export class UnifiedDocumentDialogStore {
    private readonly documentService = inject(UnifiedDocumentDialogService);
    private readonly placeholderService = inject(PlaceholderReplacerService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly sanitizer = inject(DomSanitizer);

    // --- State ---
    readonly loading = signal(false);
    readonly loadingMessage = signal('');
    readonly processedHtml = signal<SafeHtml | null>(null);
    readonly isLargeContent = signal(false);
    readonly projectName = signal('');
    readonly dialogTitle = signal('');

    private readonly _dialogType = signal<DocumentDialogType>(DocumentDialogType.BOOKING_FORM);
    private readonly _bookingData = signal<BookingData | ReceiptApiResponse | null>(null);
    private readonly _demandData = signal<DemandData[] | null>(null);
    private readonly _letterData = signal<LetterData[] | null>(null);
    private readonly _tokenData = signal<TokenData | null>(null);
    private readonly _currentDate = signal(new Date().toLocaleDateString('en-IN'));
    private readonly _dialogData = signal<DocumentDialogData | null>(null);

    // --- Computed ---
    readonly dialogType = computed(() => this._dialogType());
    readonly hasContent = computed(() => !!this.processedHtml());
    readonly canPrint = computed(() => this.hasContent() && !this.loading());

    readonly projectId = computed(() => this.getProjectId());
    readonly moduleId = computed(() => {
        const type = this._dialogType();
        if (type === DocumentDialogType.LETTER_CONFIG_PREVIEW) return 0;
        return MODULE_ID_MAP[type] || 1;
    });

    private loadingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private readonly storageUrl = environment.STORAGE_URL;

    // --- Initialization ---
    initialize(data: DocumentDialogData) {
        const type = data?.dialogType || DocumentDialogType.BOOKING_FORM;
        this._dialogType.set(type);
        this.dialogTitle.set(TITLE_MAP[type] || 'Document');
        this._dialogData.set(data);

        this.loadData(data);
    }

    private loadData(data: DocumentDialogData) {
        switch (this._dialogType()) {
            case DocumentDialogType.ALLOTMENT_LETTER:
                this.handleAllotmentLetter(data);
                break;
            case DocumentDialogType.BOOKING_COST_SHEET:
            case DocumentDialogType.BOOKING_FORM:
                this.handleBookingDocument(data);
                break;
            case DocumentDialogType.RECEIPT:
                this.handleReceipt(data);
                break;
            case DocumentDialogType.CP_INVOICE:
                this.handleCPInvoice(data);
                break;
            case DocumentDialogType.DEMAND_LETTER:
                this.handleDemandLetter(data);
                break;
            case DocumentDialogType.LETTER_CONFIG_PREVIEW:
                this.handleLetterConfig(data);
                break;
            case DocumentDialogType.TOKEN_FORM:
            case DocumentDialogType.TOKEN_RECEIPT:
                this.handleTokenDocument(data);
                break;
            case DocumentDialogType.LEDGER_REPORT:
                this.handleLedgerReport(data);
                break;
            case DocumentDialogType.QUATATION_REPORT:
                this.handleQuotationReport(data);
                break;
            default:
                this.fetchAllTemplateHTML();
        }
    }

    // --- Handlers ---
    private handleAllotmentLetter(data: DocumentDialogData) {
        const bookingId = data?.rowData?.booking_id;
        if (bookingId) {
            this.fetchBookingData(bookingId, 'Fetching booking details...', false);
        } else {
            this.fetchAllTemplateHTML();
        }
    }

    private handleBookingDocument(data: DocumentDialogData) {
        const bookingId = data?.rowData?.booking_id;
        if (bookingId) {
            this.fetchBookingData(bookingId, 'Fetching booking details...', true);
        } else {
            this.fetchAllTemplateHTML();
        }
    }

    private handleReceipt(data: DocumentDialogData) {
        const receiptIds = this.extractReceiptIds(data);
        if (receiptIds.length > 0) {
            this.fetchAllBookingReceiptDetails(receiptIds);
        } else {
            this.showError('No receipt data provided.');
        }
    }

    private handleCPInvoice(data: DocumentDialogData) {
        const bookingId = data?.rowData?.booking_id;
        if (bookingId) {
            const cpId = data?.rowData?.channel_partner_id;
            const projId = data?.rowData?.project_id ?? data?.project_id;
            this.fetchCPInvoiceDetails(bookingId, cpId, projId);
        } else {
            this.fetchAllTemplateHTML();
        }
    }

    private handleDemandLetter(data: DocumentDialogData) {
        const demandId = data?.rowData?.demand_id;
        if (demandId) {
            this.fetchDemandDetails(demandId);
        } else {
            this.fetchAllTemplateHTML();
        }
    }

    private handleLetterConfig(data: DocumentDialogData) {
        if (data) {
            this.fetchSingleLetterDetails(data);
        } else {
            this.fetchAllTemplateHTML();
        }
    }

    private handleTokenDocument(data: DocumentDialogData) {
        const tokenId = data?.token_id || data?.rowData?.token_id;
        if (tokenId) {
            this.fetchTokenDetails(tokenId);
        } else {
            this.fetchAllTemplateHTML();
        }
    }

    // --- Data Fetching ---
    private fetchBookingData(bookingID: number, message: string, setProjectName: boolean) {
        this.setLoading(true, message);
        this.documentService.fetchBookingDetails(bookingID).pipe(
            tap(res => {
                this._bookingData.set(res);
                if (setProjectName && res?.project_name) this.projectName.set(res.project_name);
            }),
            switchMap(() => {
                const pId = this.projectId();
                return pId ? this.fetchTemplateWithProject(pId) : of(null);
            }),
            catchError(err => this.handleError('Error fetching booking details', err)),
            finalize(() => this.setLoading(false))
        ).subscribe();
    }

    private fetchCPInvoiceDetails(bookingID: number, cpId?: number, projId?: number) {
        this.setLoading(true, 'Fetching invoice details...');
        this.documentService.generateBill(bookingID, cpId, projId).pipe(
            tap(res => this._bookingData.set(res)),
            switchMap(() => {
                const pId = projId || this.projectId();
                return pId ? this.fetchTemplateWithProject(pId) : of(null);
            }),
            catchError(err => this.handleError('Error fetching invoice details', err)),
            finalize(() => this.setLoading(false))
        ).subscribe();
    }

    private fetchDemandDetails(demandID: number) {
        this.setLoading(true, 'Fetching demand details...');
        this.documentService.fetchDemandDetails(demandID).pipe(
            switchMap(res => {
                if (res.status && res.data?.length) {
                    this._demandData.set(res.data);
                    const first = res.data[0];
                    if (first?.project_name) this.projectName.set(first.project_name);
                    const pId = this.projectId();
                    return pId ? this.fetchTemplateWithProject(pId) : of(null);
                }
                this.showError('No demand data received');
                return EMPTY;
            }),
            catchError(err => this.handleError('Error fetching demand details', err)),
            finalize(() => this.setLoading(false))
        ).subscribe();
    }

    private fetchSingleLetterDetails(data: DocumentDialogData) {
        const letterId = data?.letter_generation_id || data?.rowData?.letter_generation_id;
        if (!letterId) return;

        this.setLoading(true, 'Fetching letter details...');
        this.documentService.fetchLetterDetails(letterId).pipe(
            switchMap(res => {
                if (res.success && res.data?.length) {
                    this._letterData.set(res.data);
                    const pId = this.projectId();
                    return pId ? this.fetchTemplateWithProject(pId) : of(null);
                }
                this.showError('No letter data received');
                return EMPTY;
            }),
            catchError(err => this.handleError('Error fetching letter details', err)),
            finalize(() => this.setLoading(false))
        ).subscribe();
    }

    private fetchAllBookingReceiptDetails(ids: number[]) {
        this.setLoading(true, 'Fetching receipt details...');
        this.documentService.fetchBookingReceiptDetails(ids).pipe(
            switchMap(res => {
                if (res.success && res.data) {
                    this._bookingData.set(res);
                    if (res.common_data?.project_name) this.projectName.set(res.common_data.project_name);
                    const pId = this.projectId();
                    if (!pId) {
                        this.showError('Project ID not found.');
                        return EMPTY;
                    }
                    return this.fetchTemplateWithProject(pId);
                }
                this.showError('Invalid receipt data received');
                return EMPTY;
            }),
            catchError(err => this.handleError('Error fetching receipt details', err)),
            finalize(() => this.setLoading(false))
        ).subscribe();
    }

    private fetchTokenDetails(tokenID: number) {
        this.setLoading(true, 'Fetching token details...');
        this.documentService.fetchTokenDetails(tokenID).pipe(
            switchMap(res => {
                if (res?.length) {
                    const token = res[0];
                    this._tokenData.set(token);
                    if (token.property_name) this.projectName.set(token.property_name);
                    const pId = this.projectId();
                    return pId ? this.fetchTemplateWithProject(pId) : of(null);
                }
                this.showError('No token data received');
                return EMPTY;
            }),
            catchError(err => this.handleError('Error fetching token details', err)),
            finalize(() => this.setLoading(false))
        ).subscribe();
    }

    private fetchTemplateWithProject(projectID: number): Observable<TemplateResponse> {
        const title = this.dialogTitle();
        this.setLoading(true, `Loading ${title.toLowerCase()} template...`);

        const request$ = this._dialogType() === DocumentDialogType.LETTER_CONFIG_PREVIEW
            ? this.documentService.fetchLetterFormat(projectID, this._letterData()?.[0]?.letter_type_id!, this._letterData()?.[0]?.bank_id)
            : this.documentService.fetchTemplateHTML(projectID, this.moduleId());

        return request$.pipe(
            debounceTime(100),
            distinctUntilChanged((prev, curr) => prev.html_content === curr.html_content),
            tap(res => {
                if ((res.status || res.success) && res.html_content) {
                    this.processTemplateHTML(res.html_content);
                } else {
                    this.showError(`Error loading ${title.toLowerCase()} template.`);
                }
            }),
            finalize(() => this.setLoading(false))
        );
    }

    private fetchAllTemplateHTML() {
        const pId = this.projectId();
        if (pId || this._dialogType() === DocumentDialogType.LETTER_CONFIG_PREVIEW) {
            this.fetchTemplateWithProject(pId!).subscribe();
        }
    }

    // --- Processing ---
    private processTemplateHTML(htmlContent: string) {
        const isLarge = htmlContent.length > LARGE_HTML_THRESHOLD;
        this.isLargeContent.set(isLarge);

        const processed = this.replacePlaceholders(htmlContent);
        this.processedHtml.set(this.sanitizer.bypassSecurityTrustHtml(processed));
    }

    private replacePlaceholders(html: string): string {
        const type = this._dialogType();
        const replacements = this.getReplacements(type, html);

        let processed = html;

        // Handle receipt payment rows BEFORE regular placeholder replacement
        // to prevent placeholders from being replaced before pattern matching
        if (type === DocumentDialogType.RECEIPT) {
            processed = this.handleReceiptSpecialReplacements(processed, replacements);
        }

        // Handle booking: 2nd applicant column (merged "NOT AVAILABLE" when absent) and payment stage rows
        if (
            type === DocumentDialogType.BOOKING_FORM ||
            type === DocumentDialogType.BOOKING_COST_SHEET ||
            type === DocumentDialogType.ALLOTMENT_LETTER
        ) {
            processed = this.handleApplicant2ColumnReplacement(processed, replacements);
            processed = this.handleBookingSpecialReplacements(processed, replacements);
        }

        // Quotation: payment slab rows (<!--start_payment_slab_row-->...<!--end_payment_slab_row-->)
        if (type === DocumentDialogType.QUATATION_REPORT) {
            processed = this.handleBookingSpecialReplacements(processed, replacements);
        }

        // Handle ledger report receipt rows
        if (type === DocumentDialogType.LEDGER_REPORT) {
            processed = this.handleLedgerReportSpecialReplacements(processed, replacements);
        }

        // Handle letter config: parking table (one row per parking)
        if (type === DocumentDialogType.LETTER_CONFIG_PREVIEW) {
            processed = this.handleLetterConfigParkingTable(processed, replacements);
        }

        // Now do regular placeholder replacement
        processed = this.placeholderService.replacePlaceholders(processed, replacements);

        if (type === DocumentDialogType.TOKEN_FORM || type === DocumentDialogType.TOKEN_RECEIPT) {
            processed = this.handleTokenConditionalSections(processed);
        }

        return this.placeholderService.cleanupPlaceholders(processed, type === DocumentDialogType.RECEIPT ? 'N/A' : '');
    }

    private getReplacements(type: DocumentDialogType, html: string): Record<string, string> {
        const date = this._currentDate();
        const url = this.storageUrl;

        switch (type) {
            case DocumentDialogType.ALLOTMENT_LETTER:
            case DocumentDialogType.BOOKING_COST_SHEET:
            case DocumentDialogType.BOOKING_FORM:
            case DocumentDialogType.CP_INVOICE:
                return this.placeholderService.buildBookingReplacements(this._bookingData() as BookingData, type, date, url, html);
            case DocumentDialogType.RECEIPT: {
                const data = this._bookingData();
                const receipts = this.isReceiptApiResponse(data) ? data.data : (data as BookingData)?.data || [];
                const common = this.isReceiptApiResponse(data) ? data.common_data : (data as BookingData)?.common_data;
                return this.placeholderService.buildReceiptReplacements(receipts, common as any, url);
            }
            case DocumentDialogType.DEMAND_LETTER:
                return this.placeholderService.buildDemandReplacements(this._demandData()?.[0]!, date, url, a => this.placeholderService.numberToWords(a));
            case DocumentDialogType.LETTER_CONFIG_PREVIEW:
                return this.placeholderService.buildLetterConfigReplacements(this._letterData()?.[0]!, a => this.placeholderService.numberToWords(a), html);
            case DocumentDialogType.TOKEN_FORM:
            case DocumentDialogType.TOKEN_RECEIPT:
                return this.placeholderService.buildTokenReplacements(this._tokenData()!, date);
            case DocumentDialogType.LEDGER_REPORT:
                return this.placeholderService.buildLedgerReportReplacements(this._bookingData() as any, date, url, html);
            case DocumentDialogType.QUATATION_REPORT:
                return this.placeholderService.buildQuotationReplacements(this._bookingData() as any, date, url, html);
            default:
                return {};
        }
    }

    private handleReceiptSpecialReplacements(html: string, replacements: Record<string, string>): string {
        const pattern = /<tr>\s*<td[^>]*>#ReceiptPaymentDate#<\/td>\s*<td[^>]*>#RECEIPTNO#<\/td>\s*<td[^>]*>Towards #Type#<\/td>\s*<td[^>]*>#TRNO#<\/td>\s*<td[^>]*>#PaymentMode#(?:-?#BankName#)?<\/td>\s*<td[^>]*>#Amount#<\/td>\s*<\/tr>/;
        const rows = replacements['__paymentRows__'] || '';
        return html.replace(pattern, rows);
    }

    /**
     * When 2nd applicant is not available: replace the first #Applicant2# td with a single
     * merged cell (rowspan) showing "NOT AVAILABLE" centered, and remove the other Applicant2 tds.
     */
    private handleApplicant2ColumnReplacement(html: string, replacements: Record<string, string>): string {
        const mergedBlock = replacements['__applicant2MergeBlock__'];
        if (!mergedBlock) return html;
        const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let res = html.replace(/<td[^>]*>#Applicant2#\s*<\/td>/, mergedBlock);
        const toRemove = ['#Applicant2Address#', '#Applicant2DOB#', '#Applicant2PAN#', '#Applicant2Aadhar#', '#Applicant2Email#', '#Applicant2MobileNo#', '#Applicant2Occupation#', '#Applicant2Age#'];
        toRemove.forEach(ph => {
            res = res.replace(new RegExp('<td[^>]*>\\s*' + esc(ph) + '\\s*<\\/td>', 'g'), '');
        });
        return res;
    }

    private handleBookingSpecialReplacements(html: string, replacements: Record<string, string>): string {
        const pattern = /<!--start_payment_slab_row-->[\s\S]*?<!--end_payment_slab_row-->/g;
        const rows = replacements['__paymentSlabRows__'] || '';
        return html.replace(pattern, rows);
    }

    private handleLedgerReportSpecialReplacements(html: string, replacements: Record<string, string>): string {
        const pattern = /<tr>\s*<td>#SrNo#<\/td>\s*<td>#TRNDate#<\/td>\s*<td>#ReceiptNo#<\/td>\s*<td>#OCRType#<\/td>\s*<td>#PaymentDetails#<\/td>\s*<td>#Status#<\/td>\s*<td>#Remark#<\/td>\s*<td[^>]*>#CreditAmount#<\/td>\s*<td[^>]*>#DebitAmount#<\/td>\s*<\/tr>/;
        const rows = replacements['__ledgerRows__'] || '';
        return html.replace(pattern, rows);
    }

    private handleLetterConfigParkingTable(html: string, replacements: Record<string, string>): string {
        const rows = replacements['__parkingTableRows__'] || '';
        // 1) Replace <!--start_parking_row-->...<!--end_parking_row--> block with one row per parking
        if (html.includes('<!--start_parking_row-->')) {
            return html.replace(/<!--start_parking_row-->[\s\S]*?<!--end_parking_row-->/g, rows);
        }
        // 2) Fallback: replace first <tr> that contains #ParkingNo# and #ParkingLevel# (combined row → one row per parking)
        const trPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
        let replaced = false;
        return html.replace(trPattern, (m) => {
            if (!replaced && m.includes('#ParkingNo#') && m.includes('#ParkingLevel#')) {
                replaced = true;
                return rows;
            }
            return m;
        });
    }

    private handleTokenConditionalSections(html: string): string {
        const token = this._tokenData();
        if (!token) return html;
        const patterns = [
            { condition: !token.floor_unit_id, regex: /<!--start_unit_info-->[\s\S]*?<!--end_unit_info-->/g },
            { condition: !token.total_carpet_area_sqft, regex: /<!--start_carpet_info-->[\s\S]*?<!--end_carpet_info-->/g },
            { condition: !token.token_transactions?.length, regex: /<!--start_payment_details-->[\s\S]*?<!--end_payment_details-->/g }
        ];
        return patterns.reduce((res, { condition, regex }) => condition ? res.replace(regex, '') : res, html);
    }

    // --- Helpers ---
    private getProjectId(): number | null {
        const type = this._dialogType();
        switch (type) {
            case DocumentDialogType.DEMAND_LETTER: return this._demandData()?.[0]?.project_id ?? null;
            case DocumentDialogType.LETTER_CONFIG_PREVIEW: return this._letterData()?.[0]?.project_id ?? null;
            case DocumentDialogType.TOKEN_FORM:
            case DocumentDialogType.TOKEN_RECEIPT: return this._tokenData()?.project_id ?? null;
            case DocumentDialogType.RECEIPT: return this.extractProjectIdFromData() ?? null;
            case DocumentDialogType.LEDGER_REPORT: 
                return this.extractProjectIdFromData() ?? this._dialogData()?.rowData?.project_id ?? this._dialogData()?.project_id ?? null;
            case DocumentDialogType.QUATATION_REPORT:
                return (this._bookingData() as any)?.project_id ?? this._dialogData()?.rowData?.project_id ?? this._dialogData()?.project_id ?? null;
            default: return this.extractProjectIdFromData() ?? null;
        }
    }

    private extractProjectIdFromData(): number | null {
        const data = this._bookingData();
        if (!data) return null;
        if (this.isReceiptApiResponse(data)) return data.common_data?.project_id ?? null;
        return (data as BookingData).common_data?.project_id ?? (data as BookingData).project_id ?? null;
    }

    private isReceiptApiResponse(data: any): data is ReceiptApiResponse {
        return data && 'data' in data && Array.isArray(data.data);
    }

    private extractReceiptIds(data: DocumentDialogData): number[] {
        if (data?.receiptData && Array.isArray(data.receiptData)) return data.receiptData.map(r => r.booking_receipt_id!).filter(id => !!id);
        if (data?.booking_receipt_id) return [data.booking_receipt_id];
        if (data?.rowData?.booking_receipt_id) return [data.rowData.booking_receipt_id];
        return [];
    }

    private setLoading(loading: boolean, message: string = '') {
        if (loading) {
            this.loadingMessage.set(message);
            if (this.loadingTimeoutId) clearTimeout(this.loadingTimeoutId);
            this.loadingTimeoutId = setTimeout(() => {
                this.loading.set(true);
                this.loadingTimeoutId = null;
            }, LOADING_DEBOUNCE_MS);
        } else {
            if (this.loadingTimeoutId) {
                clearTimeout(this.loadingTimeoutId);
                this.loadingTimeoutId = null;
            }
            this.loading.set(false);
            this.loadingMessage.set('');
        }
    }

    private showError(message: string) {
        this.snackBar.open(message, 'Close', { duration: SNACKBAR_DURATION_MS, panelClass: 'error-snackbar' });
    }

    private handleError(message: string, error: any) {
        this.setLoading(false);
        if (!environment.production) console.error(message, error);
        this.showError(message);
        return EMPTY;
    }

    clearOutput() {
        this.processedHtml.set(null);
    }
    private handleLedgerReport(data: DocumentDialogData) {
        const bookingId = data?.rowData?.booking_id;
        if (bookingId) {
            this.fetchLedgerReport(bookingId);
        } else {
            this.fetchAllTemplateHTML();
        }
    }

    private handleQuotationReport(data: DocumentDialogData) {
        const quotationLogId = data?.rowData?.quotation_log_id;
        if (quotationLogId) {
            this.fetchQuotationDetails(quotationLogId);
        } else {
            this.fetchAllTemplateHTML();
        }
    }

    private fetchQuotationDetails(quotationLogId: number) {
        this.setLoading(true, 'Fetching quotation details...');
        this.documentService.fetchQuotationDetails(quotationLogId).pipe(
            switchMap(res => {
                const payload = res?.data ?? res;
                if (payload && (res?.success !== false && res?.status !== false)) {
                    this._bookingData.set(payload as any);
                    if (payload.project_name) this.projectName.set(payload.project_name);
                    const pId = payload.project_id ?? this._dialogData()?.rowData?.project_id ?? null;
                    return pId ? this.fetchTemplateWithProject(pId) : of(null);
                }
                this.showError('No quotation data received');
                return EMPTY;
            }),
            catchError(err => this.handleError('Error fetching quotation details', err)),
            finalize(() => this.setLoading(false))
        ).subscribe();
    }
    private fetchLedgerReport(bookingId: number) {
        this.setLoading(true, 'Fetching ledger report...');
        this.documentService.fetchLedgerReport(bookingId).pipe(
            switchMap(res => {
                if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
                    const ledgerData = res.data[0];
                    this._bookingData.set(ledgerData as any);
                    if (ledgerData.project_name) this.projectName.set(ledgerData.project_name);
                    const pId = this.projectId();
                    return pId ? this.fetchTemplateWithProject(pId) : of(null);
                }
                this.showError('No ledger report data received');
                return EMPTY;
            }),
            catchError(err => this.handleError('Error fetching ledger report', err)),
            finalize(() => this.setLoading(false))
        ).subscribe();
    }
}
