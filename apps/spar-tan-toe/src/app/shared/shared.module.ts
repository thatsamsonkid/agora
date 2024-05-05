import { NgModule } from '@angular/core';
import { HlmButtonModule } from '@spartan-ng/ui-button-helm';
import { HlmCardModule } from '@spartan-ng/ui-card-helm';
import { HlmAvatarModule } from '@spartan-ng/ui-avatar-helm';
@NgModule({
  imports: [HlmButtonModule, HlmCardModule, HlmAvatarModule],
  exports: [HlmButtonModule, HlmCardModule, HlmAvatarModule],
})
export class SharedModule {}
