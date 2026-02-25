import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
    BookingData,
    DemandData,
    DocumentDialogType,
    LetterData,
    LetterParking,
    PaymentStage,
    ReplacementMap,
    TokenData
} from './unified-document-dialog.interfaces';

@Injectable({
    providedIn: 'root'
})
export class PlaceholderReplacerService {
    private readonly storageUrl = environment.STORAGE_URL;

    // Memoized regex patterns for better performance
    private readonly placeholderPattern = /#[a-zA-Z0-9_]+#/g;
    private readonly paymentSlabPattern = /<!--start_payment_slab_row-->[\s\S]*?<!--end_payment_slab_row-->/g;
    private readonly paymentRowPattern = /<tr>\s*<td[^>]*>#ReceiptPaymentDate#<\/td>\s*<td[^>]*>#RECEIPTNO#<\/td>\s*<td[^>]*>Towards #Type#<\/td>\s*<td[^>]*>#TRNO#<\/td>\s*<td[^>]*>#PaymentMode#(?:-?#BankName#)?<\/td>\s*<td[^>]*>#Amount#<\/td>\s*<\/tr>/;

    /**
     * Optimized single-pass replacement with support for template blocks
     */
    replacePlaceholders(
        htmlContent: string,
        replacements: ReplacementMap
    ): string {
        if (!htmlContent || typeof htmlContent !== 'string') {
            return '';
        }

        let result = htmlContent;

        // Handle template blocks first (like payment slab rows)
        const templateBlockKeys = Object.keys(replacements).filter(key =>
            key.includes('<!--start_') && key.includes('<!--end_')
        );

        for (const templateBlock of templateBlockKeys) {
            // Extract the actual pattern from the string representation
            const patternMatch = templateBlock.match(/^\/\/(.*)\/\/$/);
            if (patternMatch) {
                const pattern = patternMatch[1];
                result = result.replace(new RegExp(pattern, 'g'), replacements[templateBlock]);
            }
        }

        // Then handle simple placeholders
        const simpleKeys = Object.keys(replacements).filter(key =>
            !key.includes('<!--start_') && !key.includes('<!--end_')
        );

        if (simpleKeys.length > 0) {
            const pattern = new RegExp(
                simpleKeys.map(key => this.escapeRegex(key)).join('|'),
                'g'
            );

            result = result.replace(pattern, (match) => {
                return replacements[match] ?? match;
            });
        }

        return result;
    }
    /**
     * Build replacement map for booking-related documents
     */
    buildBookingReplacements(
        bookingData: BookingData,
        dialogType: DocumentDialogType,
        currentDate: string,
        storageUrl: string,
        htmlTemplate: string = ''
    ): ReplacementMap {
        const replacements: ReplacementMap = {};
        const applicant = bookingData?.applicant_name || '';
        const coApplicant = bookingData?.coapplicant_name || '';

        // Common replacements
        replacements['#company_logo#'] = `${storageUrl}/${bookingData?.company_logo || ''}`;
        replacements['#RERA#'] = bookingData?.phases?.[0]?.rera_no || '';
        replacements['#AgreementCostWords#'] = this.numberToWords(bookingData.agreement_cost || 0);
        // replacements['#ParkingSizeSqft#'] = bookingData?.parking_size_sqft || '';
        // replacements['#ParkingSizeSqm#'] = bookingData?.parking_size_sqm || '';
        replacements['#ParkingNo#'] = bookingData?.parking_no || '';
        replacements['#project_logo#'] = `${storageUrl}/${bookingData?.project_logo || ''}`;
        replacements['#ProjectName#'] = bookingData.project_name || '';
        replacements['#ProjectAddress#'] = bookingData.site_address || '';
        replacements['#FlatNo#'] = bookingData.floor_unit || '';
        replacements['#UnitNo#'] = bookingData.floor_unit || '';
        replacements['#Wing#'] = bookingData.wing_name || '';
        replacements['#RERA# '] = this.getReraNo(bookingData, dialogType);
        replacements['#BookingDate#'] = this.formatDate(bookingData.booking_date, currentDate);

        // Applicant 1
        replacements['#Applicant1#'] = applicant;
        replacements['#Address#'] = bookingData.applicant_current_address || '';
        replacements['#Applicant1DOB#'] = this.formatDate(bookingData.applicant_dob);
        replacements['#Applicant1PAN#'] = bookingData.applicant_pan_no || '';
        replacements['#Applicant1Aadhar#'] = bookingData.applicant_aadhar_no || '';
        replacements['#Applicant1Email#'] = bookingData.applicant_email || '';
        replacements['#Applicant1MobileNo#'] = bookingData.applicant_mobile || '';
        replacements['#Applicant1Occupation#'] = bookingData.applicant_occupation || '';
        replacements['#Applicant1Age#'] = bookingData.applicant_age || '';

        // Applicant 2 - when not available: one merged cell with "NOT AVAILABLE" centered in the column
        const isSecondApplicantAvailable = !!(coApplicant && String(coApplicant).trim());
        if (isSecondApplicantAvailable) {
            replacements['#Applicant2#'] = coApplicant;
            replacements['#Applicant2Address#'] = bookingData.coapplicant_current_address || '';
            replacements['#Applicant2DOB#'] = this.formatDate(bookingData.coapplicant_dob);
            replacements['#Applicant2PAN#'] = bookingData.coapplicant_pan_no || '';
            replacements['#Applicant2Aadhar#'] = bookingData.coapplicant_aadhar_no || '';
            replacements['#Applicant2Email#'] = bookingData.coapplicant_email || '';
            replacements['#Applicant2MobileNo#'] = bookingData.coapplicant_mobile || '';
            replacements['#Applicant2Occupation#'] = bookingData.coapplicant_occupation || '';
            replacements['#Applicant2Age#'] = bookingData.coapplicant_age || '';
        } else {
            // Single merged cell with "NOT AVAILABLE" centered for the whole 2nd applicant column
            replacements['__applicant2MergeBlock__'] =
                '<td rowspan="9" style="text-align:center;vertical-align:middle">NOT AVAILABLE</td>';
        }

        // Financial
        replacements['#BookingAmount#'] = this.formatCurrency(bookingData.booking_amount || 0);
        replacements['#AgreementCost#'] = this.formatCurrency(bookingData.agreement_cost || 0);
        replacements['#StampDuty#'] = this.formatCurrency(bookingData.stamp_duty || 0);
        replacements['#Registration#'] = this.formatCurrency(bookingData.reg || 0);
        replacements['#Gst#'] = this.formatCurrency(bookingData.gst || 0);
        replacements['#PackageTotal#'] = this.formatCurrency(bookingData.package_total || 0);
        // Prefer floor_units.maintenance_charges/corpus_fund, fallback to booking-level maintenance/corpus
        const maintenanceVal = parseFloat(String(bookingData.floor_units?.maintenance_charges ?? '')) || (bookingData.maintenance ?? 0);
        const corpusVal = parseFloat(String(bookingData.floor_units?.corpus_fund ?? '')) || (bookingData.corpus ?? 0);
        replacements['#MaintenanceCharges#'] = this.formatCurrency(maintenanceVal);
        replacements['#CorpusFund#'] = this.formatCurrency(corpusVal);
        replacements['#ProjectName#'] = bookingData.project_name || '';
        replacements['#FlatNo#'] = bookingData.floor_unit || '';
        replacements['#AgreementCost#'] = this.formatCurrency(bookingData.agreement_cost || 0);
        replacements['#TotalStagePercentageInt#'] = '100';
        replacements['#TotalStageAmount#'] = this.formatCurrency(bookingData.agreement_cost || 0);

        // Generate payment stage rows dynamically from API response
        // Extract template row structure from HTML
        const templateRow = this.extractTemplateRow(htmlTemplate);
        let stageRowsHtml = '';
        let totalPercentage = 0;
        let totalAmount = 0;
        let totalGst = 0;

        if (bookingData?.stages && bookingData.stages.length > 0) {
            bookingData.stages.forEach((stage: any, index: number) => {
                const perc = parseFloat(stage.percentage) || 0;
                const amt = parseFloat(stage.amount) || 0;
                const gstAmt = parseFloat(stage.gst_amount) || 0;

                totalPercentage += perc;
                totalAmount += amt;
                totalGst += gstAmt;

                // Generate row based on template structure
                stageRowsHtml += this.generateStageRow(templateRow, stage, index + 1);
            });
        }

        // Use the correct key that matches UnifiedDocumentDialogStore expectation
        replacements['__paymentSlabRows__'] = stageRowsHtml;

        // Update totals with calculated values
        replacements['#TotalStagePercentageInt#'] = totalPercentage.toFixed(0);
        replacements['#TotalStageAmount#'] = this.formatCurrency(totalAmount);

        replacements['#TotalGstAmount#'] = this.formatCurrency(totalGst);
        replacements['#ChequeNo#'] = bookingData.transaction_no || '';
        replacements['#TransactionID#'] = bookingData.transaction_no || '';
        replacements['#ChequeDate#'] = this.formatDate(bookingData.transaction_date);
        replacements['#BankBranch#'] = bookingData.payment_mode || '';
        replacements['#BankName#'] = bookingData.bank_name || '';

        // Source
        replacements['#Source#'] = bookingData.source || '';
        replacements['#CpName#'] = bookingData.firm_name || '';
        replacements['#SourceDescription#'] = bookingData.source_description || '';
        replacements['#sourceExecutive#'] = bookingData.sales_executive || '';
        replacements['#salesExecutive#'] = bookingData.sales_executive || '';
        replacements['#InfoSource#'] = bookingData.source_description || '';

        // Area
        replacements['#FloorNo#'] = String(bookingData.floor_name || '');
        replacements['#CarpetSqm#'] = bookingData.carpet ? `${bookingData.carpet} Sq.Ft` : 'N/A';
        replacements['#TotalCarpetAreaSqm#'] = bookingData.carpet ? `${bookingData.carpet} Sq.Ft` : 'N/A';
        replacements['#TotalCarpetAreaSqft#'] = String(bookingData.carpet || '0');
        replacements['#BalconySqm#'] = bookingData.floor_units?.balcony_sqm || '';
        replacements['#BalconyArea#'] = bookingData.floor_units?.enclosed_balcony_sqft || '';
        replacements['#TerraceArea#'] = bookingData.floor_units?.balcony_sqm || '';
        replacements['#TotalUsableArea#'] = bookingData.floor_units?.total_carpet_area_sqm || '';
        replacements['#ReraCarpetArea#'] = bookingData.floor_units?.carpet_sqm || '';

        // Total Carpet Area in Square Meters - set for all document types
        replacements['#TotalCarpetAreaSqmtr#'] = String(bookingData.floor_units?.total_carpet_area_sqm || '');

        // Additional fields
        replacements['#ParkingType#'] = bookingData.parking_type || bookingData.floor_units?.parking_type || '';
        replacements['#ParkingCharges#'] = bookingData.parking_charges || '';
        replacements['#UnitType#'] = bookingData.unit_type || '';
        replacements['#SubProject#'] = bookingData.floor_unit || '';
        replacements['#SDPER#'] = bookingData.sd_per || '';
        replacements['#REGPER#'] = bookingData.reg_per || '';
        replacements['#GSTPER#'] = bookingData.gst_per || '';
        replacements['#RegistrationCharges#'] = String(bookingData.reg || '');
        replacements['#remark#'] = bookingData.remark || '';

        // Add this inside buildBookingReplacements


        // CP Invoice specific
        if (dialogType === DocumentDialogType.CP_INVOICE) {
            const netCommission = parseFloat(String(bookingData.net_commission || 0));
            const sgst = parseFloat(String(bookingData.sgst || 0));
            const cgst = parseFloat(String(bookingData.cgst || 0));
            const igst = parseFloat(String(bookingData.igst || 0));
            const grandTotal = netCommission + sgst + cgst + igst;

            replacements['#EmailId#'] = bookingData.firm_email || '';
            replacements['#RERA# '] = bookingData.rera || '';
            replacements['#InvoiceDate#'] = currentDate;
            replacements['#InvoiceNo#'] = bookingData.invoice_no || '';
            replacements['#GSTN#'] = bookingData.gst_no || 'N/A';
            replacements['#PanNo#'] = bookingData.pan || 'N/A';
            replacements['#SerialNo#'] = '1';
            replacements['#CustomerName#'] = bookingData.customer_name || '';
            replacements['#BasicCost#'] = this.formatCurrency(bookingData.basic_cost || 0);
            replacements['#BrokerageAmount#'] = this.formatCurrency(bookingData.booking_commission || 0);
            replacements['#AmountInWords#'] = this.numberToWords(grandTotal);
            replacements['#TotalAmount#'] = this.formatCurrency(netCommission);

            replacements['#SGST#'] = this.formatCurrency(sgst);
            replacements['#CGST#'] = this.formatCurrency(cgst);
            replacements['#IGST#'] = this.formatCurrency(igst);
            replacements['#GrandTotal#'] = this.formatCurrency(grandTotal);
            replacements['#AccountName#'] = bookingData.bank_account_name || '';
            replacements['#AccountNumber#'] = bookingData.bank_account_no || '--';
            replacements['#IFSCCode#'] = bookingData.ifsc_code || '--';
            replacements['#FirmName#'] = bookingData.firm_name || '';
            replacements['#FirmAddress#'] = bookingData.firm_address || '';
            replacements['#FirmCity#'] = bookingData.firm_city || '';
            replacements['#FirmPhone#'] = String(bookingData.firm_phone || '');
            replacements['#FirmWebsite#'] = bookingData.firm_website || '';
            replacements['#CommissionPercentage#'] = bookingData.commission_percentage || '';
            replacements['#TDS#'] = this.formatCurrency(bookingData.tds || 0);
            replacements['#BookingCount#'] = String(bookingData.booking_count || 0);
            replacements['#TotalProjects#'] = String(bookingData.total_project || 0);
            replacements['#TotalCarpetAreaSqmtr#'] = String(bookingData.floor_units?.total_carpet_area_sqm || 0);
            replacements['#TotalCarpetAreaSqft#'] = String(bookingData.floor_units?.total_carpet_area_sqft || 0);
        }
        // Bank account details for BOOKING_COST_SHEET
        if (dialogType === DocumentDialogType.BOOKING_COST_SHEET) {

            replacements['#TotalCarpetAreaSqmtr#'] = bookingData?.floor_units?.total_carpet_area_sqft || '';

            // Access project_bank_master from bookingData
            const bankDetails = (bookingData as any)?.project_bank_master || [];

            if (bankDetails && bankDetails.length > 0) {
                // Find RERA Collection Account - handle variations like "RERA Coll", "RERA Collection Account", etc.
                const fullAccount = bankDetails.find((bank: any) => {
                    const accountType = (bank.account_type || '').toString().toLowerCase();
                    return accountType.includes('rera') && (accountType.includes('coll') || accountType.includes('collection'));
                });

                // Find GST Collection Account - handle variations like "GST Colle", "GST Collection Account", etc.
                const gstAccount = bankDetails.find((bank: any) => {
                    const accountType = (bank.account_type || '').toString().toLowerCase();
                    return accountType.includes('gst') && (accountType.includes('coll') || accountType.includes('collection'));
                });

                // Use first account if specific account types not found
                const primaryAccount = fullAccount || bankDetails[0];
                const taxAccount = gstAccount || bankDetails.find((bank: any, index: number) =>
                    index !== bankDetails.indexOf(primaryAccount)
                ) || bankDetails[0];

                // Handle both Ifsc_code and ifsc_code field names (API may use either)
                const getIfscCode = (account: any) => account?.Ifsc_code || account?.ifsc_code || '';

                // RERA/100% Collection Account details
                replacements['#NameofBeneficiary100#'] = primaryAccount?.beneficiary_name || '';
                replacements['#BeneficiaryAccountNo100#'] = primaryAccount?.account_no || '';
                replacements['#NameofBank100#'] = primaryAccount?.bank_name || '';
                replacements['#IFSCCode100#'] = getIfscCode(primaryAccount);
                replacements['#AddressOfBank100#'] = primaryAccount?.branch_name || primaryAccount?.address || '';
                replacements['#TotalStagePercentageInt#'] = '100';
                replacements['#TotalStageAmount#'] = this.formatCurrency(bookingData.agreement_cost || 0);
                // GST/Tax Collection Account details
                replacements['#NameofBeneficiaryTax#'] = taxAccount?.beneficiary_name || '';
                replacements['#BeneficiaryAccountNoTax#'] = taxAccount?.account_no || '';
                replacements['#NameofBankTax#'] = taxAccount?.bank_name || '';
                replacements['#IFSCCodeTax#'] = getIfscCode(taxAccount);
                replacements['#AddressOfBankTax#'] = taxAccount?.branch_name || taxAccount?.address || '';
            }
        }

        return replacements;
    }



