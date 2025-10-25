import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('../admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('../admin/user-management/user-management.component').then(m => m.UserManagementComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('../admin/product-management/product-management.component').then(m => m.ProductManagementComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];