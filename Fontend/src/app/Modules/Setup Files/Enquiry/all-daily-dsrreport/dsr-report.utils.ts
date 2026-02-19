import { DailyReportResponse, ReportSection } from './dsr-report.models';

/**
 * Generates a clean, standalone HTML element for image capture.
 * Optimized for performance and high-quality rendering.
 */
export function generateSimpleReportHtml(report: DailyReportResponse): HTMLElement {
    const container = document.createElement('div');
    const formattedDate = report.date ? new Date(report.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) : 'N/A';

    container.style.cssText = `
        width: 794px;
        min-height: 1123px;
        background-color: white !important;
        color: #1e293b !important;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 40px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 20px;
    `;

    // Header matching requested layout
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding-bottom: 10px;
        border-bottom: 3px solid #334155;
    `;

    const titleArea = document.createElement('div');
    titleArea.innerHTML = `
        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a;">${report.project_name || 'Project Name'}</h1>
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">Daily Sales & Performance Report</div>
    `;

    const dateArea = document.createElement('div');
    dateArea.style.cssText = `text-align: right;`;
    dateArea.innerHTML = `
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Generated On</div>
        <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${formattedDate}</div>
    `;

    header.appendChild(titleArea);
    header.appendChild(dateArea);
    container.appendChild(header);

    // Main 2-Column Body
    const bodyCols = document.createElement('div');
    bodyCols.style.cssText = `
        display: flex;
        gap: 25px;
        margin-top: 10px;
    `;
    container.appendChild(bodyCols);

    // Left Column
    const leftCol = document.createElement('div');
    leftCol.style.cssText = `flex: 1; display: flex; flex-direction: column; gap: 25px;`;
    bodyCols.appendChild(leftCol);

    // Right Column
    const rightCol = document.createElement('div');
    rightCol.style.cssText = `flex: 1; display: flex; flex-direction: column; gap: 25px;`;
    bodyCols.appendChild(rightCol);

    const createSection = (title: string, headers: string[], rows: string[][]) => {
        const section = document.createElement('div');
        section.style.cssText = `
            border: 1px solid #cbd5e1;
            border-top: 3.5px solid #334155;
            background-color: white !important;
            border-radius: 4px;
            overflow: hidden;
        `;

        const sTitle = document.createElement('div');
        sTitle.textContent = title;
        sTitle.style.cssText = `
            padding: 8px 12px;
            background-color: #f8fafc !important;
            border-bottom: 1px solid #cbd5e1;
            font-size: 11px;
            font-weight: 800;
            color: #1e293b !important;
            text-transform: uppercase;
        `;
        section.appendChild(sTitle);

        const table = document.createElement('table');
        table.style.cssText = `width: 100%; border-collapse: collapse; font-size: 10.5px;`;

        const thead = document.createElement('thead');
        const trH = document.createElement('tr');
        headers.forEach((h, i) => {
            const th = document.createElement('th');
            th.textContent = h;
            th.style.cssText = `
                padding: 8px 10px;
                text-align: ${i === 0 ? 'left' : 'center'};
                background-color: #475569 !important;
                color: white !important;
                font-weight: 700;
                border: 1px solid #334155;
            `;
            trH.appendChild(th);
        });
        thead.appendChild(trH);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        rows.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            if (rowIndex % 2 !== 0) tr.style.backgroundColor = '#f8fafc';

            row.forEach((cell, i) => {
                const td = document.createElement('td');
                td.textContent = cell;
                td.style.cssText = `
                    padding: 7px 10px;
                    text-align: ${i === 0 ? 'left' : 'center'};
                    border: 1px solid #e2e8f0;
                    color: ${i === 0 ? '#1e293b' : '#475569'} !important;
                    font-weight: ${i === 0 ? '600' : '500'};
                `;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        section.appendChild(table);
        return section;
    };

    // Populate Left Column
    if (hasReportData(report.leads_report)) {
        leftCol.appendChild(createSection('Leads Summary', ['Source', 'Today', 'Month', 'Total'],
            report.leads_report!.sources.map(s => [s.source, s.today.toString(), s.monthly.toString(), s.till_date.toString()])
        ));
    }
    if (hasReportData(report.booking_report)) {
        leftCol.appendChild(createSection('Booking Summary', ['Source', 'Today', 'Month', 'Total'],
            report.booking_report!.sources.map(s => [s.source, s.today.toString(), s.monthly.toString(), s.till_date.toString()])
        ));
    }

    // Populate Right Column
    if (hasReportData(report.enquiry_report)) {
        rightCol.appendChild(createSection('Enquiry Summary', ['Source', 'Today', 'Month', 'Total'],
            report.enquiry_report!.sources.map(s => [s.source, s.today.toString(), s.monthly.toString(), s.till_date.toString()])
        ));
    }

    if (report.token_report?.types?.length) {
        const tokenSection = createSection('Token Collection Detail', ['Payment Type', 'Today', 'Month', 'Total'], []);
        const table = tokenSection.querySelector('table')!;
        const tbody = table.querySelector('tbody')!;

        report.token_report.types.forEach((t, rowIndex) => {
            const tr = document.createElement('tr');
            if (rowIndex % 2 !== 0) tr.style.backgroundColor = '#f8fafc';
            [t.token_type, t.today.toString(), t.monthly.toString(), t.till_date.toString()].forEach((cell, i) => {
                const td = document.createElement('td');
                td.textContent = cell;
                td.style.cssText = `padding: 7px 10px; text-align: ${i === 0 ? 'left' : 'center'}; border: 1px solid #e2e8f0; font-weight: ${i === 0 ? '600' : '500'}; color: ${i === 0 ? '#1e293b' : '#475569'} !important;`;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        const footerTr = document.createElement('tr');
        footerTr.style.backgroundColor = '#f1f5f9';
        ['Total Collections', report.token_report.totals.today.toString(), report.token_report.totals.monthly.toString(), report.token_report.totals.till_date.toString()]
            .forEach((cell, i) => {
                const td = document.createElement('td');
                td.textContent = cell;
                td.style.cssText = `padding: 8px 10px; text-align: ${i === 0 ? 'left' : 'center'}; border: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;`;
                footerTr.appendChild(td);
            });
        tbody.appendChild(footerTr);
        rightCol.appendChild(tokenSection);
    }

    if (report.post_sales_report) {
        const ps = report.post_sales_report;
        const psRows = [
            ['Agreements Executed', ps.total_agreements?.today.toString() || '0', ps.total_agreements?.monthly.toString() || '0', ps.total_agreements?.till_date.toString() || '0'],
            ['Loan Disbursements', ps.total_disbursements?.today.toString() || '0', ps.total_disbursements?.monthly.toString() || '0', ps.total_disbursements?.till_date.toString() || '0']
        ];
        rightCol.appendChild(createSection('Post Sales Operations', ['Operation Type', 'Today', 'Month', 'Total'], psRows));
    }

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
        margin-top: auto;
        padding-top: 20px;
        text-align: center;
        font-size: 10px;
        color: #94a3b8 !important;
        font-style: italic;
    `;
    footer.textContent = 'INTERNAL USE ONLY - This is a computer generated report.';
    container.appendChild(footer);

    return container;
}

export function hasReportData(section?: ReportSection): boolean {
    return !!(section && section.sources && section.sources.length > 0);
}

export function hasAnyReportData(report: DailyReportResponse | null): boolean {
    if (!report) return false;
    return !!(
        hasReportData(report.leads_report) ||
        hasReportData(report.enquiry_report) ||
        hasReportData(report.booking_report) ||
        (report.token_report?.types?.length) ||
        (report.post_sales_report && (
            (report.post_sales_report.total_agreements?.today || 0) > 0 ||
            (report.post_sales_report.total_disbursements?.today || 0) > 0
        ))
    );
}