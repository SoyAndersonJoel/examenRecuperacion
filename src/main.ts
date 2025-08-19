import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { initializeApp,provideFirebaseApp } from "@angular/fire/app";
import { getFirestore,provideFirestore } from "@angular/fire/firestore";
import { getAuth,provideAuth } from "@angular/fire/auth";

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { firebaseConfig } from "./environments/firebase.config";

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
  ],
});
