import {
  Injectable,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { injectTrpcClient } from '../../../trpc-client';
import { Observable, map, take, tap } from 'rxjs';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { SupabaseClientService } from '@agora/supabase/core';
import { SupabaseAuth } from '@agora/supabase/auth';

interface game {
  gameReady: boolean;
  playerTurn: string;
  gameState: string[][];
}

@Injectable({
  providedIn: 'root',
})
export class GameManagerService implements OnDestroy {
  private _supabase = inject(SupabaseClientService);
  private _trpc = injectTrpcClient();
  private _gameRoom!: RealtimeChannel;

  userId = 'thatsamsonkid';

  game = signal({
    gameReady: false,
    playerTurn: '',
    gameboard: [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
  });

  gameboard = computed(() => this.game().gameboard);

  // private _auth = inject(SupabaseAuth);
  // protected isSignedIn = computed(() => this._auth.session());

  constructor() {
    effect(() => {
      console.log('MM', this.gameboard());
    });
  }

  startNewGame(): Observable<{ id: string }> {
    // 1. create a new game in games table
    // 2. get id, navigate user to game/gameid
    // 3. Set up a supabase live session
    // 4. Create invite link for another player to join
    return this._trpc.game.create.mutate({}).pipe(
      take(1),
      map((res) => res[0]),
      tap(({ id }) => this.createSupabaseChannel(id))
    );
  }

  connectToGame(gameId: string | null) {
    if (!this._gameRoom && gameId) {
      // TODO: We should validate if game exist in database
      this.createSupabaseChannel(gameId);
    }
  }

  createSupabaseChannel(gameId: string): void {
    try {
      this._gameRoom = this._supabase.client.channel(gameId, {
        config: {
          presence: { key: this.userId },
        },
      });

      this._gameRoom
        .on('presence', { event: 'sync' }, () => {
          const newState = this._gameRoom.presenceState<game>();
          // console.log(newState['thatsamsonkid']?.[0]);
          if (newState['thatsamsonkid']) {
            const [playerState] = newState['thatsamsonkid'];
            if (playerState && playerState.gameState) {
              // console.log('UU', playerState.gameState);
              this.game.update((state) => ({
                ...state,
                gameboard: [...playerState.gameState],
              }));
            }
          }
        })
        // .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        //   console.log('join', key, newPresences);
        //   // if (newState && !newState.gameState) {
        //   //   this._gameRoom.track({
        //   //     gameState: [
        //   //       ['', '', ''],
        //   //       ['', '', ''],
        //   //       ['', '', ''],
        //   //     ],
        //   //   });
        //   //   // this._gameRoom.send({
        //   //   //   event: 'game_init',
        //   //   //   type: 'presence',
        //   //   //   payload: ,
        //   //   // });
        //   // }
        // })
        // .on(
        //   'presence',
        //   { event: 'leave' },
        //   ({ key, currentPresences, leftPresences }) => {
        //     // console.log('leave', key, leftPresences);
        //     console.log('leave', key, currentPresences, leftPresences);
        //   }
        // )
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            return;
          }
          console.log(status);
          if (status === 'SUBSCRIBED') {
            console.log('boom bang');
            // this._gameRoom.track({ user_name: 'user123' });

            this._gameRoom.track({
              event: 'game_init',
              gameState: this.gameboard(),
            });
          }
        });
    } catch (e) {
      console.error(e);
    }
  }

  takeTurn({ x, y }: { x: number; y: number }) {
    // consider updating only a copy and only updating from sync
    // to ensure a matching state with ephemeral state
    const nextGameState = this.updateGameboard(x, y);
    this._gameRoom.track({
      gameState: nextGameState,
    });
  }

  private updateGameboard(x: number, y: number): string[][] {
    return this.update2DArray(this.gameboard(), x, y, 'X');
  }

  private update2DArray(
    originalArray: string[][],
    rowIndex: number,
    colIndex: number,
    newValue: string
  ) {
    // Clone the array to maintain immutability
    const newArray = originalArray.map((row, index) => {
      // Clone each row
      if (index === rowIndex) {
        return [
          ...row.slice(0, colIndex),
          newValue,
          ...row.slice(colIndex + 1),
        ];
      }
      return [...row];
    });

    return newArray;
  }

  leave(): void {
    this._gameRoom.unsubscribe();
  }

  ngOnDestroy(): void {
    if (this._gameRoom) {
      this._gameRoom.untrack();
      this._gameRoom.unsubscribe();
    }
  }
}
