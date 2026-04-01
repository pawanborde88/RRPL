import { ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { VERSION as CDK_VERSION } from '@angular/cdk';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, VERSION as MAT_VERSION, MatNativeDateModule } from '@angular/material/core';
import { QuillModule } from 'ngx-quill';
import { authInterceptor } from './Auth/interceptors/auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ErpDateAdapter } from './Date Format/erp-date.adapter';
import { ERP_DATE_FORMATS } from './Date Format/date-formats';


console.info('Angular CDK version', CDK_VERSION.full);
console.info('Angular Material version', MAT_VERSION.full);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),

    provideAnimations(),

    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }, // DD-MM-YYYY
    { provide: DateAdapter, useClass: ErpDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: ERP_DATE_FORMATS },
    provideAnimationsAsync(),
    provideZonelessChangeDetection(),
    provideHttpClient(
      withInterceptors([
        authInterceptor
      ])
    ),
    importProvidersFrom(
      QuillModule.forRoot({
        sanitize: true,
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ header: 1 }, { header: 2 }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }],
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ font: [] }],
            [{ align: [] }],
            ['clean'],
            ['link', 'image', 'video'],
          ],
        },
      })
    ),

  ],
};
