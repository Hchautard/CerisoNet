// notification.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Notification, NotificationService } from '../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="notification" 
         class="notification-container"
         [ngClass]="notification.type">
      <div class="notification-content">
        <span class="message">{{ notification.message }}</span>
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
export class NotificationComponent implements OnInit, OnDestroy {
  notification: Notification | null = null;
  private subscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notification.subscribe(
      notification => this.notification = notification
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  closeNotification(): void {
    this.notificationService.clearNotification();
  }
}