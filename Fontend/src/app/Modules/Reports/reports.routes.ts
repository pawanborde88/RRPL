import { Routes } from '@angular/router';
import * as pageNames from '../../Common/pageNames';
import { AuthGuard } from '../../Guard/auth.guard';

const routes: Routes = [
    {
        path: 'all-user-login-log',
        loadComponent: () =>
            import('./Login-Log/all-user-login-log/all-user-login-log.component').then(m => m.AllUserLoginLogComponent),
        canActivate: [AuthGuard],
        title: pageNames.ALL_USER_LOGIN_LOG,
    },
];

export default routes;
