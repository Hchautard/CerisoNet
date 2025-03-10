import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  lastLogin: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://pedago.univ-avignon.fr:3221';
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  private lastLoginKey = 'lastLogin';

  constructor(private http: HttpClient, private router: Router) {
    // Vérifier s'il y a un utilisateur stocké dans le localStorage
    this.checkUser();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response.success && response.user) {
            
            // Stocker les informations de la dernière connexion
            this.saveLastLogin(response.user.lastLogin);
            this.userSubject.next(response.user);
            this.router.navigate(['/home']);
          }
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          // Réinitialiser l'utilisateur
          this.userSubject.next(null);
          this.router.navigate(['/login']);
        })
      );
  }

  // Vérifier si l'utilisateur est authentifié en appellant le backend
  checkUser(): void {
    this.http.get<any>(`${this.apiUrl}/user`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.success && response.user) {
            this.userSubject.next(response.user);
          }
        },
        error: () => {
          // En cas d'erreur, l'utilisateur n'est pas authentifié
          this.userSubject.next(null);
        }
      });
  }

  // Récupérer la date de la dernière connexion depuis le localStorage
  getLastLogin(): string | null {
    return localStorage.getItem(this.lastLoginKey);
  }

  // Sauvegarder la date de la dernière connexion dans le localStorage
  private saveLastLogin(date: string): void {
    localStorage.setItem(this.lastLoginKey, date);
  }

  // Vérifier si l'utilisateur est actuellement connecté
  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }
}