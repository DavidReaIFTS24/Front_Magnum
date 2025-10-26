import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { LoginCredentials } from '../../../interfaces/user.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['empleado@magnum.com', [Validators.required, Validators.email]],
      password: ['123456', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';

      const credentials: LoginCredentials = this.loginForm.value;
      console.log('🔵 Iniciando login para:', credentials.email);

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('✅ Login exitoso en componente');
          this.loading = false;
          // La redirección ahora se maneja en el AuthService
        },
        error: (error) => {
          console.error('❌ Error en login:', error);
          this.loading = false;
          
          if (error.status === 401) {
            this.error = 'Credenciales incorrectas';
          } else if (error.status === 0) {
            this.error = 'No se puede conectar con el servidor';
          } else {
            this.error = error.error?.message || 'Error en el servidor';
          }
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  // Método para probar login rápido
  quickLogin(role: 'admin' | 'employee') {
    if (role === 'admin') {
      this.loginForm.patchValue({
        email: 'admin@magnum.com',
        password: '123456'
      });
    } else {
      this.loginForm.patchValue({
        email: 'empleado@magnum.com', 
        password: '123456'
      });
    }
    this.onSubmit();
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}