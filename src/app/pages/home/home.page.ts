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
          message: 'Procesando imagen...'
        });
        await loading.present();

        try {
          // Convertir imagen a base64
          const reader = new FileReader();
          reader.onload = async (e: any) => {
            try {
              const imageUrl = e.target.result;
              
              // Comprimir imagen para Firebase gratuito
              const compressedImage = await this.compressImage(imageUrl);
              
              // Verificar tamaño para Firebase gratuito
              if (compressedImage.length > 500000) { // 500KB límite
                loading.dismiss();
                this.showError('La imagen es demasiado grande para Firebase gratuito. Se comprimió pero sigue siendo muy grande.');
                return;
              }

              await this.chatService.sendImageMessage(compressedImage, this.currentUser, 'Imagen seleccionada');
              loading.dismiss();
              this.showSuccess('Imagen enviada correctamente');
            } catch (error: any) {
              loading.dismiss();
              console.error('Error al enviar imagen:', error);
              this.showError('Error al enviar la imagen: ' + (error.message || 'Error desconocido'));
            }
          };
          
          reader.onerror = () => {
            loading.dismiss();
            this.showError('Error al procesar la imagen');
          };
          
          reader.readAsDataURL(file);
        } catch (error: any) {
          loading.dismiss();
          console.error('Error al procesar imagen:', error);
          this.showError('Error al procesar la imagen: ' + (error.message || 'Error desconocido'));
        }
      }
    };
    
    input.click();
  }

  async takePhoto() {
    try {
      const loading = await this.loadingController.create({
        message: 'Abriendo cámara...'
      });
      await loading.present();

      let photo;
      
      // Configuración optimizada para Firebase gratuito
      const cameraOptions = {
        quality: 50, // Reducir calidad para menor tamaño
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 400,  // Tamaño más pequeño
        height: 400
      };

      photo = await Camera.getPhoto(cameraOptions);
      loading.dismiss();

      if (photo && photo.dataUrl) {
        const uploadLoading = await this.loadingController.create({
          message: 'Procesando foto...'
        });
        await uploadLoading.present();

        try {
          // Comprimir imagen para Firebase gratuito
          const compressedImage = await this.compressImage(photo.dataUrl);
          
          if (compressedImage.length > 500000) { // 500KB límite para Firebase gratuito
            uploadLoading.dismiss();
            this.showError('La imagen es demasiado grande para Firebase gratuito. Intenta con menos calidad.');
            return;
          }

          await this.chatService.sendImageMessage(compressedImage, this.currentUser, 'Foto tomada');
          uploadLoading.dismiss();
          this.showSuccess('Foto enviada correctamente');
        } catch (error: any) {
          uploadLoading.dismiss();
          console.error('Error al enviar foto:', error);
          this.showError('Error al enviar la foto: ' + (error.message || 'Error desconocido'));
        }
      } else {
        this.showError('No se pudo obtener la imagen de la cámara');
      }
    } catch (error: any) {
      console.error('Error al acceder a la cámara:', error);
      if (error.message !== 'User cancelled photos app') {
        this.showError('Error al acceder a la cámara: ' + (error.message || 'Error desconocido'));
      }
    }
  }

  // Función para comprimir imágenes para Firebase gratuito
  private async compressImage(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Redimensionar para Firebase gratuito
        const maxWidth = 300;
        const maxHeight = 300;
        
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Comprimir con calidad baja para Firebase gratuito
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.3);
        resolve(compressedDataUrl);
      };
      
      img.src = dataUrl;
    });
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
      this.showSuccess('Ubicación compartida exitosamente');
    } catch (error: any) {
      loading.dismiss();
      
      // Manejar diferentes tipos de errores
      let errorMessage = error.message || error.toString();
      
      if (errorMessage.includes('denegado') || errorMessage.includes('denied')) {
        this.showLocationPermissionError();
      } else {
        this.showError('Error al obtener la ubicación: ' + errorMessage);
      }
    }
  }

  private async showLocationPermissionError() {
    const alert = await this.alertController.create({
      header: 'Permisos de Ubicación',
      message: 'Para compartir tu ubicación, necesitas permitir el acceso:\n\n' +
               '1. Busca el ícono 🔒 en la barra de direcciones\n' +
               '2. Selecciona "Permitir" para ubicación\n' +
               '3. Recarga la página si es necesario\n\n' +
               'También puedes ir a Configuración → Privacidad → Ubicación',
      buttons: [
        {
          text: 'Entendido',
          role: 'cancel'
        },
        {
          text: 'Intentar de nuevo',
          handler: () => {
            setTimeout(() => this.shareLocation(), 1000);
          }
        }
      ]
    });
    await alert.present();
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
