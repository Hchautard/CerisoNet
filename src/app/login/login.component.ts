import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { url } from 'inspector';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { NotificationComponent } from '../notification/notification.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NotificationComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  lastLogin: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Récupérer la dernière date de connexion stockée localement
    this.lastLogin = this.authService.getLastLogin();

    // Vérifier si l'utilisateur est déjà connecté
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  login() {
    if (this.loginForm.valid) {
      this.loading = true;
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.notificationService.success('Connexion réussie');
            // La redirection vers le mur est gérée dans le service d'authentification
          } else {
            this.notificationService.error(response.message || 'Erreur lors de la connexion');
          }
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.error(
            error.error?.message || 'Erreur de connexion au serveur'
          );
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      this.notificationService.error('Veuillez corriger les erreurs dans le formulaire');
    }
  }
}
