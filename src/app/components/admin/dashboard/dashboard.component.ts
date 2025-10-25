import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <h1>Dashboard Administrador</h1>
          <p>Panel de control para administradores - En desarrollo</p>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent {}