import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideFileRouter } from '@analogjs/router';

import { provideTrpcClient } from '../trpc-client';
import { SUPABASE_PROJECT, SUPABASE_PUB_KEY } from 'libs/auth/src';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFileRouter(),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideTrpcClient(),
    { provide: SUPABASE_PROJECT, useValue: process.env['DATABASE_REF'] },
    { provide: SUPABASE_PUB_KEY, useValue: process.env['DATABASE_PUB_KEY'] },
  ],
};
