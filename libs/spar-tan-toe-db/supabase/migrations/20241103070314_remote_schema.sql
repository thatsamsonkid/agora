CREATE TRIGGER after_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_profile();


