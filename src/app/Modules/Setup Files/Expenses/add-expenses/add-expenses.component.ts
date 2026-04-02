import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-add-expenses',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent
  ],
  templateUrl: './add-expenses.component.html',
  styleUrls: ['./add-expenses.component.scss'],
})
export class AddExpensesComponent implements OnInit {
  baseUrl = environment.API_URL;
  loading = false;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  projectsList: any[] = [];
  sourcesList: any[] = [];
  sourcerDetailedList: any[] = [];
  vendorsList: any[] = [];
  selectedFile: File | null = null;
  imageSize: string | null = null;
  imagePreview: string | null = null;
  allChannelPartnerList: any[] = [];
  storageUrl = environment.STORAGE_URL;
  pipe = new DatePipe('en-US');

  addExpenses = new FormGroup({
    user_id: new FormControl(this.userId),
    project_id: new FormControl(null),
    expense_date: new FormControl(''),
    source_id: new FormControl(null),
    source_detail_id: new FormControl(null),
    vendor_id: new FormControl(null),
    source_detail: new FormControl('', [
      
      Validators.min(1),
    ]),
    channel_partner_id: new FormControl(null),
    active_status_id: new FormControl('1'),
    amount: new FormControl('', [ Validators.min(1)]),
    gst_amount: new FormControl('', [Validators.min(0)]),
    total_amount: new FormControl('', [ Validators.min(1)]),
    remark: new FormControl(''),
    expense_attachment: new FormControl<File | null>(null),
    is_delete: new FormControl('0'),
  });

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { item: any }, // Correctly type data and item
    private dialogRef: MatDialogRef<AddExpensesComponent>
  ) {}

  expenseData: any = this.data ?.item;

  ngOnInit(): void {
    console.log(this.data ?.item);
    
    this.fetchAllProjects();
    this.fetchAllSources();
    this.fetchAllVendors();
 
    this.addExpenses.get('source_id')?.valueChanges.subscribe((sourceId) => {
      if (sourceId) {
        this.fetchAllSourceDetails(sourceId);
      }
    
    });
    if (this.expenseData) {
      this.patchFormData(this.expenseData);
    }
  }
  onPartnerSearch(
    searchText: string,
    loadInitialData?: boolean,
    initialPartnerId?: any
  ): void {
    const trimmedSearch = searchText.trim();

    // Clear dropdown if search is too short (unless loading initial data)
    if (!loadInitialData && trimmedSearch.length <= 3) {
      this.allChannelPartnerList = [];
      return;
    }

    const requestBody: any = loadInitialData
      ? {}
      : {
          firm_name: trimmedSearch,
          channel_partner_id: null,
        };

    if (loadInitialData) {
      // Use the provided initialPartnerId or fall back to form value
      requestBody.channel_partner_id =
        initialPartnerId || this.addExpenses.value.channel_partner_id;
    }

    this.http
      .post(`${this.baseUrl}/channel_partner_dropdown`, requestBody)
      .subscribe({
        next: (res: any) => {
          this.allChannelPartnerList = res.map((item: any) => ({
            ...item,
            full_name: `${item.firm_name} `,
          }));
        },
        error: () => {
          this.snackBar.open('Unable to fetch partners.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  patchFormData(item: any): void {
    const attachmentUrl = item.expense_attachment
      ? `${this.storageUrl}/${item.expense_attachment}` // Construct the full URL
      : null;
      if (item.channel_partner_id) {
        this.onPartnerSearch('', true, item.channel_partner_id);
      }
    this.addExpenses.patchValue({
      project_id: item.project_id,
      expense_date: item.expense_date, // Format if needed
      source_id: item.source_id,
      source_detail_id: item.source_detail_id,
      vendor_id: item.vendor_id,
      source_detail: item.source_detail,
      channel_partner_id: item.channel_partner_id,
      amount: item.amount,
      gst_amount: item.gst_amount,
      total_amount: item.total_amount,
      remark: item.remark,
      expense_attachment: null, // FormControl expects a File, not a URL
      is_delete: item.is_delete.toString(), // Ensure it matches the expected type (string or number)
    });
  
    // Set the image preview URL if attachment exists
    this.imagePreview = attachmentUrl;
  }
  

  onChangeFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      this.selectedFile = input.files[0];
      this.imageSize = `${(this.selectedFile.size / 1024).toFixed(2)} KB`;

      // Generate image preview if it's an image file
      if (this.selectedFile.type.startsWith('image')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string; // Store the image preview
        };
        reader.readAsDataURL(this.selectedFile);
      } else {
        this.imagePreview = null; // Reset preview if not an image
      }

      // Patch the form with the selected file (for file upload)
      this.addExpenses.patchValue({ expense_attachment: this.selectedFile });
    }
  }

  fetchAllProjects(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/project_dropdown`).subscribe({
      next: (res: any) => {
        this.projectsList = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Unable to fetch projects.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  fetchAllSources(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/source_dropdown`).subscribe({
      next: (res: any) => {
        this.sourcesList = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Unable to fetch sources.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  fetchAllSourceDetails(sourceId: any): void {
    this.loading = true;
    this.http
      .post(`${this.baseUrl}/source_detail_dropdown`, { source_id: sourceId })
      .subscribe({
        next: (res: any) => {
          this.sourcerDetailedList = res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Unable to fetch source details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  fetchAllVendors(): void {
    this.http.get(`${this.baseUrl}/vendor_dropdown`).subscribe({
      next: (res: any) => {
        this.vendorsList = res;
      },
      error: () => {
        this.snackBar.open('Unable to fetch vendors.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  deleteFile(): void {
    this.selectedFile = null;
    this.imageSize = null;
    this.addExpenses.patchValue({ expense_attachment: null });
  }

  onSubmit(): void {
    const formData = new FormData();
    // Format the expense_date to YYYY-MM-DD
    const expenseDate = this.addExpenses.get('expense_date')?.value;
    // Use Angular's DatePipe to ensure yyyy-MM-dd formatting (fallback to empty string)
    const formattedDate = expenseDate
      ? this.pipe.transform(expenseDate, 'yyyy-MM-dd') || ''
      : '';

    // Append the form values to the FormData object
    formData.append(
      'user_id',
      this.addExpenses.get('user_id')?.value?.toString() || ''
    );
    formData.append(
      'active_status_id',
      this.addExpenses.get('active_status_id')?.value || ''
    );
    formData.append(
      'project_id',
      this.addExpenses.get('project_id')?.value || ''
    );
    formData.append('expense_date', formattedDate);
    formData.append(
      'source_id',
      this.addExpenses.get('source_id')?.value || ''
    );
    formData.append(
      'channel_partner_id',
      this.addExpenses.get('channel_partner_id')?.value || ''
    );
    formData.append(
      'source_detail_id',
      this.addExpenses.get('source_detail_id')?.value || ''
    );
    formData.append(
      'vendor_id',
      this.addExpenses.get('vendor_id')?.value || ''
    );
    formData.append(
      'source_detail',
      this.addExpenses.get('source_detail')?.value || ''
    );
    formData.append(
      'amount',
      this.addExpenses.get('amount')?.value?.toString() || ''
    );
    formData.append(
      'gst_amount',
      this.addExpenses.get('gst_amount')?.value?.toString() || ''
    );
    formData.append(
      'total_amount',
      this.addExpenses.get('total_amount')?.value?.toString() || ''
    );
    formData.append('remark', this.addExpenses.get('remark')?.value || '');
    formData.append(
      'is_delete',
      this.addExpenses.get('is_delete')?.value?.toString() || ''
    );

    // If editing an expense, append the expense_id
    if (this.expenseData?.expense_id) {
      formData.append('expense_id', this.expenseData.expense_id.toString());
      formData.append('updated_by', this.userId.toString() || '');
    }

    // Handle file attachment (only if a new file is selected)
    if (this.selectedFile) {
      formData.append(
        'expense_attachment',
        this.selectedFile,
        this.selectedFile.name
      );
    } else if (this.expenseData?.expense_attachment) {
      // If no new file, append the existing file attachment if present
      formData.append(
        'expense_attachment',
        this.expenseData.expense_attachment || ''
      );
    }

    // Determine API endpoint based on whether we're adding or editing
    const apiEndpoint = this.expenseData?.expense_id
      ? 'edit_expense'
      : 'add_expense';

    // Send the FormData to the API
    this.http.post(`${this.baseUrl}/${apiEndpoint}`, formData).subscribe({
      next: (res: any) => {
        const successMessage = this.expenseData?.expense_id
          ? 'Expense edited successfully.'
          : 'Expense added successfully.';
        this.snackBar.open(successMessage, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Unable to process the expense.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
