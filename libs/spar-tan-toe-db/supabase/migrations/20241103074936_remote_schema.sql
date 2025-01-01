drop trigger if exists "on_player_2_join" on "public"."game";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.start_game()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
   -- Change game_status to 'in-progress' when player_2 is updated
   IF NEW.player_2 IS NOT NULL THEN
     UPDATE public.game
     SET game_status = 'in-progress'
     WHERE id = NEW.id;
   END IF;
   RETURN NEW;
END;$function$
;

CREATE TRIGGER start_game BEFORE UPDATE OF player_2 ON public.game FOR EACH ROW EXECUTE FUNCTION start_game();


