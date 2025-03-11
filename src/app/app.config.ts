import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

/* Application configuration
* provideHttpClient est un service qui permet de configurer le client HTTP pour effectuer des requêtes HTTP.
* provideRouter est un service qui permet de configurer le routage de l'application.
*/
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([]))
  ]
};
