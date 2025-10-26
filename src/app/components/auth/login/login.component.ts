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
      email: ['admin@magnum.com', [Validators.required, Validators.email]],
      password: ['123456', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';

      const credentials: LoginCredentials = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('✅ Login exitoso, redirigiendo...');
          this.loading = false;
          
          // El auth service ya guardó el usuario, ahora redirigir según el rol
          const currentUser = this.authService.getCurrentUser();
          
          if (currentUser) {
            if (currentUser.role === 'admin') {
              this.router.navigate(['/admin/dashboard']);
            } else {
              this.router.navigate(['/employee/dashboard']);
            }
          } else {
            this.error = 'Error: Usuario no encontrado después del login';
          }
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

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}