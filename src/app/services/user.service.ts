import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) { }

  // Obtener todos los usuarios
  getUsers(): Observable<User[]> {
    return this.apiService.get<any>('usuarios').pipe(
      map(response => {
        console.log('🔍 Respuesta completa del backend:', response);
        
        // Manejar diferentes estructuras de respuesta
        let usuarios: any[] = [];
        
        if (Array.isArray(response)) {
          usuarios = response;
        } else if (response && Array.isArray(response.usuarios)) {
          usuarios = response.usuarios;
        } else if (response && response.data && Array.isArray(response.data)) {
          usuarios = response.data;
        } else {
          console.error('❌ Formato de respuesta inesperado:', response);
          return [];
        }

        console.log(`📊 ${usuarios.length} usuarios encontrados`);

        return usuarios.map((usuario: any) => {
          // 🆕 CORRECCIÓN: Asegurar que role sea 'admin' | 'employee'
          const role = this.mapRole(usuario.rol) as 'admin' | 'employee';
          
          const userMapped: User = {
            id: usuario.id,
            email: usuario.email,
            name: this.formatFullName(usuario.nombre, usuario.apellido),
            role: role, // 🆕 Ya está tipado correctamente
            isActive: usuario.activo !== undefined ? usuario.activo : true,
            createdAt: new Date(usuario.fechaCreacion),
            nombre: usuario.nombre,
            apellido: usuario.apellido
          };

          console.log('✅ Usuario mapeado:', userMapped);
          return userMapped;
        });
      })
    );
  }

  // Crear usuario
  createUser(user: User): Observable<User> {
    const userData = {
      email: user.email,
      password: user.password || 'password123',
      nombre: user.nombre || this.extractFirstName(user.name),
      apellido: user.apellido || this.extractLastName(user.name),
      rol: this.mapRoleToSpanish(user.role),
      activo: user.isActive !== undefined ? user.isActive : true
    };

    console.log('📤 Enviando datos para crear usuario:', userData);

    return this.apiService.post<any>('usuarios', userData).pipe(
      map(response => {
        console.log('✅ Respuesta creación usuario:', response);
        
        const usuario = response.usuario || response;
        
        // 🆕 CORRECCIÓN: Asegurar que role sea 'admin' | 'employee'
        const role = this.mapRole(usuario.rol) as 'admin' | 'employee';
        
        const newUser: User = {
          id: usuario.id,
          email: usuario.email,
          name: this.formatFullName(usuario.nombre, usuario.apellido),
          role: role, // 🆕 Ya está tipado correctamente
          isActive: usuario.activo,
          createdAt: new Date(usuario.fechaCreacion),
          nombre: usuario.nombre,
          apellido: usuario.apellido
        };
        
        return newUser;
      })
    );
  }

  // Actualizar usuario
  updateUser(id: string, user: User): Observable<User> {
    const userData = {
      nombre: user.nombre || this.extractFirstName(user.name),
      apellido: user.apellido || this.extractLastName(user.name),
      rol: this.mapRoleToSpanish(user.role),
      activo: user.isActive
    };

    console.log('📤 Actualizando usuario:', { id, userData });

    return this.apiService.put<any>(`usuarios/${id}`, userData).pipe(
      map(response => {
        console.log('✅ Respuesta actualización usuario:', response);
        
        // Si el backend devuelve el usuario actualizado
        if (response.usuario) {
          const usuario = response.usuario;
          
          // 🆕 CORRECCIÓN: Asegurar que role sea 'admin' | 'employee'
          const role = this.mapRole(usuario.rol) as 'admin' | 'employee';
          
          const updatedUser: User = {
            id: usuario.id,
            email: usuario.email,
            name: this.formatFullName(usuario.nombre, usuario.apellido),
            role: role, // 🆕 Ya está tipado correctamente
            isActive: usuario.activo,
            createdAt: new Date(usuario.fechaCreacion),
            nombre: usuario.nombre,
            apellido: usuario.apellido
          };
          
          return updatedUser;
        } else {
          // Si no hay respuesta completa, reconstruir desde los datos enviados
          // 🆕 CORRECCIÓN: Mantener el tipo User correctamente
          const role = this.mapRole(userData.rol) as 'admin' | 'employee';
          
          return {
            ...user,
            id: id,
            name: this.formatFullName(userData.nombre, userData.apellido),
            role: role, // 🆕 Ya está tipado correctamente
            isActive: userData.activo
          };
        }
      })
    );
  }

  // Eliminar usuario
  deleteUser(id: string): Observable<any> {
    console.log('🗑️ Eliminando usuario:', id);
    return this.apiService.delete(`usuarios/${id}`);
  }

  // Cambiar estado de usuario (activar/desactivar)
  toggleUserStatus(id: string, isActive: boolean): Observable<any> {
    return this.apiService.put<any>(`usuarios/${id}`, { activo: isActive });
  }

  // --- MÉTODOS AUXILIARES ---

  // Mapear roles del backend (español) al frontend (inglés)
  private mapRole(rol: string): 'admin' | 'employee' {
    const roleMap: { [key: string]: 'admin' | 'employee' } = {
      'admin': 'admin',
      'administrador': 'admin',
      'empleado': 'employee',
      'employee': 'employee',
      'user': 'employee'
    };
    return roleMap[rol?.toLowerCase()] || 'employee';
  }

  // Mapear roles del frontend (inglés) al backend (español)
  private mapRoleToSpanish(role: 'admin' | 'employee'): string {
    const roleMap: { [key: string]: string } = {
      'admin': 'admin',
      'administrador': 'admin',
      'employee': 'empleado',
      'empleado': 'empleado',
      'user': 'empleado'
    };
    return roleMap[role?.toLowerCase()] || 'empleado';
  }

  // Formatear nombre completo
  private formatFullName(nombre: string, apellido: string): string {
    if (nombre && apellido) {
      return `${nombre} ${apellido}`.trim();
    } else if (nombre) {
      return nombre;
    } else if (apellido) {
      return apellido;
    }
    return '';
  }

  // Extraer primer nombre del nombre completo
  private extractFirstName(fullName: string): string {
    if (!fullName) return '';
    return fullName.split(' ')[0] || '';
  }

  // Extraer apellido del nombre completo
  private extractLastName(fullName: string): string {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  // Obtener badge class para el rol
  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'bg-danger' : 'bg-info';
  }

  // Obtener texto del rol en español para mostrar
  getRoleDisplayText(role: string): string {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'employee': 'Empleado'
    };
    return roleMap[role] || 'Empleado';
  }

  // Verificar si el usuario es admin
  isAdmin(role: string): boolean {
    return role === 'admin';
  }
}