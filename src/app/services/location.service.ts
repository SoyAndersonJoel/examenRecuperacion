import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  constructor() { }

  // Obtener ubicación actual
  async getCurrentLocation(): Promise<LocationData> {
    try {
      // Verificar si estamos en un dispositivo móvil con Capacitor
      if (Capacitor.isNativePlatform()) {
        return await this.getLocationWithCapacitor();
      } else {
        return await this.getLocationWithWebAPI();
      }
    } catch (error) {
      // Fallback a Web API si Capacitor falla
      return await this.getLocationWithWebAPI();
    }
  }

  // Obtener ubicación usando Capacitor (para móviles)
  private async getLocationWithCapacitor(): Promise<LocationData> {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };
  }

  // Obtener ubicación usando Web API (para navegadores)
  private async getLocationWithWebAPI(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada por este navegador'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(this.getLocationErrorMessage(error));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  private getLocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permiso de ubicación denegado por el usuario';
      case error.POSITION_UNAVAILABLE:
        return 'Información de ubicación no disponible';
      case error.TIMEOUT:
        return 'Tiempo de espera agotado para obtener la ubicación';
      default:
        return 'Error desconocido al obtener la ubicación';
    }
  }
}
