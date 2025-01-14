import { SupabaseAuth } from '@agora/supabase/auth';
import { JsonPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

@Component({
	selector: 'app-header',
	standalone: true,
	imports: [JsonPipe, SharedModule, RouterLink],
	template: `
		<header class="flex justify-between px-4 py-5">
			<a routerLink="/">
				<h1>Spar-tan-toe</h1>
			</a>
			@if (isSignedIn() && !isAnon()) {
				<hlm-avatar variant="medium">
					<img [src]="profilePic()" alt="spartan logo. Resembling a spartan shield" hlmAvatarImage />
					<span class="bg-[#FD005B] text-white" hlmAvatarFallback>RG</span>
				</hlm-avatar>
			}
		</header>
	`,
})
export class HeaderComponent {
	private readonly _auth = inject(SupabaseAuth);
	protected isSignedIn = computed(() => this._auth.session());
	protected isAnon = computed(() => this._auth.user()?.is_anonymous);
	protected profilePic = computed(() => this.isSignedIn()?.user?.user_metadata.picture);
}
