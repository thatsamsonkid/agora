import { SupabaseAuth } from '@agora/supabase/auth';
import { SupabaseClientService } from '@agora/supabase/core';
import { DestroyRef, Injectable, computed, inject, signal, type OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { catchError, firstValueFrom, map, of, take, tap, type Observable } from 'rxjs';
import { injectTrpcClient } from '../../../trpc-client';
import type { GAME, GAME_STATUS } from '../types/game.types';

interface GAME_STATE {
	id: string | null;
	gameReady: boolean;
	status: GAME_STATUS;
	playerTurn: boolean;
	playerOne: string | null;
	playerTwo: string | null;
	playerOneSymbol: string | null;
	playerTwoSymbol: string | null;
	gameboard: Array<Array<string | null>>;
}

// interface PLAYER_SYMBOL = "X"

@Injectable({
	providedIn: 'root',
})
export class GameManagerService implements OnDestroy {
	private readonly _supabase = inject(SupabaseClientService);
	private readonly _authService = inject(SupabaseAuth);
	private readonly _router = inject(Router);
	private readonly _trpc = injectTrpcClient();
	private readonly _destroyRef = inject(DestroyRef);

	public gameChannel!: RealtimeChannel;
	public gameMovesChannel!: RealtimeChannel;

	public game = signal<GAME_STATE>({
		id: null,
		gameReady: false,
		status: 'queued',
		playerTurn: false,
		playerOne: null,
		playerTwo: null,
		playerOneSymbol: null,
		playerTwoSymbol: null,
		gameboard: [
			[null, null, null],
			[null, null, null],
			[null, null, null],
		],
	});

	private initialGameSetup = signal(false);

	public gameId = computed(() => this.game().id);
	public gameboard = computed(() => this.game().gameboard);

	private isPlayerOne = computed(() => this.playerOne() === this._authService.userId());

	// We would create a symbol mapper
	public symbolMap = new Map([
		['0', 'O'],
		['1', 'X'],
	]);
	public playerOneSymbol = computed(() => {
		const playerOneSymbol = this.game().playerOneSymbol;
		if (!playerOneSymbol) {
			return null;
		}
		return this.symbolMap.get(playerOneSymbol);
	});
	public playerTwoSymbol = computed(() => {
		const playerTwoSymbol = this.game().playerOneSymbol;
		if (!playerTwoSymbol) {
			return null;
		}
		return this.symbolMap.get(playerTwoSymbol);
	});
	// public playerSymbol = computed(() => (this.isPlayerOne() ? this.playerOneSymbol() : this.playerTwoSymbol()))
	// public oppSymbol = computed(() => (this.isPlayerOne() ? this.playerTwoSymbol() : this.playerOneSymbol()))
	public playerSymbol = computed(() => (this.isPlayerOne() ? 'X' : 'O'));
	public oppSymbol = computed(() => (this.isPlayerOne() ? 'O' : 'X'));

	public playerOne = computed(() => this.game().playerOne);
	public playerTwo = computed(() => this.game().playerTwo);
	public moves = signal([]);

	public isSpectator = signal(false);

	private winningCombos = [
		// Horizontal rows (all share the same y)
		[
			{ y: 0, x: 0 },
			{ y: 0, x: 1 },
			{ y: 0, x: 2 },
		], // Top row
		[
			{ y: 1, x: 0 },
			{ y: 1, x: 1 },
			{ y: 1, x: 2 },
		], // Middle row
		[
			{ y: 2, x: 0 },
			{ y: 2, x: 1 },
			{ y: 2, x: 2 },
		], // Bottom row

		// Vertical columns (all share the same x)
		[
			{ y: 0, x: 0 },
			{ y: 1, x: 0 },
			{ y: 2, x: 0 },
		], // Left column
		[
			{ y: 0, x: 1 },
			{ y: 1, x: 1 },
			{ y: 2, x: 1 },
		], // Middle column
		[
			{ y: 0, x: 2 },
			{ y: 1, x: 2 },
			{ y: 2, x: 2 },
		], // Right column

		// Diagonals
		[
			{ y: 0, x: 0 },
			{ y: 1, x: 1 },
			{ y: 2, x: 2 },
		], // Top-left to bottom-right
		[
			{ y: 0, x: 2 },
			{ y: 1, x: 1 },
			{ y: 2, x: 0 },
		], // Top-right to bottom-left
	];

	public startNewGame(): Observable<{ id: string }> {
		return this._trpc.game.create.mutate().pipe(
			take(1),
			tap((game) => {
				// this.game.update((state) => ({ ...state, id }))
				this.game.update((state) => ({
					...state,
					id: game?.id,
					playerOne: game?.player_1 ?? null,
					playerTwo: game?.player_2 ?? null,
					status: game?.game_status ?? state.status,
					playerOneSymbol: 'X',
					playerTwoSymbol: 'O',
				}));
				this.createSupabaseChannel(game?.id);
			}),
		);
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
		console.log('connectin to game...');
		try {
			if (!gameId) {
				throw Error('Game not found');
			}

			const { data: game, error } = await firstValueFrom(this.findGame(gameId));

			if (error && !game) {
				throw Error('Game not found');
			}

			console.log('GAME FOUND', game);

			// we have a duplicate of this in start new game
			this.game.update((state) => ({
				...state,
				id: gameId,
				playerOne: game?.player_1 ?? null,
				playerTwo: game?.player_2 ?? null,
				status: game?.game_status ?? state.status,
				playerOneSymbol: 'X',
				playerTwoSymbol: 'O',
			}));

			// Start listening to changes in game state
			this.createSupabaseChannel(gameId);

			// Check if game is joinable and attempt to join as player
			if (game && this.isGameJoinable(game)) {
				// Game is joinable
				await this.joinGameAsPlayer(gameId);
			}

			if (!this.isPlayerInGame()) {
				this.isSpectator.set(true);
			}

			// If game already exist, check for all made moves and load them to board
			await firstValueFrom(
				this.loadGameMoves(gameId).pipe(
					tap(({ data: gameMoves }) => {
						console.log(gameMoves?.length);
						console.log('isPlayerOne', this.isPlayerOne());
						if (gameMoves?.length) {
							for (let i = 0; i < gameMoves.length; i++) {
								console.log(gameMoves?.[i]?.column, gameMoves?.[i]?.row);
								if (this.isNonNegativeNumber(gameMoves?.[i]?.column) && this.isNonNegativeNumber(gameMoves?.[i]?.row)) {
									// TODO: Instead of this which is too many for loops
									// for bulk update of the table lets create a map
									// and then loop through the table and check if a value exists in the map apply the value (X/O)
									// const playerSymbol = this.playerSymbol()
									// const oppSymbol = playerSymbol === 'X' ? 'O' : 'X'

									const isPlayerMove = gameMoves[i].player_id === this._authService.userId();

									const symbol = isPlayerMove ? this.playerSymbol() : this.oppSymbol();

									console.log(symbol);
									this.updateGameboard(gameMoves[i].row as number, gameMoves[i].column as number, symbol);
								}
							}

							// save moves up till now
							this.moves.set(gameMoves);

							// last move
							if (gameMoves[gameMoves.length - 1].player_id !== this._authService.userId()) {
								this.game.update((state) => ({ ...state, playerTurn: true }));
							}

							const lol = this.checkForWinner(this.game().gameboard);
							console.log('Winner', lol);
						} else if (this.isPlayerOne()) {
							this.game.update((state) => ({ ...state, playerTurn: true }));
						}
					}),
				),
			);
		} catch (e: unknown) {
			this._router.navigate(['/'], {
				state: { error: `Failed to fetch item, because  ${e}` },
			});
		}
	}

	public async joinGameAsPlayer(gameId: string): Promise<void> {
		const { data: game, error } = await firstValueFrom(this.joinGame(gameId));
		if (error && !game) {
			throw Error('Unable to join game');
		}
	}

	public isPlayerInGame(): boolean {
		return this.playerOne() === this._authService.userId() || this.playerTwo() === this._authService.userId();
	}

	/**
	 * description Supabase Channel Setup
	 * @param gameId
	 */
	public createSupabaseChannel(gameId: string): void {
		console.log('createSupabaseChannel + game');
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
						// console.log('Game Table Change', payload)
						if (!this.initialGameSetup()) {
							this.initialGameSetup.set(true);
							const isPlayerOne = payload.new.player_1 === this._authService.userId();
							this.game.update((state) => ({
								...state,
								playerTurn: isPlayerOne, //for now player one will always go first
								playerOneSymbol: 'X',
								playerTwoSymbol: 'O',
							}));
						} else {
							this.game.update((state) => ({
								...state,
								status: payload.new.game_status,
							}));
						}
					},
				)
				.subscribe();

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
						if (this._authService.user()?.id === payload.new.player_id) {
							this.game.update((state) => ({ ...state, playerTurn: false }));
						} else {
							this.game.update((state) => ({ ...state, playerTurn: true }));
						}

						if (!this.game().gameboard[payload.new.row][payload.new.column]) {
							const isPlayerMove = payload.new.player_id === this._authService.userId();
							const symbol = isPlayerMove ? this.playerSymbol() : this.oppSymbol();
							this.updateGameboard(payload.new.row, payload.new.column, symbol);
						}

						const lol = this.checkForWinner(this.game().gameboard);
						console.log('Winner', lol);
					},
				)
				.subscribe();
		} catch (e) {
			console.error(e);
		}
	}

	public takeTurn({ x, y }: { x: number; y: number }) {
		this.updateMovesTable(x, y);
	}

	private joinGame(gameId: string): Observable<{ data: GAME | null; error: any | null }> {
		return this._trpc.game.join.mutate({ gameId: gameId }).pipe(
			map((response) => {
				if (!response?.[0]?.id) {
					throw new Error('Game not found');
				}
				return { data: response[0], error: null };
			}),
			catchError(() => of({ data: null, error: 'Game not found' })),
		);
	}

	private findGame(gameId: string): Observable<{
		data: GAME | null;
		error: string | null;
	}> {
		return this._trpc.game.select.query({ id: gameId }).pipe(
			map((response) => {
				if (!response?.[0]?.id) {
					throw new Error('Game not found');
				}
				return { data: response[0], error: null };
			}),
			catchError(() => of({ data: null, error: 'Game not found' })),
		);
	}

	private loadGameMoves(gameId: string): Observable<{ data: any; error: string | null }> {
		return this._trpc.moves.select.query({ id: gameId }).pipe(
			take(1),
			map((response) => {
				if (!(response?.length > 0)) {
					throw new Error('No moves found for game');
				}
				return { data: response, error: null };
			}),
			catchError(() => of({ data: null, error: 'No moves for game id found' })),
		);
	}

	private updateGameboard(x: number, y: number, playerSymbol?: 'X' | 'O'): (string | null)[][] {
		// console.log(x)
		// console.log(y)
		// console.log(playerSymbol)
		//@ts-ignore
		const nextGameState = this.update2DArray(this.gameboard(), x, y, playerSymbol || this.playerSymbol());
		this.game.update((state) => ({
			...state,
			gameboard: nextGameState,
		}));
		return nextGameState;
	}

	private update2DArray(originalArray: (string | null)[][], rowIndex: number, colIndex: number, newValue: string) {
		// Clone the array to maintain immutability
		const newArray = originalArray.map((row, index) => {
			// Clone each row
			if (index === rowIndex) {
				return [...row.slice(0, colIndex), newValue, ...row.slice(colIndex + 1)];
			}
			return [...row];
		});
		return newArray;
	}

	private updateMovesTable(x: number, y: number): void {
		const gameId = this.gameId();
		const playerId = this._authService.session()?.user.id;
		if (playerId && gameId) {
			this._trpc.moves.create
				.mutate({
					gameId,
					playerId,
					column: y,
					row: x,
					symbol: 0,
				})
				.pipe(take(1), takeUntilDestroyed(this._destroyRef))
				.subscribe();
		}
	}

	private checkForWinner(board: Array<Array<string | null>>): string | null {
		for (const combo of this.winningCombos) {
			const [a, b, c] = combo;

			const valA = board[a.y][a.x];
			const valB = board[b.y][b.x];
			const valC = board[c.y][c.x];

			// If all three positions are the same and not null => winner
			if (valA && valA === valB && valB === valC) {
				return valA; // 'X' or 'O'
			}
		}

		// No winning combo found
		return null;
	}

	private isGameJoinable({ game_status = 'queued', player_1 = null, player_2 = null }: GAME): boolean {
		return game_status === 'queued' && (!player_1 || !player_2);
	}

	private isNonNegativeNumber(value: unknown) {
		return (
			typeof value === 'number' && // Must be a number (excludes null, undefined, etc.)
			Number.isFinite(value) && // Excludes NaN, Infinity, -Infinity
			value >= 0 // Allows 0 and all positive numbers
		);
	}

	ngOnDestroy(): void {
		if (this.gameChannel) {
			this.gameChannel.unsubscribe();
		}

		if (this.gameMovesChannel) {
			this.gameMovesChannel.unsubscribe();
		}
	}
}
