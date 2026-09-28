create policy "reception can add treasury entries" on public.treasury_records
  for insert to authenticated
  with check (public.current_role() = 'reception');
