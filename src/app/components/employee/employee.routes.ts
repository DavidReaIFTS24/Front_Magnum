import { Routes } from '@angular/router';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('../employee/dashboard/dashboard.component').then(m => m.EmployeeDashboardComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];