    /**
     * Build demand letter replacements
     */
    buildDemandReplacements(
        demandData: DemandData,
        currentDate: string,
        storageUrl: string,
        numberToWords: (amount: number | string) => string
    ): ReplacementMap {
        const replacements: ReplacementMap = {};
        const applicant = demandData?.applicant || {};
        const bankDetails = demandData?.bank_detail || [];

        const fullAccount = bankDetails.find(bank => bank.account_type === 'RERA Collection Account');
        const gstAccount = bankDetails.find(bank => bank.account_type === 'GST Collection Account');

        const createdDate = new Date(demandData.created_at);
        const formattedDate = createdDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        replacements['#Date#'] = formattedDate;
        replacements['#CustomerInfo#'] = this.getCustomerInfo(demandData);
        replacements['#MobileNo#'] = applicant.mobile_no || '';
        replacements['#ProjectName#'] = demandData.project_name || '';
        replacements['#ProjectAddress#'] = demandData.site_address || '';
        replacements['#UnitNo#'] = demandData.floor_unit || '';
        replacements['#FLOOR#'] = this.formatOrdinal(demandData.floor_id);
        replacements['#WING#'] = demandData.wing_name || '';
        replacements['#Wing#'] = demandData.wing_name || '';
        replacements['#StageText#'] = demandData.stage_name || '';
        replacements['#TotalUnitAmount#'] = this.formatIndianCurrency(demandData.agreement_cost ?? 0);
        replacements['#TillDateDuePercentage#'] = String(demandData.till_date_due_percentage || '');
        replacements['#InstallmentDueAmount#'] = this.formatIndianCurrency(demandData.total_installment_due_till ?? 0);
        replacements['#GstPercent#'] = String(demandData.gst_per || '');
        replacements['#GstDueAmount#'] = this.formatIndianCurrency(demandData.gst_total ?? 0);
        replacements['#ReceivedInstallmentAmount#'] = this.formatIndianCurrency(demandData.received_amount ?? 0);
        replacements['#ReceivedGstAmount#'] = this.formatIndianCurrency(demandData.received_gst ?? 0);
        replacements['#TotalBalanceInstallmentAmount1#'] = this.formatIndianCurrency(demandData.balance_amount ?? 0);
        replacements['#TotalBalanceGstAmount1#'] = this.formatIndianCurrency(demandData.balance_gst ?? 0);
        replacements['#TotalBalanceAmount1#'] = this.formatIndianCurrency(demandData.total_pending_with_gst ?? 0);
        replacements['#TotalBalanceAmountWords1#'] = demandData.pending_amount_in_words || '';
        replacements['#project_stamp#'] = this.getProjectStampUrl(demandData, storageUrl);
        replacements['#DeveloperSignature#'] = this.getProjectStampUrl(demandData, storageUrl);

        // Bank account details
        replacements['#NameofBeneficiary100#'] = fullAccount?.beneficiary_name || '';
        replacements['#BeneficiaryAccountNo100#'] = fullAccount?.account_no || '';
        replacements['#NameofBank100#'] = fullAccount?.bank_name || '';
        replacements['#IFSCCode100#'] = fullAccount?.ifsc_code || '';
        replacements['#AddressOfBank100#'] = fullAccount?.branch_name || '';
        replacements['#NameofBeneficiaryTax#'] = gstAccount?.beneficiary_name || '';
        replacements['#BeneficiaryAccountNoTax#'] = gstAccount?.account_no || '';
        replacements['#NameofBankTax#'] = gstAccount?.bank_name || '';
        replacements['#IFSCCodeTax#'] = gstAccount?.ifsc_code || '';
        replacements['#AddressOfBankTax#'] = gstAccount?.branch_name || '';

        return replacements;
    }


