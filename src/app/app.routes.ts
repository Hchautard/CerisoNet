import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from '../guards/auth.guard';
import { RegisterComponent } from './register/register.component';

export const routes: Routes = [
    { path: '', component: LoginComponent, title: 'Login' },
    { path: 'login', component: LoginComponent, title: 'Login' },
    { path: 'register', component: RegisterComponent, title: 'Register' },
    { path: 'home', component: HomeComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '/login' }
];