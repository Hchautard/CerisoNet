import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;
  private connectedUsers: any[] = [];
  
  // Observables exposés aux composants
  connectedUsers$: Observable<any[]>;
  newPost$: Observable<any>;
  postLiked$: Observable<any>;
  newComment$: Observable<any>;
  postShared$: Observable<any>;
  userConnected$: Observable<any>;
  userDisconnected$: Observable<any>;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.socket = io('https://pedago.univ-avignon.fr:3221', {
      withCredentials: true,
      autoConnect: false
    });
    
    // Création des observables
    this.connectedUsers$ = new Observable<any[]>(observer => {
      this.socket.on('connected-users', (users: any[]) => {
        this.connectedUsers = users;
        observer.next(users);
      });
    });
    
    this.userConnected$ = new Observable<any>(observer => {
      this.socket.on('user-connected', (user: any) => {
        observer.next(user);
        this.socket.emit('get-connected-users');
      });
    });
    
    this.userDisconnected$ = new Observable<any>(observer => {
      this.socket.on('user-disconnected', (user: any) => {
        observer.next(user);
        this.socket.emit('get-connected-users');
      });
    });
    
    this.newPost$ = new Observable<any>(observer => {
      this.socket.on('new-post', (post: any) => {
        observer.next(post);
      });
    });
    
    this.postLiked$ = new Observable<any>(observer => {
      this.socket.on('post-liked', (data: any) => {
        observer.next(data);
      });
    });
    
    this.newComment$ = new Observable<any>(observer => {
      this.socket.on('new-comment', (comment: any) => {
        observer.next(comment);
      });
    });
    
    this.postShared$ = new Observable<any>(observer => {
      this.socket.on('post-shared', (data: any) => {
        this.notificationService.info(`${data.userName} a partagé une publication`);
        observer.next(data);
      });
    });

    // Configuration des autres écouteurs d'événements
    this.setupSocketListeners();
  }

  /**
   * Initialise la connexion WebSocket
   */
  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
      
      // Authentification auprès du serveur WebSocket
      const user = this.authService.getCurrentUser();
      if (user) {
        this.authenticate(user);
      }
    }
  }

  /**
   * Ferme la connexion WebSocket
   */
  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  /**
   * Configure les écouteurs d'événements WebSocket additionnels
   */
  private setupSocketListeners() {    
    // Gestion de la confirmation de partage
    this.socket.on('share-success', (data: any) => {
      if (data.success) {
        this.notificationService.success(data.message || 'Publication partagée avec succès');
      } else {
        this.notificationService.error(data.message || 'Erreur lors du partage de la publication');
      }
    });
    
    // Gestion des erreurs
    this.socket.on('error', (error: any) => {
      console.error('Erreur WebSocket:', error);
      this.notificationService.error(error.message || 'Une erreur est survenue');
    });
  }

  /**
   * Récupère la liste des utilisateurs connectés
   */
  getConnectedUsers(): void {
    if (!this.socket) return;
    this.socket.emit('get-connected-users');
  }

  /**
   * Authentifie l'utilisateur auprès du serveur WebSocket
   */
  authenticate(userData: any): void {
    this.socket.emit('authenticate', userData);
  }

  /**
   * Envoie un like pour un post
   * @param postId Identifiant du post 
   */
  likePost(postId: string | number): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.socket.emit('like-post', {
        postId,
        userId: user.id
      });
    }
  }

  /**
   * Ajoute un commentaire à un post
   * @param postId Identifiant du post (chaîne MongoDB ou nombre)
   * @param content Contenu du commentaire
   */
  addComment(postId: string | number, content: string): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.socket.emit('add-comment', {
        postId,
        userId: user.id,
        userName: `${user.prenom} ${user.nom}`,
        content
      });
    }
  }

  /**
   * Partage un post
   * @param postId Identifiant du post (chaîne MongoDB ou nombre)
   */
  sharePost(postId: string | number): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.socket.emit('share-post', {
        postId,
        userId: user.id,
        userName: `${user.prenom} ${user.nom}`
      });
    }
  }
}