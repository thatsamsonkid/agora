import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  createClient,
  Session,
  Subscription,
  SupabaseClient,
} from '@supabase/supabase-js';
import { SUPABASE_PROJECT, SUPABASE_PUB_KEY } from './supabase-token';

enum OAuthProviders {
  GOOGLE = 'google',
  APPLE = 'apple',
}

@Injectable()
export class SupabaseAuth implements OnDestroy {
  private _session = signal<Session | null>(null);
  private _supabase!: SupabaseClient;

  private _SUPABASE_PROJECT = inject(SUPABASE_PROJECT);
  private _SUPABASE_PUB_KEY = inject(SUPABASE_PUB_KEY);

  public session = computed(() => this._session());

  sessionSub!: Subscription;

  constructor() {
    this._supabase = createClient(
      `https://${this._SUPABASE_PROJECT}.supabase.co`,
      this._SUPABASE_PUB_KEY
    );

    this._supabase.auth.getSession().then(({ data: { session } }) => {
      this._session.set(session);
    });

    const {
      data: { subscription },
    } = this._supabase.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
    });

    this.sessionSub = subscription;
  }

  async signInAnon() {
    const res = await this._supabase.auth.signInAnonymously();
    return res;
  }

  async convertToPermanentUserEmailPhone(id: string) {
    // Might need to figure out what form of ID was given
    const res = await this._supabase.auth.updateUser({
      email: 'example@email.com',
    });
    return res;
  }

  async convertToPermanentUserOAuthProvider(provider: OAuthProviders) {
    const res = await this._supabase.auth.linkIdentity({
      provider,
    });
    return res;
  }

  ngOnDestroy(): void {
    this.sessionSub.unsubscribe();
  }
}
