import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Je crée une interface pour définir la structure d'une notification
export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}


// Service de notification
// Gère l'affichage de notifications dans l'application
// Les notifications sont stockées dans un BehaviorSubject pour être écoutées par les composants
// Le service est injectable, ce qui permet de l'utiliser dans d'autres services ou composants (dépendance)
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification = this.notificationSubject.asObservable();
  private timeoutId: any = null;

  constructor() {}

  /**
   * Affiche une notification avec un message et un type spécifique
   * @param message Le message à afficher
   * @param type Le type de notification (success, error, info)
   * @param duration La durée d'affichage en ms (par défaut 3000ms)
   */
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
    // Créer la notification
    const notification: Notification = {
      message,
      type,
      timestamp: new Date()
    };

    this.notificationSubject.next(notification);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Effacer la notification après la duration spécifiée
    this.timeoutId = setTimeout(() => {
      this.clearNotification();
    }, duration);
  }

  /**
   * Affiche une notification de succès
   * @param message Le message de succès
   */
  success(message: string): void {
    this.showNotification(message, 'success');
  }

  /**
   * Affiche une notification d'erreur
   * @param message Le message d'erreur
   */
  error(message: string): void {
    this.showNotification(message, 'error');
  }

  /**
   * Affiche une notification d'information
   * @param message Le message d'information
   */
  info(message: string): void {
    this.showNotification(message, 'info');
  }

  /**
   * Efface la notification courante
   */
  clearNotification(): void {
    this.notificationSubject.next(null);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}