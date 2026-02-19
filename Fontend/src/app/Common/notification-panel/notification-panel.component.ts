import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Notification {
    id: number;
    title: string;
    description: string;
    time: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    unread: boolean;
}

@Component({
    selector: 'app-notification-panel',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatRippleModule,
        MatTooltipModule
    ],
    templateUrl: './notification-panel.component.html',
    styleUrls: ['./notification-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPanelComponent {
    notifications = signal<Notification[]>([
        {
            id: 1,
            title: 'New Lead Assigned',
            description: 'A new lead  has been assigned to you.',
            time: '2 mins ago',
            icon: 'person_add',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            unread: true
        },
        {
            id: 2,
            title: 'Meeting Reminder',
            description: 'Project kickoff meeting starts in 15 minutes.',
            time: '15 mins ago',
            icon: 'schedule',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            unread: true
        },
        {
            id: 3,
            title: 'Report Ready',
            description: 'The weekly sales report is ready for download.',
            time: '1 hour ago',
            icon: 'description',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            unread: true
        },
        {
            id: 4,
            title: 'System Update',
            description: 'System maintenance scheduled for tonight at 12 AM.',
            time: '3 hours ago',
            icon: 'settings',
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-600',
            unread: false
        },
        {
            id: 5,
            title: 'New Message',
            description: 'You have a new message from the supervisor.',
            time: '5 hours ago',
            icon: 'chat',
            iconBg: 'bg-rose-50',
            iconColor: 'text-rose-600',
            unread: false
        },
        {
            id: 6,
            title: 'Task Completed',
            description: 'Development task "Navbar Update" marked as completed.',
            time: 'Yesterday',
            icon: 'check_circle',
            iconBg: 'bg-green-50',
            iconColor: 'text-green-600',
            unread: false
        },
        {
            id: 7,
            title: 'Approval Required',
            description: 'Inventory request #452 needs your approval.',
            time: 'Yesterday',
            icon: 'assignment_late',
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            unread: false
        },
        {
            id: 8,
            title: 'Security Alert',
            description: 'New login attempt from a new device detected.',
            time: '2 days ago',
            icon: 'security',
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            unread: false
        },
        {
            id: 9,
            title: 'Goal Achieved',
            description: 'Monthly target achieved! Congratulations.',
            time: '3 days ago',
            icon: 'stars',
            iconBg: 'bg-yellow-50',
            iconColor: 'text-yellow-600',
            unread: false
        },
        {
            id: 10,
            title: 'Document Shared',
            description: 'Marketing shared "Strategy_2024.pdf" with you.',
            time: '4 days ago',
            icon: 'share',
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            unread: false
        }
    ]);

    unreadCount = computed(() => this.notifications().filter(n => n.unread).length);
    activeTab = signal<'all' | 'unread'>('all');

    filteredNotifications = computed(() => {
        const notes = this.notifications();
        return this.activeTab() === 'all' ? notes : notes.filter(n => n.unread);
    });

    setActiveTab(tab: 'all' | 'unread') {
        this.activeTab.set(tab);
    }

    markAllAsRead() {
        this.notifications.update(notes =>
            notes.map(n => ({ ...n, unread: false }))
        );
    }

    deleteNotification(id: number, event: MouseEvent) {
        event.stopPropagation();
        this.notifications.update(notes => notes.filter(n => n.id !== id));
    }
}
