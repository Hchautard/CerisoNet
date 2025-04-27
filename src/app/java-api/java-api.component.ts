import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Message {
  _id?: string;
  body: string;
  createdBy: number;
  date?: string;
  hour?: string;
  likes?: number;
  likedBy?: number[];
  comments?: Comment[];
  hashtags?: string[];
  images?: string[];
  showCommentForm?: boolean;
  newComment?: string;
}

interface Comment {
  commentedBy: number;
  text: string;
  date: string;
  hour: string;
}

@Component({
  selector: 'app-java-api',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './java-api.component.html',
  styleUrls: ['./java-api.component.css']
})
export class JavaApiComponent implements OnInit {
  // URL de l'API
  private apiUrl = 'https://pedago.univ-avignon.fr:3569/api/messages';
  
  // Données utilisateur (à remplacer par la gestion d'authentification réelle)
  currentUserId = 1;
  
  // État des données
  messages: Message[] = [];
  loading = false;
  error: string | null = null;
  
  // Formulaire de création de message
  newMessage: Message = {
    body: '',
    createdBy: this.currentUserId,
    hashtags: []
  };
  
  // Recherche
  searchTerm = '';
  hashtagSearch = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMessages();
  }

  // Charger les messages
  loadMessages(): void {
    this.loading = true;
    this.error = null;
    
    this.http.get<any[]>(this.apiUrl)
      .subscribe({
        next: (data) => {
          this.messages = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des messages', err);
          this.error = 'Impossible de charger les messages. Veuillez réessayer.';
          this.loading = false;
        }
      });
  }

  // Publier un nouveau message
  postMessage(): void {
    if (!this.newMessage.body || this.newMessage.body.trim() === '') {
      this.error = 'Le contenu du message ne peut pas être vide';
      return;
    }

    // Traiter les hashtags s'ils sont fournis
    if (typeof this.newMessage.hashtags === 'string') {
      this.newMessage.hashtags = (this.newMessage.hashtags as string)
        .split(' ')
        .filter(tag => tag.trim() !== '')
        .map(tag => tag.startsWith('#') ? tag.substring(1) : tag);
    }
    
    this.loading = true;
    this.http.post(this.apiUrl, this.newMessage)
      .subscribe({
        next: () => {
          // Réinitialiser le formulaire
          this.newMessage = {
            body: '',
            createdBy: this.currentUserId,
            hashtags: []
          };
          
          // Recharger les messages
          this.loadMessages();
        },
        error: (err) => {
          console.error('Erreur lors de la publication du message', err);
          this.error = 'Impossible de publier le message. Veuillez réessayer.';
          this.loading = false;
        }
      });
  }

  // Aimer un message
  likeMessage(message: Message): void {
    if (!message._id) return;
    
    const isLiked = this.isLikedByCurrentUser(message);
    const endpoint = `${this.apiUrl}/${message._id}/like?userId=${this.currentUserId}`;
    
    if (isLiked) {
      // Retirer le like
      this.http.delete(endpoint)
        .subscribe({
          next: () => {
            if (message.likes && message.likes > 0) message.likes--;
            if (message.likedBy) {
              const index = message.likedBy.indexOf(this.currentUserId);
              if (index > -1) message.likedBy.splice(index, 1);
            }
          },
          error: (err) => {
            console.error('Erreur lors du retrait du like', err);
            this.error = 'Impossible de retirer le like. Veuillez réessayer.';
          }
        });
    } else {
      // Ajouter le like
      this.http.post(endpoint, {})
        .subscribe({
          next: () => {
            if (!message.likes) message.likes = 0;
            message.likes++;
            if (!message.likedBy) message.likedBy = [];
            message.likedBy.push(this.currentUserId);
          },
          error: (err) => {
            console.error('Erreur lors de l\'ajout du like', err);
            this.error = 'Impossible d\'ajouter le like. Veuillez réessayer.';
          }
        });
    }
  }

  // Vérifier si l'utilisateur actuel a aimé un message
  isLikedByCurrentUser(message: Message): boolean {
    return message.likedBy ? message.likedBy.includes(this.currentUserId) : false;
  }

  // Ajouter un commentaire
  addComment(message: Message): void {
    if (!message._id || !message.newComment || message.newComment.trim() === '') {
      return;
    }
    
    const comment = {
      commentedBy: this.currentUserId,
      text: message.newComment
    };
    
    this.http.post(`${this.apiUrl}/${message._id}/comment`, comment)
      .subscribe({
        next: () => {
          // Ajouter le commentaire à la liste locale
          if (!message.comments) message.comments = [];
          message.comments.push({
            ...comment,
            date: new Date().toISOString().split('T')[0],
            hour: new Date().toTimeString().split(' ')[0]
          } as Comment);
          
          // Réinitialiser le formulaire
          message.newComment = '';
          message.showCommentForm = false;
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout du commentaire', err);
          this.error = 'Impossible d\'ajouter le commentaire. Veuillez réessayer.';
        }
      });
  }

  // Rechercher des messages
  searchMessages(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.loadMessages();
      return;
    }
    
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/search?term=${encodeURIComponent(this.searchTerm)}`)
      .subscribe({
        next: (data) => {
          this.messages = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors de la recherche', err);
          this.error = 'Impossible d\'effectuer la recherche. Veuillez réessayer.';
          this.loading = false;
        }
      });
  }

  // Rechercher par hashtag
  searchByHashtag(hashtag: string): void {
    if (!hashtag || hashtag.trim() === '') {
      this.loadMessages();
      return;
    }
    
    // Supprimer le # si présent
    const tag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
    
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/hashtag/${encodeURIComponent(tag)}`)
      .subscribe({
        next: (data) => {
          this.messages = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors de la recherche par hashtag', err);
          this.error = 'Impossible d\'effectuer la recherche par hashtag. Veuillez réessayer.';
          this.loading = false;
        }
      });
  }

  // Formater la date et l'heure
  formatDateTime(date?: string, hour?: string): string {
    if (!date) return '';
    
    try {
      const dateObj = new Date(`${date}${hour ? 'T' + hour : ''}`);
      return dateObj.toLocaleString();
    } catch (e) {
      return `${date} ${hour || ''}`;
    }
  }

  goBack(): void {
    window.history.back();
  }
}