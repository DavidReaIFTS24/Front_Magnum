import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/">
          <i class="fas fa-store me-2"></i>
          Sistema Magnum
        </a>
        
        <div class="navbar-nav ms-auto">
          <a class="nav-link" routerLink="/login">Login</a>
          <a class="nav-link" routerLink="/admin/dashboard">Admin</a>
          <a class="nav-link" routerLink="/employee/dashboard">Employee</a>
        </div>
      </div>
    </nav>
  `,
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {}