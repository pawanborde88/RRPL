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
  Observable,
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
import { environment } from '../../../../environments/environment';

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
  readonly selectedFile = signal<File | null>(null);
  readonly storageUrl = signal<string>(environment.STORAGE_URL);

  // Form
  readonly sendMessageForm: FormGroup;
  readonly activeMessageType = signal<MessageType>('template');
  readonly isAttachmentMenuOpen = signal<boolean>(false);

  // Computed Signals
  readonly hasMessages = computed(() => this.messages().length > 0);
  readonly isEmpty = computed(() => !this.loading() && !this.hasMessages());
  readonly customerFirstName = computed(() => {
    const fullName = this.data.chattingData.customer_name || '';
    return fullName.split(' ')[0] || 'Customer';
  });
  readonly selectedFileType = computed(() => {
    const file = this.selectedFile();
    if (!file) return null;
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
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

    // Effect to handle custom message validations based on selected file
    effect(() => {
      const file = this.selectedFile();
      const type = this.activeMessageType();
      const customMessageControl = this.sendMessageForm.get('customMessage');

      if (type === 'custom') {
        if (file) {
          customMessageControl?.setValidators([Validators.maxLength(500)]);
        } else {
          customMessageControl?.setValidators([
            Validators.required,
            Validators.maxLength(500)
          ]);
        }
        customMessageControl?.updateValueAndValidity();
      }
    });

    // Effect to sync messages with dataSource
    effect(() => {
      this.dataSource.data = this.messages();
      this.cdr.markForCheck();
    });

    // Effect to scroll to bottom when new messages arrive
    effect(() => {
      if (this.messages().length > 0) {
        // Trigger CD directly then scroll to ensure smooth repositioning
        setTimeout(() => {
          this.cdr.detectChanges();
          this.scrollToBottom();
        }, 150);
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

    // Watch for template changes and automatically set the required language
    this.sendMessageForm.get('template_name')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((templateName) => {
        const selectedTemplate = this.templateOptions().find(t => t.value === templateName);
        if (selectedTemplate) {
          this.sendMessageForm.patchValue({
            language_code: selectedTemplate.language_code
          }, { emitEvent: false });
        }
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

      if (this.selectedFile()) {
        customMessageControl?.setValidators([Validators.maxLength(500)]);
      } else {
        customMessageControl?.setValidators([
          Validators.required,
          Validators.maxLength(500)
        ]);
      }
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
          if (response.success) {
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
    const options: TemplateOption[] = templates.map(template => {
      // Format template name for display (e.g., 'project_intro' to 'Project Intro')
      const formattedName = template.template_name
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      return {
        value: template.template_name,
        // Label displays Context (Formatted Name)
        label: `${template.module_name || 'Template'} - ${formattedName}`,
        language_code: template.language_code,
        module_name: template.module_name,
        project_name: template.project_name,
        created_by_name: template.created_by_name
      };
    });

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
    const allTemplates = this.templateOptions();
    if (allTemplates.length > 0) {
      const defaultTemplate = allTemplates[0];
      this.sendMessageForm.patchValue({
        language_code: defaultTemplate.language_code,
        template_name: defaultTemplate.value
      }, { emitEvent: false });
    }
  }

  onLanguageChange(): void {
    // Legacy mapping kept but not actively used for template resetting
    // since the language selector is removed from UI.
  }

  // ========== MESSAGE SENDING ==========
  sendWhatsAppMessage(): void {
    if (!this.data.chattingData.mobile_no) {
      this.showSnackBar('Mobile number is required', 'error');
      return;
    }

    this.sendingMessage.set(true);

    const formValue = this.sendMessageForm.value;
    const isTemplate = formValue.messageType === 'template';
    const file = this.selectedFile();

    let apiCall: Observable<SendMessageResponse>;

    if (isTemplate) {
      apiCall = this.whatsAppService.sendTemplate(this.buildTemplateRequestData(formValue));
    } else {
      // Unified custom/media message logic
      const formData = this.buildCustomMessageRequestData(formValue);
      apiCall = this.whatsAppService.sendMessage(formData);
    }

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
              this.selectedFile.set(null);
              // reset file input
              const fileInput = document.getElementById('chat-file-upload') as HTMLInputElement;
              if (fileInput) fileInput.value = '';
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
  ): FormData {
    const formData = new FormData();
    formData.append('to', this.data.chattingData.mobile_no || '');
    formData.append('message', formValue.customMessage || '');
    
    const projectLeadId = this.data.chattingData['project_lead_id'];
    if (projectLeadId) {
      formData.append('project_lead_id', String(projectLeadId));
    }
    
    const projectEnqId = this.data.chattingData['project_enq_id'];
    if (projectEnqId) {
      formData.append('project_enq_id', String(projectEnqId));
    }
    
    formData.append('created_by', String(this.userId));

    const file = this.selectedFile();
    if (file) {
      formData.append('file', file);
      formData.append('type', this.selectedFileType() || 'document');
    }

    return formData;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    } else {
      this.selectedFile.set(null);
    }
  }

  openFilePicker(type: 'image' | 'video' | 'document', fileInput: HTMLInputElement): void {
    this.isAttachmentMenuOpen.set(false);
    if (type === 'image') {
      fileInput.accept = 'image/*';
    } else if (type === 'video') {
      fileInput.accept = 'video/*';
    } else {
      fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv';
    }
    fileInput.click();
  }

  clearSelectedFile(): void {
    this.selectedFile.set(null);
    const fileInput = document.getElementById('chat-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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

  // ========== MEDIA HELPERS ==========
  getMediaUrl(chat: ChatMessage): string | null {
    const path = chat.image_url || chat.media_url || null;
    if (!path || path === 'null' || path === 'undefined') return null;
    if (path.startsWith('http')) return path;
    return `${this.storageUrl()}/${path}`;
  }

  isImage(chat: ChatMessage): boolean {
    const hasValidImage = chat.image_url && chat.image_url !== 'null' && chat.image_url !== 'undefined';
    return chat.message_type === 'image' || !!hasValidImage;
  }

  isVideo(chat: ChatMessage): boolean {
    return chat.message_type === 'video';
  }

  isDocument(chat: ChatMessage): boolean {
    const hasValidMedia = chat.media_url && chat.media_url !== 'null' && chat.media_url !== 'undefined';
    return chat.message_type === 'document' || chat.message_type === 'file' || (!this.isImage(chat) && !this.isVideo(chat) && !!hasValidMedia && !!chat.file_name);
  }

  isInteractive(chat: ChatMessage): boolean {
    return chat.message_type === 'interactive' || !!chat.buttons || !!chat.interactive_data || !!chat.parent_question;
  }

  downloadFile(event: Event, url: string, fileName?: string): void {
    event.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    if (fileName) {
      link.download = fileName;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openMediaPreview(url: string): void {
    window.open(url, '_blank');
  }

  // ========== UTILITY METHODS ==========
  isFromUser(chat: ChatMessage): boolean {
    return !chat.message_from || chat.message_from === null || chat.message_from === 'outbound';
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
        const timeStr = String(timestamp).replace(' ', 'T');
        date = new Date(timeStr);
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
    return this.templateOptions();
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
      setTimeout(() => {
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight + 500,
          behavior: 'smooth'
        });
      }, 50);
    }
  }
}
