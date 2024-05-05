import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  AuthError,
  AuthResponse,
  OAuthResponse,
  Session,
  Subscription,
  User,
  UserResponse,
} from '@supabase/supabase-js';
import { SupabaseClientService } from '@agora/supabase/core';

enum OAuthProviders {
  GOOGLE = 'google',
  APPLE = 'apple',
}

@Injectable()
export class SupabaseAuth implements OnDestroy {
  private _session = signal<Session | null>(null);
  private _user = signal<User | null>(null);
  private _supabase = inject(SupabaseClientService);

  public session = computed(() => this._session());
  public user = computed(() => this._session());
  public isAuthenticated = computed(() => !!this._session());

  sessionSub!: Subscription;

  constructor() {
    this._supabase.client.auth.getSession().then(({ data: { session } }) => {
      this._session.set(session);
    });

    const {
      data: { subscription },
    } = this._supabase.client.auth.onAuthStateChange((_event, session) => {
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
    const res = await this._supabase.client.auth.signUp({
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
    const res = await this._supabase.client.auth.updateUser({
      email: 'example@email.com',
    });
    return res;
  }

  async convertToPermanentUserOAuthProvider(
    provider: OAuthProviders
  ): Promise<OAuthResponse> {
    const res = await this._supabase.client.auth.linkIdentity({
      provider,
    });
    return res;
  }

  /**
   * Sign In Methods ----------------------------
   */

  async signInAnon(): Promise<AuthResponse> {
    const res = await this._supabase.client.auth.signInAnonymously();
    return res;
  }

  async signInWithGoogle(): Promise<OAuthResponse> {
    const res = await this._supabase.client.auth.signInWithOAuth({
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

  async handleSignInWithGoogle(
    response: google.accounts.id.CredentialResponse
  ) {
    const { data, error } = await this._supabase.client.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    });
    if (data) {
      this._session.set(data.session);
      this._user.set(data.user);
    }

    return { data, error };
  }

  /**
   * Sign Out Methods ----------------------------
   */

  async signOut(): Promise<{
    error: AuthError | null;
  }> {
    const res = await this._supabase.client.auth.signOut();
    return res;
  }

  ngOnDestroy(): void {
    this.sessionSub.unsubscribe();
  }
}
