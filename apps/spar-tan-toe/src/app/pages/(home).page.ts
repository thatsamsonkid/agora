import { SupabaseAuth } from '@agora/supabase/auth';
import type { RouteMeta } from '@analogjs/router';
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	computed,
	effect,
	inject,
	signal,
	type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	NavigationCancel,
	NavigationEnd,
	NavigationError,
	NavigationStart,
	Router,
	RouterLink,
	type Event,
} from '@angular/router';
import { toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { HeaderComponent } from '../core/components/header.component';
import { anonAuthGuard } from '../core/guards/anon-auth.guard';
import { GameManagerService } from '../core/services/game-manager.service';
import { SharedModule } from '../shared/shared.module';

export const routeMeta: RouteMeta = {
	canActivate: [anonAuthGuard],
};

@Component({
	selector: 'spar-tan-toe-home',
	standalone: true,
	imports: [SharedModule, RouterLink, HeaderComponent],
	host: {
		class: 'min-h-screen min-w-screen',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<app-header></app-header>
		<main class="min-w-screen flex min-h-screen items-center justify-center">
			<section hlmCard>
				<div hlmCardHeader>
					<h3 hlmCardTitle>Welcome to spar-tan-toe!</h3>
				</div>
				<div hlmCardContent class="text-center">
					@if (!isSigned() || isAnon()) {
						<ul class="flex flex-col gap-3">
							<li>
								<a hlmBtn class="w-full" routerLink="/signin" (click)="signIn()">Sign In</a>
							</li>
							<li>
								<a hlmBtn class="w-full" (click)="signUp()">Sign Up</a>
							</li>
							<hr class="my-2" />
							<li>
								<a hlmBtn class="w-full" (click)="startNewGame()">Just Start New game</a>
							</li>
						</ul>
					} @else {
						<button hlmBtn (click)="startNewGame()">Start a new Game</button>
					}
				</div>
			</section>
			<hlm-toaster />
		</main>
	`,
})
export default class HomeComponent implements OnInit {
	private _auth = inject(SupabaseAuth);
	private _gameManagerService = inject(GameManagerService);
	private _router = inject(Router);
	private _destroyRef = inject(DestroyRef);

	protected isSigned = computed(() => this._auth.session());
	protected isAnon = computed(() => this._auth.user()?.is_anonymous);
	protected readonly toast = toast;
	protected loading = signal(false);

	constructor() {
		effect(() => {
			console.log('Auth: ', this._auth.isAuthenticated(), this._auth.user());
		});
	}

	ngOnInit() {
		// if (this._auth.isAuthenticated()) {
		// 	this._auth.signInAnon()
		// }

		const navigation = this._router.getCurrentNavigation();
		// console.log(navigation)
		if (navigation?.extras?.state?.error) {
			console.log('we toasting');
			this.toast(navigation.extras.state.error);
		}
	}

	protected signIn() {}

	protected signUp() {}

	protected async startNewGame(): Promise<void> {
		this.listenToRouteEvents();
		try {
			if (!this._auth.isAuthenticated()) {
				const { error: authError } = await this._auth.signInAnon();
				if (authError) {
					throw new Error('Failed to create anon profile');
				}

				await this._createNewGame();
			} else {
				await this._createNewGame();
			}
		} catch (error) {
			console.log(error);
			this.toast('Seem to be running into a temporary issue, try again later!');
		}
	}

	private async _createNewGame(): Promise<void> {
		const game = await firstValueFrom(this._gameManagerService.startNewGame());
		console.log('GameID', game);

		if (game?.id) {
			this._router.navigate(['game', game.id]);
		} else {
			throw new Error('Failed to create game');
		}
	}

	private listenToRouteEvents() {
		this._router.events.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((event: Event) => {
			switch (true) {
				case event instanceof NavigationStart: {
					this.loading.set(true);
					break;
				}

				case event instanceof NavigationEnd:
				case event instanceof NavigationCancel:
				case event instanceof NavigationError: {
					this.loading.set(false);
					break;
				}
				default: {
					break;
				}
			}
		});
	}
}
