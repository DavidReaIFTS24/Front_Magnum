import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="card">
          <div class="card-header">
            <h3 class="text-center">Sistema Magnum</h3>
          </div>
          <div class="card-body">
            <p>Página de login - En desarrollo</p>
            <button class="btn btn-primary" routerLink="/admin/dashboard">
              Ir a Admin (Temp)
            </button>
            <button class="btn btn-secondary" routerLink="/employee/dashboard">
              Ir a Employee (Temp)
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.css']
})
export class LoginComponent {}