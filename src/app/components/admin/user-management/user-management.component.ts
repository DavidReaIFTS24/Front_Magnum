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
      // 🆕 CAMBIADO: Separar nombre y apellido
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      // 🆕 CAMBIADO: Usar roles en español para el backend
      role: ['empleado', Validators.required]
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
        console.log('✅ Usuarios cargados:', this.users);
      },
      error: (error) => {
        console.error('❌ Error cargando usuarios:', error);
        this.loading = false;
        // Mock data para testing (opcional)
        this.users = this.getMockUsers();
      }
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.actionLoading = true;
      
      // 🆕 CONSTRUIR UserData correctamente
      const userData: User = {
        email: this.userForm.value.email,
        name: `${this.userForm.value.nombre} ${this.userForm.value.apellido}`.trim(),
        role: this.userForm.value.role,
        isActive: true,
        createdAt: this.isEditing && this.selectedUser ? this.selectedUser.createdAt : new Date(),
        // 🆕 Campos adicionales para el servicio
        nombre: this.userForm.value.nombre,
        apellido: this.userForm.value.apellido,
        password: this.userForm.value.password || undefined
      };

      console.log('📤 Enviando datos:', userData);

      if (this.isEditing && this.selectedUser?.id) {
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
        console.log('✅ Usuario creado:', newUser);
      },
      error: (error) => {
        console.error('❌ Error creando usuario:', error);
        this.actionLoading = false;
        // Opcional: Mock para testing
        // this.handleMockCreate(userData);
      }
    });
  }

  updateUser(userData: User) {
    if (!this.selectedUser?.id) {
      console.error('No se puede actualizar: usuario o ID no válido');
      this.actionLoading = false;
      return;
    }

    this.userService.updateUser(this.selectedUser.id, userData).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === this.selectedUser?.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.resetForm();
        this.actionLoading = false;
        console.log('✅ Usuario actualizado:', updatedUser);
      },
      error: (error) => {
        console.error('❌ Error actualizando usuario:', error);
        this.actionLoading = false;
      }
    });
  }

  editUser(user: User) {
    this.isEditing = true;
    this.selectedUser = user;
    this.showForm = true;
    
    // 🆕 Rellenar formulario con nombre y apellido separados
    this.userForm.patchValue({
      nombre: user.nombre || this.extractFirstName(user.name),
      apellido: user.apellido || this.extractLastName(user.name),
      email: user.email,
      role: user.role // El servicio ya mapea los roles
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
          console.log('✅ Usuario eliminado');
        },
        error: (error) => {
          console.error('❌ Error eliminando usuario:', error);
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
        console.error('❌ Error actualizando estado:', error);
        this.actionLoading = false;
      }
    });
  }

  resetForm() {
    this.userForm.reset({
      role: 'empleado' // 🆕 CAMBIADO a español
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

  // 🆕 MÉTODOS AUXILIARES PARA NOMBRE/APELLIDO
  private extractFirstName(fullName: string): string {
    return fullName.split(' ')[0] || '';
  }

  private extractLastName(fullName: string): string {
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  // 🆕 MOCK DATA PARA TESTING (opcional)
  private getMockUsers(): User[] {
    return [
      {
        id: 'USER-101',
        email: 'admin@magnum.com',
        name: 'Carlos Magnum',
        role: 'admin',
        createdAt: new Date(),
        isActive: true,
        nombre: 'Carlos',
        apellido: 'Magnum'
      },
      {
        id: 'USER-102',
        email: 'empleado@magnum.com',
        name: 'Ana Garcia',
        role: 'employee',
        createdAt: new Date(),
        isActive: true,
        nombre: 'Ana',
        apellido: 'Garcia'
      }
    ];
  }

  // 🆕 GETTERS ACTUALIZADOS
  get nombre() { return this.userForm.get('nombre'); }
  get apellido() { return this.userForm.get('apellido'); }
  get email() { return this.userForm.get('email'); }
  get password() { return this.userForm.get('password'); }
  get role() { return this.userForm.get('role'); }

  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'bg-danger' : 'bg-info';
  }

  getRoleDisplayText(role: string): string {
    return role === 'admin' ? 'Administrador' : 'Empleado';
  }
}