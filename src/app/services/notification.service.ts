import { Injectable } from '@angular/core';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public currentNotification: Notification | null = null;
  private timeoutId: any = null;

  constructor() {}

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
    this.currentNotification = {
      message,
      type,
      timestamp: new Date()
    };

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.clearNotification();
    }, duration);
  }

  success(message: string): void {
    this.showNotification(message, 'success');
  }

  error(message: string): void {
    this.showNotification(message, 'error');
  }

  info(message: string): void {
    this.showNotification(message, 'info');
  }

  clearNotification(): void {
    this.currentNotification = null;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}