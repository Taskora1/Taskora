-- Optional: Seed 3 example tasks (edit URLs!)
insert into public.offers (title, description, payout_points, target_countries, url, is_active)
values
  ('App Signup', 'Install the app and create an account. Take a screenshot of the success screen.', 360, array['IN','PK'], 'https://example.com/offer1', true),
  ('Wallet Registration', 'Register and verify basic profile. Screenshot the welcome screen.', 420, array['IN','PK'], 'https://example.com/offer2', true),
  ('Newsletter Signup', 'Submit your email and confirm subscription. Screenshot confirmation.', 180, array['IN','PK'], 'https://example.com/offer3', true)
on conflict do nothing;
