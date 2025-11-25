import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { PRIME_NG_TAILWIND } from './primeng-tailwind.config';
import Aura from '@primeuix/themes/aura';
import { definePreset, palette } from '@primeuix/themes';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      pt: PRIME_NG_TAILWIND,
      theme: {
        preset: definePreset(Aura, {
          semantic: {
            primary: palette('{rose}'),
            colorScheme: {
              light: {
                primary: {
                  color: '{primary.800}',
                  hoverColor: '{primary.900}',
                  activeColor: '{primary.950}',
                },
              },
            },
          },
        }),
        options: {
          darkModeSelector: false,
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
    }),
  ],
};
