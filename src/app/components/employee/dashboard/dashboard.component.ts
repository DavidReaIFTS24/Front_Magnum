import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <h1>Dashboard Empleado</h1>
          <p>Panel de control para empleados - En desarrollo</p>
        </div>
      </div>
    </div>
  `,
  
})
export class EmployeeDashboardComponent {}