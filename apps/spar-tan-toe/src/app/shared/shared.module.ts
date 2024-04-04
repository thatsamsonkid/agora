import { NgModule } from '@angular/core';
import { HlmButtonModule } from '@spartan-ng/ui-button-helm';
import { HlmCardModule } from '@spartan-ng/ui-card-helm';

@NgModule({
  imports: [HlmButtonModule, HlmCardModule],
  exports: [HlmButtonModule, HlmCardModule],
})
export class SharedModule {}
