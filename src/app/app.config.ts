import { ApplicationConfig } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

/* Application configuration
* provideClientHydration est un service qui permet de récupérer les données du serveur pour les injecter dans l'application côté client.
* provideHttpClient est un service qui permet de configurer le client HTTP pour effectuer des requêtes HTTP.
* provideRouter est un service qui permet de configurer le routage de l'application.
*/

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([]))
  ]
};
