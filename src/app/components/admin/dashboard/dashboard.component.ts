import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { ProductService } from '../../../services/product.service';
import { AuthService } from '../../../services/auth.service';
import { Product } from '../../../interfaces/product.interface';
import { User } from '../../../interfaces/user.interface';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  // Estadísticas principales
  userCount = 0;
  productCount = 0;
  lowStockCount = 0;
  totalRevenue = 0;

  // Datos para tablas
  recentUsers: User[] = [];
  recentProducts: Product[] = [];
  lowStockProducts: Product[] = [];

  // Estado de carga
  loading = true;

  // Usuario actual
  currentUser: User | null = null;

  constructor(
    private userService: UserService,
    @Inject(ProductService) private productService: ProductService, // ← Corregido con @Inject
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    
    // Cargar usuarios
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.userCount = users.length;
        this.recentUsers = users
          .filter(user => user.isActive) // ← Usuarios siguen en inglés
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
      }
    });

    // Cargar productos
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.productCount = products.length;
        this.recentProducts = products
          .filter(product => product.activo) // ← Cambiado a 'activo' (español)
          .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()) // ← Cambiado a 'fechaCreacion'
          .slice(0, 5);
        
        this.lowStockProducts = products.filter(product => (product.cantidad || 0) < 10); // ← Cambiado a 'cantidad'
        this.lowStockCount = this.lowStockProducts.length;
        
        // Calcular revenue (simulado) - usando propiedades en español
        this.totalRevenue = products.reduce((sum, product) => sum + ((product.precio || 0) * (product.cantidad || 0)), 0);
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.loading = false;
      }
    });
  }

  // Métodos de utilidad
  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'bg-danger' : 'bg-info';
  }

  getStockBadgeClass(cantidad: number | undefined): string { // ← Actualizado para usar 'cantidad'
    const stock = cantidad || 0;
    if (stock < 3) return 'bg-danger';
    if (stock < 10) return 'bg-warning';
    return 'bg-success';
  }

  formatCurrency(amount: number | undefined): string { // ← Acepta undefined
    if (amount === undefined) return '$0.00';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  refreshData() {
    this.loadDashboardData();
  }
}