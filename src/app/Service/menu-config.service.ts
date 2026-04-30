import { Injectable, computed, signal } from '@angular/core';

export interface SubMenuItem {
  routerLink?: string;
  label: string;
  visible?: boolean;
  items?: SubMenuItem[];
  icon?: string; // Added icon property
}

export interface MenuItem {
  title: string;
  icon: string;
  tippy: {
    id: string;
    menuId: string;
  };
  routerLink?: string;
  items?: SubMenuItem[];
  visible?: boolean;
}

export interface MenuItems {
  [key: string]: MenuItem;
}

@Injectable({
  providedIn: 'root'
})
export class MenuConfigService {
  private readonly permissionData = signal<string | null>(null);
  private readonly roleId = signal<string | null>(null);

  // Expose readonly computed values
  readonly permissions = computed(() => this.permissionData());
  readonly role = computed(() => this.roleId());

  constructor() {
    this.initializePermissions();
  }

  private initializePermissions(): void {
    this.permissionData.set(sessionStorage.getItem('permission'));
    this.roleId.set(sessionStorage.getItem('role_id'));
  }

  updatePermissions(): void {
    this.permissionData.set(sessionStorage.getItem('permission'));
    this.roleId.set(sessionStorage.getItem('role_id'));
  }

  hasPermission(permission: string): boolean {
    const permissions = this.permissionData();
    if (!permissions) return false;
    // Use exact matching by splitting the permission string
    return permissions.split(',').map(p => p.trim()).includes(permission);
  }

