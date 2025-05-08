import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private currentUser: User | null = null;
  private lastLoginKey = 'lastLogin';

  constructor(private http: HttpClient, private router: Router) {
    // Vérifier s'il y a un utilisateur stocké
    this.checkUser();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.http.post<LoginResponse>(
        `${this.apiUrl}/login`, 
        { email, password }, 
        { withCredentials: true }
      ).toPromise();
      
      if (response && response.success && response.user) {
        // Stocker les informations de la dernière connexion
        this.saveLastLogin(response.user.lastLogin);
        this.currentUser = response.user;
        this.router.navigate(['/home']);
      }
      
      return response as LoginResponse;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  }

  async logout(): Promise<any> {
    try {
      const response = await this.http.post(
        `${this.apiUrl}/logout`, 
        {}, 
        { withCredentials: true }
      ).toPromise();
      
      // Réinitialiser l'utilisateur
      this.currentUser = null;
      this.router.navigate(['/login']);
      
      return response;
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  }

  async checkUser(): Promise<void> {
    try {
      const response = await this.http.get<any>(
        `${this.apiUrl}/user`, 
        { withCredentials: true }
      ).toPromise();
      
      if (response && response.success && response.user) {
        this.currentUser = response.user;
      }
    } catch (error) {
      // En cas d'erreur, l'utilisateur n'est pas authentifié
      this.currentUser = null;
    }
  }

  getLastLogin(): string | null {
    return localStorage.getItem(this.lastLoginKey);
  }

  private saveLastLogin(date: string): void {
    localStorage.setItem(this.lastLoginKey, date);
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }
}