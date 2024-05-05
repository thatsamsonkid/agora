import { SupabaseAuth } from '@agora/supabase/auth';
import { JsonPipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [JsonPipe, SharedModule],
  template: ` <header class="flex justify-between px-4 py-5">
    <h1>Spar-tan-toe</h1>
    @if(isSignedIn()){

    <hlm-avatar variant="medium">
      <img
        [src]="profilePic()"
        alt="spartan logo. Resembling a spartanic shield"
        hlmAvatarImage
      />
      <span class="bg-[#FD005B] text-white" hlmAvatarFallback>RG</span>
    </hlm-avatar>
    }
  </header>`,
})
export class HeaderComponent implements OnInit {
  private _auth = inject(SupabaseAuth);
  protected isSignedIn = computed(() => this._auth.session());
  protected profilePic = computed(
    () => this.isSignedIn()?.user?.user_metadata.picture
  );

  constructor() {}

  ngOnInit(): void {}
}