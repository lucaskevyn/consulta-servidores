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
      pt: {
        table: {
          root: { class: 'w-full text-xs' },
          header: { class: 'bg-gray-100 text-gray-700 rounded-t-lg' },
          footer: { class: 'text-xs' },
        },

        inputtext: {
          root: {
            class: 'border border-gray-300 rounded px-2 py-1 text-xs h-7',
          },
        },

        dropdown: {
          root: { class: 'text-xs h-7' },
          panel: {
            class:
              'bg-white border border-gray-300 rounded shadow-md text-xs z-[9999]',
          },
          item: { class: 'px-2 py-1 hover:bg-gray-100 cursor-pointer text-xs' },
        },

        multiselect: {
          root: { class: 'text-xs h-7 min-h-7' },
          label: { class: 'text-xs' },
          panel: {
            class:
              'bg-white border border-gray-300 rounded shadow-md text-xs z-[9999]',
          },
          item: { class: 'px-2 py-1 hover:bg-gray-100 cursor-pointer text-xs' },
          token: {
            class: 'bg-gray-200 text-gray-700 px-1 py-0.5 text-xs rounded',
          },
        },

        paginator: {
          root: {
            class:
              'flex items-center justify-end px-2 py-1 text-xs border-t border-gray-200',
          },
          pageButton: { class: 'px-2 py-1 rounded hover:bg-gray-200 text-xs' },
          currentPageButton: { class: 'bg-gray-700 text-white' },
        },

        columnfilter: {
          container: { class: 'flex flex-col gap-1' },
        },
      },
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
