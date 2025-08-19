import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
  IonItem,
  IonTextarea,
  ActionSheetController,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  ellipsisVertical, 
  send, 
  attach, 
  camera, 
  location, 
  trash, 
  logOut,
  image,
  images,
  close
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

import { AuthService } from '../../services/auth.service';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonButton,
    IonIcon,
    IonButtons,
    IonItem,
    IonTextarea,
    CommonModule, 
    FormsModule
  ]
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUser: string = '';
  private messagesSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private locationService: LocationService,
    private router: Router,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ 
      ellipsisVertical, 
      send, 
      attach, 
      camera, 
      location, 
      trash, 
      logOut,
      image,
      images,
      close
    });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.currentUser = user?.email || 'Anónimo';
    this.loadMessages();
  }

  ngOnDestroy() {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  loadMessages() {
    this.messagesSubscription = this.chatService.getMessages().subscribe(
      (messages) => {
        this.messages = messages;
        setTimeout(() => this.scrollToBottom(), 100);
      }
    );
  }

  async sendMessage(event?: Event) {
    // Si es un evento de teclado, verificar las teclas
    if (event && event instanceof KeyboardEvent) {
      if (!event.shiftKey) {
        event.preventDefault();
      } else {
        return; // Si se presiona Shift+Enter, no enviar el mensaje
      }
    }

    if (!this.newMessage.trim()) return;

    try {
      await this.chatService.sendTextMessage(this.newMessage.trim(), this.currentUser);
      this.newMessage = '';
    } catch (error) {
      this.showError('Error al enviar el mensaje');
    }
  }

  async presentAttachmentOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccionar adjunto',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            this.takePhoto();
          }
        },
        {
          text: 'Seleccionar imagen',
          icon: 'images',
          handler: () => {
            this.selectImage();
          }
        },
        {
          text: 'Ubicación',
          icon: 'location',
          handler: () => {
            this.shareLocation();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async selectImage() {
    // Crear input de tipo file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const loading = await this.loadingController.create({
          message: 'Subiendo imagen...'
        });
        await loading.present();

        try {
          // Convertir imagen a base64 (para la versión gratuita de Firebase)
          const reader = new FileReader();
          reader.onload = async (e: any) => {
            const imageUrl = e.target.result;
            await this.chatService.sendImageMessage(imageUrl, this.currentUser);
            loading.dismiss();
          };
          reader.readAsDataURL(file);
        } catch (error) {
          loading.dismiss();
          this.showError('Error al subir la imagen');
        }
      }
    };
    
    input.click();
  }

  async takePhoto() {
    try {
      let photo;
      
      // Verificar si estamos en un dispositivo móvil con Capacitor
      if (Capacitor.isNativePlatform()) {
        // Usar la cámara nativa en dispositivos móviles
        photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });
      } else {
        // Usar la cámara web en navegadores
        photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          width: 300,
          height: 300
        });
      }

      if (photo && photo.dataUrl) {
        const loading = await this.loadingController.create({
          message: 'Enviando foto...'
        });
        await loading.present();

        try {
          await this.chatService.sendImageMessage(photo.dataUrl, this.currentUser, 'Foto tomada');
          loading.dismiss();
        } catch (error) {
          loading.dismiss();
          this.showError('Error al enviar la foto');
        }
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        this.showError('Error al acceder a la cámara: ' + error.message);
      }
    }
  }

  async shareLocation() {
    const loading = await this.loadingController.create({
      message: 'Obteniendo ubicación...'
    });
    await loading.present();

    try {
      const location = await this.locationService.getCurrentLocation();
      await this.chatService.sendLocationMessage(
        location.latitude, 
        location.longitude, 
        this.currentUser
      );
      loading.dismiss();
    } catch (error) {
      loading.dismiss();
      this.showError('Error al obtener la ubicación: ' + error);
    }
  }

  async presentOptionsActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones',
      buttons: [
        {
          text: 'Borrar historial',
          icon: 'trash',
          handler: () => {
            this.confirmClearHistory();
          }
        },
        {
          text: 'Cerrar sesión',
          icon: 'log-out',
          handler: () => {
            this.logout();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async confirmClearHistory() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que quieres borrar todo el historial del chat?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Borrar',
          role: 'destructive',
          handler: () => {
            this.clearHistory();
          }
        }
      ]
    });
    await alert.present();
  }

  async clearHistory() {
    try {
      await this.chatService.clearChatHistory();
      this.showSuccess('Historial borrado exitosamente');
    } catch (error) {
      this.showError('Error al borrar el historial');
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      this.showError('Error al cerrar sesión');
    }
  }

  openMap(latitude: number, longitude: number) {
    const mapUrl = this.chatService.generateMapLink(latitude, longitude);
    window.open(mapUrl, '_blank');
  }

  viewImage(imageUrl: string) {
    // Abrir imagen en nueva ventana
    window.open(imageUrl, '_blank');
  }

  isMyMessage(sender: string): boolean {
    return sender === this.currentUser;
  }

  formatTimestamp(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger'
    });
    toast.present();
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