  /**
   * Builds menu items with permission checks
   * This is memoized to avoid recalculating on every access
   */
  buildMenuItems(): MenuItems {
    const hasPermission = (perm: string) => this.hasPermission(perm);

    return {
      allProjects: {
        title: 'All Project Setup',
        icon: 'domain',
        tippy: { id: 'all-projects-tippy', menuId: 'all-projects-tippy-menu' },
        routerLink: '/all-projects',
        visible: hasPermission('608'),
      },

      hrms: {
        title: 'HRMS',
        icon: 'badge',
        routerLink: '/hrms',
        visible: hasPermission('216'),
        tippy: { id: '', menuId: '' },
      },
      LMS: {
        title: 'LMS',
        icon: 'school',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [
          {
            routerLink: '/lmsdashboard',
            label: 'LMS Dashboard',
            icon: 'dashboard',
            visible: hasPermission('248'),
          },
          {
            routerLink: '/setup/courses',
            label: 'All courses',
            icon: 'menu_book',
            visible: hasPermission('248'),
          },
          {
            routerLink: '/setup/course-user-report',
            label: 'Course User Report',
            icon: 'assignment_ind',
            visible: hasPermission('583'),
          },
          {
            routerLink: '/setup/leaderboard',
            label: 'Leaderboard',
            icon: 'emoji_events',
            visible: hasPermission('583'),
          },
          {
            routerLink: '/setup/courses/notice-board',
            label: 'Notice Board',
            icon: 'notifications_active',
            visible: hasPermission('583'),
          }
        ],
        visible: hasPermission('219'),
      },
      GoalsAndTargets: {
        title: 'Goals & Targets',
        icon: 'track_changes',
        tippy: { id: 'goals-targets-tippy', menuId: 'goals-targets-tippy-menu' },
        items: [
          {
            routerLink: '/goals-targets/all-strategys',
            label: 'All Strategies',
            icon: 'psychology',
            visible: hasPermission('665'),
          },
          {
            routerLink: '/goals-targets/annual-goal-dashboard',
            label: 'Annual Goal Dashboard',
            icon: 'speed',
            visible: hasPermission('665'),
          },
          {
            routerLink: '/goals-targets/all-anngual-goals',
            label: 'All Annual Goals',
            icon: 'stars',
            visible: hasPermission('666'),
          },
          {
            routerLink: '/goals-targets/goals-form',
            label: 'Goals Form',
            icon: 'edit_note',
            visible: hasPermission('667'),
          },

        ],
        visible: hasPermission('664'),
      },
      customerSearch: {
        title: 'Customers',
        icon: 'contact_page',
        routerLink: '/customer-search',
        visible: hasPermission('217'),
        tippy: { id: '', menuId: '' },
      },
      DailyDAReport: {
        title: ' DA Report',
        icon: 'insights',
        routerLink: '/Pre-sales/talecaller-salesexecutive-count',
        visible: hasPermission('616'),
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
      },
      preSales: {
        title: 'Lead Management',
        icon: 'leaderboard',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [
          {
            routerLink: '/leadManagement-all-projectleads',
            label: 'All Leads',
            icon: 'group_add',
            visible: hasPermission('232'),
          },
          {
            routerLink: '/all-leadsTrackings',
            label: 'Lead Tracking ',
            icon: 'my_location',
            visible: hasPermission('291'),
          },
          {
            routerLink: '/leadManagement-all-dismissLeads',
            label: 'Dismiss Leads',
            icon: 'person_remove',
            visible: hasPermission('292'),
          },
          {
            label: 'Reports',
            icon: 'pie_chart',
            visible: hasPermission('233'),
            items: [
              {
                routerLink: '/leadManagement/leadCallLogs',
                label: 'Lead Call Logs',
                icon: 'ring_volume',
                visible: hasPermission('619'),
              },
              {
                routerLink: '/leadManagement-all-preSalesReport',
                label: 'Site Visited Report',
                icon: 'home_work',
                visible: hasPermission('633'),
              },
              {
                routerLink: '/leadManagement-all-DigitalHoardingLeadsReport',
                label: 'Digital Hoarding Report',
                icon: 'featured_video',
                visible: hasPermission('612'),
              },
              {
                routerLink: '/leadManagement-all-Re-enquiryReport',
                label: 'Digital Re-Enquiry Report',
                icon: 'sync_problem',
                visible: hasPermission('294'),
              },
              {
                routerLink: '/Pre-sales/NewCRMPreSalesTrackingReports',
                label: 'Lead Tracking Report',
                icon: 'query_stats',
                visible: hasPermission('296'),
              },
              {
                routerLink: '/leadManagement-all-AllDissmissLeadsReport',
                label: ' Dismiss Lead Report',
                icon: 'report_off',
                visible: hasPermission('299'),
              },
              {
                routerLink: '/after-sales/leads-transfer-report',
                label: 'Transfer Report',
                icon: 'move_down',
                visible: hasPermission('300'),
              },
            ],
          },
        ],
        visible: hasPermission('221'),
      },

      sales: {
        title: 'Site Visit Management',
        icon: 'travel_explore',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [

          {
            routerLink: '/salesManagement-dailyDSRReport',
            label: 'DSR Report',
            icon: 'assignment',
            visible: hasPermission('582'),
          },

          {
            routerLink: '/all-FloorUnits',
            label: 'Floor level Units',
            icon: 'view_quilt',
            visible: hasPermission('416'),
          },
          {
            routerLink: '/all-parking-units',
            label: 'All Parking Units',
            icon: 'directions_car',
            visible: hasPermission('618'),
          },
          {
            routerLink: '/parking-inventory-chart',
            label: 'Parking Inventory Chart',
            icon: 'pie_chart_outline',
            visible: hasPermission('617'),
          },
          {
            routerLink: '/salesManagement-inventory',
            label: 'Inventory ',
            icon: 'warehouse',
            visible: hasPermission('302'),
          },
          {
            routerLink: '/siteVisitManagement/projectWise-QR',
            label: 'Project QR ',
            icon: 'qr_code_2',
            visible: hasPermission('235'),
          },
          {
            label: 'Client Logs',
            icon: 'recent_actors',
            visible: hasPermission('234'),
            items: [
              {
                routerLink: '/siteVisitManagement-Enquiries',
                label: 'Client List',
                icon: 'person_add_alt',
                visible: hasPermission('306'),
              },
              {
                routerLink: '/sales-enquiry-AllFollowUps',
                label: 'Enquiries Tracking',
                icon: 'follow_the_signs',
                visible: hasPermission('307'),
              },
            ],
          },
          {
            label: 'EOI',
            icon: 'draw',
            visible: hasPermission('237'),
            items: [
              {
                routerLink: '/setup/sales-tokens',
                label: 'All EOI',
                icon: 'history_edu',
                visible: hasPermission('303'),
              },
            ],
          },
          {
            label: 'Booking',
            icon: 'book_online',
            visible: hasPermission('238'),
            items: [
              {
                routerLink: '/salesManagement/site-bookings',
                label: 'All Bookings',
                icon: 'event_note',
                visible: hasPermission('309'),
              },
              {
                routerLink: '/salesManagement/bookings/cancelled-booking-log',
                label: 'Cancelled Bookings ',
                icon: 'event_busy',
                visible: hasPermission('606'),
              },
              {
                routerLink: '/siteVisitManagement/tokens/GuestBooking',
                label: 'Guest Entry',
                icon: 'person_add_alt_1',
                visible: hasPermission('304'),
              },
            ],
          },
          {
            label: 'Reports',
            icon: 'bar_chart_4_bars',
            visible: hasPermission('364'),
            items: [
              {
                routerLink: '/metaSetup/all-digital-activity-report/list',
                label: 'Detailed  Activity Report',
                icon: 'insights',
                visible: hasPermission('582'),
              },
              {
                routerLink: '/salesManagement-Enquiry-RevisitReport',
                label: 'Enquiry Revisit Report',
                icon: 'replay',
                visible: hasPermission('308'),
              },
              {
                routerLink: '/salesManagement/allEnquiryTrackingReport',
                label: 'Enquiry Tracking  Report',
                icon: 'location_searching',
                visible: hasPermission('237'),
              },
              {
                routerLink: '/salesManagement/allQuatationLog',
                label: 'Quotation Report',
                icon: 'price_check',
                visible: hasPermission('628'),
              },
              {
                routerLink: '/salesManagement-EnquiryOverviewReport',
                label: ' Enquiry Overview Report',
                icon: 'description',
                visible: hasPermission('237'),
              },
              {
                routerLink: '/salesManagement-Enquiry-DismissReport',
                label: ' Dismiss Enquiry Report',
                icon: 'block',
                visible: hasPermission('308'),
              },
              {
                routerLink: '/sales-reports/sales-enquiry-transfer-report',
                label: 'Transfer Report',
                icon: 'input',
                visible: hasPermission('237'),
              },
            ],
          },
        ],
        visible: hasPermission('222'),
      },
      postSales: {
        title: 'After Sales  ',
        icon: 'verified',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [
          {
            routerLink: '/post-sales/account-setup-master',
            label: 'Account Setup ',
            icon: 'admin_panel_settings',
            visible: hasPermission('240'),
          },
          {
            routerLink: '/postsales-config/TemplateManagement',
            label: 'Template Management',
            icon: 'file_copy',
            visible: hasPermission('468'),
          },
          {
            routerLink: '/post-sales/unitAssignedBank',
            label: 'Unit Assigned Bank',
            icon: 'account_balance',
            visible: hasPermission('242'),
          },
          {
            routerLink: '/after-sales-DocumentUploadManagements',
            label: 'File upload',
            icon: 'cloud_upload',
            visible: hasPermission('318'),
          },
          {
            routerLink: '/after-sales/document-generation',
            label: 'Document Generation',
            icon: 'history_edu',
            visible: hasPermission('246'),
          },
          {
            label: 'Payment Collection',
            icon: 'account_balance_wallet',
            visible: hasPermission('241'),
            items: [
              {
                routerLink: '/after-sales/paymentCollection-paymentCollectionList',
                label: 'Payment Collection List',
                icon: 'format_list_bulleted',
                visible: hasPermission('323'),
              },
              {
                routerLink: '/after-sales/paymentCollection-updateClientData',
                label: 'Update Client Data',
                icon: 'update',
                visible: hasPermission('324'),
              },
              {
                routerLink: '/after-sales/paymentCollection-AgreementRecords',
                label: 'Agreement Records',
                icon: 'gavel',
                visible: hasPermission('325'),
              },
              {
                routerLink: '/after-sales/paymentCollection-AgreementInprogress',
                label: 'Agreement In Progress',
                icon: 'hourglass_top',
                visible: hasPermission('326'),
              },
              {
                routerLink: '/after-sales/paymentCollection-receipts',
                label: 'All Slips',
                icon: 'receipt_long',
                visible: hasPermission('327'),
              },
            ],
          },
          {
            label: 'Setup Config',
            icon: 'tune',
            visible: hasPermission('244'),
            items: [
              {
                routerLink: '/placeholder-tag-setup/all-hashtagplacehodler',
                label: 'Modify Tags',
                icon: 'style',
                visible: hasPermission('319'),
              },
              {
                routerLink: '/placeholder-tag-setup/EmailTeamplates',
                label: 'Email Templates',
                icon: 'forward_to_inbox',
                visible: hasPermission('320'),
              },

            ],
          },
          {
            label: 'Installment',
            icon: 'calendar_month',
            visible: hasPermission('244'),
            items: [
              {
                routerLink: '/after-sales/Installment-modifyStages',
                label: 'Modify Stages',
                icon: 'reorder',
                visible: hasPermission('319'),
              },
              {
                routerLink: '/post-sales/demand-DemandStageConfig',
                label: 'Unit Payment Setup',
                icon: 'settings_input_component',
                visible: hasPermission('320'),
              },
              {
                routerLink: '/after-sales/installment-installment-generation',
                label: 'Installment Generation',
                icon: 'post_add',
                visible: hasPermission('321'),
              },
              {
                routerLink: '/post-sales/demand-dashboard-estimantion-payments',
                label: 'Stage wise Payments',
                icon: 'assessment',
                visible: hasPermission('322'),
              },
            ],
          },
          {
            label: 'Reports',
            icon: 'bar_chart',
            visible: hasPermission('245'),
            items: [
              {
                routerLink: '/after-sales/crm-activity-report',
                label: 'CRM Activity Report',
                icon: 'restore_from_trash',
                visible: hasPermission('234'),
              },
              {
                routerLink: '/after-sales/deleted-receipts-log',
                label: 'Deleted Receipts Log',
                icon: 'restore_from_trash',
                visible: hasPermission('234'),
              },
              {
                routerLink: '/after-sales/MSEBDetailsReport',
                label: ' MSEB Report',
                icon: 'bolt',
                visible: hasPermission('234'),
              },
              {
                routerLink: '/after-sales/ledget-report',
                label: 'Ledger Report',
                icon: 'menu_book',
                visible: hasPermission('374'),
              },
              {
                routerLink: '/after-sales/property-tax-report',
                label: 'Property Tax Report',
                icon: 'request_page',
                visible: hasPermission('234'),
              },
              {
                routerLink: '/after-sales/mis-report',
                label: 'MIS Report',
                icon: 'assessment',
                visible: hasPermission('376'),
              },
              {
                routerLink: '/after-sales/recovery-report-account',
                label: 'Recovery Report',
                icon: 'published_with_changes',
                visible: hasPermission('376'),
              },
              {
                routerLink: '/after-sales/receipt-report',
                label: 'Receipts Report ',
                icon: 'view_list',
                visible: hasPermission('372'),
              },
              {
                routerLink: '/after-sales/consolidated-collection-report',
                label: ' Consolidated Collection',
                icon: 'grid_view',
                visible: hasPermission('369'),
              },
              {
                routerLink: '/after-sales/agreement-report',
                label: '  Agreement Report',
                icon: 'fact_check',
                visible: hasPermission('368'),
              },
              {
                routerLink: '/after-sales/stages-payment-report',
                label: '  Stages Payment Report',
                icon: 'stacked_line_chart',
                visible: hasPermission('234'),
              },
            ],
          },
        ],
        visible: hasPermission('224'),
      },
      channelPartners: {
        title: 'CP Management',
        icon: 'diversity_3',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [
          {
            routerLink: '/all-channelpartner',
            label: 'All Channel Partners',
            icon: 'corporate_fare',
            visible: hasPermission('330'),
          },
          {
            routerLink: '/module/channel-partners-meeting',
            label: 'CP Meetings',
            icon: 'handshake',
            visible: hasPermission('339'),
          },
          {
            routerLink: '/CP-management/brokerage-offer',
            label: 'Brokerage Offer',
            icon: 'percent',
            visible: hasPermission('339'),
          },
          {
            routerLink: '/all-CPExecutives',
            label: 'CP Executives',
            icon: 'badge',
            visible: hasPermission('331'),
          },
          {
            routerLink: '/all-CPLevels',
            label: 'CP Levels',
            icon: 'stairs',
            visible: hasPermission('331'),
          },
          {
            routerLink: '/all-CPOwner',
            label: 'CP Owners',
            icon: 'face',
            visible: hasPermission('331'),
          },
          {
            routerLink: '/setup/all-brokerage',
            label: 'Brokerage Slabs',
            icon: 'grid_on',
            visible: hasPermission('332'),
          },
          {
            routerLink: '/all-channelpartner-deals',
            label: 'All Deals',
            icon: 'handshake',
            visible: hasPermission('333'),
          },
          {
            label: 'CP Visits',
            icon: 'where_to_vote',
            visible: hasPermission('334'),
            items: [
              {
                routerLink: '/setup/site-visits',
                label: 'Site Visits',
                icon: 'place',
                visible: hasPermission('335'),
              },
              {
                routerLink: '/sales/cp-site-visits/cp-payout',
                label: 'CP Payout',
                icon: 'payments',
                visible: hasPermission('336'),
              },
              {
                routerLink: '/sales/cp-site-visits/cp-bill-approved',
                label: 'CP Bill Approval',
                icon: 'fact_check',
                visible: hasPermission('337'),
              },
              {
                routerLink: '/setu',
                label: ' Bulk Shoot',
                icon: 'rocket_launch',
                visible: hasPermission('338'),
              },
            ],
          },
          {
            label: 'Reports',
            icon: 'poll',
            visible: hasPermission('343'),
            items: [
              {
                routerLink: '/channel-partner/reports/cp-executive-follow-up-report',
                label: 'CP Follow-up Report',
                icon: 'repeat',
                visible: hasPermission('343'),
              },
              {
                routerLink: '/channel-partner/reports/event-attendance-report',
                label: 'Event Attendance Report',
                icon: 'playlist_add_check',
                visible: hasPermission('343'),
              },
              {
                routerLink: '/setup/site-visits',
                label: 'CP Billing Report',
                icon: 'account_balance_wallet',
                visible: hasPermission('340'),
              },
              {
                routerLink: '/channel-partner/reports/cpSiteVisitReport',
                label: 'CP Site Visit Report',
                icon: 'map',
                visible: hasPermission('341'),
              },
              {
                routerLink: '/channel-partner/reports/CPTarget',
                label: 'CP Target',
                icon: 'gps_fixed',
                visible: hasPermission('342'),
              },
              {
                routerLink: '/channel-partner/reports/CPReport',
                label: 'CP Report',
                icon: 'query_stats',
                visible: hasPermission('342'),
              },
            ],
          },
        ],
        visible: hasPermission('365'),
      },

      helpDesk: {
        title: 'Help Desk',
        icon: 'headset_mic',
        routerLink: '/all-feedbacks',
        visible: hasPermission('471'),
        tippy: { id: 'setup-tippy', menuId: 'setup-tippy-menu' },
      },


      Events: {
        title: 'Events',
        icon: 'celebration',
        tippy: { id: 'marketing-tippy', menuId: 'marketing-tippy-menu' },
        items: [
          {
            routerLink: '/events/all-events-user-log',
            label: 'All Events',
            icon: 'confirmation_number',
            visible: hasPermission('622'),
          },

        ],
        visible: hasPermission('622'),
      },


      sop: {
        title: 'SOP',
        icon: 'rule',
        tippy: { id: 'marketing-tippy', menuId: 'marketing-tippy-menu' },
        items: [
          {
            routerLink: '/all-sop',
            label: 'All SOP',
            icon: 'rule',
            visible: hasPermission('229'),
          },
        ],
        visible: hasPermission('218'),
      },
      Finance: {
        title: 'Finance',
        icon: 'savings',
        tippy: { id: 'marketing-tippy', menuId: 'marketing-tippy-menu' },
        items: [
          {
            routerLink: '/all-budget',
            label: 'Budget',
            icon: 'account_tree',
            visible: hasPermission('229'),
          },
          {
            routerLink: '/all-expenses',
            label: 'Expenses',
            icon: 'shopping_bag',
            visible: hasPermission('230'),
          },
          {
            routerLink: '/all-expenseSummary',
            label: 'Reports',
            icon: 'show_chart',
            visible: hasPermission('231'),
          },
        ],
        visible: hasPermission('220'),
      },
      metaSetup: {
        title: 'Meta setup',
        icon: 'campaign',
        tippy: { id: 'marketing-tippy', menuId: 'marketing-tippy-menu' },
        items: [
          {
            routerLink: '/metaSetup/all-digital-budget/list',
            label: 'All Facebook Budget',
            icon: 'account_balance_wallet',
            visible: hasPermission('420'),
          },
          {
            routerLink: '/metaSetup/all-digital-spend/list',
            label: 'All Facebook Spend',
            icon: 'monetization_on',
            visible: hasPermission('420'),
          },

          {
            routerLink: '/metaSetup/all-digital-Facebook/list',
            label: 'Facebook Setup',
            icon: 'facebook',
            visible: hasPermission('420'),
          },
          {
            routerLink: '/metaSetup/all-digital-leads/list',
            label: 'Digital Leads',
            icon: 'person_add_alt',
            visible: hasPermission('634'),
          },
        ],
        visible: hasPermission('220'),
      },
      MOMInternalMeetings: {
        title: 'MOM ',
        icon: 'forum',
        routerLink: '/MOM/Internal-meetings/all-mom-meetings',
        visible: hasPermission('600'),
        tippy: { id: 'setup-tippy', menuId: 'setup-tippy-menu' },
      },
      targetAndAchievement: {
        title: 'Performance ',
        icon: 'speed',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [
          {
            routerLink: '/target-achievement/all-source-wise-targets',
            label: 'Source Wise Target',
            icon: 'show_chart',
            visible: hasPermission('234'),
          },
          {
            routerLink: '/target-achievement/pre-sales/all-presale-target-list',
            label: 'Sales',
            icon: 'show_chart',
            visible: hasPermission('234'),
          },
          {
            routerLink: '/target-achievement/pre-sales/all-insentive-bonus-master-list',
            label: ' Incentive  Report',
            icon: 'military_tech',
            visible: hasPermission('234'),
          },
          {
            routerLink: '/target-achievement/all-monthly-target',
            label: 'Monthly Target',
            icon: 'military_tech',
            visible: hasPermission('234'),
          },
          {
            routerLink: '/target-achievement/incentive-slabs',
            label: 'Incentive Slabs',
            icon: 'layers',
            visible: hasPermission('234'),
          },
          {
            routerLink: '/target-achievement/incentive-slabs/all-insentive-slabs',
            label: 'Setup Incentive Slabs',
            icon: 'construction',
            visible: hasPermission('234'),
          },
        ],
        visible: hasPermission('366'),
      },
      setup: {
        title: 'Setup',
        icon: 'settings',
        routerLink: '/all-setupDashboard',
        visible: hasPermission('217'),
        tippy: { id: 'setup-tippy', menuId: 'setup-tippy-menu' },
      },
    };
  }
}
