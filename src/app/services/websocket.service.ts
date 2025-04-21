import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;
  private connectedUsers: any[] = [];
  
  // Sujets pour les événements WebSocket
  private connectedUsersSubject = new Subject<any[]>();
  private newPostSubject = new Subject<any>();
  private postLikedSubject = new Subject<any>();
  private newCommentSubject = new Subject<any>();
  private postSharedSubject = new Subject<any>();
  
  // Observables exposés aux composants
  connectedUsers$ = this.connectedUsersSubject.asObservable();
  newPost$ = this.newPostSubject.asObservable();
  postLiked$ = this.postLikedSubject.asObservable();
  newComment$ = this.newCommentSubject.asObservable();
  postShared$ = this.postSharedSubject.asObservable();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.socket = io('https://pedago.univ-avignon.fr:3221', {
      withCredentials: true,
      autoConnect: false
    });
    
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
   * Configure les écouteurs d'événements WebSocket
   */
  private setupSocketListeners() {
    // Réception de la liste des utilisateurs connectés
    this.socket.on('connected-users', (users: any[]) => {
      this.connectedUsers = users;
      this.connectedUsersSubject.next(this.connectedUsers);
    });
    
    // Notification de connexion d'un nouvel utilisateur
    this.socket.on('user-connected', (user: any) => {
      this.connectedUsers.push(user);
      this.connectedUsersSubject.next(this.connectedUsers);
      this.notificationService.info(`${user.prenom} ${user.nom} s'est connecté(e)`);
    });
    
    // Notification de déconnexion d'un utilisateur
    this.socket.on('user-disconnected', (user: any) => {
      this.connectedUsers = this.connectedUsers.filter(u => u.id !== user.id);
      this.connectedUsersSubject.next(this.connectedUsers);
      this.notificationService.info(`${user.prenom} ${user.nom} s'est déconnecté(e)`);
    });
    
    // Réception d'un nouveau post
    this.socket.on('new-post', (post: any) => {
      this.newPostSubject.next(post);
    });
    
    // Notification de like sur un post
    this.socket.on('post-liked', (data: any) => {
      this.postLikedSubject.next(data);
    });
    
    // Réception d'un nouveau commentaire
    this.socket.on('new-comment', (comment: any) => {
      this.newCommentSubject.next(comment);
    });
    
    // Notification de partage d'un post
    this.socket.on('post-shared', (data: any) => {
      this.postSharedSubject.next(data);
      this.notificationService.info(`${data.userName} a partagé une publication`);
    });
  }

  /**
   * Authentifie l'utilisateur auprès du serveur WebSocket
   */
  authenticate(userData: any) {
    this.socket.emit('authenticate', userData);
  }

  /**
   * Envoie un like pour un post
   * @param postId Identifiant du post (chaîne MongoDB ou nombre)
   * @param newLikeCount Nouveau nombre de likes
   */
  likePost(postId: string | number, newLikeCount: number) {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.socket.emit('like-post', {
        postId,
        userId: user.id,
        userName: `${user.prenom} ${user.nom}`,
        newLikeCount
      });
    }
  }

  /**
   * Ajoute un commentaire à un post
   * @param postId Identifiant du post (chaîne MongoDB ou nombre)
   * @param content Contenu du commentaire
   */
  addComment(postId: string | number, content: string) {
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
  sharePost(postId: string | number) {
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