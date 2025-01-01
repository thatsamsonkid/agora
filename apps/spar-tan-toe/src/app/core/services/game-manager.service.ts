import { SupabaseAuth } from '@agora/supabase/auth'
import { SupabaseClientService } from '@agora/supabase/core'
import { DestroyRef, Injectable, type OnDestroy, computed, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { type Observable, catchError, firstValueFrom, map, of, take, tap } from 'rxjs'
import { injectTrpcClient } from '../../../trpc-client'
import type { GAME, GAME_STATUS } from '../types/game.types'

interface GAME_STATE {
	id: string | null
	gameReady: boolean
	status: GAME_STATUS
	playerTurn: boolean
	playerOne: string | null
	playerTwo: string | null
	gameboard: Array<Array<string | null>>
}

@Injectable({
	providedIn: 'root',
})
export class GameManagerService implements OnDestroy {
	private _supabase = inject(SupabaseClientService)
	private _authService = inject(SupabaseAuth)
	private _router = inject(Router)
	private _trpc = injectTrpcClient()
	private destroyRef = inject(DestroyRef)

	public gameChannel!: RealtimeChannel
	public gameMovesChannel!: RealtimeChannel

	public game = signal<GAME_STATE>({
		id: null,
		gameReady: false,
		status: 'queued',
		playerTurn: false,
		playerOne: null,
		playerTwo: null,
		gameboard: [
			[null, null, null],
			[null, null, null],
			[null, null, null],
		],
	})

	public gameId = computed(() => this.game().id)
	public gameboard = computed(() => this.game().gameboard)

	public playerSymbol = signal<'X' | 'O'>('X')
	public moves = signal([])

	public isSpectator = signal(false)

	public startNewGame(): Observable<{ id: string }> {
		return this._trpc.game.create.mutate().pipe(
			take(1),
			tap(({ id }) => {
				// this.gameId.set(id)
				this.game.update((state) => ({ ...state, id }))
				this.createSupabaseChannel(id)
			}),
		)
	}

	/**
	 * Enables joining a game
	 * 1. As a creator of the game
	 * 2. Joining as a secondary player or as invited player
	 * 3. Joining the game with already 2 listed players
	 * 4. Re-joining a game you are already a part of
	 * @param gameId
	 */
	public async connectToGame(gameId: string | null): Promise<void> {
		console.log('connectin to game...')
		try {
			if (!gameId) {
				throw Error('Game not found')
			}

			const { data: game, error } = await firstValueFrom(this.findGame(gameId))

			if (error && !game) {
				throw Error('Game not found')
			}

			this.game.update((state) => ({ ...state, id: gameId }))

			// Start listening to changes in game state
			this.createSupabaseChannel(gameId)

			// Check if game is joinable and attempt to join as player
			if (game && this.isGameJoinable(game)) {
				// Game is joinable
				await this.joinGameAsPlayer(gameId)
			} else if (this.isPlayerInGame({ player_1: game?.player_1 || '', player_2: game?.player_2 || '' })) {
				console.log('User is a player')
				this.playerSymbol.set(game?.player_1 === this._authService.userId() ? 'X' : 'O')
			} else {
				this.isSpectator.set(true)
			}

			// If game already exist, check for all made moves and load them to board
			await firstValueFrom(
				this.loadGameMoves(gameId).pipe(
					tap(({ data: gameMoves }) => {
						if (gameMoves?.length) {
							for (let i = 0; i < gameMoves.length; i++) {
								if (gameMoves?.length && gameMoves?.[i]?.column && gameMoves?.[i]?.row) {
									// TODO: Instead of this which is too many for loops
									// for bulk update of the table lets create a map
									// and then loop through the table and check if a value exists in the map apply the value (X/O)
									// const playerSymbol = this.playerSymbol()
									// const oppSymbol = playerSymbol === 'X' ? 'O' : 'X'
									const symbol = gameMoves[i].player_id === this._authService.userId() ? 'X' : 'O'
									console.log(symbol)
									this.updateGameboard(gameMoves[i].row as number, gameMoves[i].column as number, symbol)
								}
							}

							// save moves up till now
							this.moves.set(gameMoves)

							// last move
							if (gameMoves[gameMoves.length - 1].player_id !== this._authService.userId()) {
								this.game.update((state) => ({ ...state, playerTurn: true }))
							}
						}
					}),
				),
			)
		} catch (e: unknown) {
			this._router.navigate(['/'], {
				state: { error: `Failed to fetch item, because  ${e}` },
			})
		}
	}

	public async joinGameAsPlayer(gameId: string): Promise<void> {
		// const { data: game, error } = await firstValueFrom(this._trpc.game.join.mutate({ gameId: gameId }))
		const { data: game, error } = await firstValueFrom(this.joinGame(gameId))

		this.playerSymbol.set(game?.player_1 === this._authService.userId() ? 'X' : 'O')

		if (error && !game) {
			throw Error('Unable to join game')
		}
	}

	public isPlayerInGame({ player_1 = '', player_2 = '' } = {}): boolean {
		return player_1 === this._authService.userId() || player_2 === this._authService.userId()
	}

	/**
	 * description Supabase Channel Setup
	 * @param gameId
	 */
	public createSupabaseChannel(gameId: string): void {
		console.log('createSupabaseChannel + game')
		try {
			this.gameChannel = this._supabase.client
				.channel(gameId)
				.on(
					'postgres_changes',
					{
						event: 'UPDATE',
						schema: 'public',
						table: 'game',
						filter: `id=eq.${gameId}`,
					},
					(payload) => {
						console.log('Game Table Change', payload)
						// this.gameStatus.set(payload.new.game_status)
						this.game.update((state) => ({ ...state, status: payload.new.game_status }))
						if (payload.new.player_1 === this._authService.userId()) {
							this.game.update((state) => ({ ...state, playerTurn: true }))
						}
						// TODO: We may want to limit doing this only for opp since player turn is already eager updating the board
						// console.log(payload.new.row, payload.new.column)
						// console.log(this.game().gameboard[payload.new.row][payload.new.column])
						// if (!this.game().gameboard[payload.new.row][payload.new.column]) {
						// 	console.log('Updating Gameboard')
						// 	this.updateGameboard(payload.new.row, payload.new.column)
						// }
					},
				)
				.subscribe()

			this.gameMovesChannel = this._supabase.client
				.channel(`${gameId}_moves`)
				.on(
					'postgres_changes',
					{
						event: 'INSERT',
						schema: 'public',
						table: 'moves',
						filter: `game_id=eq.${gameId}`,
					},
					(payload) => {
						// console.log('Moves Table Change', payload)
						// TODO: We may want to limit doing this only for opp since player turn is already eager updating the board
						// console.log(payload.new.row, payload.new.column)
						// console.log(this.game().gameboard[payload.new.row][payload.new.column])
						if (this._authService.user()?.id === payload.new.player_id) {
							this.game.update((state) => ({ ...state, playerTurn: false }))
						} else {
							this.game.update((state) => ({ ...state, playerTurn: true }))
						}

						//
						if (!this.game().gameboard[payload.new.row][payload.new.column]) {
							// console.log('Updating Gameboard')
							// const player
							const symbol =
								payload.new.player_id === this._authService.userId()
									? this.playerSymbol()
									: this.playerSymbol() === 'X'
										? 'O'
										: 'X'
							this.updateGameboard(payload.new.row, payload.new.column, symbol)
						}
					},
				)
				.subscribe()
		} catch (e) {
			console.error(e)
		}
	}

	public takeTurn({ x, y }: { x: number; y: number }) {
		this.updateMovesTable(x, y)
	}

	private joinGame(gameId: string): Observable<{ data: GAME | null; error: any | null }> {
		return this._trpc.game.join.mutate({ gameId: gameId }).pipe(
			map((response) => {
				if (!response?.[0]?.id) {
					throw new Error('Game not found')
				}
				return { data: response[0], error: null }
			}),
			catchError(() => of({ data: null, error: 'Game not found' })),
		)
	}

	private findGame(gameId: string): Observable<{
		data: GAME | null
		error: string | null
	}> {
		return this._trpc.game.select.query({ id: gameId }).pipe(
			map((response) => {
				if (!response?.[0]?.id) {
					throw new Error('Game not found')
				}
				return { data: response[0], error: null }
			}),
			catchError(() => of({ data: null, error: 'Game not found' })),
		)
	}

	private loadGameMoves(gameId: string): Observable<{ data: any; error: string | null }> {
		return this._trpc.moves.select.query({ id: gameId }).pipe(
			take(1),
			map((response) => {
				if (!(response?.length > 0)) {
					throw new Error('No moves found for game')
				}
				return { data: response, error: null }
			}),
			catchError(() => of({ data: null, error: 'No moves for game id found' })),
		)
	}

	private updateGameboard(x: number, y: number, playerSymbol?: 'X' | 'O'): (string | null)[][] {
		const nextGameState = this.update2DArray(this.gameboard(), x, y, playerSymbol || this.playerSymbol())
		this.game.update((state) => ({
			...state,
			gameboard: nextGameState,
		}))
		return nextGameState
	}

	private update2DArray(originalArray: (string | null)[][], rowIndex: number, colIndex: number, newValue: string) {
		// Clone the array to maintain immutability
		const newArray = originalArray.map((row, index) => {
			// Clone each row
			if (index === rowIndex) {
				return [...row.slice(0, colIndex), newValue, ...row.slice(colIndex + 1)]
			}
			return [...row]
		})
		return newArray
	}

	private updateMovesTable(x: number, y: number): void {
		const gameId = this.gameId()
		const playerId = this._authService.session()?.user.id
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
				.subscribe()
		}
	}

	private isGameJoinable({ game_status = 'queued', player_1 = null, player_2 = null }: GAME): boolean {
		return game_status === 'queued' && (!player_1 || !player_2)
	}

	// private updateGameId(id: string): void {
	// 	this.game.update
	// }

	ngOnDestroy(): void {
		if (this.gameChannel) {
			this.gameChannel.unsubscribe()
		}

		if (this.gameMovesChannel) {
			this.gameMovesChannel.unsubscribe()
		}
	}
}
