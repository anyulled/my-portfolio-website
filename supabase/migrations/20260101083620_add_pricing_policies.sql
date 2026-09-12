create policy "Public can read pricing"
  on public.pricing_packages
  for select
  using (true);

create policy "Public can insert pricing"
  on public.pricing_packages
  for insert
  with check (true);
