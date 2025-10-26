import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { User } from '../../../interfaces/user.interface';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  userForm: FormGroup;
  isEditing = false;
  selectedUser: User | null = null;
  showForm = false;
  loading = false;
  actionLoading = false;

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder
  ) {
    this.userForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      role: ['employee', Validators.required]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.loading = false;
        // Mock data para testing
        this.users = [
          {
            id: 'USER-101',
            email: 'admin@magnum.com',
            name: 'Carlos Magnum',
            role: 'admin',
            createdAt: new Date(),
            isActive: true
          },
          {
            id: 'USER-102',
            email: 'empleado@magnum.com',
            name: 'Ana Garcia',
            role: 'employee',
            createdAt: new Date(),
            isActive: true
          }
        ];
      }
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.actionLoading = true;
      const userData: User = {
        ...this.userForm.value,
        createdAt: this.isEditing && this.selectedUser ? this.selectedUser.createdAt : new Date(),
        isActive: true
      };

      if (this.isEditing && this.selectedUser && this.selectedUser.id) { // ← CORREGIDO: Verificar id
        this.updateUser(userData);
      } else {
        this.createUser(userData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  createUser(userData: User) {
    this.userService.createUser(userData).subscribe({
      next: (newUser) => {
        this.users.push(newUser);
        this.resetForm();
        this.actionLoading = false;
      },
      error: (error) => {
        console.error('Error creando usuario:', error);
        // Mock para testing
        const mockUser: User = {
          ...userData,
          id: 'USER-' + Date.now(),
          createdAt: new Date(),
          isActive: true
        };
        this.users.push(mockUser);
        this.resetForm();
        this.actionLoading = false;
      }
    });
  }

  updateUser(userData: User) {
    // CORREGIDO: Verificar que selectedUser y su id existan
    if (!this.selectedUser?.id) {
      console.error('No se puede actualizar: usuario o ID no válido');
      this.actionLoading = false;
      return;
    }

    this.userService.updateUser(this.selectedUser.id, userData).subscribe({ // ← Ahora seguro que existe
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === this.selectedUser?.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.resetForm();
        this.actionLoading = false;
      },
      error: (error) => {
        console.error('Error actualizando usuario:', error);
        // Mock para testing
        const index = this.users.findIndex(u => u.id === this.selectedUser?.id);
        if (index !== -1 && this.selectedUser) {
          this.users[index] = { ...userData, id: this.selectedUser.id };
        }
        this.resetForm();
        this.actionLoading = false;
      }
    });
  }

  editUser(user: User) {
    this.isEditing = true;
    this.selectedUser = user;
    this.showForm = true;
    
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Limpiar validación de password en edición
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  deleteUser(user: User) {
    if (confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
      this.actionLoading = true;
      if (!user.id) {
        console.error('No se puede eliminar: usuario sin ID');
        this.actionLoading = false;
        return;
      }

      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.actionLoading = false;
        },
        error: (error) => {
          console.error('Error eliminando usuario:', error);
          // Mock para testing
          this.users = this.users.filter(u => u.id !== user.id);
          this.actionLoading = false;
        }
      });
    }
  }

  toggleUserStatus(user: User) {
    this.actionLoading = true;
    const updatedUser = { ...user, isActive: !user.isActive };

    if (!user.id) {
      console.error('No se puede actualizar estado: usuario sin ID');
      this.actionLoading = false;
      return;
    }

    this.userService.updateUser(user.id, updatedUser).subscribe({
      next: (result) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = result;
        }
        this.actionLoading = false;
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        // Mock para testing
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.actionLoading = false;
      }
    });
  }

  resetForm() {
    this.userForm.reset({
      role: 'employee'
    });
    this.isEditing = false;
    this.selectedUser = null;
    this.showForm = false;
    this.actionLoading = false;
    
    // Restaurar validación de password
    this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  private markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }

  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'bg-danger' : 'bg-info';
  }

  get name() { return this.userForm.get('name'); }
  get email() { return this.userForm.get('email'); }
  get password() { return this.userForm.get('password'); }
}