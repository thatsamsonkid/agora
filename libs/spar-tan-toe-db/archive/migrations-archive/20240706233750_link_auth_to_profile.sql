alter table "public"."profile" drop constraint "player_pkey";

alter table "public"."moves" drop constraint "moves_game_id_id_pk";

drop index if exists "public"."player_pkey";

drop index if exists "public"."moves_game_id_id_pk";

alter table "public"."game" add column "player_1" uuid;

alter table "public"."game" add column "player_2" uuid;

alter table "public"."game" disable row level security;

alter table "public"."leaderboard" alter column "id" drop identity;

alter table "public"."leaderboard" disable row level security;

alter table "public"."moves" disable row level security;

drop type "public"."one_time_token_type";

CREATE UNIQUE INDEX profile_pkey ON public.profile USING btree (id);

CREATE UNIQUE INDEX moves_game_id_id_pk ON public.moves USING btree (id, game_id);

alter table "public"."profile" add constraint "profile_pkey" PRIMARY KEY using index "profile_pkey";

alter table "public"."moves" add constraint "moves_game_id_id_pk" PRIMARY KEY using index "moves_game_id_id_pk";

alter table "public"."game" add constraint "public_game_player_1_fkey" FOREIGN KEY (player_1) REFERENCES profile(id) not valid;

alter table "public"."game" validate constraint "public_game_player_1_fkey";

alter table "public"."game" add constraint "public_game_player_2_fkey" FOREIGN KEY (player_2) REFERENCES profile(id) not valid;

alter table "public"."game" validate constraint "public_game_player_2_fkey";

alter table "public"."leaderboard" add constraint "public_leaderboard_player_id_fkey" FOREIGN KEY (player_id) REFERENCES profile(id) not valid;

alter table "public"."leaderboard" validate constraint "public_leaderboard_player_id_fkey";

alter table "public"."moves" add constraint "public_moves_player_id_fkey" FOREIGN KEY (player_id) REFERENCES profile(id) not valid;

alter table "public"."moves" validate constraint "public_moves_player_id_fkey";

set check_function_bodies = off;

create policy "Can only update own profile data"
on "public"."profile"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = id));


create policy "Can only view own profile data"
on "public"."profile"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = id));