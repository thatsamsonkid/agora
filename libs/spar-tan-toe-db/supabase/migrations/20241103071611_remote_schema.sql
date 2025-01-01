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

CREATE TRIGGER on_player_2_join AFTER UPDATE ON public.game FOR EACH STATEMENT EXECUTE FUNCTION start_game();


