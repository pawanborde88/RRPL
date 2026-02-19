import { Routes } from '@angular/router';
import * as pageNames from '../Common/pageNames';
import { AuthGuard } from '../Guard/auth.guard';

export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./login/login.component'),
        title: pageNames.LOGIN,
    },
    {
        path: 'register',
        loadComponent: () => import('./register/register.component'),
        canActivate: [AuthGuard],
        title: pageNames.REGISTER,
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: pageNames.FORGOT_PASSWORD,
    },
    {
        path: 'register-password',
        loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: pageNames.RESET_PASSWORD,
    },
    {
        path: 'portal-login-password',
        loadComponent: () => import('./user-forgot-password/user-forgot-password.component').then(m => m.UserForgotPasswordComponent),
        title: pageNames.PORTAL_LOGIN_PASSWORD,
    }
];
