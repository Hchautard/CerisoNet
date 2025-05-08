import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { JavaApiComponent } from './java-api/java-api.component';

export const routes: Routes = [
    { path: '', component: LoginComponent, title: 'Login' },
    { path: 'login', component: LoginComponent, title: 'Login' },
    { path: 'register', component: RegisterComponent, title: 'Register' },
    { path: 'home', component: HomeComponent, title: 'Home'},
    { path: 'java_api', component: JavaApiComponent, title: 'Java API'},
    { path: '**', redirectTo: '/login' }
];