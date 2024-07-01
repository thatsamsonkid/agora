import {
  DestroyRef,
  Injectable,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { injectTrpcClient } from '../../../trpc-client';
import {
  Observable,
  catchError,
  firstValueFrom,
  map,
  of,
  take,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { SupabaseClientService } from '@agora/supabase/core';
import { SupabaseAuth } from '@agora/supabase/auth';
import { moves } from 'apps/spar-tan-toe/drizzle/schema';
import { Router } from '@angular/router';

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
  private _authService = inject(SupabaseAuth);
  private _router = inject(Router);
  private _trpc = injectTrpcClient();
  private destroyRef = inject(DestroyRef);

  // Add ability for local play, no need to connect to db or auth as anon,
  // just keep game state local

  gameId = signal<string | null>(null);
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

  gameChannel!: RealtimeChannel;

  startNewGame(): Observable<{ id: string }> {
    // 1. create a new game in games table
    // 2. get id, navigate user to game/gameid
    // 3. Set up a supabase live session
    // 4. Create invite link for another player to join
    return this._trpc.game.create.mutate({}).pipe(
      take(1),
      map((res) => res[0]),
      tap(({ id }) => {
        this.gameId.set(id);
        this.createSupabaseChannel(id);
      })
    );
  }

  async connectToGame(gameId: string | null) {
    try {
      if (!gameId) {
        throw Error('Game not found');
      }

      const { data, error } = await firstValueFrom(this.findGame(gameId));
      if (error) {
        throw Error('Game not found');
      }
      this.gameId.set(gameId);
      this.createSupabaseChannel(gameId);
      // this.findGame(gameId)
      //   .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      //   .subscribe({
      //     next: () => {
      //       this.gameId.set(gameId);
      //       this.createSupabaseChannel(gameId);
      //     },
      //     error: (e) => {
      //       throw Error('Game not found');
      //     },
      //   });
    } catch (e) {
      this._router.navigate(['/'], {
        state: { error: 'Failed to fetch item' },
      });
    }
  }

  createSupabaseChannel(gameId: string): void {
    try {
      this.gameChannel = this._supabase.client
        .channel(gameId)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'moves',
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            console.log('REALTY', payload);
            // TODO: We may want to limit doing this only for opp since player turn is already eager updating the board
            console.log(payload.new.row, payload.new.column);
            console.log(
              this.game().gameboard[payload.new.row][payload.new.column]
            );
            if (!this.game().gameboard[payload.new.row][payload.new.column]) {
              console.log('Updating Gameboard');
              this.updateGameboard(payload.new.row, payload.new.column);
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.error(e);
    }
  }

  takeTurn({ x, y }: { x: number; y: number }) {
    // consider updating only a copy and only updating from sync
    // to ensure a matching state with ephemeral state
    // const nextGameState = this.updateGameboard(x, y);
    // this.game.update((state) => ({
    //   ...state,
    //   gameboard: nextGameState,
    // }));

    // Eager update gameboard
    // If update fails revert to previous game state
    this.updateMovesTable(x, y);
    //   const { error } = await supabase
    // .from('countries')
    // .insert({ id: 1, name: 'Denmark' })
    //   this._supabase.client.from('moves').insert()
    // this._gameRoom.track({
    //   gameState: nextGameState,
    // });
  }

  private findGame(gameId: string): Observable<any> {
    return this._trpc.game.select.query({ id: gameId }).pipe(
      map((response) => {
        if (!response?.[0]?.id) {
          throw new Error('Game not found');
        }
        return { data: response[0], error: null };
      }),
      catchError((error) => of({ data: null, error: 'Game not found' }))
    );
  }

  private updateGameboard(x: number, y: number): string[][] {
    const nextGameState = this.update2DArray(this.gameboard(), x, y, 'X');
    this.game.update((state) => ({
      ...state,
      gameboard: nextGameState,
    }));
    return nextGameState;
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
    console.log(newArray);
    return newArray;
  }

  private updateMovesTable(x: number, y: number): void {
    const gameId = this.gameId();
    // const playerId = this._authService.session()?.user.id;
    const playerId = '65f2d3f8-ff5d-4a71-bd15-d49dc92c2d76';
    console.log(gameId, playerId);
    if (playerId && gameId) {
      this._trpc.moves.create
        .mutate({
          gameId,
          playerId,
          column: y,
          row: x,
          symbol: 0,
        })
        .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  ngOnDestroy(): void {
    if (this.gameChannel) {
      this.gameChannel.unsubscribe();
    }
  }
}
