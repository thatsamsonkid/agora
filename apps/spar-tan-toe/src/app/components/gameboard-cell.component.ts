import { Component, input, output, signal } from '@angular/core'
// import { GameManagerService } from '../core/services/game-manager.service';

@Component({
	selector: 'gb-cell',
	template: `<button
    class="w-full h-full"
    [disabled]="disabled()"
    (click)="select($event)"
    (mouseenter)="mouseEnter()"
    (mouseleave)="mouseLeave()"
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
export class GameboardCellComponent {
	coordinates = input<{ x: number; y: number }>()
	disabled = input()
	player = input<number>()
	value = input()

	buttonClick = output<MouseEvent>()

	isHovered = signal(false)

	select(event: MouseEvent): void {
		// console.log('making selection');
		this.buttonClick.emit(event)
	}

	mouseEnter(): void {
		this.isHovered.set(true)
		// console.log('Mouse is over the button');
	}

	mouseLeave(): void {
		this.isHovered.set(false)
		// console.log('Mouse has left the button');
	}
}
