import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { User, LoginCredentials, AuthResponse } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private apiService: ApiService, // ✅ CORREGIDO: Usar ApiService en lugar de HttpClient
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    try {
      const user = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');
      
      if (user && user !== 'undefined' && user !== 'null' && token && token !== 'undefined' && token !== 'null') {
        const parsedUser = JSON.parse(user);
        this.currentUserSubject.next(parsedUser);
      } else {
        if (user === 'undefined' || user === 'null') {
          localStorage.removeItem('currentUser');
        }
        if (token === 'undefined' || token === 'null') {
          localStorage.removeItem('token');
        }
        this.currentUserSubject.next(null);
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario desde storage:', error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      this.currentUserSubject.next(null);
    }
  }

  login(credentials: LoginCredentials): Observable<any> {
    console.log('📤 Enviando login a /auth/login via ApiService');
    
    // ✅ CORRECCIÓN: Usar apiService en lugar de http
    return this.apiService.post<any>('auth/login', credentials).pipe(
      tap(response => {
        console.log('🔵 Respuesta completa del backend:', response);
        
        // ESTRUCTURA CORRECTA BASADA EN POSTMAN:
        const token = response.token;
        const usuario = response.usuario;

        if (usuario && token) {
          // MAPEAR LA ESTRUCTURA ESPAÑOL → INGLÉS Y ROLES
          const userData: User = {
            id: usuario.id,
            email: usuario.email,
            name: usuario.nombre + (usuario.apellido ? ' ' + usuario.apellido : ''),
            role: this.mapRole(usuario.rol),
            createdAt: new Date(),
            isActive: true
          };

          console.log('✅ User data mapeado:', userData);
          console.log('✅ Rol mapeado:', usuario.rol, '→', userData.role);

          this.setUser(userData, token);
        } else {
          console.error('❌ No se pudo extraer usuario o token de la respuesta');
          throw new Error('Respuesta inválida del servidor');
        }
      })
    );
  }

  // MÉTODO: Mapear roles de español a inglés
  private mapRole(rol: string): 'admin' | 'employee' {
    console.log('🔵 Mapeando rol:', rol);
    
    const roleMap: { [key: string]: 'admin' | 'employee' } = {
      'admin': 'admin',
      'administrador': 'admin',
      'employee': 'employee', 
      'empleado': 'employee',
      'emp': 'employee'
    };

    const mappedRole = roleMap[rol.toLowerCase()] || 'employee';
    console.log('🔵 Rol mapeado:', rol, '→', mappedRole);
    
    return mappedRole;
  }

  setUser(user: User, token: string) {
    try {
      if (!user || !token) {
        console.error('❌ Intentando guardar usuario o token inválido');
        return;
      }

      const userString = JSON.stringify(user);
      JSON.parse(userString); // Validar JSON
      
      localStorage.setItem('currentUser', userString);
      localStorage.setItem('token', token);
      this.currentUserSubject.next(user);
      
      console.log('✅ Usuario guardado correctamente en storage:', user);
      
      // REDIRIGIR INMEDIATAMENTE DESPUÉS DE GUARDAR
      this.redirectBasedOnRole(user.role);
      
    } catch (error) {
      console.error('❌ Error al guardar usuario en storage:', error);
    }
  }

  // MÉTODO: Redirigir basado en el rol
  private redirectBasedOnRole(role: string) {
    console.log('🔵 Redirigiendo basado en rol:', role);
    
    if (role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/employee/dashboard']);
    }
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
    console.log('✅ Logout exitoso');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!(token && token !== 'undefined' && token !== 'null');
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    return (token && token !== 'undefined' && token !== 'null') ? token : null;
  }

  // Método para verificar si el usuario está autenticado y tiene un rol específico
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  // Método para refrescar el usuario desde el storage
  refreshUser() {
    this.loadUserFromStorage();
  }

  // Método para verificar expiración del token (básico)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      return Date.now() >= exp;
    } catch (error) {
      console.error('❌ Error al verificar token:', error);
      return true;
    }
  }

  // Método para auto-logout si el token expiró
  checkTokenExpiration() {
    if (this.isTokenExpired()) {
      console.log('🔐 Token expirado, haciendo logout automático');
      this.logout();
    }
  }
}