import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { NotificationComponent } from '../notification/notification.component';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

interface Post {
  id: string;           // MongoDB _id (converti en string)
  content: string;      // body du message
  author: string;       // Nom de l'auteur (à partir de createdBy)
  authorId?: number;    // createdBy (id de l'auteur)
  authorAvatar: string;      // avatar de l'auteur
  likes: number;        // likes
  comments: Comment[];     
  date: string;         // date + heure formatée
  hashtags?: string[];  // hashtags
  images?: {             
    url: string;
    title: string;
  };
  shared?: string; // id du post partagé (si applicable)
  showComments?: boolean;
}

interface Comment {
  id: string;
  commentedBy: number;
  commentedByName?: string;
  commentedByAvatar?: string;
  text: string;  
  date: string;
  hour: string;
}

interface ConnectedUser {
  id: number;
  nom: string;
  prenom: string;
  avatar: string;
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
  commentText: { [key: string]: string } = {};
  connectedUsers: ConnectedUser[] = [];
  private apiUrl = 'https://pedago.univ-avignon.fr:3221';
  private subscriptions: Subscription[] = [];

  // Propriétés pour la pagination
  currentPage = 1;
  pageSize = 5;
  totalPosts = 0;
  totalPages = 1;
  pageSizeOptions = [5, 10, 20, 50];

  // Propriétés pour le filtrage
  filterByHashtag: string | null = null;
  filterByOwner: 'all' | 'me' | 'others' = 'all';

  // Propriétés pour le tri
  sortBy: 'date' | 'owner' | 'popularity' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private authService: AuthService, 
    private notificationService: NotificationService,
    private http: HttpClient,
    private webSocketService: WebSocketService,
    private router: Router
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur est connecté
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = `${user.prenom} ${user.nom}`;
      // Connexion au WebSocket
      this.webSocketService.connect();
      
      // Charger les utilisateurs connectés
      this.loadConnectedUsers();
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

  // Fonction pour aller sur l'api de Mme Nabitz
  goToJavaApi() {
    this.router.navigate(['/java_api']);
  }

  goToDocumentation() {
    window.open('https://pedago.univ-avignon.fr:3221/api-docs', '_blank');
  }

