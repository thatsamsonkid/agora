import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'spar-tan-toe-root',
  standalone: true,
  imports: [RouterOutlet],
  providers: [],
  template: ` <router-outlet></router-outlet> `,
})
export class AppComponent {}
