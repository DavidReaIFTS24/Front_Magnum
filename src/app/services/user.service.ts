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
    return this.apiService.get<User[]>('users');
  }

  getUserById(id: string): Observable<User> {
    return this.apiService.get<User>(`users/${id}`);
  }

  createUser(user: User): Observable<User> {
    return this.apiService.post<User>('users', user);
  }

  updateUser(id: string, user: User): Observable<User> {
    return this.apiService.put<User>(`users/${id}`, user);
  }

  deleteUser(id: string): Observable<any> {
    return this.apiService.delete<any>(`users/${id}`);
  }
}