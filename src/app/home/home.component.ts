import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { NotificationComponent } from '../notification/notification.component';
import { HttpClient } from '@angular/common/http';

interface Post {
  id: number;
  content: string;
  author: string;
  likes: number;
  comments: number;
  date: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- En-tête -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 class="text-3xl font-bold text-gray-900">CERISoNet</h1>
          <div class="flex items-center space-x-4">
            <span class="text-gray-700">Bonjour, {{ userName }}</span>
            <button 
              (click)="logout()" 
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 focus:outline-none"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <!-- Contenu principal -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Section du mur -->
        <div class="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div class="p-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Mur d'accueil</h2>
          </div>
          
          <div *ngIf="loading" class="p-6 flex justify-center">
            <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>

          <div *ngIf="!loading && posts.length === 0" class="p-6 text-center text-gray-500">
            Aucun post à afficher
          </div>

          <div *ngIf="!loading && posts.length > 0">
            <div *ngFor="let post of posts" class="p-4 border-b border-gray-200">
              <div class="flex justify-between items-start mb-2">
                <div class="text-sm font-medium text-indigo-600">{{ post.author }}</div>
                <div class="text-sm text-gray-500">{{ post.date | date:'dd/MM/yyyy HH:mm' }}</div>
              </div>
              <p class="text-gray-900 mb-3">{{ post.content }}</p>
              <div class="flex items-center text-sm text-gray-500 space-x-4">
                <button class="flex items-center space-x-1 hover:text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{{ post.likes }} likes</span>
                </button>
                <button class="flex items-center space-x-1 hover:text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{{ post.comments }} commentaires</span>
                </button>
                <button class="flex items-center space-x-1 hover:text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Partager</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Composant de notification -->
      <app-notification></app-notification>
    </div>
  `,
  styles: []
})
export class HomeComponent implements OnInit {
  loading = true;
  posts: Post[] = [];
  userName = '';
  private apiUrl = 'https://pedago.univ-avignon.fr:3221';

  constructor(
    private authService: AuthService, 
    private notificationService: NotificationService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur est connecté
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = `${user.prenom} ${user.nom}`;
    } else {
      this.notificationService.error('Vous devez être connecté pour accéder à cette page');
      // Redirection gérée par le service d'auth
    }

    // Charger les posts
    this.loadPosts();
  }

  loadPosts() {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/posts`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.posts = response.posts;
          } else {
            this.notificationService.error('Erreur lors du chargement des posts');
          }
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.error(
            error.error?.message || 'Erreur de connexion au serveur'
          );
        }
      });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.notificationService.success('Déconnexion réussie');
        // Redirection gérée par le service d'auth
      },
      error: () => {
        this.notificationService.error('Erreur lors de la déconnexion');
      }
    });
  }
}