    buildLetterConfigReplacements(
        letterData: LetterData,
        numberToWords: (amount: number | string) => string,
        htmlTemplate?: string
    ): ReplacementMap {
        const replacements: ReplacementMap = {};

        const totalReceivedInstallment = this.formatIndianCurrency(letterData.received_amount || 0);
        const totalRemainingInstallment = this.formatIndianCurrency(letterData.balance_amount || 0);
        const sanctionAmt = this.formatIndianCurrency(letterData.sanction_amount || 0);
        const fundingAmt = this.formatIndianCurrency(letterData.funding_amount || 0);
        const ocrAmt = this.formatIndianCurrency(0);
        const createdDate = new Date(letterData.created_at);
        const formattedDate = createdDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const formattedAgreementDate = letterData.agreement_date
            ? new Date(letterData.agreement_date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
            : 'N/A';

        replacements['#DATE#'] = formattedDate;
        replacements['#Applicant1#'] = letterData.applicant1_name || '';
        replacements['#Applicant2#'] = letterData.coapplicant_name || '';
        replacements['#CustomerInfo#'] = letterData.all_applicant || '';
        replacements['#MobileNo#'] = letterData.applicant_mobile || '';
        replacements['#AgreementNo#'] = letterData.agreement_no || 'N/A';
        replacements['#AgreementDate#'] = formattedAgreementDate;
        replacements['#AgreementCostWords#'] = numberToWords(letterData.agreement_cost || 0);
        replacements['#AllApplicant#'] = letterData.all_applicant || 'N/A';
        replacements['#BookingDate#'] = letterData.booking_date || 'N/A';
        replacements['#Wing#'] = letterData.wing_name || '';
        replacements['#AllApplicants#'] = letterData.all_applicant || 'N/A';
        replacements['#ProjectName#'] = letterData.project_name || '';
        replacements['#ProjectAddress#'] = letterData.site_address || 'N/A';
        replacements['#TotalCarpetAreaSqft#'] = letterData.total_carpet_area_sqft || 'N/A';
        replacements['#TotalCarpetAreaSqmtr#'] = letterData.total_carpet_area_sqm || 'N/A';
        replacements['#UnitNo#'] = letterData.floor_unit || 'N/A';
        replacements['#SubProject#'] = letterData.wing_name || '';
        replacements['#GstPercent#'] = letterData.gst_percent || 'N/A';
        replacements['#Gst#'] = this.formatIndianCurrency(letterData.gst || 0);
        replacements['#AgreementCost#'] = this.formatIndianCurrency(letterData.agreement_cost || 0);
        replacements['#AmountInWords#'] = numberToWords(letterData.agreement_cost || 0);
        replacements['#TotalReceivedInstallment#'] = totalReceivedInstallment;
        replacements['#TotalRemainingInstallment#'] = totalRemainingInstallment;
        replacements['#TotalReceivedInstallmentWords#'] = numberToWords(letterData.received_amount || 0);
        replacements['#BankName#'] = letterData.bank_name || '';
        replacements['#BankBranch#'] = letterData.branch_name || '';
        replacements['#SanctionAmt#'] = sanctionAmt;
        replacements['#FundingAmt#'] = fundingAmt;
        replacements['#OCRAmt#'] = ocrAmt;
        replacements['#SanctionAmtWords#'] = numberToWords(letterData.sanction_amount || 0);
        replacements['#FundingAmtWords#'] = numberToWords(letterData.funding_amount || 0);
        replacements['#OCRAmtWords#'] = numberToWords(0);
        // Parking: prefer root fields, else derive from parkings[] (e.g. letter API)
        const parkingNos = letterData.parkings?.map(p => p.parking_no).filter(Boolean) as string[];
        const parkingLevels = [...new Set(letterData.parkings?.map(p => p.parking_level).filter(Boolean))] as string[];
        const parkingTypes = [...new Set(letterData.parkings?.map(p => p.parking_type).filter(Boolean))] as string[];
        replacements['#ParkingNo#'] = letterData.parking_no || parkingNos.join(', ') || '';
        replacements['#ParkingLevel#'] = letterData.parking_level || parkingLevels.join(', ') || '';
        replacements['#ParkingType#'] = letterData.parking_type || parkingTypes.join(', ') || '';
        replacements['#BuilderName#'] = letterData.builder_name || '';

        // Parking table: one row per parking (for <!--start_parking_row-->...<!--end_parking_row--> or a single <tr> with #ParkingNo#/#ParkingLevel#)
        replacements['__parkingTableRows__'] = this.buildParkingTableRows(letterData, htmlTemplate);

        // Set N/A for missing fields
        const naFields = [
            '#RegistOffice#', '#ChequeInFavor#', '#ChequeDate#', '#PackageTotal#',
            '#ReceiptDate#', '#GraceDays#', '#GracePeriod#', '#DelayDays#',
            '#InterestRate#', '#TotalStagePercentage#', '#TotalInstallmentAmount#',
            '#TotalInterestAmount#', '#Signature1#'
        ];
        naFields.forEach(field => {
            replacements[field] = 'N/A';
        });

        return replacements;
    }

    /**
     * Build parking table rows (one row per parking) for letter config.
     * Template from: 1) <!--start_parking_row-->...<!--end_parking_row--> 2) or first <tr> containing #ParkingNo# and #ParkingLevel# 3) or default.
     * Placeholders per row: #SrNo#, #ParkingNo#, #ParkingLevel#, #Wing#/#WingName#, #ParkingType#, #AgreementNo#.
     */
    private buildParkingTableRows(letterData: LetterData, htmlTemplate?: string): string {
        const list = letterData.parkings?.filter(p => p != null) ?? [];
        if (list.length === 0) return '';

        const agreementNo = letterData.agreement_no ?? '';
        const defaultRow = '<tr><td>#SrNo#</td><td>#ParkingNo#</td><td>#ParkingLevel#</td><td>#Wing#</td><td>#ParkingType#</td></tr>';
        let templateRow = defaultRow;

        if (htmlTemplate) {
            const blockMatch = htmlTemplate.match(/<!--start_parking_row-->([\s\S]*?)<!--end_parking_row-->/);
            if (blockMatch?.[1]) {
                const tr = blockMatch[1].match(/<tr[\s\S]*?<\/tr>/i);
                if (tr?.[0]) templateRow = tr[0];
            } else {
                // Fallback: use first <tr> that contains #ParkingNo# and #ParkingLevel# (single combined row → we replace with one row per parking)
                const trMatches = htmlTemplate.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
                if (trMatches) {
                    const found = trMatches.find(t => t.includes('#ParkingNo#') && t.includes('#ParkingLevel#'));
                    if (found) templateRow = found;
                }
            }
        }

        return list
            .map((p, i) => {
                return templateRow
                    .replace(/#SrNo#/gi, String(i + 1))
                    .replace(/#ParkingNo#/gi, p.parking_no ?? '')
                    .replace(/#ParkingLevel#/gi, p.parking_level ?? '')
                    .replace(/#Wing#/gi, p.wing_name ?? '')
                    .replace(/#WingName#/gi, p.wing_name ?? '')
                    .replace(/#ParkingType#/gi, p.parking_type ?? '')
                    .replace(/#AgreementNo#/gi, agreementNo);
            })
            .join('\n');
    }

    /**
     * Build receipt replacements
     */
    buildReceiptReplacements(
        receiptData: any[],
        commonData: any,
        storageUrl: string
    ): ReplacementMap[] {

        if (!receiptData || receiptData.length === 0) {
            return [];
        }

        return receiptData.map((receipt) => {

            const replacements: ReplacementMap = {};

            const receivedAmount =
                receipt?.received_amount != null
                    ? Number(receipt.received_amount)
                    : Number(receipt?.amount || 0);

            // 🟢 Project & Common Data
            replacements['#project_logo#'] = `${storageUrl}/${commonData?.project_logo || ''}`;
            replacements['#company_logo#'] = `${storageUrl}/${commonData?.project_thumbnail_img || ''}`;
            replacements['#Wing#'] = commonData?.wing_name || 'N/A';
            replacements['#UnitNo#'] = commonData?.floor_unit || 'N/A';
            replacements['#ProjectName#'] = commonData?.project_name || 'N/A';
            replacements['#ProjectAddress#'] = commonData?.address || 'N/A';
            replacements['#RERA#'] = commonData?.rera_no || 'N/A';
            replacements['#DATE#'] = receipt?.receipt_date || 'N/A';
            replacements['#WINGFLATNO#'] = this.formatWingFlatNo(commonData);
            replacements['#ChequeInFavor#'] = commonData?.builder_name || 'N/A';

            // 🟢 Applicant Names
            const applicantNames: string[] = [];
            if (commonData?.applicant_name1?.trim()) applicantNames.push(commonData.applicant_name1.trim());
            if (commonData?.applicant_name2?.trim()) applicantNames.push(commonData.applicant_name2.trim());
            if (commonData?.applicant_name3?.trim()) applicantNames.push(commonData.applicant_name3.trim());

            replacements['#Applicant#'] =
                applicantNames.length > 0
                    ? applicantNames.join(', ')
                    : (commonData?.applicant_name || 'N/A');

            // 🟢 Receipt Specific Fields
            replacements['#TRNO#'] = receipt?.trn_no || 'N/A';
            replacements['#RECEIPTNO#'] = receipt?.receipt_no || 'N/A';
            replacements['#PaymentMode#'] = receipt?.payment_mode || 'N/A';
            replacements['#BankName#'] = receipt?.bank_name || 'N/A';
            replacements['#Type#'] = receipt?.receipt_type || 'N/A';
            replacements['#ReceiptPaymentDate#'] = this.formatDate(receipt?.receipt_date);
            replacements['#Amount#'] = this.formatIndianCurrency(receivedAmount);
            replacements['#ChequeNo#'] = receipt?.trn_no || 'N/A';
            replacements['#TransactionID#'] = receipt?.trn_no || 'N/A';
            replacements['#ChequeDate#'] = this.formatDate(receipt?.trn_date);

            // 🟢 Amount Fields
            replacements['#ReceivedAmount#'] = this.formatIndianCurrency(receivedAmount);

            const amountInWords = this.numberToWords(receivedAmount);
            replacements['#AmountInWords#'] = amountInWords;
            replacements['#AmountinWords#'] = amountInWords;

            // 🟢 Only ONE row per receipt
            replacements['__paymentRows__'] = `
      <tr>
        <td>${receipt.receipt_date || 'N/A'}</td>
        <td>${receipt.receipt_no || 'N/A'}</td>
        <td>Towards ${receipt.receipt_type || 'N/A'}</td>
        <td>${receipt.trn_no || 'N/A'}</td>
        <td>${receipt.payment_mode || 'N/A'}${receipt.bank_name ? ` - ${receipt.bank_name}` : ''}</td>
        <td>${this.formatIndianCurrency(receivedAmount)}</td>
      </tr>
    `;

            return replacements;
        });
    }

    /**
     * Clean up remaining placeholders in HTML content
     */
    cleanupPlaceholders(htmlContent: string, replacement: string = ''): string {
        return htmlContent.replace(this.placeholderPattern, replacement);
    }

    // Helper methods
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Extract the template row structure from HTML between markers
     */
    private extractTemplateRow(html: string): string {
        if (!html) return '';

        const pattern = /<!--start_payment_slab_row-->([\s\S]*?)<!--end_payment_slab_row-->/;
        const match = html.match(pattern);

        if (match && match[1]) {
            // Extract just the <tr> content, removing comments
            const content = match[1].trim();
            const trMatch = content.match(/<tr[\s\S]*?<\/tr>/i);
            return trMatch ? trMatch[0] : '';
        }

        // Fallback to default 3-column template if no template found
        return `
      <tr>
        <td style="font-size: 9px;">#PaymentStage#</td>
        <td class="center">#Percentage#%</td>
        <td class="right">#Amount#</td>
      </tr>
    `;
    }

    /**
     * Generate a single stage row based on the template structure
     */
    private generateStageRow(templateRow: string, stage: any, serialNo: number): string {
        if (!templateRow) return '';

        // Create a map of placeholder values
        const placeholderMap: Record<string, string> = {
            // Serial number variations
            '#SerialNo#': String(serialNo),
            '#SrNo#': String(serialNo),
            '#Sr.No#': String(serialNo),
            '#No#': String(serialNo),

            // Stage/Milestone variations
            '#Stage#': stage.payment_stage || '',
            '#Milestone#': stage.payment_stage || '',
            '#PaymentStage#': stage.payment_stage || '',
            '#Stages#': stage.payment_stage || '',

            // Percentage variations
            '#Percentage#': String(stage.percentage || 0),
            '#%#': String(stage.percentage || 0),
            '#Perc#': String(stage.percentage || 0),

            // Amount variations
            '#Amount#': this.formatCurrency(stage.amount || 0),
            '#DemandAmount#': this.formatCurrency(stage.amount || 0),
            '#StageAmount#': this.formatCurrency(stage.amount || 0),

            // GST variations
            '#GST#': this.formatCurrency(stage.gst_amount || 0),
            '#GSTAmount#': this.formatCurrency(stage.gst_amount || 0),
            '#GST5%#': this.formatCurrency(stage.gst_amount || 0),
            '#GstAmount#': this.formatCurrency(stage.gst_amount || 0)
        };

        // Replace all placeholders in the template row
        let row = templateRow;
        for (const [placeholder, value] of Object.entries(placeholderMap)) {
            row = row.replace(new RegExp(this.escapeRegex(placeholder), 'g'), value);
        }

        return row;
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('₹', 'Rs.');
    }

    private formatIndianCurrency(amount: string | number): string {
        if (amount === null || amount === undefined) return '0';
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return '0';
        return num.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        });
    }

    private formatDate(date?: string, fallback?: string): string {
        if (!date) return fallback || '';
        try {
            return new Date(date).toLocaleDateString('en-IN');
        } catch {
            return fallback || '';
        }
    }

    private formatOrdinal(value: string | number | null | undefined): string {
        if (value === null || value === undefined) return '';
        const num = typeof value === 'string' ? parseInt(value, 10) : value;
        if (isNaN(num)) return String(value ?? '');
        const absValue = Math.abs(num);
        const mod100 = absValue % 100;
        let suffix = 'th';
        if (mod100 < 11 || mod100 > 13) {
            switch (absValue % 10) {
                case 1: suffix = 'st'; break;
                case 2: suffix = 'nd'; break;
                case 3: suffix = 'rd'; break;
            }
        }
        return `${num}${suffix}`;
    }

    private getReraNo(bookingData: BookingData, dialogType: DocumentDialogType): string {
        if (dialogType === DocumentDialogType.BOOKING_COST_SHEET) {
            return bookingData?.phases?.[0]?.rera_no || 'Not Available';
        }
        return bookingData.rera_no || 'NA';
    }

    private getProjectStampUrl(demandData: DemandData, storageUrl: string): string {
        const stampPath = demandData?.project_stamp;
        if (!stampPath) return '';
        if (typeof stampPath === 'string' && (stampPath.startsWith('http://') || stampPath.startsWith('https://'))) {
            return stampPath;
        }
        return `${storageUrl}/${stampPath}`;
    }

    private getCustomerInfo(demandData: DemandData): string {
        const names: string[] = [];
        if (demandData.applicant_name?.trim()) names.push(demandData.applicant_name.trim());
        if (demandData.applicant_name1?.trim()) names.push(demandData.applicant_name1.trim());
        if (demandData.applicant_name2?.trim()) names.push(demandData.applicant_name2.trim());
        return names.join(', ');
    }

    private formatWingFlatNo(commonData: any): string {
        const floorUnit = commonData?.floor_unit || 'N/A';
        const floorId = commonData?.floor_id;
        const wingName = commonData?.wing_name;

        if (!floorId || floorId === 0) {
            return `${floorUnit} on the Ground Floor${wingName ? ` in ${wingName} wing` : ''}`;
        }

        const ordinalSuffix = this.getOrdinalSuffix(floorId);
        const floorText = `${floorId}${ordinalSuffix}`;
        let result = `${floorUnit} on the ${floorText} Floor`;
        if (wingName) {
            result += ` in ${wingName} wing`;
        }
        return result;
    }

    private getOrdinalSuffix(num: number): string {
        if (num === 0) return '';
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
    }

    numberToWords(amount: number | string): string {
        if (amount === null || amount === undefined || amount === '' || Number(amount) === 0) {
            return 'Zero Rupees';
        }

        const num = Number(amount);
        if (isNaN(num)) {
            return 'Zero Rupees';
        }

        const ones = [
            '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen'
        ];

        const tens = [
            '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
        ];

        const toWordsBelowThousand = (n: number): string => {
            let str = '';
            if (n > 99) {
                str += ones[Math.floor(n / 100)] + ' Hundred';
                n = n % 100;
                if (n) {
                    str += ' and ';
                }
            }
            if (n > 19) {
                str += tens[Math.floor(n / 10)];
                const unit = n % 10;
                if (unit) {
                    str += ' ' + ones[unit];
                }
            } else if (n > 0) {
                str += ones[n];
            }
            return str;
        };

        const integerPart = Math.floor(num);
        const decimalPart = Math.round((num - integerPart) * 100);
        let result = '';
        let n = integerPart;

        const crore = Math.floor(n / 10000000);
        n = n % 10000000;
        const lakh = Math.floor(n / 100000);
        n = n % 100000;
        const thousand = Math.floor(n / 1000);
        n = n % 1000;
        const hundredToOne = n;

        if (crore) {
            result += toWordsBelowThousand(crore) + ' Crore ';
        }
        if (lakh) {
            result += toWordsBelowThousand(lakh) + ' Lakh ';
        }
        if (thousand) {
            result += toWordsBelowThousand(thousand) + ' Thousand ';
        }
        if (hundredToOne) {
            result += toWordsBelowThousand(hundredToOne) + ' ';
        }

        result = result.trim();
        if (!result) {
            result = 'Zero';
        }

        let finalResult = `Rupees ${result}`;
        if (decimalPart > 0) {
            const paiseWords = toWordsBelowThousand(decimalPart);
            finalResult += ` and ${paiseWords} Paise`;
        }
        finalResult += ' Only';

        return finalResult;
    }

    /**
     * Build token replacements
     */
    buildTokenReplacements(
        tokenData: TokenData,
        currentDate: string
    ): ReplacementMap {
        const replacements: ReplacementMap = {};

        if (!tokenData) {
            return replacements;
        }

        const transactions = tokenData.token_transactions || [];
        const latestTransaction = transactions.length > 0
            ? transactions[transactions.length - 1]
            : {};

        // Calculate total paid amount
        const totalPaid = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        // Owner name
        const salutation = tokenData.salution ? `${tokenData.salution}. ` : '';
        const ownerName = `${salutation}${tokenData.first_name || ''} ${tokenData.middle_name || ''} ${tokenData.last_name || ''}`.trim();

        // Unit info
        const unitInfo = `${tokenData.floor_id || ''} - ${tokenData.floor_unit || ''}`.trim();

        // Carpet area
        const carpetArea = tokenData.total_carpet_area_sqft
            ? `${tokenData.total_carpet_area_sqft} Sq.Ft`
            : 'N/A';

        // Project logo URL
        const projectLogoUrl = tokenData.project_logo
            ? `${this.storageUrl}/${tokenData.project_logo}`
            : '';

        // Company logo URL
        const companyLogoUrl = tokenData.company_logo
            ? `${this.storageUrl}/${tokenData.company_logo}`
            : '';

        // Format date helper - use existing private method
        const formatDateHelper = (dateString?: string): string => {
            return this.formatDate(dateString, currentDate);
        };

        // Format currency helper - use existing service method
        const formatCurrency = (amount: string | number): string => {
            return this.formatIndianCurrency(amount);
        };

        // Basic replacements
        replacements['#project_logo#'] = projectLogoUrl;
        replacements['#company_logo#'] = companyLogoUrl;
        replacements['#ProjectName#'] = tokenData.property_name || 'N/A';
        replacements['#ProjectAddress#'] = tokenData.project_address || 'N/A';
        replacements['#TokenType#'] = tokenData.token_type || 'N/A';
        replacements['#DATE#'] = formatDateHelper(tokenData.token_date);
        replacements['#RECEIPTNO#'] = tokenData.token_no || 'N/A';
        replacements['#Wing#'] = tokenData.wing_name || 'N/A';
        replacements['#TotalUsableArea#'] = tokenData.total_carpet_area_sqft ? String(tokenData.total_carpet_area_sqft) : 'N/A';
        replacements['#MappedUnitInfo#'] = unitInfo;
        replacements['#OwnerName#'] = ownerName;
        replacements['#carpet#'] = carpetArea;
        replacements['#ContactNumber#'] = tokenData.mob_no || 'N/A';
        replacements['#Email#'] = tokenData.email_id || 'N/A';
        replacements['#Source#'] = tokenData.source || 'N/A';
        replacements['#SourceDetail#'] = tokenData.source_detail || 'N/A';
        replacements['#FirmName#'] = tokenData.firm_name || 'N/A';
        replacements['#AmountinWords#'] = this.numberToWords(tokenData.token_amount || 0);
        replacements['#Amount#'] = formatCurrency(tokenData.token_amount || 0);
        replacements['#BankBranch#'] = latestTransaction.bank_branch || 'N/A';
        replacements['#BankName#'] = latestTransaction.bank_name || 'N/A';
        replacements['#TRNO#'] = latestTransaction.transaction_id || 'N/A';
        replacements['#TotalPayable#'] = formatCurrency(tokenData.token_amount || 0);
        replacements['#PaymentStatus#'] = tokenData.payment_status || 'N/A';
        replacements['#TokenDate#'] = formatDateHelper(tokenData.token_date);
        replacements['#Preference#'] = tokenData.preference_name || 'N/A';
        replacements['#SalesExecutive#'] = tokenData.sales_executive_name || 'N/A';
        replacements['#ProjectCode#'] = tokenData.project_code || 'N/A';
        replacements['#ChannelPartner#'] = tokenData.channel_partner || 'N/A';
        replacements['#AmountPaid#'] = formatCurrency(totalPaid);
        replacements['#BalanceAmount#'] = formatCurrency(tokenData.balance || 0);
        replacements['#UnitType#'] = tokenData.unit_type || 'N/A';
        replacements['#FloorNumber#'] = String(tokenData.floor_id || 'N/A');
        replacements['#Mobile#'] = tokenData.mob_no || 'N/A';
        replacements['#InfoSource#'] = tokenData.source || 'N/A';

        return replacements;
    }

    /**
     * Build ledger report replacements
     */
    buildLedgerReportReplacements(
        ledgerData: any,
        currentDate: string,
        storageUrl: string,
        htmlTemplate: string = ''
    ): ReplacementMap {
        const replacements: ReplacementMap = {};

        if (!ledgerData) {
            return replacements;
        }

        const receipts = ledgerData.receipts || [];

        // Basic project and customer info
        replacements['#ProjectName#'] = ledgerData.project_name || '';
        replacements['#ProjectAddress#'] = ledgerData.site_address || '';
        replacements['#AllApplicants#'] = ledgerData.all_applicant || '';
        replacements['#Applicant1#'] = ledgerData.applicant1_name || '';
        replacements['#WING#'] = ledgerData.wing_name || '';
        replacements['#Wing#'] = ledgerData.wing_name || '';
        replacements['#UnitNo#'] = ledgerData.floor_unit || '';
        replacements['#DATE#'] = currentDate;
        replacements['#BookingDate#'] = this.formatDate(ledgerData.booking_date);
        replacements['#AgreementNo#'] = ledgerData.agreement_no || 'N/A';
        replacements['#AgreementDate#'] = this.formatDate(ledgerData.agreement_date) || 'N/A';
        replacements['#LastWorkStage#'] = ledgerData.payment_stage || 'N/A';
        // Financial summary
        const agreementCost = Number(ledgerData.agreement_cost || 0);
        const gst = Number(ledgerData.gst || 0);
        const receivedAmount = Number(ledgerData.received_amount || 0);
        const receivedGst = Number(ledgerData.received_gst || 0);
        const balanceAmount = Number(ledgerData.balance_amount || 0);
        const balanceGst = Number(ledgerData.balance_gst || 0);
        const packageTotal = agreementCost + gst;
        const receivedPackageTotal = receivedAmount + receivedGst;
        const balancePackageTotal = balanceAmount + balanceGst;

        replacements['#AgreementCost#'] = this.formatIndianCurrency(agreementCost);
        replacements['#ReceivedAmount#'] = this.formatIndianCurrency(receivedAmount);
        replacements['#BalanceAmountAgreement#'] = this.formatIndianCurrency(balanceAmount);
        replacements['#Gst#'] = this.formatIndianCurrency(gst);
        replacements['#AmountReceivedAgainstGST#'] = this.formatIndianCurrency(receivedGst);
        replacements['#BalanceAmountAgainstGST#'] = this.formatIndianCurrency(balanceGst);
        replacements['#PackageTotal#'] = this.formatIndianCurrency(packageTotal);
        replacements['#ReceivedPackageTotal#'] = this.formatIndianCurrency(receivedPackageTotal);
        replacements['#BalancePackageTotal#'] = this.formatIndianCurrency(balancePackageTotal);

        // Work stage details
        const installmentDueAmount = Number(ledgerData.total_installment_due_till || 0);
        const gstDueAsPerWorkStage = Number(ledgerData.current_gst || 0);
        const partPaymentGST = Number(ledgerData.total_pending_amount_with_gst || 0);
        const partPaymentReceived = receivedAmount;
        const gstReceived = receivedGst;
        const balanceAsPerWorkStage = Number(ledgerData.total_balance || 0);
        const currentGSTBalance = Number(ledgerData.balance_gst_as_per_stage || 0);
        const agreementValuePartPaymentReceived = receivedAmount;

        replacements['#InstallmentDueAmount#'] = this.formatIndianCurrency(installmentDueAmount);
        replacements['#GSTDueAsPerWorkStage#'] = this.formatIndianCurrency(gstDueAsPerWorkStage);
        replacements['#PartPaymentGST#'] = this.formatIndianCurrency(partPaymentGST);
        replacements['#PartPaymentReceived#'] = this.formatIndianCurrency(partPaymentReceived);
        replacements['#GSTReceived#'] = this.formatIndianCurrency(gstReceived);
        replacements['#BalanceAsPerWorkStage#'] = this.formatIndianCurrency(balanceAsPerWorkStage);
        replacements['#CurrentGSTBalance#'] = this.formatIndianCurrency(currentGSTBalance);
        replacements['#AgreementValuePartPaymentReceived#'] = this.formatIndianCurrency(balanceAmount);

        // Generate ledger table rows from receipts
        let ledgerRowsHtml = '';
        let totalCredit = 0;
        let totalDebit = 0;
        let srNo = 1;

        receipts.forEach((receipt: any) => {
            const receiptDate = this.formatDate(receipt.receipt_date) || 'N/A';
            const receiptNo = receipt.receipt_id || receipt.receipt_no || 'N/A';
            const ocrType = receipt.receipt_type || 'N/A';
            const paymentMode = receipt.payment_mode || '';
            const bankName = receipt.bank_name || '';
            const paymentDetails = bankName ? `${paymentMode} - ${bankName}` : paymentMode;
            const status = receipt.cheque_status || receipt.active_status || 'N/A';
            const remark = receipt.updated_by_name || receipt.created_by_name || '';
            const receivedAmount = Number(receipt.received_amount || 0);

            // Credit amount is the received amount
            const creditAmount = receivedAmount;
            const debitAmount = 0;

            totalCredit += creditAmount;
            totalDebit += debitAmount;

            ledgerRowsHtml += `
        <tr>
          <td>${srNo}</td>
          <td>${receiptDate}</td>
          <td>${receiptNo}</td>
          <td>${ocrType}</td>
          <td>${paymentDetails}</td>
          <td>${status}</td>
          <td>${remark}</td>
          <td class="text-right">${this.formatIndianCurrency(creditAmount)}</td>
          <td class="text-right">${this.formatIndianCurrency(debitAmount)}</td>
        </tr>
      `;

            srNo++;
        });

        // Add totals row
        replacements['__ledgerRows__'] = ledgerRowsHtml;
        replacements['#TotalCreditAmount#'] = this.formatIndianCurrency(totalCredit);
        replacements['#TotalDebitAmount#'] = this.formatIndianCurrency(totalDebit);

        return replacements;
    }

    /**
     * Build quotation report replacements from fetch_quotation_details API response
     * for FLAT QUOTATION template (ProjectName, RERA, Applicant1, EnquiryNo, QuotationDate,
     * WING, UnitType, UnitNo, area fields, AgreementCost, taxes, PackageTotal, slab payment plan)
     */
    buildQuotationReplacements(
        quotationData: any,
        currentDate: string,
        storageUrl: string,
        htmlTemplate: string = ''
    ): ReplacementMap {
        const replacements: ReplacementMap = {};

        if (!quotationData) {
            return replacements;
        }

        // Project and logos (header)
        replacements['#project_logo#'] = `${storageUrl}/${quotationData?.project_logo || ''}`;
        replacements['#company_logo#'] = `${storageUrl}/${quotationData?.company_logo || quotationData?.project_logo || ''}`;
        replacements['#ProjectName#'] = quotationData?.project_name || '';
        replacements['#ProjectAddress#'] = quotationData?.site_address || quotationData?.address || '';
        replacements['#RERA#'] = quotationData?.rera_no || '';

        // Quotation details table
        replacements['#Applicant1#'] = quotationData?.customer_name || '';
        replacements['#CustomerName#'] = quotationData?.customer_name || '';
        replacements['#EnquiryNo#'] = String(quotationData?.project_enq_id ?? '');
        replacements['#EnquiryDate#'] = this.formatDate(quotationData?.enquiry_date) || '';
        replacements['#QuotationDate#'] = this.formatDate(quotationData?.created_at, currentDate);
        replacements['#Wing#'] = quotationData?.wing_name || '';
        replacements['#WING#'] = quotationData?.wing_name || '';
        replacements['#UnitType#'] = quotationData?.unit_type || String(quotationData?.unit_type_id ?? '') || 'N/A';
        replacements['#UnitNo#'] = quotationData?.floor_unit || '';
        replacements['#FlatNo#'] = quotationData?.floor_unit || '';

        // Area breakdown (Sq mt)
        replacements['#TotalCarpetAreaSqm#'] = String(quotationData?.carpet ?? '');
        replacements['#TotalCarpetAreaSqft#'] = String(quotationData?.carpet ?? '');
        replacements['#Carpet#'] = String(quotationData?.carpet ?? '');
        replacements['#TerraceSqm#'] = String(quotationData?.terrace_area ?? quotationData?.terrace_sqm ?? '');
        replacements['#EnclosedBalconySqm#'] = String(quotationData?.enclosed_balcony_sqm ?? '');
        replacements['#BalconySqm#'] = String(quotationData?.balcony_sqm ?? '');
        replacements['#TotalUsableAreaSqm#'] = String(quotationData?.total_usable_area_sqm ?? quotationData?.carpet ?? '');

        // Agreement value
        replacements['#AgreementCost#'] = this.formatIndianCurrency(quotationData?.agreement_cost ?? 0);

        // Government taxes & duties: percent and amount
        replacements['#StampDutyPercent#'] = String(quotationData?.sd_per ?? '');
        replacements['#StampDuty#'] = this.formatIndianCurrency(quotationData?.stamp_duty ?? 0);
        replacements['#RegistrationPercent#'] = String(quotationData?.reg_per ?? '');
        replacements['#Registration#'] = this.formatIndianCurrency(quotationData?.reg ?? 0);
        replacements['#GSTPER#'] = String(quotationData?.gst_per ?? '');
        replacements['#Gst#'] = this.formatIndianCurrency(quotationData?.gst ?? 0);

        const stampDuty = Number(quotationData?.stamp_duty ?? 0);
        const reg = Number(quotationData?.reg ?? 0);
        const gst = Number(quotationData?.gst ?? 0);
        replacements['#TotalTaxes#'] = this.formatIndianCurrency(stampDuty + reg + gst);

        replacements['#PackageTotal#'] = this.formatIndianCurrency(quotationData?.package_total ?? 0);

        // Slab payment plan: dynamic rows from data.stages
        const stages = quotationData?.stages || [];
        const templateRow = this.extractTemplateRow(htmlTemplate);
        let stageRowsHtml = '';
        let totalPercentage = 0;
        let totalAmount = 0;

        stages.forEach((stage: any) => {
            const pct = parseFloat(stage.percentage) || 0;
            const amt = Number(stage.amount) || 0;
            totalPercentage += pct;
            totalAmount += amt;
            const row = templateRow
                .replace(/#StageText#/gi, stage.payment_stage || '')
                .replace(/#PaymentStage#/gi, stage.payment_stage || '')
                .replace(/#Percentage#/g, String(stage.percentage ?? ''))
                .replace(/#Amount#/gi, this.formatIndianCurrency(amt));
            stageRowsHtml += row;
        });

        replacements['__paymentSlabRows__'] = stageRowsHtml;
        replacements['#TotalStagePercentage#'] = String(Math.round(totalPercentage));
        replacements['#TotalStageAmount#'] = this.formatIndianCurrency(totalAmount);

        // Other fields (kept for compatibility)
        replacements['#BasicCost#'] = this.formatIndianCurrency(quotationData?.basic_cost ?? 0);
        replacements['#IDC#'] = this.formatIndianCurrency(quotationData?.idc ?? 0);
        replacements['#GstPer#'] = String(quotationData?.gst_per ?? '');
        replacements['#SDPER#'] = String(quotationData?.sd_per ?? '');
        replacements['#REGPER#'] = String(quotationData?.reg_per ?? '');
        replacements['#Reg#'] = this.formatIndianCurrency(quotationData?.reg ?? 0);
        replacements['#SocietyFor#'] = this.formatIndianCurrency(quotationData?.society_for ?? 0);
        replacements['#Legal#'] = this.formatIndianCurrency(quotationData?.legal ?? 0);
        replacements['#Maintenance#'] = this.formatIndianCurrency(quotationData?.maintenance ?? 0);
        replacements['#MaintenanceCharges#'] = this.formatIndianCurrency(quotationData?.maintenance ?? 0);
        replacements['#Corpus#'] = this.formatIndianCurrency(quotationData?.corpus ?? 0);
        replacements['#CorpusFund#'] = this.formatIndianCurrency(quotationData?.corpus ?? 0);
        replacements['#Other#'] = this.formatIndianCurrency(quotationData?.other ?? 0);
        replacements['#ParkingNo#'] = String(quotationData?.parking_no ?? '');
        replacements['#ParkingCharges#'] = this.formatIndianCurrency(quotationData?.parking_charges ?? 0);
        replacements['#Rate#'] = this.formatIndianCurrency(quotationData?.rate ?? 0);
        replacements['#FloorRiseAmount#'] = this.formatIndianCurrency(quotationData?.floor_rise_amt ?? 0);
        replacements['#FloorRiseAmt#'] = this.formatIndianCurrency(quotationData?.floor_rise_amt ?? 0);
        replacements['#Remark#'] = quotationData?.remark || '';
        replacements['#remark#'] = quotationData?.remark || '';
        replacements['#CreatedByName#'] = quotationData?.created_by_name || '';
        replacements['#DATE#'] = this.formatDate(quotationData?.created_at, currentDate);

        return replacements;
    }
}

