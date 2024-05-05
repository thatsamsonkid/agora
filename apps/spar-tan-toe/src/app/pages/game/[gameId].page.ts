import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { SharedModule } from '../../shared/shared.module';
import { HeaderComponent } from '../../core/components/header.component';

@Component({
  selector: 'app-game-page',
  template: `<app-header></app-header>`,
  imports: [SharedModule, HeaderComponent],
  standalone: true,
})
export default class GamePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly gameId$ = this.route.paramMap.pipe(
    map((params) => params.get('gameId'))
  );

  constructor() {}

  ngOnInit(): void {}
}
