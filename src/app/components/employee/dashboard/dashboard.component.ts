import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../interfaces/product.interface';
import { User } from '../../../interfaces/user.interface';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class EmployeeDashboardComponent implements OnInit {
  currentUser: User | null = null;
  products: Product[] = [];
  lowStockProducts: Product[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    @Inject(ProductService) private productService: ProductService // ← Corregido con @Inject
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products.filter(product => product.activo); // ← Cambiado a 'activo' (español)
        this.lowStockProducts = this.products.filter(product => (product.cantidad || 0) < 10); // ← Cambiado a 'cantidad'
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.loading = false;
      }
    });
  }

  getTotalProducts(): number {
    return this.products.length;
  }

  getLowStockCount(): number {
    return this.lowStockProducts.length;
  }

  getCriticalStockCount(): number {
    return this.products.filter(product => (product.cantidad || 0) < 3).length; // ← Cambiado a 'cantidad'
  }

  formatCurrency(amount: number | undefined): string { // ← Acepta undefined
    if (amount === undefined) return '$0.00';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  getStockBadgeClass(cantidad: number | undefined, minimo: number | undefined): string { // ← Nueva función adaptada
    const stock = cantidad || 0;
    const minStock = minimo || 5;
    
    if (stock < 3) return 'bg-danger';
    if (stock <= minStock) return 'bg-warning';
    return 'bg-success';
  }

  refreshData() {
    this.loadProducts();
  }
}