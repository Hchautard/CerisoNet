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
  templateUrl: './home.component.html',
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