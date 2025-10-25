export interface User {
  id?: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  createdAt: Date;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}