  loadConnectedUsers() {
    this.http.get<any>(`${this.apiUrl}/users/connected`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Filtrer pour ne pas inclure l'utilisateur actuel
            const currentUser = this.authService.getCurrentUser();
            this.connectedUsers = response.connectedUsers.filter(
              (user: ConnectedUser) => currentUser && user.id !== currentUser.id
            );
          } else {
            console.error('Erreur lors du chargement des utilisateurs connectés');
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des utilisateurs connectés:', error);
        }
      });
  }

  /**
   * Configure les écouteurs d'événements WebSocket
   */
  setupWebSocketListeners() {
    // Liste des utilisateurs connectés
    this.subscriptions.push(
      this.webSocketService.connectedUsers$.subscribe(users => {
        // Filtrer pour ne pas inclure l'utilisateur actuel
        const currentUser = this.authService.getCurrentUser();
        this.connectedUsers = currentUser 
          ? users.filter(user => user.id !== currentUser.id) 
          : users;
      })
    );
    
    // Connexion d'un nouvel utilisateur
    this.subscriptions.push(
      this.webSocketService.userConnected$.subscribe(user => {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && user.id !== currentUser.id && !this.connectedUsers.some(u => u.id === user.id)) {
          this.connectedUsers.push(user);
        }
      })
    );
    
    // Déconnexion d'un utilisateur
    this.subscriptions.push(
      this.webSocketService.userDisconnected$.subscribe(user => {
        this.connectedUsers = this.connectedUsers.filter(u => u.id !== user.id);
      })
    );
    
    // Réception d'un like sur un post
    this.subscriptions.push(
      this.webSocketService.postLiked$.subscribe(data => {
        if (data.success) {
          const post = this.posts.find(p => p.id === data.postId);
          if (post) {
            post.likes = data.totalLikes !== undefined ? data.totalLikes : post.likes + 1;
          }
        }
      })
    );
    
    // Réception d'un nouveau commentaire
    this.subscriptions.push(
      this.webSocketService.newComment$.subscribe(comment => {
        const post = this.posts.find(p => p.id === comment.postId);
        if (post) {
          if (!post.comments) {
            post.comments = [];
          }
          post.comments.push(comment);
          post.showComments = true;
        }
      })
    );
    
    // Réception d'un post partagé 
    this.subscriptions.push(
      this.webSocketService.postShared$.subscribe(data => {
        // La notification est déjà gérée par le service WebSocket
        // Recharger les posts pour voir le nouveau post partagé
        this.loadPosts();
      })
    );
  }

  /**
   * Méthode pour charger les posts avec pagination, tri et filtrage
   */
  loadPosts() {
    this.loading = true;
    const params: any = {
      page: this.currentPage.toString(),
      pageSize: this.pageSize.toString(),
      hashtag: this.filterByHashtag || '',
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      filterByOwner: this.filterByOwner
    };
    
    // Si filtre propriétaire est "me" alors id de l'utilisateur connecté
    if (this.filterByOwner !== 'all') {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        params.userId = currentUser.id.toString();
      }
    }
    
    this.http.get<any>(`${this.apiUrl}/posts`, { 
      params,
      withCredentials: true 
    })
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            // Mise à jour des infos de pagination
            this.totalPosts = response.total || 0;
            this.totalPages = Math.ceil(this.totalPosts / this.pageSize);
            
            // Vérifier que les données sont dans le bon format
            if (response.posts && Array.isArray(response.posts)) {
              this.posts = response.posts.map((post: any) => {
                
                return {
                  id: post.id || '',
                  content: post.content || '',
                  author: post.author || 'Inconnu',
                  authorId: post.authorId,
                  authorAvatar: post.authorAvatar || '',
                  likes: post.likes || 0,
                  likedBy: post.likedBy || [],
                  images: post.images || null,
                  comments: post.comments || [],
                  date: post.date || new Date().toISOString(),
                  hashtags: post.hashtags || [],
                  isShared: post.isShared || false,
                  sharedFrom: post.sharedFrom ? {
                    id: post.sharedFrom,
                    name: post.sharedFromName || 'Utilisateur inconnu'
                  } : undefined,
                  originalPost: post.originalPost || '',
                  showComments: false
                };
              });
              console.log('Posts après traitement:', this.posts);
            } else {
              console.error('Format de posts incorrect:', response.posts);
              this.notificationService.error('Format de données incorrect');
            }
          } else {
            this.notificationService.error('Erreur lors du chargement des posts');
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Erreur lors du chargement des posts:', error);
          this.notificationService.error(
            error.error?.message || 'Erreur de connexion au serveur'
          );
        }
      });
  }

  /**
   * Méthodes pour la pagination
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadPosts();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPosts();
    }
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPosts();
    }
  }

  changePageSize(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize = parseInt(select.value, 10);
    this.currentPage = 1; // Retour à la première page
    this.loadPosts();
  }

  /**
   * Méthodes de filtrage
   */
  // Filtrage par hashtag
  applyHashtagFilter(hashtag: string) {
    this.filterByHashtag = hashtag;
    this.currentPage = 1; // Retour à la première page
    this.loadPosts();
  }

  clearHashtagFilter() {
    this.filterByHashtag = null;
    this.currentPage = 1; // Retour à la première page
    this.loadPosts();
  }

  // Filtrage par propriétaire
  filterByPostOwner(ownerType: 'all' | 'me' | 'others') {
    this.filterByOwner = ownerType;
    this.currentPage = 1; // Retour à la première page
    this.loadPosts();
  }

  /**
   * Méthodes de tri
   */
  applySorting(sortOption: 'date' | 'owner' | 'popularity') {
    if (this.sortBy === sortOption) {
      // Si on clique sur le même critère de tri, on inverse la direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Sinon on change le critère de tri et on met la direction par défaut
      this.sortBy = sortOption;
      // Date: par défaut du plus récent au plus ancien
      // Owner: par défaut ordre alphabétique (A-Z)
      // Popularité: par défaut du plus de like au moins de like
      this.sortDirection = sortOption === 'owner' ? 'asc' : 'desc';
    }
    this.loadPosts();
  }

  // Méthode pour obtenir l'icône de tri en fonction du statut actuel
  getSortIcon(column: string): string {
    if (this.sortBy !== column) {
      return 'sort'; 
    }
    return this.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  createPost() {
    this.notificationService.showNotification('Bientôt là...', 'info', 2000);
  }

  likePost(post: Post) {
    
    // Envoi de l'événement via WebSocket
    this.webSocketService.likePost(Number(post.id));
  }

  toggleComments(post: Post) {
    post.showComments = !post.showComments;
    
    // Si on affiche les commentaires et qu'ils n'ont pas été chargés, on les charge
    if (post.showComments && !post.comments) {
      this.loadCommentsForPost(post);
    }
  }

  loadCommentsForPost(post: Post) {
    this.http.get<any>(`${this.apiUrl}/posts/${post.id}/comments`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.success) {
            post.comments = response.comments || [];
          } else {
            this.notificationService.error('Erreur lors du chargement des commentaires');
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des commentaires:', error);
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
    this.webSocketService.addComment(Number(post.id), commentContent.trim());
    
    // Réinitialiser le champ de texte
    this.commentText[post.id] = '';
  }

  sharePost(post: Post) {
    // Envoi de l'événement via WebSocket
    this.webSocketService.sharePost(Number(post.id));
    this.notificationService.success('Publication partagée avec succès');
  }

  logout() {
    this.authService.logout();
  }
}