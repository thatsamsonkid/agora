import { Component, OnInit, computed, inject } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterLink } from '@angular/router';
import { SupabaseAuth } from '@agora/auth';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [SharedModule, RouterLink],
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
          <li>
            <div
              id="g_id_onload"
              data-client_id="864475690269-uf6ao4qa2k4jr0pc6o5og9o0pah7ubb1.apps.googleusercontent.com"
              data-context="signin"
              data-ux_mode="popup"
              data-callback="onSignIn"
              data-nonce=""
              data-auto_select="true"
              data-itp_support="true"
            ></div>

            <div
              class="g_id_signin"
              data-type="standard"
              data-shape="rectangular"
              data-theme="filled_black"
              data-text="signin_with"
              data-size="large"
              data-logo_alignment="left"
            ></div>
            <!-- <a
              hlmBtn
              class="w-full"
              routerLink="/auth/signin"
              (click)="()"
              >Sign In</a
            > -->
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

  constructor() {}

  ngOnInit(): void {}
}
