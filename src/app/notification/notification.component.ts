import { Component } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="notificationService.currentNotification" 
         class="notification-container"
         [ngClass]="notificationService.currentNotification.type">
      <div class="notification-content">
        <span class="message">{{ notificationService.currentNotification.message }}</span>
        <button (click)="closeNotification()" class="close-btn">×</button>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 50%;
      transform: translateX(50%);
      padding: 15px;
      border-radius: 5px;
      max-width: 500px;
      z-index: 1000;
      transition: all 0.3s ease-in-out;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .notification-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .success {
      background-color: #4CAF50;
      color: white;
    }
    
    .error {
      background-color: #f44336;
      color: white;
    }
    
    .info {
      background-color: #2196F3;
      color: white;
    }
    
    .message {
      flex-grow: 1;
      margin-right: 10px;
    }
    
    .close-btn {
      background: transparent;
      border: none;
      color: inherit;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      margin: 0;
      line-height: 1;
    }
  `]
})
export class NotificationComponent {
  constructor(public notificationService: NotificationService) {}

  closeNotification(): void {
    this.notificationService.clearNotification();
  }
}