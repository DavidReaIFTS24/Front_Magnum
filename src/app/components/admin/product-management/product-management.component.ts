import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <h1>Gestión de Productos</h1>
          <p>Módulo de gestión de productos - En desarrollo</p>
        </div>
      </div>
    </div>
  `
})
export class ProductManagementComponent {}