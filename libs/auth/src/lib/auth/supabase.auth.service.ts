import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  AuthError,
  AuthResponse,
  createClient,
  OAuthResponse,
  Session,
  Subscription,
  SupabaseClient,
  UserResponse,
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

  /**
   * Sign Up Methods ----------------------------
   */

  async signUpWithEmail({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await this._supabase.auth.signUp({
      email,
      password,
      // options: {
      //   emailRedirectTo: 'https://example.com/welcome',
      // },
    });
    return res;
  }

  /**
   * Sign Up Converter Methods ----------------------------
   */

  async convertToPermanentUserEmailPhone(id: string): Promise<UserResponse> {
    // Might need to figure out what form of ID was given
    const res = await this._supabase.auth.updateUser({
      email: 'example@email.com',
    });
    return res;
  }

  async convertToPermanentUserOAuthProvider(
    provider: OAuthProviders
  ): Promise<OAuthResponse> {
    const res = await this._supabase.auth.linkIdentity({
      provider,
    });
    return res;
  }

  /**
   * Sign In Methods ----------------------------
   */

  async signInAnon(): Promise<AuthResponse> {
    const res = await this._supabase.auth.signInAnonymously();
    return res;
  }

  async signInWithGoogle(): Promise<OAuthResponse> {
    const res = await this._supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return res;
  }

  /**
   * Sign Out Methods ----------------------------
   */

  async signOut(): Promise<{
    error: AuthError | null;
  }> {
    const res = await this._supabase.auth.signOut();
    return res;
  }

  ngOnDestroy(): void {
    this.sessionSub.unsubscribe();
  }
}
