import { Routes } from '@angular/router';
import * as pageNames from '../../Common/pageNames';
import { AuthGuard } from '../../Guard/auth.guard';

const routes: Routes = [
    {
        path: 'all-sop',
        loadComponent: () =>
            import('./SOP/SOP/all-soplist/all-soplist.component').then(m => m.AllSOPListComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_SOP,
    },
    {
        path: 'execution-history',
        loadComponent: () =>
            import('./SOP/SOP/sop-execution-histroy/sop-execution-histroy.component').then(m => m.SopExecutionHistroyComponent),
        canActivate: [AuthGuard],
        title: pageNames.EXECUTION_HISTORY,
    },
    {
        path: 'all-teams',
        loadComponent: () =>
            import('./Team/all-teams/all-teams.component').then(m => m.AllTeamsComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_TEAMS,
    },
];

export default routes;
