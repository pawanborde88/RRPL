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
        icon: 'folder',
        tippy: { id: 'all-projects-tippy', menuId: 'all-projects-tippy-menu' },
        routerLink: '/all-projects',
        visible: hasPermission('608'),
      },

      hrms: {
        title: 'HRMS',
        icon: 'manage_accounts',
        routerLink: '/hrms',
        visible: hasPermission('216'),
        tippy: { id: '', menuId: '' },
      },
      LMS: {
        title: 'LMS',
        icon: 'menu_book',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [
          {
            routerLink: '/lmsdashboard',
            label: 'LMS Dashboard',
            visible: hasPermission('248'),
          },
          {
            routerLink: '/setup/courses',
            label: 'All courses',
            visible: hasPermission('248'),
          },
          {
            routerLink: '/setup/course-user-report',
            label: 'Course User Report',
            visible: hasPermission('583'),
          },
          {
            routerLink: '/setup/leaderboard',
            label: 'Leaderboard',
            visible: hasPermission('583'),
          },
          {
            routerLink: '/setup/courses/notice-board',
            label: 'Notice Board',
            visible: hasPermission('583'),
          }
        ],
        visible: hasPermission('219'),
      },
      customerSearch: {
        title: 'Customers',
        icon: 'find_replace',
        routerLink: '/customer-search',
        visible: hasPermission('217'),
        tippy: { id: '', menuId: '' },
      },
      DailyDAReport: {
        title: ' DA Report',
        icon: 'calendar_month',
        routerLink: '/Pre-sales/talecaller-salesexecutive-count',
        visible: hasPermission('616'),
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
      },
      preSales: {
        title: 'Lead Management',
        icon: 'real_estate_agent',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [
          {
            routerLink: '/leadManagement-all-projectleads',
            label: 'All Leads',
            visible: hasPermission('232'),
          },
          // {
          //   routerLink: '/leadManagement-all-projectUnassignedLeads',
          //   label: 'Pending Assigned Leads',
          //   visible: hasPermission('396'),
          // },
          {
            routerLink: '/all-leadsTrackings',
            label: 'Lead Tracking ',
            visible: hasPermission('291'),
          },


          {
            routerLink: '/leadManagement-all-dismissLeads',
            label: 'Dismiss Leads',
            visible: hasPermission('292'),
          },
          {
            label: 'Reports',
            visible: hasPermission('233'),
            items: [
              {
                routerLink: '/leadManagement/leadCallLogs',
                label: 'Lead Call Logs',
                visible: hasPermission('619'),
              },
              {
                routerLink: '/leadManagement-all-preSalesReport',
                label: 'Site Visited Report',
                visible: hasPermission('633'),
              },
              {
                routerLink: '/leadManagement-all-DigitalHoardingLeadsReport',
                label: 'Digital Hoarding Report',
                visible: hasPermission('612'),
              },
              {
                routerLink: '/leadManagement-all-Re-enquiryReport',
                label: 'Digital Re-Enquiry Report',
                visible: hasPermission('294'),
              },
              {
                routerLink: '/Pre-sales/NewCRMPreSalesTrackingReports',
                label: 'Lead Tracking Report',
                visible: hasPermission('296'),
              },
              // {
              //   routerLink: '/Pre-',
              //   label: ' Lead overview Report',
              //   visible: hasPermission('297'),
              // },
              {
                routerLink: '/leadManagement-all-AllDissmissLeadsReport',
                label: ' Dismiss Lead Report',
                visible: hasPermission('299'),
              },
              {
                routerLink: '/after-sales/leads-transfer-report',
                label: 'Transfer Report',
                visible: hasPermission('300'),
              },
            ],
          },
        ],
        visible: hasPermission('221'),
      },

      sales: {
        title: 'Site Visit Management',
        icon: 'shopping_cart_checkout',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [

          {
            routerLink: '/salesManagement-dailyDSRReport',
            label: 'DSR Report',
            visible: hasPermission('582'),
          },

          {
            routerLink: '/all-FloorUnits',
            label: 'Floor level Units',
            visible: hasPermission('416'),
          },
          {
            routerLink: '/all-parking-units',
            label: 'All Parking Units',
            visible: hasPermission('618'),
          },
          {
            routerLink: '/parking-inventory-chart',
            label: 'Parking Inventory Chart',
            visible: hasPermission('617'),
          },
          {
            routerLink: '/salesManagement-inventory',
            label: 'Inventory ',
            visible: hasPermission('302'),
          },
          {
            routerLink: '/siteVisitManagement/projectWise-QR',
            label: 'Project QR ',
            visible: hasPermission('235'),
          },
          {
            label: 'Client Logs',
            visible: hasPermission('234'),
            items: [
              {
                routerLink: '/siteVisitManagement-Enquiries',
                label: 'Client List',
                visible: hasPermission('306'),
              },
              {
                routerLink: '/sales-enquiry-AllFollowUps',
                label: 'Enquiries Tracking',
                visible: hasPermission('307'),
              },
              // {
              //   routerLink: '/SalesManagement-DismissEnquiries',
              //   label: 'All Dismiss Enquiries',
              //   visible: hasPermission('308'),
              // },
            ],
          },
          {
            label: 'EOI',
            visible: hasPermission('237'),
            items: [
              {
                routerLink: '/setup/sales-tokens',
                label: 'All EOI',
                visible: hasPermission('303'),
              },
              // {
              //   routerLink: '/setu',
              //   label: 'Bulk Shoot',
              //   visible: hasPermission('305'),
              // },
            ],
          },
          {
            label: 'Booking',
            visible: hasPermission('238'),
            items: [
              {
                routerLink: '/salesManagement/site-bookings',
                label: 'All Bookings',
                visible: hasPermission('309'),
              },
              {
                routerLink: '/salesManagement/bookings/cancelled-booking-log',
                label: 'Cancelled Bookings ',
                visible: hasPermission('606'),
              },
              {
                routerLink: '/siteVisitManagement/tokens/GuestBooking',
                label: 'Guest Entry',
                visible: hasPermission('304'),
              },
              // {
              //   routerLink: '/setup/site-bookingsffff',
              //   label: ' Bulk Shoot',
              //   visible: hasPermission('607'),
              // },
            ],
          },
          {
            label: 'Reports',
            visible: hasPermission('364'),
            items: [
              {
                routerLink: '/salesManagement/allEnquiryTrackingReport',
                label: 'Enquiry Tracking  Report',
                visible: hasPermission('237'),
              },
              {
                routerLink: '/salesManagement/allQuatationLog',
                label: 'Quotation Report',
                visible: hasPermission('628'),
              },
              {
                routerLink: '/salesManagement-EnquiryOverviewReport',
                label: ' Enquiry Overview Report',
                visible: hasPermission('237'),
              },
              {
                routerLink: '/salesManagement-Enquiry-DismissReport',
                label: ' Dismiss Enquiry Report',
                visible: hasPermission('308'),
              },
              {
                routerLink: '/sales-reports/sales-enquiry-transfer-report',
                label: 'Transfer Report',
                visible: hasPermission('237'),
              },
            ],
          },
        ],
        visible: hasPermission('222'),
      },
      postSales: {
        title: 'After Sales  ',
        icon: 'diversity_3',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [
          {
            routerLink: '/post-sales/account-setup-master',
            label: 'Account Setup ',
            visible: hasPermission('240'),
          },
          {
            routerLink: '/postsales-config/TemplateManagement',
            label: 'Template Management',
            visible: hasPermission('468'),
          },
          {
            routerLink: '/post-sales/unitAssignedBank',
            label: 'Unit Assigned Bank',
            visible: hasPermission('242'),
          },
          {
            routerLink: '/after-sales-DocumentUploadManagements',
            label: 'File upload',
            visible: hasPermission('318'),
          },
          {
            routerLink: '/after-sales/document-generation',
            label: 'Document Generation',
            visible: hasPermission('246'),
          },
          {
            label: 'Payment Collection',
            visible: hasPermission('241'),
            items: [
              {
                routerLink: '/after-sales/paymentCollection-paymentCollectionList',
                label: 'Payment Collection List',
                visible: hasPermission('323'),
              },
              {
                routerLink: '/after-sales/paymentCollection-updateClientData',
                label: 'Update Client Data',
                visible: hasPermission('324'),
              },
              {
                routerLink: '/after-sales/paymentCollection-AgreementRecords',
                label: 'Agreement Records',
                visible: hasPermission('325'),
              },
              {
                routerLink: '/after-sales/paymentCollection-AgreementInprogress',
                label: 'Agreement In Progress',
                visible: hasPermission('326'),
              },
              {
                routerLink: '/after-sales/paymentCollection-receipts',
                label: 'All Slips',
                visible: hasPermission('327'),
              },
            ],
          },
          {
            label: 'Installment',
            visible: hasPermission('244'),
            items: [
              {
                routerLink: '/after-sales/Installment-modifyStages',
                label: 'Modify Stages',
                visible: hasPermission('319'),
              },
              {
                routerLink: '/post-sales/demand-DemandStageConfig',
                label: 'Unit Payment Setup',
                visible: hasPermission('320'),
              },
              {
                routerLink: '/after-sales/installment-installment-generation',
                label: 'Installment Generation',
                visible: hasPermission('321'),
              },
              {
                routerLink: '/post-sales/demand-dashboard-estimantion-payments',
                label: 'Stage wise Payments',
                visible: hasPermission('322'),
              },
            ],
          },
          {
            label: 'Reports',
            visible: hasPermission('245'),
            items: [
              {
                routerLink: '/after-sales/MSEBDetailsReport',
                label: ' MSEB Report',
                visible: hasPermission('234'),
              },
              {
                routerLink: '/after-sales/ledget-report',
                label: 'Ledger Report',
                visible: hasPermission('374'),
              },
              {
                routerLink: '/after-sales/property-tax-report',
                label: 'Property Tax Report',
                visible: hasPermission('234'),
              },
              {
                routerLink: '/after-sales/mis-report',
                label: 'MIS Report',
                visible: hasPermission('376'),
              },
              // {
              //   routerLink: '/after-sales/account-statement-report',
              //   label: 'Account Statement',
              //   visible: hasPermission('374'),
              // },
              {
                routerLink: '/after-sales/receipt-report',
                label: 'Receipts Report ',
                visible: hasPermission('372'),
              },
              {
                routerLink: '/after-sales/consolidated-collection-report',
                label: ' Consolidated Collection',
                visible: hasPermission('369'),
              },
              {
                routerLink: '/after-sales/agreement-report',
                label: '  Agreement Report',
                visible: hasPermission('368'),
              },
              {
                routerLink: '/after-sales/stages-payment-report',
                label: '  Stages Payment Report',
                visible: hasPermission('234'),
              },
            ],
          },
        ],
        visible: hasPermission('224'),
      },
      channelPartners: {
        title: 'CP Management',
        icon: 'manage_accounts',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [
          {
            routerLink: '/all-channelpartner',
            label: 'All CPs',
            visible: hasPermission('330'),
          },
          {
            routerLink: '/module/channel-partners-meeting',
            label: 'CP Meetings',
            visible: hasPermission('339'),
          },
          {
            routerLink: '/CP-management/brokerage-offer',
            label: 'Brokerage Offer',
            visible: hasPermission('339'),
          },
          {
            routerLink: '/all-CPExecutives',
            label: 'CP Executives',
            visible: hasPermission('331'),
          },
          {
            routerLink: '/all-CPLevels',
            label: 'CP Levels',
            visible: hasPermission('331'),
          },
          {
            routerLink: '/all-CPOwner',
            label: 'CP Owners',
            visible: hasPermission('331'),
          },
          {
            routerLink: '/setup/all-brokerage',
            label: 'Brokerage Slabs',
            visible: hasPermission('332'),
          },
          {
            routerLink: '/all-channelpartner-deals',
            label: 'All Deals',
            visible: hasPermission('333'),
          },
          {
            label: 'CP Visits',
            visible: hasPermission('334'),
            items: [
              {
                routerLink: '/setup/site-visits',
                label: 'Site Visits',
                visible: hasPermission('335'),
              },
              {
                routerLink: '/sales/cp-site-visits/cp-payout',
                label: 'CP Payout',
                visible: hasPermission('336'),
              },
              {
                routerLink: '/sales/cp-site-visits/cp-bill-approved',
                label: 'CP Bill Approval',
                visible: hasPermission('337'),
              },
              {
                routerLink: '/setu',
                label: ' Bulk Shoot',
                visible: hasPermission('338'),
              },
            ],
          },
          {
            label: 'Reports',
            visible: hasPermission('343'),
            items: [
              {
                routerLink: '/channel-partner/reports/event-attendance-report',
                label: 'Event Attendance Report',
                visible: hasPermission('343'),
              },
              {
                routerLink: '/setup/site-visits',
                label: 'CP Billing Report',
                visible: hasPermission('340'),
              },
              {
                routerLink: '/channel-partner/reports/cpSiteVisitReport',
                label: 'CP Site Visit Report',
                visible: hasPermission('341'),
              },
              {
                routerLink: '/channel-partner/reports/CPTarget',
                label: 'CP Target',
                visible: hasPermission('342'),
              },
              {
                routerLink: '/channel-partner/reports/CPReport',
                label: 'CP Report',
                visible: hasPermission('342'),
              },
            ],
          },
        ],
        visible: hasPermission('365'),
      },

      helpDesk: {
        title: 'Help Desk',
        icon: 'help',
        routerLink: '/all-feedbacks',
        visible: hasPermission('471'),
        tippy: { id: 'setup-tippy', menuId: 'setup-tippy-menu' },
      },


      Events: {
        title: 'Events',
        icon: 'event_available',
        tippy: { id: 'marketing-tippy', menuId: 'marketing-tippy-menu' },
        items: [
          {
            routerLink: '/events/all-events-user-log',
            label: 'All Events',
            visible: hasPermission('622'),
          },
        ],
        visible: hasPermission('622'),
      },





      sop: {
        title: 'SOP',
        icon: 'assignment',
        tippy: { id: 'marketing-tippy', menuId: 'marketing-tippy-menu' },
        items: [
          {
            routerLink: '/all-sop',
            label: 'All SOP',
            visible: hasPermission('229'),
          },
        ],
        visible: hasPermission('218'),
      },
      Finance: {
        title: 'Finance',
        icon: 'account_balance',
        tippy: { id: 'marketing-tippy', menuId: 'marketing-tippy-menu' },
        items: [
          {
            routerLink: '/all-budget',
            label: 'Budget',
            visible: hasPermission('229'),
          },
          {
            routerLink: '/all-expenses',
            label: 'Expenses',
            visible: hasPermission('230'),
          },
          {
            routerLink: '/all-expenseSummary',
            label: 'Reports',
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
            routerLink: '/metaSetup/all-digital-Facebook/list',
            label: 'Facebook Setup',
            visible: hasPermission('420'),
          },
          {
            routerLink: '/metaSetup/all-digital-leads/list',
            label: 'Digital Leads',
            visible: hasPermission('634'),
          },
        ],
        visible: hasPermission('220'),
      },
      MOMInternalMeetings: {
        title: 'MOM ',
        icon: 'groups_3',
        routerLink: '/MOM/Internal-meetings/all-mom-meetings',
        visible: hasPermission('600'),
        tippy: { id: 'setup-tippy', menuId: 'setup-tippy-menu' },
      },
      taergetAndAchievement: {
        title: 'Performance ',
        icon: 'crisis_alert',
        tippy: { id: 'sales-tippy', menuId: 'sales-tippy-menu' },
        items: [
          {
            routerLink: '/target-achievement/pre-sales/all-presale-target-list',
            label: 'Sales',
            visible: hasPermission('234'),
          },
          {
            routerLink: '/target-achievement/pre-sales/all-insentive-bonus-master-list',
            label: ' Incentive  Report',
            visible: hasPermission('234'),
          },
          {
            routerLink: '/target-achievement/incentive-slabs',
            label: 'Incentive Slabs',
            visible: hasPermission('234'),
          },
          {
            routerLink: '/target-achievement/incentive-slabs/all-insentive-slabs',
            label: 'Setup Incentive Slabs',
            visible: hasPermission('234'),
          },
        ],
        visible: hasPermission('366'),
      },
      setup: {
        title: 'Setup',
        icon: 'tune',
        routerLink: '/all-setupDashboard',
        visible: hasPermission('217'),
        tippy: { id: 'setup-tippy', menuId: 'setup-tippy-menu' },
      },
    };
  }
}
