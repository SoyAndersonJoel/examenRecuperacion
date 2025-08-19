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
    // Primero verificar permisos
    const permissions = await Geolocation.checkPermissions();
    
    if (permissions.location !== 'granted') {
      // Solicitar permisos
      const requestResult = await Geolocation.requestPermissions();
      
      if (requestResult.location !== 'granted') {
        throw new Error('Permisos de ubicación denegados');
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000
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

      // Verificar permisos primero en navegadores modernos
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'denied') {
            reject(new Error('Permisos de ubicación denegados. Por favor, permite el acceso a la ubicación en la configuración del navegador.'));
            return;
          }
          
          this.requestLocationFromNavigator(resolve, reject);
        }).catch(() => {
          // Si no se puede verificar permisos, intentar directamente
          this.requestLocationFromNavigator(resolve, reject);
        });
      } else {
        // Navegadores más antiguos
        this.requestLocationFromNavigator(resolve, reject);
      }
    });
  }

  private requestLocationFromNavigator(resolve: any, reject: any) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(new Error(this.getLocationErrorMessage(error)));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  private getLocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permiso de ubicación denegado. Ve a Configuración → Privacidad → Ubicación y permite el acceso a este sitio web.';
      case error.POSITION_UNAVAILABLE:
        return 'No se pudo obtener tu ubicación. Verifica que el GPS esté activado.';
      case error.TIMEOUT:
        return 'Tiempo de espera agotado. Intenta nuevamente.';
      default:
        return 'Error al obtener la ubicación. Verifica tus permisos y conexión.';
    }
  }
}
