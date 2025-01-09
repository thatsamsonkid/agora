import { SupabaseAuth } from '@agora/supabase/auth'
import type { RouteMeta } from '@analogjs/router'
import { JsonPipe } from '@angular/common'
import { Component, type OnInit, computed, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { filter, map, take } from 'rxjs'
import { GameboardCellComponent } from '../../components/gameboard-cell.component'
import { anonAuthGuard } from '../../core/guards/anon-auth.guard'
import { GameManagerService } from '../../core/services/game-manager.service'
import { SharedModule } from '../../shared/shared.module'

export const routeMeta: RouteMeta = {
	title: 'About Analog',
	canActivate: [anonAuthGuard],
}

@Component({
	selector: 'app-game-id-page',
	standalone: true,
	imports: [SharedModule, GameboardCellComponent, JsonPipe],
	template: `<p>{{gameStatus()}}</p>
	<p>{{id()}}</p>
	<p>{{isPlayerTurn()}}</p>
	<p>{{playerSymbol()}}</p>
	@if(isSpectator()){
		<p>Spectating</p>
	}

{{ game() | json}}

    <div class="grid grid-rows-3 divide-y border mx-6 rounded-sm">
      @for(row of gameboard(); let rowIndex = $index; track rowIndex){
      <div class="grid grid-cols-3 divide-x">
        @for(col of row; let colIndex = $index; track "col" + colIndex){
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
	private readonly route = inject(ActivatedRoute)
	private readonly _auth = inject(SupabaseAuth)
	private readonly gameManager = inject(GameManagerService)

	private readonly gameId$ = this.route.paramMap.pipe(map((params) => params.get('gameId')))

	protected readonly id = computed(() => this._auth.user()?.id)

	//temp
	protected game = computed(() => this.gameManager.game())

	protected readonly gameboard = computed(() => this.gameManager.gameboard())
	protected readonly gameStatus = computed(() => this.gameManager.game().status)
	protected readonly isPlayerTurn = computed(() => (this.gameManager.game().playerTurn ? 'Your Turn' : 'Not you turn'))
	protected readonly isSpectator = this.gameManager.isSpectator
	protected readonly playerSymbol = this.gameManager.playerSymbol

	ngOnInit(): void {
		if (!this.gameManager.gameChannel) {
			this.gameId$
				.pipe(
					take(1),
					filter((val) => !!val),
				)
				.subscribe(async (gameId: string | null) => {
					await this.gameManager.connectToGame(gameId)
				})
		}
	}

	selectCell(coordinates: { x: number; y: number }): void {
		if (this.gameManager.game().playerTurn) {
			this.gameManager.takeTurn(coordinates)
		}
	}
}
