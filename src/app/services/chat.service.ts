import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, orderBy, deleteDoc, getDocs } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id?: string;
  message: string;
  sender: string;
  timestamp: any;
  type: 'text' | 'image' | 'location';
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesCollection = collection(this.firestore, 'messages');

  constructor(private firestore: Firestore) {}

  // Enviar mensaje de texto
  async sendTextMessage(message: string, sender: string): Promise<void> {
    const chatMessage: ChatMessage = {
      message,
      sender,
      timestamp: new Date(),
      type: 'text'
    };
    
    await addDoc(this.messagesCollection, chatMessage);
  }

  // Enviar mensaje con imagen
  async sendImageMessage(imageUrl: string, sender: string, message?: string): Promise<void> {
    try {
      const chatMessage: ChatMessage = {
        message: message || 'Imagen compartida',
        sender,
        timestamp: new Date(),
        type: 'image',
        imageUrl
      };
      
      console.log('Enviando mensaje de imagen:', {
        sender,
        message: chatMessage.message,
        imageSize: imageUrl.length
      });
      
      await addDoc(this.messagesCollection, chatMessage);
      console.log('Mensaje de imagen enviado correctamente');
    } catch (error) {
      console.error('Error en sendImageMessage:', error);
      throw error;
    }
  }

  // Enviar ubicación
  async sendLocationMessage(latitude: number, longitude: number, sender: string): Promise<void> {
    const chatMessage: ChatMessage = {
      message: `Ubicación compartida: ${latitude}, ${longitude}`,
      sender,
      timestamp: new Date(),
      type: 'location',
      latitude,
      longitude
    };
    
    await addDoc(this.messagesCollection, chatMessage);
  }

  // Obtener mensajes en tiempo real
  getMessages(): Observable<ChatMessage[]> {
    const q = query(this.messagesCollection, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<ChatMessage[]>;
  }

  // Borrar historial del chat
  async clearChatHistory(): Promise<void> {
    const querySnapshot = await getDocs(this.messagesCollection);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }

  // Generar enlace de Google Maps
  generateMapLink(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
}
