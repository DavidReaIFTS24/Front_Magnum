export interface User {
  id?: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  createdAt: Date;
  isActive: boolean;
  // Campos adicionales para el formulario
  nombre?: string;
  apellido?: string;
  password?: string; // Solo para creación
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}