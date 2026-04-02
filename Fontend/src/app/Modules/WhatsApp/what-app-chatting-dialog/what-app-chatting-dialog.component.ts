import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal,
  computed,
  effect,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {
  catchError,
  EMPTY,
  finalize,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';
import {
  WhatsAppServiceService,
  ChatMessage,
  WhatsAppTemplate,
  FetchChatResponse,
  TemplatesResponse,
  SendMessageResponse
} from '../../../Service/common/whatsApp/whats-app-service.service';

// Interfaces
interface TemplateOption {
  value: string;
  label: string;
  language_code: string;
  module_name: string;
  project_name: string;
  created_by_name: any;
}

interface DialogData {
  chattingData: {
    mobile_no: string;
    customer_name?: string;
    project_id?: number[];
    project_names?: string[];
    telecaller_names?: string[];
    [key: string]: unknown;
  };
}

type MessageType = 'template' | 'custom';
type SnackBarType = 'success' | 'error' | 'warning' | 'info';

const LANGUAGE_MAP: Record<string, string> = {
  'en': 'English',
  'hi': 'Hindi',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'ta': 'Tamil',
  'te': 'Telugu',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'bn': 'Bengali',
  'pa': 'Punjabi',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic'
};

@Component({
  selector: 'app-what-app-chatting-dialog',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './what-app-chatting-dialog.component.html',
  styleUrls: ['./what-app-chatting-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhatAppChattingDialogComponent implements OnInit, AfterViewInit {
  // Dependency Injection
  private readonly whatsAppService = inject(WhatsAppServiceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly dialogRef = inject(MatDialogRef<WhatAppChattingDialogComponent>);
  userId = Number(sessionStorage.getItem('session_id'));

  // Dialog data (readonly)
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  // State Signals
  readonly loading = signal<boolean>(false);
  readonly sendingMessage = signal<boolean>(false);
  readonly loadingTemplates = signal<boolean>(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly templateOptions = signal<TemplateOption[]>([]);
  readonly groupedTemplates = signal<Record<string, TemplateOption[]>>({});
  readonly availableLanguages = signal<string[]>([]);

  // Form
  readonly sendMessageForm: FormGroup;
  readonly activeMessageType = signal<MessageType>('template');

  // Computed Signals
  readonly hasMessages = computed(() => this.messages().length > 0);
  readonly isEmpty = computed(() => !this.loading() && !this.hasMessages());
  readonly templatesForLanguage = computed(() => {
    const selectedLanguage = this.sendMessageForm.get('language_code')?.value;
    return this.groupedTemplates()[selectedLanguage] || [];
  });
  readonly customerFirstName = computed(() => {
    const fullName = this.data.chattingData.customer_name || '';
    return fullName.split(' ')[0] || 'Customer';
  });

  // Table DataSource
  readonly dataSource = new MatTableDataSource<ChatMessage>([]);

  // ViewChild
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Constants
  readonly messageTypeOptions = [
    { value: 'template' as const, label: 'Template Message' },
    { value: 'custom' as const, label: 'Custom Message' }
  ] as const;

  constructor() {
    // Initialize form
    this.sendMessageForm = this.fb.group({
      messageType: ['template', Validators.required],
      language_code: ['', Validators.required],
      template_name: ['', Validators.required],
      customMessage: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(500)
      ]]
    });

    // Setup form listeners
    this.setupFormListeners();

    // Effect to sync messages with dataSource
    effect(() => {
      this.dataSource.data = this.messages();
      this.cdr.markForCheck();
    });

    // Effect to scroll to bottom when new messages arrive
    effect(() => {
      if (this.messages().length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnInit(): void {
    if (!this.data?.chattingData?.mobile_no) {
      this.showSnackBar('No mobile number provided', 'error');
      return;
    }

    this.loadChatHistory();
    this.loadTemplates();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  // ========== FORM SETUP ==========
  private setupFormListeners(): void {
    // Watch for message type changes
    this.sendMessageForm.get('messageType')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type: MessageType) => {
        this.activeMessageType.set(type);
        this.updateFormValidation(type);
      });

    // Watch for language changes
    this.sendMessageForm.get('language_code')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onLanguageChange();
      });
  }

  private updateFormValidation(messageType: MessageType): void {
    const templateNameControl = this.sendMessageForm.get('template_name');
    const languageControl = this.sendMessageForm.get('language_code');
    const customMessageControl = this.sendMessageForm.get('customMessage');

    if (messageType === 'template') {
      customMessageControl?.clearValidators();
      customMessageControl?.setValue('');
      customMessageControl?.updateValueAndValidity();

      templateNameControl?.setValidators([Validators.required]);
      languageControl?.setValidators([Validators.required]);
    } else {
      templateNameControl?.clearValidators();
      templateNameControl?.setValue('');
      languageControl?.clearValidators();
      languageControl?.setValue('');

      customMessageControl?.setValidators([
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(500)
      ]);
    }

    templateNameControl?.updateValueAndValidity();
    languageControl?.updateValueAndValidity();
    customMessageControl?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  // ========== CHAT HISTORY ==========
  loadChatHistory(): void {
    this.loading.set(true);

    this.whatsAppService.fetchChatByPhone(this.data.chattingData.mobile_no)
      .pipe(
        map((response: FetchChatResponse) => {
          if (response.status && response.data?.length > 0) {
            return this.sortMessages(response.data);
          }
          return [];
        }),
        catchError((error: unknown) => {
          this.showSnackBar('Failed to load chat history', 'error');
          console.error('Error loading chat history:', error);
          return of([]);
        }),
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (sortedMessages) => {
          this.messages.set(sortedMessages);
        }
      });
  }

  private sortMessages(messages: ChatMessage[]): ChatMessage[] {
    return [...messages].sort((a, b) => {
      const timeA = this.getTimestamp(a);
      const timeB = this.getTimestamp(b);
      return timeA - timeB;
    });
  }

  private getTimestamp(message: ChatMessage): number {
    if (message.message_timestamp) {
      return message.message_timestamp * 1000;
    }
    if (message.created_at) {
      return new Date(message.created_at).getTime();
    }
    return 0;
  }

  fetchAllWhatsAppChatting(): void {
    this.loadChatHistory();
  }

  // ========== TEMPLATES ==========
  private loadTemplates(): void {
    const projectId = this.getProjectId();

    if (!projectId) {
      this.showSnackBar('No project ID found', 'warning');
      return;
    }

    this.loadingTemplates.set(true);

    this.whatsAppService.getAllWhatsAppTemplates(projectId)
      .pipe(
        map((response: TemplatesResponse) => {
          if (response.success && response.data?.length > 0) {
            return response.data;
          }
          return [];
        }),
        catchError((error: unknown) => {
          this.showSnackBar('Failed to load templates', 'error');
          console.error('Error loading templates:', error);
          return of([]);
        }),
        finalize(() => {
          this.loadingTemplates.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (templates) => {
          if (templates.length > 0) {
            this.processTemplates(templates);
          } else {
            this.templateOptions.set([]);
            this.groupedTemplates.set({});
            this.availableLanguages.set([]);
            this.showSnackBar('No templates available', 'warning');
          }
        }
      });
  }

  private getProjectId(): number | null {
    const projectIds = this.data.chattingData.project_id;
    return Array.isArray(projectIds) && projectIds.length > 0 ? projectIds[0] : null;
  }

  private processTemplates(templates: WhatsAppTemplate[]): void {
    const options: TemplateOption[] = templates.map(template => ({
      value: template.template_name,
      label: template.template_name,
      language_code: template.language_code,
      module_name: template.module_name,
      project_name: template.project_name,
      created_by_name: template.created_by_name
    }));

    this.templateOptions.set(options);
    this.groupTemplatesByLanguage();
    this.setDefaultFormValues();
  }

  private groupTemplatesByLanguage(): void {
    const grouped: Record<string, TemplateOption[]> = {};

    this.templateOptions().forEach(template => {
      const lang = template.language_code;
      if (!grouped[lang]) {
        grouped[lang] = [];
      }
      grouped[lang].push(template);
    });

    this.groupedTemplates.set(grouped);
    this.availableLanguages.set(Object.keys(grouped));
    this.cdr.markForCheck();
  }

  private setDefaultFormValues(): void {
    const languages = this.availableLanguages();
    if (languages.length > 0) {
      const defaultLanguage = languages[0];
      const defaultTemplate = this.groupedTemplates()[defaultLanguage]?.[0];

      if (defaultTemplate) {
        this.sendMessageForm.patchValue({
          language_code: defaultLanguage,
          template_name: defaultTemplate.value
        }, { emitEvent: false });
      }
    }
  }

  onLanguageChange(): void {
    const selectedLanguage = this.sendMessageForm.get('language_code')?.value;
    const templates = this.groupedTemplates()[selectedLanguage];

    if (templates && templates.length > 0) {
      this.sendMessageForm.patchValue({
        template_name: templates[0].value
      }, { emitEvent: false });
    } else {
      this.sendMessageForm.patchValue({
        template_name: ''
      }, { emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  // ========== MESSAGE SENDING ==========
  sendWhatsAppMessage(): void {
    if (this.sendMessageForm.invalid) {
      this.markAllControlsAsTouched(this.sendMessageForm);
      this.showSnackBar('Please fill all required fields correctly', 'warning');
      return;
    }

    if (!this.data.chattingData.mobile_no) {
      this.showSnackBar('Mobile number is required', 'error');
      return;
    }

    this.sendingMessage.set(true);

    const formValue = this.sendMessageForm.value;
    const isTemplate = formValue.messageType === 'template';

    const apiCall = isTemplate
      ? this.whatsAppService.sendTemplate(this.buildTemplateRequestData(formValue))
      : this.whatsAppService.sendMessage(this.buildCustomMessageRequestData(formValue));

    apiCall
      .pipe(
        switchMap((response: SendMessageResponse) => {
          if (response.status || response.success) {
            this.showSnackBar('Message sent successfully!', 'success');

            // Refresh chat history
            this.loadChatHistory();

            // Reset form if custom message
            if (!isTemplate) {
              this.sendMessageForm.patchValue({
                customMessage: ''
              }, { emitEvent: false });
            }
            return EMPTY;
          } else {
            this.showSnackBar(response.message || 'Failed to send message', 'error');
            return EMPTY;
          }
        }),
        catchError((error: unknown) => {
          this.showSnackBar('Error sending message', 'error');
          console.error('Message sending error:', error);
          return EMPTY;
        }),
        finalize(() => {
          this.sendingMessage.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private buildTemplateRequestData(
    formValue: { template_name?: string; language_code?: string }
  ): {
    to: string;
    customer_name: string;
    project_name: string;
    telecaller_name: string;
    template_name: string;
    language_code: string;
    project_lead_id: number;
    created_by: number;
  } {
    return {
      to: this.data.chattingData.mobile_no,
      customer_name: this.data.chattingData.customer_name || 'Customer',
      project_name: this.getProjectName(),
      telecaller_name: this.getTelecallerName(),
      template_name: formValue.template_name || '',
      language_code: formValue.language_code || '',
      project_lead_id: Number(this.data.chattingData['project_lead_id']),
      created_by: this.userId
    };
  }

  private buildCustomMessageRequestData(
    formValue: { customMessage?: string }
  ): {
    to: string;
    message: string;
    project_lead_id: number;
    created_by: number;
  } {
    return {
      to: this.data.chattingData.mobile_no,
      message: formValue.customMessage || '',
      project_lead_id: Number(this.data.chattingData['project_lead_id']),
      created_by: this.userId
    };
  }

  private getProjectName(): string {
    const projectNames = this.data.chattingData.project_names;
    return Array.isArray(projectNames) && projectNames.length > 0
      ? projectNames[0]
      : 'Project';
  }

  private getTelecallerName(): string {
    const telecallerNames = this.data.chattingData.telecaller_names;
    return Array.isArray(telecallerNames) && telecallerNames.length > 0
      ? telecallerNames[0]
      : 'Telecaller';
  }

  // ========== UTILITY METHODS ==========
  isFromUser(chat: ChatMessage): boolean {
    return !chat.message_from || chat.message_from === null;
  }

  formatDate(timestamp: number | string | undefined): string {
    if (timestamp === undefined || timestamp === null) {
      return 'No date';
    }

    try {
      let date: Date;

      if (typeof timestamp === 'number') {
        date = timestamp > 9999999999
          ? new Date(timestamp)
          : new Date(timestamp * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid date';
    }
  }

  getLanguageName(code: string): string {
    return LANGUAGE_MAP[code] || code.toUpperCase();
  }

  getTemplatesForSelectedLanguage(): TemplateOption[] {
    return this.templatesForLanguage();
  }

  getSelectedTemplateDetails(): TemplateOption | null {
    const selectedTemplate = this.sendMessageForm.get('template_name')?.value;
    return this.templateOptions().find(t => t.value === selectedTemplate) || null;
  }

  // ========== HELPER METHODS ==========
  private markAllControlsAsTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
        if (control instanceof FormGroup) {
          this.markAllControlsAsTouched(control);
        }
      }
    });
  }

  private showSnackBar(message: string, type: SnackBarType = 'info'): void {
    const panelClass = `${type}-snackbar`;

    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [panelClass],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  private scrollToBottom(): void {
    const chatContainer = document.querySelector('.chat-history-scroll');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }
}
