import { Component } from '@angular/core';

import { AnalogWelcomeComponent } from './analog-welcome.component';

@Component({
  selector: 'spar-tan-toe-home',
  standalone: true,
  imports: [AnalogWelcomeComponent],
  template: `
     <spar-tan-toe-analog-welcome/>
  `,
})
export default class HomeComponent {
}
