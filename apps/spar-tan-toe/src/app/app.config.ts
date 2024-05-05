import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideFileRouter } from '@analogjs/router';

import { provideTrpcClient } from '../trpc-client';
import {
  SUPABASE_PROJECT,
  SUPABASE_PUB_KEY,
  SupabaseClientService,
} from '@agora/supabase/core';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_INIT_OPTIONS,
  GoogleAuthService,
  SupabaseAuth,
} from '@agora/supabase/auth';
import { ScriptLoaderService } from '@agora/script-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFileRouter(),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideTrpcClient(),

    // Custom providers
    ScriptLoaderService,
    { provide: SUPABASE_PROJECT, useValue: import.meta.env.VITE_DATABASE_REF },
    {
      provide: SUPABASE_PUB_KEY,
      useValue: import.meta.env.VITE_DATABASE_PUB_KEY,
    },
    SupabaseClientService,
    SupabaseAuth,
    GoogleAuthService,
    {
      provide: GOOGLE_CLIENT_ID,
      useValue: import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID,
    },
    { provide: GOOGLE_INIT_OPTIONS, useValue: {} },
  ],
};
