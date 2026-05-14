import { Routes } from '@angular/router';
import * as pageNames from './Common/pageNames';
import { AuthGuard } from './Guard/auth.guard';
import { AllDigitalLeadsComponent } from './Modules/Facebook/Digital Lead/all-digital-leads/all-digital-leads.component';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./Common/main-dashboard-page/main-dashboard-page.component').then(m => m.MainDashboardPageComponent),
        canActivate: [AuthGuard],
        title: pageNames.DASHBOARD,
    },

    {
        path: 'login',
        loadComponent: () =>
            import('./Auth/login/login.component'),
        title: pageNames.LOGIN,
    },
    {
        path: 'all-user-login-log',
        loadComponent: () =>
            import('./Modules/Reports/Login-Log/all-user-login-log/all-user-login-log.component').then(m => m.AllUserLoginLogComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_USER_LOGIN_LOG,
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./Auth/register/register.component'),
        canActivate: [AuthGuard],
        title: pageNames.REGISTER,
    },
    {
        path: 'forgot-password',
        loadComponent: () =>
            import('./Auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: pageNames.FORGOT_PASSWORD,
    },
    {
        path: 'register-password',
        loadComponent: () =>
            import('./Auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: pageNames.RESET_PASSWORD,
    },
    {
        path: 'customer-search',
        loadComponent: () =>
            import('./Common/customer-search-log/search-customer-data/search-customer-data.component').then(m => m.SearchCustomerDataComponent),
        title: pageNames.CUSTOMER_SEARCH,
    },
    // SOP module
    {
        path: 'all-sop',
        loadComponent: () =>
            import('./Modules/Setup Files/SOP/SOP/all-soplist/all-soplist.component').then(m => m.AllSOPListComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_SOP,
    },
    {
        path: 'home-page',
        loadComponent: () =>
            import('./Common/main-dashboard-page/main-dashboard-page.component').then(m => m.MainDashboardPageComponent),
        canActivate: [AuthGuard],
        title: pageNames.HOME_PAGE,
    },
    {
        path: 'execution-history',
        loadComponent: () =>
            import('./Modules/Setup Files/SOP/SOP/sop-execution-histroy/sop-execution-histroy.component').then(m => m.SopExecutionHistroyComponent),
        canActivate: [AuthGuard],
        title: pageNames.EXECUTION_HISTORY,
    },
    {
        path: 'add-editSOP/:id',
        loadComponent: () =>
            import('./Modules/Setup Files/SOP/SOP/add-edit-sopsteps/add-edit-sopsteps.component').then(m => m.AddEditSOPStepsComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_SOP,
    },
    {
        path: 'add-editSOP',
        loadComponent: () =>
            import('./Modules/Setup Files/SOP/SOP/add-edit-sopsteps/add-edit-sopsteps.component').then(m => m.AddEditSOPStepsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_SOP,
    },
    {
        path: 'all-SOPdetails/:id',
        loadComponent: () =>
            import('./Modules/Setup Files/SOP/SOP/all-sopdetails/all-sopdetails.component').then(m => m.AllSOPDetailsComponent),
        canActivate: [AuthGuard],
        title: pageNames.SOP_DETAILS,
    },
    {
        path: 'all-viewLogs/:project_lead_id',
        loadComponent: () =>
            import('./Modules/view Logs/view-mob-email-log/view-mob-email-log.component').then(m => m.ViewMobEmailLogComponent),
        canActivate: [AuthGuard],
        title: pageNames.VIEW_LOGS,
    },

    // Team
    {
        path: 'all-teams',
        loadComponent: () =>
            import('./Modules/Setup Files/Team/all-teams/all-teams.component').then(m => m.AllTeamsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_TEAMS,
    },

    // All FeedBacks
    {
        path: 'all-feedbacks',
        loadComponent: () =>
            import('./Modules/Help Desk/All FeedBacks/allfeedback-list/allfeedback-list.component').then(m => m.AllfeedbackListComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_FEEDBACKS,
    },

    //citySubregion
    {
        path: 'all-citySubregion',
        loadComponent: () =>
            import('./Modules/Setup Files/city Subregion/city-subregion/city-subregion.component').then(m => m.CitySubregionComponent),
        canActivate: [AuthGuard],
        title: pageNames.CITY_SUBREGION,
    },
    {
        path: 'all-setupDashboard',
        loadComponent: () =>
            import('./Common/Settings Dashboard/settings-dashboard/settings-dashboard.component').then(m => m.SettingsDashboardComponent),
        canActivate: [AuthGuard],
        title: pageNames.SETUP_DASHBOARD,
    },
    {
        path: 'all-salesReportDashboard',
        loadComponent: () =>
            import('./Modules/Setup Files/Sales/Reports/salesreport/salesreport.component').then(m => m.SalesreportComponent),
        canActivate: [AuthGuard],
        title: pageNames.SALES_REPORT_DASHBOARD,
    },
    {
        path: 'salesManagement-inventory',
        loadComponent: () =>
            import('./Modules/Setup Files/Sales/Reports/inventory-chart/inventory-chart.component').then(m => m.InventoryChartComponent),
        canActivate: [AuthGuard],
        title: pageNames.INVENTORY_CHART,
    },
    {
        path: 'Pre-sales/talecaller-salesexecutive-count',
        loadComponent: () =>
            import('./Modules/Setup Files/Pre Sales/Tallecaller & Salesexecutive/talecaller-salesexecutive-count/talecaller-salesexecutive-count.component').then(m => m.TalecallerSalesexecutiveCountComponent),
        canActivate: [AuthGuard],
        title: pageNames.TALECALLER_SALESEXECUTIVE_COUNT,
    },
    // Pre Sales
    {
        path: 'salesManagement-Enquiry-DismissReport',
        loadComponent: () =>
            import('./Modules/Setup Files/Sales/Reports/discard-enquiry-report/discard-enquiry-report.component').then(m => m.DiscardEnquiryReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.ENQUIRY_DISMISS_REPORT,
    },
    {
        path: 'salesManagement-Enquiry-RevisitReport',
        loadComponent: () =>
            import('./Modules/Setup Files/Sales/Reports/all-revisit-enquiry-report/all-revisit-enquiry-report.component').then(m => m.AllRevisitEnquiryReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.ENQUIRY_REVISIT_REPORT,
    },
    {
        path: 'sales-reports/sales-enquiry-transfer-report',
        loadComponent: () =>
            import('./Modules/Setup Files/Sales/Reports/sales-enquiry-transfer-report/sales-enquiry-transfer-report.component').then(m => m.SalesEnquiryTransferReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.ENQUIRY_TRANSFER_REPORT,
    },
    {
        path: 'salesManagement-EnquiryOverviewReport',
        loadComponent: () =>
            import('./Modules/Setup Files/Sales/Reports/enquiry-summary-report/enquiry-summary-report.component').then(m => m.EnquirySummaryReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.ENQUIRY_OVERVIEW_REPORT,
    },
    {
        path: 'sales-reports/sales-site-visit-report',
        loadComponent: () =>
            import('./Modules/Setup Files/Enquiry/site-visit-report/site-visit-report.component').then(m => m.SiteVisitReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.SITE_VISIT_REPORT,
    },

    // Team
    {
        path: 'all-SOPCategory',
        loadComponent: () =>
            import('./Modules/Setup Files/SOP category/all-sopcategory/all-sopcategory.component').then(m => m.AllSOPCategoryComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_SOP_CATEGORY,
    },
    // Expense Summary
    {
        path: 'all-expenseSummary',
        loadComponent: () =>
            import('./Modules/Setup Files/Expense Summary/expense-summary/expense-summary.component').then(m => m.ExpenseSummaryComponent),
        canActivate: [AuthGuard],
        title: pageNames.EXPENSE_SUMMARY,
    },
    {
        path: 'all-summary',
        loadComponent: () =>
            import('./Modules/Setup Files/Expense Summary/summary/summary.component').then(m => m.SummaryComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_SUMMARY,
    },
    // Floor Unit
    {
        path: 'all-FloorUnits',
        loadComponent: () =>
            import('./Modules/Setup Files/Floor Unit/all-floor-units/all-floor-units.component').then(m => m.AllFloorUnitsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_FLOOR_UNITS,
    },

    // Budget
    {
        path: 'all-budget',
        loadComponent: () =>
            import('./Modules/Setup Files/Budget/all-bugets/all-bugets.component').then(m => m.AllBugetsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_BUDGET,
    },
    {
        path: 'add-budget',
        loadComponent: () =>
            import('./Modules/Setup Files/Budget/add-budget/add-budget.component').then(m => m.AddBudgetComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_BUDGET,
    },
    // Expenses
    {
        path: 'all-expenses',
        loadComponent: () =>
            import('./Modules/Setup Files/Expenses/all-expenses/all-expenses.component').then(m => m.AllExpensesComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_EXPENSES,
    },

    // Expenses
    {
        path: 'all-vendors',
        loadComponent: () =>
            import('./Modules/Setup Files/vendor/all-vendor/all-vendor.component').then(m => m.AllVendorComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_VENDORS,
    },

    // Projects
    {
        path: 'all-projects',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/all-projects/all-projects.component').then(m => m.AllProjectsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_PROJECTS,
    },
    {
        path: 'setup/all-brokerage',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/all-brokerage/all-brokerage.component').then(m => m.AllBrokerageComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_BROKERAGE,
    },

    // EDIT PROJECT
    // In app.routes.ts
    {
        path: 'setup/edit-project/:project_id', // Only one parameter
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/edit-projects/edit-projects.component').then(m => m.EditProjectComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_PROJECT,
    }
    ,
    {
        path: 'qrform/:slug',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/QRCODE/qrproject-forom/qrproject-forom.component').then(m => m.QRProjectForomComponent),
        title: pageNames.QR_FORM,
    },
    {
        path: 'add-projects',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/add-projects/add-projects.component').then(m => m.AddProjectsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_PROJECT,
    },
    {
        path: 'add-bookings',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Bookings/add-bookings/add-bookings.component').then(m => m.AddBookingsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_BOOKINGS,
    },
    {
        path: 'add-bookings/:id',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Bookings/add-bookings/add-bookings.component').then(m => m.AddBookingsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_BOOKINGS,
    },
    {
        path: 'salesManagement/bookings/cancelled-booking-log',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Bookings/cancelled-booking-log/cancelled-booking-log.component').then(m => m.CancelledBookingLogComponent),
        canActivate: [AuthGuard],
        title: pageNames.CANCELLED_BOOKING_LOG,
    },
    {
        path: 'setup/edit-booking/:slug/:booking_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Bookings/add-bookings/add-bookings.component').then(m => m.AddBookingsComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_BOOKING,
    },
    {
        path: 'setup/alltoken-bookings',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Bookings/booking-details-chart/booking-details-chart.component').then(m => m.BookingDetailsChartComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_TOKEN_BOOKINGS,
    },
    {
        path: 'siteVisitManagement-Enquiries',
        loadComponent: () =>
            import('./Modules/Setup Files/Enquiry/all-enquirys/all-enquirys.component').then(m => m.AllEnquirysComponent),
        canActivate: [AuthGuard],
        title: pageNames.ENQUIRIES,
    },
    {
        path: 'salesManagement-dailyDSRReport',
        loadComponent: () =>
            import('./Modules/Setup Files/Enquiry/all-daily-dsrreport/all-daily-dsrreport.component').then(m => m.AllDailyDSRReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.DAILY_DSR_REPORT,
    },

    {
        path: 'leadManagement-all-Re-enquiryReport',
        loadComponent: () =>
            import('./Modules/Setup Files/Enquiry/all-reenquiry-report/all-reenquiry-report.component').then(m => m.AllReenquiryReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.RE_ENQUIRY_REPORT,
    },
    {
        path: 'Pre-sales/NewCRMPreSalesTrackingReports',
        loadComponent: () =>
            import('./Modules/Setup Files/Pre Sales/Reports/followupreport/followupreport.component').then(m => m.FollowupreportComponent),
        canActivate: [AuthGuard],
        title: pageNames.PRESALES_TRACKING_REPORT,
    },
    {
        path: 'leadManagement/leadCallLogs',
        loadComponent: () =>
            import('./Modules/Setup Files/Pre Sales/Reports/allclient-call-logs/allclient-call-logs.component').then(m => m.AllclientCallLogsComponent),
        canActivate: [AuthGuard],
        title: pageNames.LEAD_CALL_LOGS,
    },

    {
        path: 'sales-enquiry-AllFollowUps',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/Leads/project-lead-follow-ups/project-lead-follow-ups.component').then(
                (m) => m.ProjectLeadFollowUpsComponent
            ),
        data: { followUpType: 'enquiry' },
        canActivate: [AuthGuard],
        title: pageNames.ALL_FOLLOW_UPS,
    },
    {
        path: 'setup/add-project-enquiry', // Use lowercase and hyphens for consistency
        loadComponent: () =>
            import('./Modules/Setup Files/Enquiry/add-enquiry/add-enquiry.component').then(m => m.AddEnquiryComponent),
        canActivate: [AuthGuard], // Ensure AuthGuard is properly imported and implemented
        title: pageNames.ADD_ENQUIRY,
    },

    {
        path: 'setup/edit-enquiry/:slug/:project_enq_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Enquiry/add-enquiry/add-enquiry.component').then(m => m.AddEnquiryComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_ENQUIRY,
    },

    // loader
    {
        path: 'loader',
        loadComponent: () =>
            import('./Common/laoder/loader/loader.component').then(m => m.LoaderComponent),
        canActivate: [AuthGuard],
        title: pageNames.LOADER,
    },

    // Delete Logs
    {
        path: 'delete-logs',
        loadComponent: () =>
            import('./Common/Delete Log/delete-log/delete-log.component').then(m => m.DeleteLogComponent),
        canActivate: [AuthGuard],
        title: pageNames.DELETE_LOGS,
    },
    // Preferrd Location
    {
        path: 'all-preferred-location',
        loadComponent: () =>
            import('./Modules/Setup Files/Preferred Location/preferredlocation/preferredlocation.component').then(m => m.PreferredlocationComponent),
        canActivate: [AuthGuard],
        title: pageNames.PREFERRED_LOCATION,
    },
    // Preferrd Bank
    {
        path: 'all-preferred-bank',
        loadComponent: () =>
            import('./Modules/Setup Files/Bank/all-banks/all-banks.component').then(m => m.AllBanksComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_BANKS,
    },

    // Channel Partner
    {
        path: 'all-channelpartner',
        loadComponent: () =>
            import('./Modules/Setup Files/Channel Partner/all-channel-partner/all-channel-partner.component').then(m => m.AllChannelPartnerComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_CHANNEL_PARTNER,
    },
    {
        path: 'single-cp-all-data/:slug/:channel_partner_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Channel Partner/single-cp-all-data/single-cp-all-data.component').then(m => m.SingleCPAllDataComponent),
        canActivate: [AuthGuard],
        title: pageNames.SINGLE_CP_ALL_DATA,
    },
    {
        path: 'CP-management/brokerage-offer',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/all-brokerage/Brokeage Offer/brokerage-offer/brokerage-offer.component').then(m => m.BrokerageOfferComponent),
        canActivate: [AuthGuard],
        title: pageNames.BROKERAGE_OFFER,
    },


    {
        path: 'all-channelpartner-deals',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/Deal Value/all-deal-values/all-deal-values.component').then(m => m.AllDealValuesComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_DEALS,
    },
    // FaceBook Setup
    {
        path: 'metaSetup/all-digital-Facebook/list',
        loadComponent: () =>
            import('./Modules/Facebook/Facebook Setup/all-face-book-list/all-face-book-list.component').then(m => m.AllFaceBookListComponent),
        canActivate: [AuthGuard],
        title: pageNames.FACEBOOK_LIST,
    },
    {
        path: 'metaSetup/all-digital-Facebook/budget',
        loadComponent: () =>
            import('./Modules/Facebook/Digital Facebook/Facebook Budget/digital-all-facebook-budget').then(m => m.DigitalAllFacebookBudgetComponent),
        canActivate: [AuthGuard],
        title: pageNames.DIGITAL_ALL_FACEBOOK_BUDGET,
    },
    {
        path: 'metaSetup/all-digital-leads/list',
        loadComponent: () =>
            import('./features/digital-leads/pages/all-digital-leads/all-digital-leads.component').then(m => m.AllDigitalLeadsComponent),
        canActivate: [AuthGuard],
        title: pageNames.DIGITAL_LEADS,
    },
    // FaceBook Setup
    {
        path: 'setup/all-booking-offers',
        loadComponent: () =>
            import('./Modules/Setup Files/Booking Offers/all-booking-offers/all-booking-offers.component').then(m => m.AllBookingOffersComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_BOOKING_OFFERS,
    },
    {
        path: 'whatsapp/all-whatsapp-message-log',
        loadComponent: () =>
            import('./Modules/WhatsApp/all-whatsapp-message-log/all-whatsapp-message-log.component').then(m => m.AllWhatsappMessageLogComponent),
        canActivate: [AuthGuard],
        title: pageNames.WHATSAPP_MESSAGE_LOGS,
    },
    // Channel Partner meetings
    {
        path: 'module/channel-partners-meeting',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/all-channel-partner-meeting/all-channel-partner-meeting.component').then(m => m.AllChannelPartnerMeetingComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_MEETINGS,
    },
    // {
    //     path: 'module/channel-partners/cp-executive-follow-up-report',
    //     loadComponent: () =>
    //         import('./Modules/Channel Partner Meetings/cp-report/cp-executive-follow-up-report/cp-executive-follow-up-report.component').then(m => m.CpExecutiveFollowUpReport),
    //     canActivate: [AuthGuard],
    //     title: pageNames.CP_EXECUTIVE_FOLLOW_UP_REPORT,
    // },
    {
        path: 'channel-partner/reports/cp-executive-follow-up-report',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/cp-report/cp-executive-follow-up-report/cp-executive-follow-up-report').then(m => m.CpExecutiveFollowUpReport),
        canActivate: [AuthGuard],
        title: pageNames.CP_EXECUTIVE_FOLLOW_UP_REPORT,
    },
    {
        path: 'channel-partner/reports/event-attendance-report',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/cp-report/event-attendance-report/event-attendance-report.component').then(m => m.EventAttendanceReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.EVENT_ATTENDANCE_REPORT,
    },
    {
        path: 'channel-partner/reports/CPTarget',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/cp-report/cp-targets/cp-targets.component').then(m => m.CpTargetsComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_TARGET,
    },
    {
        path: 'channel-partner/reports/cpSiteVisitReport',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/cp-report/cp-site-visit-report/cp-site-visit-report.component').then(m => m.CpSiteVisitReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_SITE_VISIT_REPORT,
    },
    {
        path: 'module/channel-partners-bookingList/:booking_id',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/all-bills/all-bills.component').then(m => m.AllBillsComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_BOOKING_LIST,
    },
    {
        path: 'setup/add-channel-partner',
        loadComponent: () =>
            import('./Modules/Setup Files/Channel Partner/add-channel-partner/add-channel-partner.component').then(m => m.AddChannelPartnerComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_CHANNEL_PARTNER,
    },
    {
        path: 'setup/edit-channel-partner/:slug/:channel_partner_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Channel Partner/add-channel-partner/add-channel-partner.component').then(m => m.AddChannelPartnerComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_CHANNEL_PARTNER,
    },



    // CP executives
    {
        path: 'all-CPExecutives',
        loadComponent: () =>
            import('./Modules/Setup Files/USERS/all-users/all-users.component').then(m => m.AllUsersComponent),
        canActivate: [AuthGuard],
        data: { listType: 'cp-executives' },
        title: pageNames.ALL_CP_EXECUTIVES,
    },

    // CP Levels
    {
        path: 'all-CPLevels',
        loadComponent: () =>
            import('./Modules/Setup Files/CP level/all-cplevels/all-cplevels.component').then(m => m.AllCPLevelsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_CP_LEVELS,
    },
    // CP Owner
    {
        path: 'all-CPOwner',
        loadComponent: () =>
            import('./Modules/Setup Files/USERS/all-users/all-users.component').then(m => m.AllUsersComponent),
        canActivate: [AuthGuard],
        data: { listType: 'cp-owners' },
        title: pageNames.ALL_CP_OWNERS,
    },
    // CP Owner
    {
        path: 'post-sales/account-setup-master',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Project Bank Master/all-project-bank-master/all-project-bank-master.component').then(m => m.AllProjectBankMasterComponent),
        canActivate: [AuthGuard],
        title: pageNames.ACCOUNT_SETUP_MASTER,
    },


    /// permission


    {
        path: 'module',
        loadComponent: () =>
            import('./Permissions/Module/fetch-module/fetch-module.component').then(m => m.FetchModuleComponent),
        canActivate: [AuthGuard],
        title: pageNames.MODULE,
    },
    {
        path: 'roles',
        loadComponent: () =>
            import('./Permissions/Roles/fetch-roles/fetch-roles.component').then(m => m.FetchRolesComponent),
        canActivate: [AuthGuard],
        title: pageNames.ROLES,
    },
    {
        path: 'add-role',
        loadComponent: () =>
            import('./Permissions/Roles/add-roles/add-roles.component').then(m => m.AddRolesComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_ROLE,
    },
    {
        path: 'permission',
        loadComponent: () =>
            import('./Permissions/Permission/fetch-permission/fetch-permission.component').then(m => m.FetchPermissionComponent),
        canActivate: [AuthGuard],
        title: pageNames.PERMISSION,
    },
    {
        path: 'add-permission',
        loadComponent: () =>
            import('./Permissions/Permission/add-permission/add-permission.component').then(m => m.AddPermissionComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_PERMISSION,
    },
    {
        path: 'edit-permission/:id',
        loadComponent: () =>
            import('./Permissions/Permission/edit-permission/edit-permission.component').then(m => m.EditPermissionComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_PERMISSION,
    },
    {
        path: 'user-role',
        loadComponent: () =>
            import('./Permissions/User Roles/fetch-user-role/fetch-user-role.component').then(m => m.FetchUserRoleComponent),
        canActivate: [AuthGuard],
        title: pageNames.USER_ROLE,
    },
    {
        path: 'role-permission',
        loadComponent: () =>
            import('./Permissions/Role Permissions/fetch-role-permissions/fetch-role-permissions.component').then(m => m.FetchRolePermissionsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ROLE_PERMISSION,
    },
    {
        path: 'add-role-permission',
        loadComponent: () =>
            import('./Permissions/Role Permissions/add-role-permissions/add-role-permissions.component').then(m => m.AddRolePermissionsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_ROLE_PERMISSION,
    },
    {
        path: 'edit-role-permission/:id',
        loadComponent: () =>
            import('./Permissions/Role Permissions/edit-role-permissions/edit-role-permissions.component').then(m => m.EditRolePermissionsComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_ROLE_PERMISSION,
    },
    {
        path: 'portal-login-password',
        loadComponent: () =>
            import('./Auth/user-forgot-password/user-forgot-password.component').then(m => m.UserForgotPasswordComponent),
        title: pageNames.PORTAL_LOGIN_PASSWORD,
    },
    {
        path: 'register-password',
        loadComponent: () =>
            import('./Auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: pageNames.RESET_PASSWORD,
    },


    /// Courses
    {
        path: 'setup/courses',
        loadComponent: () =>
            import('./Modules/Setup Files/Courses/allcourses/allcourses.component').then(m => m.AllcoursesComponent),
        canActivate: [AuthGuard],
        title: pageNames.COURSES,
    },
    {
        path: 'lmsdashboard',
        loadComponent: () =>
            import('./Modules/Setup Files/Courses/lmsdashboard/lmsdashboard.component').then(m => m.LMSDashboardComponent),
        canActivate: [AuthGuard],
        title: pageNames.LMS_DASHBOARD,
    },
    {
        path: 'setup/course-user-report',
        loadComponent: () =>
            import('./Modules/Setup Files/Courses/Reports/course-use-rs-report/course-use-rs-report').then(m => m.CourseUseRsReport),
        canActivate: [AuthGuard],
        title: pageNames.COURSE_USE_RS_REPORT,
    },
    /// Sections
    {
        path: 'setup/sections/:slug/:course_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Courses/Sections/all-sections/all-sections.component').then(m => m.AllSectionsComponent),
        canActivate: [AuthGuard],
        title: pageNames.SECTIONS,
    },
    /// Sections
    {
        path: 'setup/lectures/:slug/:section_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Courses/lectures/all-lectures/all-lectures.component').then(m => m.AllLecturesComponent),
        canActivate: [AuthGuard],
        title: pageNames.LECTURES,
    },
    /// Leaderboard
    {
        path: 'setup/leaderboard',
        loadComponent: () =>
            import('./Modules/Setup Files/Leaderboard/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
        canActivate: [AuthGuard],
        title: pageNames.LEADERBOARD,
    },

    /// site Visits
    {
        path: 'setup/site-visits',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/all-site-visite/all-site-visite.component').then(m => m.AllSiteVisiteComponent),
        canActivate: [AuthGuard],
        title: pageNames.SITE_VISITS,
    },

    /// site Visits
    {
        path: 'salesManagement/site-bookings',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Bookings/all-bookings/all-bookings.component').then(m => m.AllBookingsComponent),
        canActivate: [AuthGuard],
        title: pageNames.SITE_BOOKINGS,
    },
    {
        path: 'sales/bookings/booking-approval-log',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Bookings/booking-approval-log/booking-approval-log').then(m => m.BookingApprovalLog),
        canActivate: [AuthGuard],
        title: pageNames.BOOKING_APPROVAL_LOG,
    },
    {
        path: 'salesManagement/bookings/booking-approval-log',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Bookings/booking-approval-log/booking-approval-log').then(m => m.BookingApprovalLog),
        canActivate: [AuthGuard],
        title: pageNames.BOOKING_APPROVAL_LOG,
    },
    {
        path: 'sales/bookings/edit-booking/:booking_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Bookings/edit-booking-page/edit-booking-page.component').then(m => m.EditBookingPageComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_BOOKING,
    },
    /// Reports
    {
        path: 'setup/whatsapp-messageLogs',
        loadComponent: () =>
            import('./Modules/Setup Files/Reports/whatsapp-message-logs/whatsapp-message-logs.component').then(m => m.WhatsappMessageLogsComponent),
        canActivate: [AuthGuard],
        title: pageNames.WHATSAPP_MESSAGE_LOGS,
    },
    /// usera
    {
        path: 'setup/all-users',
        loadComponent: () =>
            import('./Modules/Setup Files/USERS/all-users/all-users.component').then(m => m.AllUsersComponent),
        canActivate: [AuthGuard],
        data: { listType: 'users' },
        title: pageNames.ALL_USERS,
    },
    {
        path: 'setup/add-User',
        loadComponent: () =>
            import('./Modules/Setup Files/USERS/add-user/add-user.component').then(m => m.AddUserComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_USER,
    },
    {
        path: 'setup/edit-user/:slug/:user_id',
        loadComponent: () =>
            import('./Modules/Setup Files/USERS/add-user/add-user.component').then(m => m.AddUserComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_USER,
    },

    /// Permission Module
    // {
    //   path: 'setup/all-modules',
    //   component: AllmodulesComponent,
    //   canActivate: [AuthGuard],
    // },
    // {
    //   path: 'setup/all-permissions',
    //   component: AllPermissionsComponent,
    //   canActivate: [AuthGuard],
    // },
    // {
    //   path: 'setup/all-rolepermissions',
    //   component: AllRolePermissionsComponent,
    //   canActivate: [AuthGuard],
    // },
    /// site Tokens
    {
        path: 'setup/sales-tokens',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/all-tokens/all-tokens.component').then(m => m.AllTokensComponent),
        canActivate: [AuthGuard],
        title: pageNames.SALES_TOKENS,
    },
    {
        path: 'all-tokentypes',
        loadComponent: () =>
            import('./Modules/Setup Files/Token Type/all-token-types/all-token-types.component').then(m => m.AllTokenTypesComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_TOKEN_TYPES,
    },
    {
        path: 'setup/add-token',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/add-tokens/add-tokens.component').then(m => m.AddTokensComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_TOKEN,
    },
    {
        path: 'setup/tokens-allcancelled-tokens',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/all-cancelled-tokens/all-cancelled-tokens.component').then(m => m.AllCancelledTokensComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_CANCELLED_TOKENS,
    },
    {
        path: 'setup/tokens-upgradeToken',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/add-tokens/add-tokens.component').then(m => m.AddTokensComponent),
        canActivate: [AuthGuard],
        title: pageNames.UPGRADE_TOKEN,
    },
    {
        path: 'setup/add-tokenPayments/:token_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/Token Payment/add-token-payment/add-token-payment.component').then(m => m.AddTokenPaymentComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_TOKEN_PAYMENTS,
    },
    {
        path: 'setup/upgrade-token/:token_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/upgreade-token/upgreade-token.component').then(m => m.UpgreadeTokenComponent),
        canActivate: [AuthGuard],
        title: pageNames.UPGRADE_TOKEN,
    },
    {
        path: 'setup/transfer-token/:token_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/transfer-token/transfer-token.component').then(m => m.TransferTokenComponent),
        canActivate: [AuthGuard],
        title: pageNames.TRANSFER_TOKEN,
    },
    {
        path: 'setup/tokens/pay-token-manually/:token_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/pay-token-manually/pay-token-manually.component').then(m => m.PayTokenManuallyComponent),
        canActivate: [AuthGuard],
        title: pageNames.PAY_TOKEN_MANUALLY,
    },
    {
        path: 'setup/all-tokenPayments/:token_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/Token Payment/all-token-payments/all-token-payments.component').then(m => m.AllTokenPaymentsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_TOKEN_PAYMENTS,
    },
    {
        path: 'setup/edit-token/:slug/:token_id',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/add-tokens/add-tokens.component').then(m => m.AddTokensComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_TOKEN,
    },
    //Post sales --  Unit Banker

    {
        path: 'siteVisitManagement/projectWise-QR',
        loadComponent: () =>
            import('./Modules/Setup Files/Enquiry/executive-project-qr/executive-project-qr.component').then(m => m.ExecutiveProjectQRComponent),
        canActivate: [AuthGuard],
        title: pageNames.PROJECTWISE_QR,
    },
    //CP-bill-Approved

    {
        path: 'sales/cp-site-visits/cp-bill-approved',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/CP Bill Approved/cp-bill-approved-list/cp-bill-approved-list.component').then(m => m.CpBillApprovedListComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_BILL_APPROVED,
    },
    {
        path: 'settings/dashboard/cp-booking-bill-workflow',
        loadComponent: () =>
            import('./Modules/Setup Files/Channel Partner/cp-booking-bill-work-flow/cp-booking-bill-work-flow.component').then(m => m.CpBookingBillWorkFlowComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_BOOKING_BILL_WORKFLOW,
    },
    //CP-bill-Approved

    {
        path: 'sales/cp-site-visits/cp-payout',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Bookings/CP Payout/all-cppayout/all-cppayout.component').then(m => m.AllCPPayoutComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_PAYOUT,
    },
    {
        path: 'module/channel-partners-meeting',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/all-channel-partner-meeting/all-channel-partner-meeting.component').then(m => m.AllChannelPartnerMeetingComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_MEETINGS,
    },
    {
        path: 'channel-partner/reports/CPReport',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/cp-report/cp-report.component').then(m => m.CpReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_REPORT,
    },
    {
        path: 'channel-partner/reports/event-attendance-report',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/cp-report/event-attendance-report/event-attendance-report.component').then(m => m.EventAttendanceReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.EVENT_ATTENDANCE_REPORT,
    },
    {
        path: 'channel-partner/reports/CPTarget',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/cp-report/cp-targets/cp-targets.component').then(m => m.CpTargetsComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_TARGET,
    },
    {
        path: 'channel-partner/reports/cpSiteVisitReport',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/cp-report/cp-site-visit-report/cp-site-visit-report.component').then(m => m.CpSiteVisitReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_SITE_VISIT_REPORT,
    },
    {
        path: 'module/channel-partners-bookingList/:booking_id',
        loadComponent: () =>
            import('./Modules/Channel Partner Meetings/all-bills/all-bills.component').then(m => m.AllBillsComponent),
        canActivate: [AuthGuard],
        title: pageNames.CP_BOOKING_LIST,
    },
    //Pre sales --  Reports


    {
        path: 'Pre-sales/NewCRMPreSalesFollowupReports',
        loadComponent: () =>
            import('./Modules/Setup Files/Pre Sales/Reports/followupreport/followupreport.component').then(m => m.FollowupreportComponent),
        canActivate: [AuthGuard],
        title: pageNames.PRESALES_FOLLOWUP_REPORT,
    },
    {
        path: 'after-sales/leads-transfer-report',
        loadComponent: () =>
            import('./Modules/Setup Files/Pre Sales/Reports/lead-transfer-report/lead-transfer-report.component').then(m => m.LeadTransferReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.LEAD_TRANSFER_REPORT,
    },
    {
        path: 'after-sales/MSEBDetailsReport',
        loadComponent: () =>
            import('./features/reports/pages/msebdetails-report/msebdetails-report.component').then(m => m.MSEBDetailsReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.MSEB_DETAILS_REPORT,
    },
    {
        path: 'after-sales/property-tax-report',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Post Sales Report/property-tax-report/property-tax-report.component').then(m => m.PropertyTaxReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.PROPERTY_TAX_REPORT,
    },
    {
        path: 'after-sales/mis-report',
        loadComponent: () =>
            import('./features/reports/pages/mis-report/mis-report.component').then(m => m.MisReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.MIS_REPORT,
    },
    {
        path: 'after-sales/ledget-report',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Post Sales Report/ledget-report/ledget-report.component').then(m => m.LedgetReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.LEDGET_REPORT,
    },
    {
        path: 'after-sales/recovery-report-account',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Post Sales Report/recovery-report-account/recovery-report-account')
                .then(m => m.RecoveryReportAccount),
        canActivate: [AuthGuard],
        title: pageNames.RECOVERY_REPORT_ACCOUNT,
    },
    {
        path: 'after-sales/deleted-receipts-log',
        loadComponent: () =>
            import('./features/reports/pages/deleted-receipts-log/deleted-receipts-log').then(m => m.DeletedReceiptsLog),
        canActivate: [AuthGuard],
        title: pageNames.DELETED_RECEIPTS_LOG,
    },
    {
        path: 'after-sales/consolidated-collection-report',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Post Sales Report/consolidated-collection-report/consolidated-collection-report.component').then(m => m.ConsolidatedCollectionReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.CONSOLIDATED_COLLECTION_REPORT,
    },
    {
        path: 'after-sales/receipt-report',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Post Sales Report/receipt-report/receipt-report.component').then(m => m.ReceiptReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.RECEIPT_REPORT,
    },
    {
        path: 'after-sales/agreement-report',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Post Sales Report/agreement-report/agreement-report.component').then(m => m.AgreementReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.AGREEMENT_REPORT,
    },
    {
        path: 'after-sales/stages-payment-report',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Post Sales Report/stages-payment-report/stages-payment-report.component').then(m => m.StagesPaymentReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.STAGES_PAYMENT_REPORT,
    },
    {
        path: 'salesManagement/allEnquiryTrackingReport',
        loadComponent: () =>
            import('./Modules/Setup Files/Pre Sales/Reports/enquiry-report/enquiry-report.component').then(m => m.EnquiryReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.ENQUIRY_TRACKING_REPORT,
    },
    {
        path: 'salesManagement/allQuatationLog',
        loadComponent: () =>
            import('./Modules/Setup Files/Pre Sales/Reports/enquiry-report/all-quatation-log/all-quatation-log.component').then(m => m.AllQuatationLogComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_QUATATION_LOG,
    },
    // {
    //   path: 'leadManagement-all-dismissLeadReport',
    //   loadComponent: () =>
    //     import('./Modules/Setup Files/Pre Sales/Reports/discard-leads-report/discard-leads-report.component').then(m => m.DiscardLeadsReportComponent),
    //   canActivate: [AuthGuard],
    //   title: pageNames.DISMISS_LEAD_REPORT,
    // },
    {
        path: 'leadManagement-all-AllDissmissLeadsReport',
        loadComponent: () =>
            import('./Modules/Setup Files/Pre Sales/Reports/all-dissmiss-leads-report/all-dissmiss-leads-report.component').then(m => m.AllDissmissLeadsReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.DISMISS_LEAD_REPORT,
    },
    {
        path: 'leadManagement-all-DigitalHoardingLeadsReport',
        loadComponent: () =>
            import('./Modules/Setup Files/Pre Sales/Reports/digital-hoarding-leads-report/digital-hoarding-leads-report.component').then(m => m.DigitalHoardingLeadsReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.DIGITAL_HOARDING_LEADS_REPORT,
    },
    //Post sales --  Demand Generation

    {
        path: 'post-sales/demand-dashboard-estimantion-payments',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Demand/estimantion-payment-schedule/estimantion-payment-schedule.component').then(m => m.EstimantionPaymentScheduleComponent),
        canActivate: [AuthGuard],
        title: pageNames.ESTIMATION_PAYMENTS,
    },
    {
        path: 'after-sales/Installment-modifyStages',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Demand/Demand Dashboard/Payment Schedule/update-stages-list/update-stages-list.component').then(m => m.UpdateStagesListComponent),
        canActivate: [AuthGuard],
        title: pageNames.INSTALLMENT_MODIFY_STAGES,
    },
    {
        path: 'post-sales/demand-DemandStageConfig',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Demand/Demand Dashboard/Unit payment Schedule Config/unit-payment-schedule-config/unit-payment-schedule-config.component').then(m => m.UnitPaymentScheduleConfigComponent),
        canActivate: [AuthGuard],
        title: pageNames.DEMAND_STAGE_CONFIG,
    },

    //Post sales --  Recovery
    {
        path: 'after-sales/installment-installment-generation',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Demand/Demand Dashboard/Demand Generation/all-demand-generated-list/all-demand-generated-list.component').then(m => m.AllDemandGeneratedListComponent),
        canActivate: [AuthGuard],
        title: pageNames.INSTALLMENT_GENERATION,
    },
    //Post sales --  Letter Generation
    {
        path: 'after-sales/document-generation',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Letter Generation/all-letter-generated-list/all-letter-generated-list.component').then(m => m.AllLetterGeneratedListComponent),
        canActivate: [AuthGuard],
        title: pageNames.DOCUMENT_GENERATION,
    },
    //Sales Config --  Project
    {
        path: 'postsales-config/TemplateManagement',
        loadComponent: () =>
            import('./Modules/Setup Files/Sales Config/letter config/all-letter-config-list/all-letter-config-list.component').then(m => m.AllLetterConfigListComponent),
        canActivate: [AuthGuard],
        title: pageNames.TEMPLATE_MANAGEMENT,
    },


    {
        path: 'after-sales/paymentCollection-paymentCollectionList',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Recovery/collection-list/collection-list.component').then(m => m.CollectionListComponent),
        canActivate: [AuthGuard],
        title: pageNames.PAYMENT_COLLECTION_LIST,
    },
    {
        path: 'after-sales/paymentCollection-updateClientData',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Recovery/update-customer-info/update-customer-info.component').then(m => m.UpdateCustomerInfoComponent),
        canActivate: [AuthGuard],
        title: pageNames.UPDATE_CLIENT_DATA,
    },
    {
        path: 'after-sales/paymentCollection-AgreementRecords',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Recovery/all-agreement-details/all-agreement-detials-list/all-agreement-detials-list.component').then(m => m.AllAgreementDetialsListComponent),
        canActivate: [AuthGuard],
        title: pageNames.AGREEMENT_RECORDS,
    },
    {
        path: 'after-sales/paymentCollection-AgreementInprogress',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Recovery/Pending agreement list/all-pending-agrement-list/all-pending-agrement-list.component').then(m => m.AllPendingAgrementListComponent),
        canActivate: [AuthGuard],
        title: pageNames.AGREEMENT_IN_PROGRESS,
    },

    {
        path: 'customer/:slug',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Recovery/Pending agreement list/applicant-details-link-form/applicant-details-link-form.component').then(m => m.ApplicantDetailsLinkFormComponent),
        title: pageNames.CUSTOMER_DETAILS,
    },
    {
        path: 'after-sales/paymentCollection-receipts',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Recovery/Recipts/receipts.component').then(m => m.ReceiptsComponent),
        canActivate: [AuthGuard],
        title: pageNames.RECEIPTS,
    },



    //Post sales --  Unit Banker
    {
        path: 'setup/add-unit-banker',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/unit-banker/addunit-banker/addunit-banker.component').then(m => m.AddunitBankerComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_UNIT_BANKER,
    },
    {
        path: 'setup/unit-banker/:id',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/unit-banker/addunit-banker/addunit-banker.component').then(m => m.AddunitBankerComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_UNIT_BANKER,
    },
    {
        path: 'after-sales-DocumentUploadManagements',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/Attachment Upload/all-uploaded-attachment/all-uploaded-attachment.component').then(m => m.AllUploadedAttachmentComponent),
        canActivate: [AuthGuard],
        title: pageNames.DOCUMENT_UPLOAD_MANAGEMENT,
    },
    {
        path: 'post-sales/unitAssignedBank',
        loadComponent: () =>
            import('./Modules/Setup Files/Post Sales/unit-banker/all-unit-banker-list/all-unit-banker-list.component').then(m => m.AllUnitBankerListComponent),
        canActivate: [AuthGuard],
        title: pageNames.UNIT_ASSIGNED_BANK,
    },
    //Post sales --  AddDemandGenerationComponentr


    //Pre Sales
    {
        path: 'leadManagement-all-projectleads',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/Leads/claimed-leads/claimed-leads.component').then(m => m.ClaimedLeadsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_PROJECT_LEADS,
    },

    {
        path: 'all-leadsTrackings',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/Leads/project-lead-follow-ups/project-lead-follow-ups.component').then(m => m.ProjectLeadFollowUpsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_LEADS_TRACKING,
    },
    {
        path: 'leadManagement-all-preSalesReport',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/Leads/pre-sales-report/pre-sales-report.component').then(m => m.PreSalesReportComponent),
        canActivate: [AuthGuard],
        title: pageNames.PRESALES_REPORT,
    },
    {
        path: 'leadManagement-all-dismissLeads',
        loadComponent: () =>
            import('./Modules/Setup Files/Projects/Leads/Discard Leads/discard-leads/discard-leads.component').then(m => m.DiscardLeadsComponent),
        canActivate: [AuthGuard],
        title: pageNames.DISMISS_LEADS,
    },
    {
        path: 'SalesManagement-DismissEnquiries',
        loadComponent: () =>
            import('./Modules/Setup Files/Enquiry/discard-site-visits/discard-site-visits.component').then(m => m.DiscardSiteVisitsComponent),
        canActivate: [AuthGuard],
        title: pageNames.DISMISS_ENQUIRIES,
    },

    //Events
    {
        path: 'events/all-events',
        loadComponent: () =>
            import('./Modules/Setup Files/Events/fetch-upcoming-events/fetch-upcoming-events.component').then(m => m.FetchUpcomingEventsComponent),
        canActivate: [AuthGuard],
        title: pageNames.EVENT,
    },
    {
        path: 'events/event-registration/:id',
        loadComponent: () =>
            import('./Modules/Setup Files/Events/add-new-event-user/add-new-event-user.component').then(m => m.AddNewEventUserComponent),
        title: pageNames.ADD_NEW_EVENT_USER,
    },
    {
        path: 'events/event-registration/:id/:slug',
        loadComponent: () =>
            import('./Modules/Setup Files/Events/add-new-event-user/add-new-event-user.component').then(m => m.AddNewEventUserComponent),
        title: pageNames.ADD_NEW_EVENT_USER,
    },
    {
        path: 'events/qrattendence-scanner',
        loadComponent: () =>
            import('./Modules/Setup Files/Events/qrattendence-scanner/qrattendence-scanner.component').then(m => m.QRAttendenceScannerComponent),
        title: pageNames.QR_ATTENDENCE_SCANNER,
    },
    {
        path: 'events/all-events-user-log',
        loadComponent: () =>
            import('./Modules/Setup Files/Events/Events-log/all-events-user-log/all-events-user-log.component').then(m => m.AllEventsUserLogComponent),
        title: pageNames.ALL_EVENTS_USER_LOG,
    },

    // Dravyam Setup
    {
        path: 'setup/all-floor',
        loadComponent: () =>
            import('./Modules/Floor Rise/all-floor/all-floor.component').then(m => m.AllFloorComponent),
        title: pageNames.ALL_FLOOR,
    },
    // Dravyam Setup

    {
        path: 'setup/sources',
        loadComponent: () =>
            import('./Modules/Setup Files/sources/all-sources/all-sources.component').then(m => m.AllSourcesComponent),
        canActivate: [AuthGuard],
        title: pageNames.SOURCES,
    },

    // Dravyam Setup

    {
        path: 'setup/lead_level',
        loadComponent: () =>
            import('./Modules/Setup Files/city Subregion/city-subregion/city-subregion.component').then(m => m.CitySubregionComponent),
        canActivate: [AuthGuard],
        title: pageNames.LEAD_LEVEL,
    },
    // sales Executive


    {
        path: 'credential',
        loadComponent: () =>
            import('./Modules/Setup Files/Credential Password/fetch-credential-password/fetch-credential-password.component').then(m => m.FetchCredentialPasswordComponent),
        canActivate: [AuthGuard],
        title: pageNames.CREDENTIAL,
    },

    {
        path: 'add-credential',
        loadComponent: () =>
            import('./Modules/Setup Files/Credential Password/add-credential-password/add-credential-password.component').then(m => m.AddCredentialPasswordComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_CREDENTIAL,
    },
    {
        path: 'edit-credential/:id',
        loadComponent: () =>
            import('./Modules/Setup Files/Credential Password/edit-credential-password/edit-credential-password.component').then(m => m.EditCredentialPasswordComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_CREDENTIAL,
    },
    //Parking 
    {
        path: 'all-parking-units',
        loadComponent: () =>
            import('./Modules/Setup Files/Parking Module/all-parking-unit-list/all-parking-unit-list.component').then(m => m.AllParkingUnitListComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_PARKING_UNITS,
    },
    {
        path: 'parking-inventory-chart',
        loadComponent: () =>
            import('./Modules/Setup Files/Parking Module/parking-inventory-chart/parking-inventory-chart.component').then(m => m.ParkingInventoryChartComponent),
        canActivate: [AuthGuard],
        title: pageNames.PARKING_INVENTORY_CHART,
    },
    /// HRMS
    {
        path: 'hrms',
        loadComponent: () =>
            import('./Modules/HRMS/hrms-module/hrms-module.component').then(m => m.HrmsModuleComponent),
        canActivate: [AuthGuard],
        title: pageNames.HRMS,
    },
    {
        path: 'employee-list',
        loadComponent: () =>
            import('./Modules/HRMS/Employee Tab/employee-module/employee-module.component').then(m => m.EmployeeModuleComponent),
        canActivate: [AuthGuard],
        title: pageNames.EMPLOYEE_LIST,
    },
    {
        path: 'add-employee',
        loadComponent: () =>
            import('./Modules/HRMS/Employee Tab/add-employee/add-employee.component').then(m => m.AddEmployeeComponent),
        canActivate: [AuthGuard],
        title: pageNames.ADD_EMPLOYEE,
    },
    {
        path: 'edit-employee/:id',
        loadComponent: () =>
            import('./Modules/HRMS/Employee Tab/edit-employee/edit-employee.component').then(m => m.EditEmployeeComponent),
        canActivate: [AuthGuard],
        title: pageNames.EDIT_EMPLOYEE,
    },
    // { path: 'edit-Profile/:id',  component: EditProfileComponent,  canActivate: [AuthGuard]  },
    {
        path: 'attendance-list',
        loadComponent: () =>
            import('./Modules/HRMS/Attendance Tab/fetch-attendance/fetch-attendance.component').then(m => m.FetchAttendanceComponent),
        canActivate: [AuthGuard],
        title: pageNames.ATTENDANCE_LIST,
    },
    {
        path: 'leaves-module',
        loadComponent: () =>
            import('./Modules/HRMS/Leaves Tab/leave-module/leave-module.component').then(m => m.LeaveModuleComponent),
        canActivate: [AuthGuard],
        title: pageNames.LEAVES_MODULE,
    },
    {
        path: 'leaves-list',
        loadComponent: () =>
            import('./Modules/HRMS/Leaves Tab/view Leave/fetch-leaves/fetch-leaves.component').then(m => m.FetchLeavesComponent),
        canActivate: [AuthGuard],
        title: pageNames.LEAVES_LIST,
    },
    {
        path: 'holiday-list',
        loadComponent: () =>
            import('./Modules/HRMS/Leaves Tab/Holiday Leaves/holiday-leaves/holiday-leaves.component').then(m => m.HolidayLeavesComponent),
        canActivate: [AuthGuard],
        title: pageNames.HOLIDAY_LIST,
    },
    {
        path: 'leave-credit-view',
        loadComponent: () =>
            import('./Modules/HRMS/Leaves Tab/Credit/leave-credit/leave-credit.component').then(m => m.LeaveCreditComponent),
        canActivate: [AuthGuard],
        title: pageNames.LEAVE_CREDIT_VIEW,
    },
    {
        path: 'performance-list',
        loadComponent: () =>
            import('./Modules/HRMS/Performance Tab/performance-list/performance-list.component').then(m => m.PerformanceListComponent),
        canActivate: [AuthGuard],
        title: pageNames.PERFORMANCE_LIST,
    },
    {
        path: 'sales-dashboard',
        loadComponent: () =>
            import('./Modules/Dashboard/sales/sales.component').then(m => m.SalesComponent),
        canActivate: [AuthGuard],
        title: pageNames.SALES_DASHBOARD,
    },
    {
        path: 'sales-pie-chart',
        loadComponent: () =>
            import('./Modules/Dashboard/sales/pie-charts/pie-charts.component').then(m => m.PieChartsComponent),
        canActivate: [AuthGuard],
        title: pageNames.SALES_PIE_CHART,
    },
    {
        path: 'permission-access',
        loadComponent: () =>
            import('./Permissions/permission-access/permission-access.component').then(m => m.PermissionAccessComponent),
        canActivate: [AuthGuard],
        title: pageNames.PERMISSION_ACCESS,
    },
    /// Courses

    {
        path: 'target-achievement/pre-sales/all-presale-target-list',
        loadComponent: () =>
            import('./Modules/Target & Achievement/Pre Sales/all-presale-target-list/all-presale-target-list.component').then(m => m.AllPresaleTargetListComponent),
        canActivate: [AuthGuard],
        title: pageNames.PRESALE_TARGET_LIST,
    },
    {
        path: 'target-achievement/incentive-slabs',
        loadComponent: () =>
            import('./Modules/Target & Achievement/Incentive Slabs/all-incentive-slabs/all-incentive-slabs.component').then(m => m.AllIncentiveSlabsComponent),
        canActivate: [AuthGuard],
        title: pageNames.INCENTIVE_SLABS,
    },
    {
        path: 'target-achievement/pre-sales/all-insentive-bonus-master-list',
        loadComponent: () =>
            import('./Modules/Target & Achievement/Pre Sales/Incensentive & Bonus Master/add-insentive-bonus-master-dialog/all-insentive-bonus-master-list/all-insentive-bonus-master-list.component').then(m => m.AllInsentiveBonusMasterListComponent),
        canActivate: [AuthGuard],
        title: pageNames.INCENTIVE_BONUS_MASTER,
    },
    /// Booking Visitors

    {
        path: 'siteVisitManagement/tokens/GuestBooking',
        loadComponent: () =>
            import('./Modules/Setup Files/Site Visit/Toktens/Booking visitors/all-booking-visitors-list/all-booking-visitors-list.component').then(m => m.AllBookingVisitorsListComponent),
        canActivate: [AuthGuard],
        title: pageNames.GUEST_BOOKING,
    },
    {
        path: 'target-achievement/pre-sales/all-insentive-bonus-master-list',
        loadComponent: () =>
            import('./Modules/Target & Achievement/Pre Sales/Incensentive & Bonus Master/add-insentive-bonus-master-dialog/all-insentive-bonus-master-list/all-insentive-bonus-master-list.component').then(m => m.AllInsentiveBonusMasterListComponent),
        canActivate: [AuthGuard],
        title: pageNames.INCENTIVE_BONUS_MASTER,
    },
    ///WhatsApp Templates
    {
        path: 'setup/all-whatsapp-templates',
        loadComponent: () =>
            import('./Modules/Setup Files/whatsApp/WhatsApp Template/all-whats-app-templates/all-whats-app-templates.component').then(m => m.AllWhatsAppTemplatesComponent),
        canActivate: [AuthGuard],
        title: pageNames.WHATSAPP_TEMPLATES,
    },


    //MOM 

    {
        path: 'MOM/Internal-meetings/all-mom-meetings',
        loadComponent: () =>
            import('./Modules/Setup Files/MOM/All Meeting/all-mommeetings/all-mommeetings.component').then(m => m.AllMOMMeetingsComponent),
        canActivate: [AuthGuard],
        title: pageNames.MOM_MEETINGS,
    },

    // Incentive Slabs
    {
        path: 'target-achievement/incentive-slabs/all-insentive-slabs',
        loadComponent: () =>
            import('./Modules/Setup Files/Incentives/Insentive Slabs/all-insentive-slabs/all-insentive-slabs.component').then(m => m.AllInsentiveSlabsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_INCENTIVE_SLABS,
    },
    {
        path: 'target-achievement/rolewise-insentives/all-role-wise-insentives',
        loadComponent: () =>
            import('./Modules/Setup Files/Incentives/rolewise insentives/all-role-wise-insentives/all-role-wise-insentives.component').then(m => m.AllRoleWiseInsentivesComponent),
        canActivate: [AuthGuard],
        title: pageNames.ROLEWISE_INCENTIVES,
    },
    {
        path: 'target-achievement/incentive-plans/all-incentive-plans',
        loadComponent: () =>
            import('./Modules/Setup Files/Incentives/Incentive Plans/all-incentive-plans/all-incentive-plans.component').then(m => m.AllIncentivePlansComponent),
        canActivate: [AuthGuard],
        title: pageNames.INCENTIVE_PLANS,
    },

    // Dravyam Setup


    // IVR
    {
        path: 'ivr/all-ivrusers',
        loadComponent: () =>
            import('./Modules/IVR/IVR/IVR Users/all-ivrusers/all-ivrusers.component').then(m => m.AllIVRUsersComponent),
        canActivate: [AuthGuard],
        title: pageNames.IVR_USERS,
    },
    // Placeholder Tag Setup
    {
        path: 'placeholder-tag-setup/all-hashtagplacehodler',
        loadComponent: () => import('./Modules/Setup Files/placeholderTagSetup/all-hashtagplacehodler/all-hashtagplacehodler').then(m => m.AllHashtagplacehodler),
        canActivate: [AuthGuard],
        title: pageNames.ALL_HASHTAG_PLACEHOLDERS,
    },
    {
        path: 'placeholder-tag-setup/EmailTeamplates',
        loadComponent: () => import('./Modules/Setup Files/placeholderTagSetup/Email Template/allmail-templates/allmail-templates').then(m => m.AllmailTemplates),
        canActivate: [AuthGuard],
        title: pageNames.ALL_HASHTAG_PLACEHOLDERS,
    },

    // Goals & Targets
    {
        path: 'goals-targets/goals-form',
        loadComponent: () => import('./Modules/Goals & Targets/goals-form/goals-form').then(m => m.GoalsForm),
        canActivate: [AuthGuard],
        title: pageNames.GOALS_FORM,
    },
    {
        path: 'goals-targets/all-anngual-goals',
        loadComponent: () => import('./Modules/Goals & Targets/Compacy goal Setup/all-anngual-goals/all-anngual-goals').then(m => m.AllAnngualGoals),
        canActivate: [AuthGuard],
        title: pageNames.ALL_ANNGUAL_GOALS,
    },
    {
        path: 'goals-targets/annual-goal-dashboard',
        loadComponent: () => import('./Modules/Goals & Targets/Compacy goal Setup/annual-goal-dashboard/annual-goal-dashboard').then(m => m.AnnualGoalDashboard),
        canActivate: [AuthGuard],
        title: pageNames.ANNUAL_GOAL_DASHBOARD,
    },
    {
        path: 'goals-targets/all-strategys',
        loadComponent: () => import('./Modules/Goals & Targets/all-strategys/all-strategys').then(m => m.AllStrategys),
        canActivate: [AuthGuard],
        title: pageNames.ALL_STRATEGYS,
    },
];