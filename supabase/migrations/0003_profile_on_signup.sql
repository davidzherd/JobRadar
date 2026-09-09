-- Job Radar — auto-create a profile row when a user registers
-- (see docs/webapp-plan.md §6: "register creates his row in the DB").
--
-- A trigger on auth.users keeps profile creation atomic with signup, so the
-- app never has to remember to insert the row. Runs as SECURITY DEFINER, so it
-- bypasses RLS to insert. Email is copied across for convenient joins; the rest
-- of the onboarding fields are filled later by the onboarding submit handler.

create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
