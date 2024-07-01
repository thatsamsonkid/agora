import { NgModule } from '@angular/core'
import { HlmAvatarModule } from '@spartan-ng/ui-avatar-helm'
import { HlmButtonModule } from '@spartan-ng/ui-button-helm'
import { HlmCardModule } from '@spartan-ng/ui-card-helm'
import { HlmToasterModule } from '@spartan-ng/ui-sonner-helm'
@NgModule({
	imports: [HlmButtonModule, HlmCardModule, HlmAvatarModule, HlmToasterModule],
	exports: [HlmButtonModule, HlmCardModule, HlmAvatarModule, HlmToasterModule],
})
export class SharedModule {}
