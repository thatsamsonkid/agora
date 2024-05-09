import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { SharedModule } from '../../shared/shared.module';
import { GameManagerService } from '../../core/services/game-manager.service';
import { GameboardCellComponent } from '../../components/gameboard-cell.component';

@Component({
  selector: 'app-game-id-page',
  template: `
    <div class="grid grid-rows-3 divide-y border mx-6 rounded-sm">
      <h1>BOOM</h1>
      @for(row of gameManager.gameboard(); track $index){
      <div class="grid grid-cols-3 divide-x">
        @for(col of row; let idx = $index; track idx){
        <div class="flex h-60 grow">
          <gb-cell
            [coordinates]="{ x: $index, y: idx }"
            (buttonClick)="selectCell({ x: $index, y: idx })"
            [value]="col"
          ></gb-cell>
        </div>
        }
      </div>
      }
    </div>
  `,
  imports: [SharedModule, GameboardCellComponent],
  standalone: true,
})
export default class GameIdPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly gameManager = inject(GameManagerService);

  readonly gameId$ = this.route.paramMap.pipe(
    map((params) => params.get('gameId'))
  );

  ngOnInit(): void {
    this.gameId$
      .pipe(
        take(1),
        filter((val) => !!val)
      )
      .subscribe((gameId: string | null) => {
        console.log(gameId);
        this.gameManager.connectToGame(gameId);
      });
  }

  selectCell(coordinates: { x: number; y: number }): void {
    this.gameManager.takeTurn(coordinates);
  }

  leave(): void {
    this.gameManager.leave();
  }
}
