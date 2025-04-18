import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { NotificationComponent } from '../notification/notification.component';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';

interface Post {
  id: number;
  content: string;
  author: string;
  likes: number;
  comments: number;
  date: string;
  commentsList?: Comment[];
  showComments?: boolean;
}

interface Comment {
  id: string;
  postId: number;
  userId: number;
  userName: string;
  content: string;
  date: string;
}

interface ConnectedUser {
  id: number;
  nom: string;
  prenom: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationComponent],
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Section principale (posts) -->
          <div class="md:col-span-2">
            <!-- Création de post -->
            <div class="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div class="p-4">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Créer un post</h2>
                <div class="flex flex-col space-y-3">
                  <textarea 
                    [(ngModel)]="newPostContent" 
                    class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    rows="3" 
                    placeholder="Quoi de neuf ?">
                  </textarea>
                  <button 
                    (click)="createPost()" 
                    [disabled]="!newPostContent.trim()" 
                    class="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    Publier
                  </button>
                </div>
              </div>
            </div>

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
                    <button (click)="likePost(post)" class="flex items-center space-x-1 hover:text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{{ post.likes }} likes</span>
                    </button>
                    <button (click)="toggleComments(post)" class="flex items-center space-x-1 hover:text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{{ post.comments }} commentaires</span>
                    </button>
                    <button (click)="sharePost(post)" class="flex items-center space-x-1 hover:text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>Partager</span>
                    </button>
                  </div>
                  
                  <!-- Section commentaires -->
                  <div *ngIf="post.showComments" class="mt-4">
                    <div class="border-t border-gray-200 pt-3">
                      <h3 class="text-sm font-semibold mb-2">Commentaires</h3>
                      
                      <!-- Liste des commentaires -->
                      <div *ngIf="post.commentsList && post.commentsList.length > 0" class="space-y-3 mb-3">
                        <div *ngFor="let comment of post.commentsList" class="bg-gray-50 p-3 rounded-md">
                          <div class="flex justify-between items-start">
                            <div class="text-xs font-medium text-indigo-600">{{ comment.userName }}</div>
                            <div class="text-xs text-gray-500">{{ comment.date | date:'dd/MM/yyyy HH:mm' }}</div>
                          </div>
                          <p class="text-sm text-gray-800 mt-1">{{ comment.content }}</p>
                        </div>
                      </div>
                      
                      <!-- Formulaire d'ajout de commentaire -->
                      <div class="flex space-x-2">
                        <input 
                          [(ngModel)]="commentText[post.id]" 
                          type="text" 
                          class="flex-1 p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                          placeholder="Ajouter un commentaire..."
                        >
                        <button 
                          (click)="addComment(post)" 
                          [disabled]="!commentText[post.id] || !commentText[post.id].trim()" 
                          class="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-500 focus:outline-none disabled:opacity-50"
                        >
                          Commenter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Sidebar (utilisateurs connectés) -->
          <div class="md:col-span-1">
            <div class="bg-white shadow rounded-lg overflow-hidden sticky top-6">
              <div class="p-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">Utilisateurs connectés</h2>
              </div>
              
              <div *ngIf="connectedUsers.length === 0" class="p-4 text-center text-gray-500">
                Aucun autre utilisateur connecté
              </div>
              
              <div *ngIf="connectedUsers.length > 0" class="divide-y divide-gray-200">
                <div *ngFor="let user of connectedUsers" class="p-4">
                  <div class="flex items-center space-x-3">
                    <div class="h-2 w-2 rounded-full bg-green-500"></div>
                    <div class="text-sm font-medium">{{ user.prenom }} {{ user.nom }}</div>
                  </div>
                </div>
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
export class HomeComponent implements OnInit, OnDestroy {
  loading = true;
  posts: Post[] = [];
  userName = '';
  newPostContent = '';
  commentText: { [key: number]: string } = {};
  connectedUsers: ConnectedUser[] = [];
  private apiUrl = 'https://pedago.univ-avignon.fr:3221';
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService, 
    private notificationService: NotificationService,
    private http: HttpClient,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur est connecté
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = `${user.prenom} ${user.nom}`;
      // Connexion au WebSocket
      this.webSocketService.connect();
    } else {
      this.notificationService.error('Vous devez être connecté pour accéder à cette page');
      // Redirection gérée par le service d'auth
    }

    // Charger les posts
    this.loadPosts();
    
    // S'abonner aux événements WebSocket
    this.setupWebSocketListeners();
  }
  
  ngOnDestroy() {
    // Se désabonner de tous les observables
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Déconnecter le WebSocket
    this.webSocketService.disconnect();
  }

  /**
   * Configure les écouteurs d'événements WebSocket
   */
  setupWebSocketListeners() {
    // Liste des utilisateurs connectés
    this.subscriptions.push(
      this.webSocketService.connectedUsers$.subscribe(users => {
        this.connectedUsers = users;
      })
    );
    
    // Réception d'un like sur un post
    this.subscriptions.push(
      this.webSocketService.postLiked$.subscribe(data => {
        const post = this.posts.find(p => p.id === data.postId);
        if (post) {
          post.likes = data.totalLikes;
        }
      })
    );
    
    // Réception d'un nouveau commentaire
    this.subscriptions.push(
      this.webSocketService.newComment$.subscribe(comment => {
        const post = this.posts.find(p => p.id === comment.postId);
        if (post) {
          if (!post.commentsList) {
            post.commentsList = [];
          }
          post.commentsList.push(comment);
          post.comments += 1;
        }
      })
    );
  }

  loadPosts() {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/posts`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.posts = response.posts.map((post: Post) => ({
              ...post,
              commentsList: [],
              showComments: false
            }));
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

  createPost() {
    if (!this.newPostContent.trim()) return;
    
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    const newPost = {
      content: this.newPostContent.trim()
    };
    
    this.http.post<any>(`${this.apiUrl}/posts`, newPost, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('Publication créée avec succès');
            this.newPostContent = '';
            // Le nouveau post sera ajouté via WebSocket
          } else {
            this.notificationService.error('Erreur lors de la création de la publication');
          }
        },
        error: (error) => {
          this.notificationService.error(
            error.error?.message || 'Erreur de connexion au serveur'
          );
        }
      });
  }

  likePost(post: Post) {
    // Optimistic UI update
    post.likes += 1;
    
    // Envoi de l'événement via WebSocket
    this.webSocketService.likePost(post.id, post.likes);
  }

  toggleComments(post: Post) {
    post.showComments = !post.showComments;
    
    // Si on affiche les commentaires et qu'ils n'ont pas été chargés, on les charge
    if (post.showComments && (!post.commentsList || post.commentsList.length === 0) && post.comments > 0) {
      this.loadCommentsForPost(post);
    }
  }

  loadCommentsForPost(post: Post) {
    this.http.get<any>(`${this.apiUrl}/posts/${post.id}/comments`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.success) {
            post.commentsList = response.comments;
          } else {
            this.notificationService.error('Erreur lors du chargement des commentaires');
          }
        },
        error: (error) => {
          this.notificationService.error(
            error.error?.message || 'Erreur de connexion au serveur'
          );
        }
      });
  }

  addComment(post: Post) {
    const commentContent = this.commentText[post.id];
    if (!commentContent || !commentContent.trim()) return;
    
    // Envoi de l'événement via WebSocket
    this.webSocketService.addComment(post.id, commentContent.trim());
    
    // Réinitialiser le champ de texte
    this.commentText[post.id] = '';
  }

  sharePost(post: Post) {
    // Envoi de l'événement via WebSocket
    this.webSocketService.sharePost(post.id);
    this.notificationService.success('Publication partagée avec succès');
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
