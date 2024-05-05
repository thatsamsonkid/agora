import { Component, OnInit, computed, inject } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterLink } from '@angular/router';
import {
  GoogleSigninButtonDirective,
  SupabaseAuth,
} from '@agora/supabase/auth';
import { RouteMeta } from '@analogjs/router';
import { unauthenticatedGuard } from './guards/unauthenticated.guard';

export const routeMeta: RouteMeta = {
  title: 'About Analog',
  canActivate: [unauthenticatedGuard],
  // providers: [AboutService],
};

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [SharedModule, RouterLink, GoogleSigninButtonDirective],
  host: {
    class: 'min-h-screen min-w-screen',
  },
  template: ` <main
    class="min-h-screen min-w-screen flex items-center justify-center"
  >
    <section hlmCard>
      <div hlmCardHeader>
        <h3 hlmCardTitle>Welcome to spar-tan-toe!</h3>
        <!-- <p hlmCardDescription>Card Description</p> -->
      </div>
      <div hlmCardContent>
        @if(!isSigned()){
        <ul class="flex flex-col gap-3">
          <li class="flex justify-center">
            <google-signin-button
              type="standard"
              size="large"
              theme="filled_black"
            />
          </li>
        </ul>
        } @else {
        <button>Start a new Game</button>
        }
      </div>
    </section>
  </main>`,
})
export default class SignInPageComponent implements OnInit {
  private _auth = inject(SupabaseAuth);
  protected isSigned = computed(() => this._auth.session());

  onGoogleSignIn(credential: any) {
    console.log(credential);
    this._auth.handleSignInWithGoogle(credential);
  }

  constructor() {}

  ngOnInit(): void {}
}
