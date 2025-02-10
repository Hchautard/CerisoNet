import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { url } from 'inspector';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() { 
    var url = 'pedago.univ-avignon.fr:3221';
  }

  sendFormInformationToServer() {

    fetch('https://pedago.univ-avignon.fr:3221/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.loginForm.value),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
    })
  }


  login() {
    if (this.loginForm.valid) {
      console.log('Formulaire valide');
      this.sendFormInformationToServer();
    } else {
      console.log('Formulaire invalide');
    }
  }
}
