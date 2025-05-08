import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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

  // J'utilise 2 services pour gérer la connexion et les notifications
  // J'utilise également le router pour rediriger l'utilisateur après la connexion
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Ajout de validateurs pour les champs du formulaire
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]]
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

      // Subscribe permet de gérer les réponses de la requête HTTP
      // Ici, on affiche une notification en cas de succès ou d'erreur
      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.notificationService.success('Connexion réussie, date de la dernière connexion: ' + this.lastLogin);
            setTimeout(() => {
              this.router.navigate(['/home']);
            } , 2000);
          } else {
            this.notificationService.error(response.message || 'Erreur lors de la connexion (HTTP ' + response.message + ')');
          }
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.error(
            error.error?.message || 'Erreur de connexion au serveur (HTTP ' + error.status + ')'
          );
        }
      });
    } else {
      this.notificationService.error('Veuillez corriger les erreurs dans le formulaire');
    }
  }
}
