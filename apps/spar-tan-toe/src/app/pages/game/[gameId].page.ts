import { SupabaseAuth } from '@agora/supabase/auth';
import type { RouteMeta } from '@analogjs/router';
import { isPlatformBrowser, JsonPipe } from '@angular/common';
import { Component, computed, inject, PlatformRef, type OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { GameboardCellComponent } from '../../components/gameboard-cell.component';
import { anonAuthGuard } from '../../core/guards/anon-auth.guard';
import { GameManagerService } from '../../core/services/game-manager.service';
import { SharedModule } from '../../shared/shared.module';

export const routeMeta: RouteMeta = {
	title: 'About Analog',
	canActivate: [anonAuthGuard],
};

@Component({
	selector: 'app-game-id-page',
	standalone: true,
	imports: [SharedModule, GameboardCellComponent, JsonPipe],
	template: `
		<p>{{ gameStatus() }}</p>
		<p>{{ id() }}</p>
		<p>{{ isPlayerTurn() }}</p>
		<p>{{ playerSymbol() }}</p>
		@if (isSpectator()) {
			<p>Spectating</p>
		}

		{{ game() | json }}

		<div class="mx-6 grid grid-rows-3 divide-y rounded-sm border">
			@for (row of gameboard(); let rowIndex = $index; track rowIndex) {
				<div class="grid grid-cols-3 divide-x">
					@for (col of row; let colIndex = $index; track 'col' + colIndex) {
						<div class="flex h-60 grow">
							<gb-cell
								[coordinates]="{ x: rowIndex, y: colIndex }"
								[value]="col"
								(buttonClick)="selectCell({ x: rowIndex, y: colIndex })"
							/>
						</div>
					}
				</div>
			}
		</div>
	`,
})
export default class GameIdPageComponent implements OnInit {
	private readonly _route = inject(ActivatedRoute);
	private readonly _auth = inject(SupabaseAuth);
	private readonly _gameManager = inject(GameManagerService);
	private readonly _platform = inject(PlatformRef);

	private readonly _gameId$ = this._route.paramMap.pipe(map((params) => params.get('gameId')));

	protected readonly id = computed(() => this._auth.user()?.id);

	//temp
	protected game = computed(() => this._gameManager.game());

	protected readonly gameboard = computed(() => this._gameManager.gameboard());
	protected readonly gameStatus = computed(() => this._gameManager.game().status);
	protected readonly isPlayerTurn = computed(() =>
		this._gameManager.game().playerTurn ? 'Your Turn' : 'Not you turn',
	);
	protected readonly isSpectator = this._gameManager.isSpectator;
	protected readonly playerSymbol = this._gameManager.playerSymbol;

	ngOnInit(): void {
		if (!this._gameManager.gameChannel && isPlatformBrowser(this._platform)) {
			this._gameId$
				.pipe(
					take(1),
					filter((val) => !!val),
				)
				.subscribe(async (gameId: string | null) => {
					await this._gameManager.connectToGame(gameId);
				});
		}
	}

	selectCell(coordinates: { x: number; y: number }): void {
		if (this._gameManager.game().playerTurn) {
			this._gameManager.takeTurn(coordinates);
		}
	}
}
