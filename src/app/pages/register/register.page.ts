import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton,
  IonIcon,
  IonSpinner,
  IonButtons,
  IonBackButton,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAdd } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonItem, 
    IonLabel, 
    IonInput, 
    IonButton,
    IonIcon,
    IonSpinner,
    IonButtons,
    IonBackButton,
    CommonModule, 
    FormsModule
  ]
})
export class RegisterPage implements OnInit {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ personAdd });
  }

  ngOnInit() {}

  async register() {
    if (!this.email || !this.password || !this.confirmPassword) {
      this.showError('Por favor completa todos los campos');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showError('Las contraseñas no coinciden');
      return;
    }

    if (this.password.length < 6) {
      this.showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.register(this.email, this.password);
      await this.showSuccess('¡Cuenta creada exitosamente!');
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.showError(this.getErrorMessage(error.code));
    } finally {
      this.isLoading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/weak-password':
        return 'La contraseña es muy débil';
      default:
        return 'Error al crear la cuenta. Intenta nuevamente';
    }
  }

  private showError(message: string) {
    this.errorMessage = message;
  }

  private async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success'
    });
    toast.present();
  }
}
