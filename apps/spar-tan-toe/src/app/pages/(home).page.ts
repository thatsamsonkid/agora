import { Component, computed, inject } from '@angular/core';
import { SupabaseAuth } from '@agora/supabase/auth';
import { SharedModule } from '../shared/shared.module';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../core/components/header.component';
import { GameManagerService } from '../core/services/game-manager.service';
import { injectTrpcClient } from '../../trpc-client';
import { take } from 'rxjs';

@Component({
  selector: 'spar-tan-toe-home',
  standalone: true,
  imports: [SharedModule, RouterLink, HeaderComponent],
  host: {
    class: 'min-h-screen min-w-screen',
  },
  template: ` <app-header></app-header>
    <main class="min-h-screen min-w-screen flex items-center justify-center">
      <section hlmCard>
        <div hlmCardHeader>
          <h3 hlmCardTitle>Welcome to spar-tan-toe!</h3>
          <!-- <p hlmCardDescription>Card Description</p> -->
        </div>
        <div hlmCardContent class="text-center">
          @if(!isSigned()){
          <ul class="flex flex-col gap-3">
            <li>
              <a hlmBtn class="w-full" routerLink="/signin" (click)="signIn()"
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
          <button hlmBtn (click)="startNewGame()">Start a new Game</button>
          }
        </div>
      </section>
    </main>`,
})
export default class HomeComponent {
  private _auth = inject(SupabaseAuth);
  protected isSigned = computed(() => this._auth.session());
  private _gameManagerService = inject(GameManagerService);
  private _router = inject(Router);

  protected signIn() {}

  protected signUp() {}

  protected startNewGame() {
    this._gameManagerService.startNewGame().subscribe(({ id }) => {
      this._router.navigate(['game', id]);
    });
  }
}
