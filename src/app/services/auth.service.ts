import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User, LoginCredentials, AuthResponse } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
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
    const url = `${this.apiUrl}/auth/login`;
    console.log('📤 Haciendo request a:', url);
    
    return this.http.post<any>(url, credentials).pipe(
      tap(response => {
        console.log('🔵 Respuesta del backend:', response);
        
        // ESTRUCTURA CORRECTA BASADA EN POSTMAN:
        // {
        //   "message": "Login exitoso",
        //   "token": "eyJ...",
        //   "usuario": {
        //     "id": "USER-101",
        //     "email": "admin@magnum.com",
        //     "nombre": "Carlos",
        //     "apellido": "Magnum", 
        //     "rol": "admin"
        //   }
        // }
        
        const token = response.token;
        const usuario = response.usuario;

        if (usuario && token) {
          // MAPEAR LA ESTRUCTURA ESPAÑOL → INGLÉS
          const userData: User = {
            id: usuario.id,
            email: usuario.email,
            name: usuario.nombre + (usuario.apellido ? ' ' + usuario.apellido : ''), // Combinar nombre + apellido
            role: usuario.rol, // ← 'rol' en español → 'role' en inglés
            createdAt: new Date(), // Tu backend no envía createdAt, usar fecha actual
            isActive: true // Asumir que está activo
          };

          console.log('✅ User data mapeado:', userData);
          console.log('✅ Token recibido:', token);

          this.setUser(userData, token);
        } else {
          console.error('❌ No se pudo extraer usuario o token de la respuesta');
        }
      })
    );
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
    } catch (error) {
      console.error('❌ Error al guardar usuario en storage:', error);
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
}