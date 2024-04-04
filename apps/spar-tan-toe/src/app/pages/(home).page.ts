import { Component, computed, inject } from '@angular/core';
import { SupabaseAuth } from '@agora/auth';
import { SharedModule } from '../shared/shared.module';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'spar-tan-toe-home',
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
            <a
              hlmBtn
              class="w-full"
              routerLink="/auth/signin"
              (click)="signIn()"
              >Sign In</a
            >
          </li>
          <li>
            <a hlmBtn class="w-full" (click)="signUp()">Sign Up</a>
          </li>
          <hr class="my-2" />
          <li>
            <a hlmBtn class="w-full" (click)="startNewGame()">
              Just Start New game
            </a>
          </li>
        </ul>
        } @else {
        <button>Start a new Game</button>
        }
      </div>
    </section>
  </main>`,
})
export default class HomeComponent {
  private _auth = inject(SupabaseAuth);
  protected isSigned = computed(() => this._auth.session());

  protected signIn() {
    // this._auth.
  }

  protected signUp() {}

  protected startNewGame() {}
}
