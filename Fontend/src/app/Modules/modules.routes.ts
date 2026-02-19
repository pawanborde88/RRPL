import { Routes } from '@angular/router';
import { AuthGuard } from '../Guard/auth.guard';
import * as pageNames from '../Common/pageNames';

export const MODULES_ROUTES: Routes = [
    {
        path: 'reports',
        loadChildren: () => import('./Reports'),
        canActivate: [AuthGuard]
    },
    {
        path: 'setup',
        loadChildren: () => import('./Setup Files'),
        canActivate: [AuthGuard]
    },
    {
        path: 'all-projects',
        loadComponent: () =>
            import('./Setup Files/Projects/all-projects/all-projects.component').then(m => m.AllProjectsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_PROJECTS,
    },
    {
        path: 'all-sop',
        loadComponent: () =>
            import('./Setup Files/SOP/SOP/all-soplist/all-soplist.component').then(m => m.AllSOPListComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_SOP,
    },
    {
        path: 'all-expenses',
        loadComponent: () =>
            import('./Setup Files/Expenses/all-expenses/all-expenses.component').then(m => m.AllExpensesComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_EXPENSES,
    },
    {
        path: 'all-budget',
        loadComponent: () =>
            import('./Setup Files/Budget/all-bugets/all-bugets.component').then(m => m.AllBugetsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_BUDGET,
    },
    {
        path: 'all-setupDashboard',
        loadComponent: () =>
            import('../Common/Settings Dashboard/settings-dashboard/settings-dashboard.component').then(m => m.SettingsDashboardComponent),
        canActivate: [AuthGuard],
        title: pageNames.SETUP_DASHBOARD,
    },
    {
        path: 'all-feedbacks',
        loadComponent: () =>
            import('./Help Desk/All FeedBacks/allfeedback-list/allfeedback-list.component').then(m => m.AllfeedbackListComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_FEEDBACKS,
    },
    {
        path: 'all-channelpartner',
        loadComponent: () =>
            import('./Setup Files/Channel Partner/all-channel-partner/all-channel-partner.component').then(m => m.AllChannelPartnerComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_CHANNEL_PARTNER,
    },
];
