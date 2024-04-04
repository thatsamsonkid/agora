import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideFileRouter } from '@analogjs/router';

import { provideTrpcClient } from '../trpc-client';
import { SUPABASE_PROJECT, SUPABASE_PUB_KEY, SupabaseAuth } from '@agora/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFileRouter(),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideTrpcClient(),
    { provide: SUPABASE_PROJECT, useValue: import.meta.env.VITE_DATABASE_REF },
    {
      provide: SUPABASE_PUB_KEY,
      useValue: import.meta.env.VITE_DATABASE_PUB_KEY,
    },
    SupabaseAuth,
  ],
};
