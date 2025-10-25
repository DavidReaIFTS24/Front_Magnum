import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: 'admin' },
    loadChildren: () => import('./components/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'employee',
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: 'employee' },
    loadChildren: () => import('./components/employee/employee.routes').then(m => m.EMPLOYEE_ROUTES)
  },
  { path: '**', redirectTo: '/login' }
];