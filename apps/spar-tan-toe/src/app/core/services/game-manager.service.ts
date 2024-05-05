import { Injectable, computed, inject, signal } from '@angular/core';
import { injectTrpcClient } from '../../../trpc-client';
import { Observable, map, take, tap } from 'rxjs';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseClientService } from '@agora/supabase/core';
import { SupabaseAuth } from '@agora/supabase/auth';

@Injectable({
  providedIn: 'root',
})
export class GameManagerService {
  private _supabase = inject(SupabaseClientService);
  private _trpc = injectTrpcClient();
  private _gameRoom!: RealtimeChannel;

  gameboard = signal([
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
  ]);

  // private _auth = inject(SupabaseAuth);
  // protected isSignedIn = computed(() => this._auth.session());

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

  createSupabaseChannel(gameId: string): void {
    this._gameRoom = this._supabase.client.channel(gameId, {
      config: {
        presence: { key: 'thatsamsonkid' },
      },
    });

    this._gameRoom
      .on('presence', { event: 'sync' }, () => {
        const newState = this._gameRoom.presenceState();
        console.log('sync', newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('join', key, newPresences);
        // if (newState && !newState.gameState) {
        //   this._gameRoom.track({
        //     gameState: [
        //       ['', '', ''],
        //       ['', '', ''],
        //       ['', '', ''],
        //     ],
        //   });
        //   // this._gameRoom.send({
        //   //   event: 'game_init',
        //   //   type: 'presence',
        //   //   payload: ,
        //   // });
        // }
      })
      .on(
        'presence',
        { event: 'leave' },
        ({ key, currentPresences, leftPresences }) => {
          // console.log('leave', key, leftPresences);
          console.log('leave', key, currentPresences, leftPresences);
        }
      )
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
  }
}
