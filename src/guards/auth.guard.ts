import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../app/services/auth.service';
import { NotificationService } from '../app/services/notification.service';

// Garde d'authentification
// Vérifie si l'utilisateur est connecté avant d'accéder à une route
export const authGuard: CanActivateFn = (route, state) => {
  // Je récupère les services nécessaires
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  if (authService.isLoggedIn()) {
    return true;
  }

  // L'utilisateur n'est pas connecté, rediriger vers la page de connexion
  notificationService.error('Vous devez être connecté pour accéder à cette page');
  router.navigate(['/login']);
  return false;
};