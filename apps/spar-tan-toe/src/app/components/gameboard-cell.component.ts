import {
  Component,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
// import { GameManagerService } from '../core/services/game-manager.service';

@Component({
  selector: 'gb-cell',
  template: `<button
    class="w-full h-full"
    [disabled]="disabled()"
    (click)="select($event)"
    (mouseenter)="onMouseEnter()"
    (mouseleave)="onMouseLeave()"
  >
    @if(value() === "X"){
    <span>X</span>
    } @else {
    <span>_</span>
    <!-- @if(player() === 0){
    <span>X</span> } @else { <span>O</span> }  -->
    }

    {{ coordinates()?.x }}, {{ coordinates()?.y }}
  </button>`,
  standalone: true,
  host: {
    class: 'contents',
  },
})
export class GameboardCellComponent implements OnInit {
  //   protected readonly gameManager = inject(GameManagerService);

  coordinates = input<{ x: number; y: number }>();
  disabled = input();
  player = input<number>();
  value = input();

  buttonClick = output<MouseEvent>();

  isHovered = signal(false);

  constructor() {
    // effect(() => {
    //   console.log(this.value());
    // });
  }

  ngOnInit(): void {}

  select(event: MouseEvent): void {
    // console.log('making selection');
    this.buttonClick.emit(event);
  }

  onMouseEnter(): void {
    this.isHovered.set(true);
    // console.log('Mouse is over the button');
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
    // console.log('Mouse has left the button');
  }
}
