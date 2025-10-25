import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <h1>Gestión de Usuarios</h1>
          <p>Módulo de gestión de usuarios - En desarrollo</p>
        </div>
      </div>
    </div>
  `
})
export class UserManagementComponent {}