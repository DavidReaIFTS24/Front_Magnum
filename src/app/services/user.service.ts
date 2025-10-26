import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) { }

  getUsers(): Observable<User[]> {
    return this.apiService.get<User[]>('usuarios'); // ← Cambiado a español
  }

  getUserById(id: string): Observable<User> {
    return this.apiService.get<User>(`usuarios/${id}`); // ← Cambiado a español
  }

  createUser(user: User): Observable<User> {
    return this.apiService.post<User>('usuarios', user); // ← Cambiado a español
  }

  updateUser(id: string, user: User): Observable<User> {
    return this.apiService.put<User>(`usuarios/${id}`, user); // ← Cambiado a español
  }

  deleteUser(id: string): Observable<any> {
    return this.apiService.delete<any>(`usuarios/${id}`); // ← Cambiado a español
  }
}