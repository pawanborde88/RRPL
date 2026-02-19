import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  OnDestroy,
  computed,
  signal,
  effect
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../../angular-material.module';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, fromEvent } from 'rxjs';

/*
 * A single chat message exchanged between the user and the bot.
 */
interface ChatMessage {
  id: string;
  from: 'user' | 'bot';
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  avatar?: string;
  isTyping?: boolean;
  type?: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileIcon?: string;
  reactions?: string[];
  isImportant?: boolean;
  suggestionButtons?: SuggestionButton[];
}

/*
 * Quick response options for common support queries
 */
interface QuickResponse {
  text: string;
  icon: string;
  category: string;
  description?: string;
}

/*
 * Suggestion buttons that appear with bot messages
 */
interface SuggestionButton {
  text: string;
  action: string;
}

/*
 * Support categories for better routing
 */
interface SupportCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-support-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularMaterialModule,
    DatePipe
  ],
  templateUrl: './support-chat.component.html',
  styleUrls: ['./support-chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportChatComponent implements OnDestroy {
  // ===== Signals for Reactive State Management =====
  private readonly messagesSignal = signal<ChatMessage[]>([
    {
      id: this.generateId(),
      from: 'bot',
      text: '👋 Hello! Welcome to RRPL Support. I\'m your virtual assistant, and I\'m here to help you navigate our services. How can I assist you today?',
      timestamp: new Date(),
      status: 'read',
      avatar: 'smart_toy',
      suggestionButtons: [
        { text: 'Quick Overview', action: 'help' },
        { text: 'Technical Issue', action: 'technical' },
        { text: 'Talk to human', action: 'agent' }
      ]
    }
  ]);

  readonly userInput = signal('');
  readonly isTyping = signal(false);
  readonly currentView = signal<'chat' | 'categories' | 'search'>('categories');
  readonly selectedCategory = signal<string>('');
  readonly searchQuery = signal('');

  // Computed signals for derived state
  readonly filteredMessages = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.messagesSignal();

    return this.messagesSignal().filter(msg =>
      msg.text.toLowerCase().includes(query)
    );
  });

  readonly shouldShowSearch = computed(() =>
    this.messagesSignal().length > 5
  );

  readonly shouldShowQuickResponses = computed(() =>
    this.messagesSignal().length <= 3 && !this.searchQuery()
  );

  readonly selectedCategoryName = computed(() => {
    const categoryId = this.selectedCategory();
    const category = this.supportCategories.find(c => c.id === categoryId);
    return category?.name || '';
  });

  readonly selectedCategoryColor = computed(() => {
    const categoryId = this.selectedCategory();
    const category = this.supportCategories.find(c => c.id === categoryId);
    return category?.color || '#9c27b0';
  });

  // Expose messages as getter for template (signals work better but keeping compatibility)
  get messages(): ChatMessage[] {
    return this.messagesSignal();
  }

  // Support categories (immutable)
  readonly supportCategories: SupportCategory[] = [
    {
      id: 'technical',
      name: 'Technical Support',
      icon: 'bug_report',
      description: 'Issues, errors, and bugs',
      color: '#f44336'
    },
    {
      id: 'account',
      name: 'Account Help',
      icon: 'account_circle',
      description: 'Login, profile, and settings',
      color: '#2196f3'
    },
    {
      id: 'billing',
      name: 'Billing & Payments',
      icon: 'payment',
      description: 'Invoices and subscriptions',
      color: '#4caf50'
    },
    {
      id: 'features',
      name: 'Feature Request',
      icon: 'lightbulb',
      description: 'Suggest improvements',
      color: '#ff9800'
    },
    {
      id: 'general',
      name: 'General Inquiry',
      icon: 'help_outline',
      description: 'Questions and information',
      color: '#9c27b0'
    },
    {
      id: 'urgent',
      name: 'Urgent Issue',
      icon: 'priority_high',
      description: 'Critical problems',
      color: '#e91e63'
    }
  ] as const;

  // Enhanced quick response options (immutable)
  readonly quickResponses: QuickResponse[] = [
    { text: 'How do I...?', icon: 'help_outline', category: 'general', description: 'Get help with tasks' },
    { text: 'Report Bug', icon: 'bug_report', category: 'technical', description: 'Something not working' },
    { text: 'Request Feature', icon: 'add_circle_outline', category: 'features', description: 'Suggest improvements' },
    { text: 'Account Issue', icon: 'account_circle', category: 'account', description: 'Login or profile help' }
  ] as const;

  // Advanced bot responses with context (immutable)
  private readonly botKnowledgeBase = {
    greetings: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    thanks: ['thank', 'thanks', 'appreciate', 'grateful'],
    goodbye: ['bye', 'goodbye', 'see you', 'take care'],
    urgent: ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'right now'],
    password: ['password', 'reset password', 'forgot password', 'login'],
    billing: ['bill', 'payment', 'invoice', 'charge', 'refund', 'subscription'],
    bug: ['bug', 'error', 'not working', 'broken', 'crash', 'issue', 'problem'],
    feature: ['feature', 'suggestion', 'improvement', 'add', 'new'],
    how: ['how to', 'how do i', 'how can i', 'guide', 'tutorial']
  } as const;

  // Category suggestions (memoized)
  private readonly categorySuggestionsCache = new Map<string, SuggestionButton[]>();

  private readonly destroy$ = new Subject<void>();
  private scrollTimeoutId?: number;
  private typingTimeoutId?: number;
  private messageStatusTimeouts = new Map<string, number[]>();

  @ViewChild('messagesContainer', { static: false })
  private messagesContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('searchInput', { static: false })
  private searchInput?: ElementRef<HTMLInputElement>;

  @ViewChild('messageTextarea')
  private messageTextarea?: ElementRef<HTMLTextAreaElement>;

  constructor(
    private readonly dialogRef: MatDialogRef<SupportChatComponent>,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {
    // Effect to auto-scroll when new messages are added
    effect(() => {
      // Access messages to track changes
      const messages = this.messagesSignal();
      // Schedule scroll after DOM update (Angular will handle the timing)
      if (messages.length > 0) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          this.scheduleScrollToBottom();
        });
      }
    });

    // Initialize category suggestions cache
    this.initializeCategorySuggestions();
  }

  ngOnDestroy(): void {
    // Clear all timeouts
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
    }
    if (this.typingTimeoutId) {
      clearTimeout(this.typingTimeoutId);
    }

    // Clear message status timeouts
    this.messageStatusTimeouts.forEach(timeouts => {
      timeouts.forEach(id => clearTimeout(id));
    });
    this.messageStatusTimeouts.clear();

    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== UI Control Methods =====

  close(): void {
    this.dialogRef.close();
  }

  // ===== Category Selection =====

  selectCategory(category: SupportCategory): void {
    this.selectedCategory.set(category.id);
    this.currentView.set('chat');

    // Send welcome message for the category
    const categoryMessage: ChatMessage = {
      id: this.generateId(),
      from: 'bot',
      text: `Great! I'll help you with ${category.name.toLowerCase()}. What specific issue are you facing?`,
      timestamp: new Date(),
      status: 'read',
      suggestionButtons: this.getCategorySuggestions(category.id)
    };

    this.messagesSignal.update(messages => [...messages, categoryMessage]);
    this.cdr.markForCheck();
  }

  private getCategorySuggestions(categoryId: string): SuggestionButton[] {
    // Check cache first
    if (this.categorySuggestionsCache.has(categoryId)) {
      return this.categorySuggestionsCache.get(categoryId)!;
    }

    const suggestions: Record<string, SuggestionButton[]> = {
      technical: [
        { text: 'App crashes', action: 'crash' },
        { text: 'Can\'t login', action: 'login' },
        { text: 'Other issue', action: 'other' }
      ],
      account: [
        { text: 'Reset password', action: 'password' },
        { text: 'Update profile', action: 'profile' },
        { text: 'Delete account', action: 'delete' }
      ],
      billing: [
        { text: 'View invoices', action: 'invoice' },
        { text: 'Payment failed', action: 'payment' },
        { text: 'Cancel subscription', action: 'cancel' }
      ],
      features: [
        { text: 'Request feature', action: 'request' },
        { text: 'Share feedback', action: 'feedback' }
      ],
      general: [
        { text: 'How to use', action: 'howto' },
        { text: 'FAQ', action: 'faq' }
      ],
      urgent: [
        { text: 'Connect to agent', action: 'agent' },
        { text: 'Call support', action: 'call' }
      ]
    };

    const result = suggestions[categoryId] || [];
    this.categorySuggestionsCache.set(categoryId, result);
    return result;
  }

  private initializeCategorySuggestions(): void {
    // Pre-populate cache
    this.supportCategories.forEach(category => {
      this.getCategorySuggestions(category.id);
    });
  }

  // ===== Message Sending =====

  send(): void {
    const text = this.userInput().trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: this.generateId(),
      from: 'user',
      text,
      timestamp: new Date(),
      status: 'sending',
      type: 'text',
      avatar: 'person'
    };

    this.messagesSignal.update(messages => [...messages, userMessage]);
    this.userInput.set('');
    this.cdr.markForCheck();

    // Schedule message status updates
    const timeouts: number[] = [];

    const timeout1 = window.setTimeout(() => {
      this.updateMessageStatus(userMessage.id, 'sent');
    }, 300);
    timeouts.push(timeout1);

    const timeout2 = window.setTimeout(() => {
      this.updateMessageStatus(userMessage.id, 'delivered');
    }, 600);
    timeouts.push(timeout2);

    const timeout3 = window.setTimeout(() => {
      this.updateMessageStatus(userMessage.id, 'read');
    }, 900);
    timeouts.push(timeout3);

    this.messageStatusTimeouts.set(userMessage.id, timeouts);

    // Generate intelligent bot response
    this.showTypingIndicator();

    this.typingTimeoutId = window.setTimeout(() => {
      this.hideTypingIndicator();
      this.generateIntelligentResponse(text);
    }, 1200 + Math.random() * 800) as unknown as number;
  }

  sendQuickResponse(response: QuickResponse): void {
    this.userInput.set(response.text);
    this.send();
  }

  handleSuggestionClick(action: string): void {
    const actionResponses: Record<string, string> = {
      help: 'I need help getting started',
      agent: 'I would like to speak with a human agent',
      crash: 'The application keeps crashing',
      login: 'I cannot log into my account',
      password: 'I need to reset my password',
      invoice: 'I want to view my invoices',
      request: 'I have a feature request',
      faq: 'Show me frequently asked questions'
    };

    const responseText = actionResponses[action] || action;
    this.userInput.set(responseText);
    this.send();
  }

  // ===== Search =====

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.cdr.markForCheck();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.cdr.markForCheck();
  }

  // ===== Advanced Response Generation =====

  private generateIntelligentResponse(userMessage: string): void {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';
    let suggestions: SuggestionButton[] = [];

    // Check for greetings
    if (this.containsKeywords(lowerMessage, this.botKnowledgeBase.greetings)) {
      response = '👋 Hello! How can I assist you today?';
      suggestions = [
        { text: 'I have a question', action: 'help' },
        { text: 'Report an issue', action: 'issue' }
      ];
    }
    // Check for thanks
    else if (this.containsKeywords(lowerMessage, this.botKnowledgeBase.thanks)) {
      response = 'You\'re welcome! 😊 Is there anything else I can help you with?';
      suggestions = [
        { text: 'Yes, one more thing', action: 'help' },
        { text: 'No, that\'s all', action: 'bye' }
      ];
    }
    // Check for goodbye
    else if (this.containsKeywords(lowerMessage, this.botKnowledgeBase.goodbye)) {
      response = 'It was a pleasure helping you! If you need anything else later, just type here. Have a wonderful day! 👋';
    }
    // Check for urgent issues
    else if (this.containsKeywords(lowerMessage, this.botKnowledgeBase.urgent)) {
      response = '🚨 I understand this is urgent. Let me connect you with our priority support team right away.';
      suggestions = [
        { text: 'Connect now', action: 'agent' },
        { text: 'Call support', action: 'call' }
      ];
    }
    // Check for password issues
    else if (this.containsKeywords(lowerMessage, this.botKnowledgeBase.password)) {
      response = '🔐 I can help you reset your password. Please click the link below or I can send a reset email to your registered address.';
      suggestions = [
        { text: 'Send reset email', action: 'reset' },
        { text: 'Call support', action: 'call' }
      ];
    }
    // Check for billing
    else if (this.containsKeywords(lowerMessage, this.botKnowledgeBase.billing)) {
      response = '💳 I can help with billing questions. Would you like to view your invoices, update payment method, or discuss your subscription?';
      suggestions = [
        { text: 'View invoices', action: 'invoice' },
        { text: 'Update payment', action: 'payment' },
        { text: 'Talk to billing', action: 'agent' }
      ];
    }
    // Check for bugs
    else if (this.containsKeywords(lowerMessage, this.botKnowledgeBase.bug)) {
      response = '🐛 I\'m sorry you\'re experiencing this issue. Can you please provide more details about what happened? Screenshots would be helpful.';
      suggestions = [
        { text: 'Upload screenshot', action: 'upload' },
        { text: 'Describe issue', action: 'describe' }
      ];
    }
    // Check for features
    else if (this.containsKeywords(lowerMessage, this.botKnowledgeBase.feature)) {
      response = '💡 We love hearing your ideas! Please share your feature request and I\'ll make sure it reaches our product team.';
      suggestions = [
        { text: 'Submit idea', action: 'submit' }
      ];
    }
    // Check for how-to questions
    else if (this.containsKeywords(lowerMessage, this.botKnowledgeBase.how)) {
      response = '📚 I\'d be happy to guide you through that! Could you be more specific about what you\'d like to learn?';
      suggestions = [
        { text: 'Video tutorial', action: 'video' },
        { text: 'Step-by-step guide', action: 'guide' }
      ];
    }
    // Default response with AI-like understanding
    else {
      response = `I understand you're asking about "${userMessage}". Let me help you with that. Could you provide a bit more detail so I can assist you better?`;
      suggestions = [
        { text: 'Talk to agent', action: 'agent' },
        { text: 'Search FAQ', action: 'faq' }
      ];
    }

    // Add bot message
    const botMessage: ChatMessage = {
      id: this.generateId(),
      from: 'bot',
      text: response,
      timestamp: new Date(),
      status: 'read',
      avatar: 'smart_toy',
      suggestionButtons: suggestions
    };

    this.messagesSignal.update(messages => [...messages, botMessage]);
    this.cdr.markForCheck();
  }

  private containsKeywords(message: string, keywords: readonly string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  // ===== Utility Methods =====

  private updateMessageStatus(messageId: string, status: 'sending' | 'sent' | 'delivered' | 'read'): void {
    this.messagesSignal.update(messages =>
      messages.map(msg =>
        msg.id === messageId ? { ...msg, status } : msg
      )
    );
    this.cdr.markForCheck();
  }

  private showTypingIndicator(): void {
    this.isTyping.set(true);
    this.cdr.markForCheck();
  }

  private hideTypingIndicator(): void {
    this.isTyping.set(false);
    this.cdr.markForCheck();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private scheduleScrollToBottom(): void {
    // Cancel previous scroll if pending
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
    }

    // Schedule scroll after DOM update
    this.scrollTimeoutId = requestAnimationFrame(() => {
      this.scrollToBottom();
    }) as unknown as number;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      const el = this.messagesContainer.nativeElement;
      // Use scrollTop for better performance than scrollTo
      el.scrollTop = el.scrollHeight;
    }
  }

  // ===== Status Helpers (memoized) =====

  private readonly statusIconMap: Record<string, string> = {
    sending: 'schedule',
    sent: 'done',
    delivered: 'done_all',
    read: 'done_all'
  };

  private readonly statusColorMap: Record<string, string> = {
    sending: 'text-muted',
    sent: 'text-primary',
    delivered: 'text-primary',
    read: 'text-success'
  };

  getStatusIcon(status: string): string {
    return this.statusIconMap[status] || 'schedule';
  }

  getStatusColor(status: string): string {
    return this.statusColorMap[status] || 'text-muted';
  }

  // ===== TrackBy Functions for Performance =====

  trackByMessageId(_index: number, message: ChatMessage): string {
    return message.id;
  }

  trackByCategoryId(_index: number, category: SupportCategory): string {
    return category.id;
  }

  trackByQuickResponseId(_index: number, response: QuickResponse): string {
    return `${response.category}-${response.text}`;
  }

  trackBySuggestionId(_index: number, suggestion: SuggestionButton): string {
    return suggestion.action;
  }

  // ===== Input Handlers =====

  onUserInputChange(value: string): void {
    this.userInput.set(value);
    this.adjustTextareaHeight();
  }

  private adjustTextareaHeight(): void {
    if (this.messageTextarea) {
      const textarea = this.messageTextarea.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  }

  onEnterKeyPress(): void {
    if (this.userInput().trim()) {
      this.send();
    }
  }

  skipToChat(): void {
    this.currentView.set('chat');
    this.cdr.markForCheck();
  }
}