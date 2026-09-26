create table if not exists public.portfolio_models (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  profile_url text not null check (profile_url ~ '^https?://'),
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  session_date date not null,
  location text not null check (length(trim(location)) > 0),
  style text not null check (style in ('portrait', 'artistic-nude', 'boudoir', 'glamour', 'swimwear', 'fashion', 'lifestyle')),
  lingerie_brand text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_collection_models (
  collection_id uuid not null references public.portfolio_collections(id) on delete cascade,
  model_id uuid not null references public.portfolio_models(id) on delete restrict,
  primary key (collection_id, model_id)
);

create table if not exists public.portfolio_collection_photos (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.portfolio_collections(id) on delete cascade,
  drive_file_id text not null,
  object_path text not null unique,
  public_url text not null,
  alt_text text not null,
  position integer not null check (position >= 0),
  unique (collection_id, position)
);

create index if not exists portfolio_collections_published_date_idx
  on public.portfolio_collections (session_date desc)
  where archived_at is null;

create index if not exists portfolio_collection_models_model_idx
  on public.portfolio_collection_models (model_id, collection_id);

create index if not exists portfolio_collection_photos_order_idx
  on public.portfolio_collection_photos (collection_id, position);

alter table public.portfolio_models enable row level security;
alter table public.portfolio_collections enable row level security;
alter table public.portfolio_collection_models enable row level security;
alter table public.portfolio_collection_photos enable row level security;

create policy "Public can read models in published collections"
  on public.portfolio_models for select to anon, authenticated
  using (
    exists (
      select 1
      from public.portfolio_collection_models as association
      join public.portfolio_collections as collection on collection.id = association.collection_id
      where association.model_id = portfolio_models.id
        and collection.archived_at is null
    )
  );

create policy "Public can read published collections"
  on public.portfolio_collections for select to anon, authenticated
  using (archived_at is null);

create policy "Public can read models of published collections"
  on public.portfolio_collection_models for select to anon, authenticated
  using (
    exists (
      select 1 from public.portfolio_collections as collection
      where collection.id = collection_id and collection.archived_at is null
    )
  );

create policy "Public can read photos of published collections"
  on public.portfolio_collection_photos for select to anon, authenticated
  using (
    exists (
      select 1 from public.portfolio_collections as collection
      where collection.id = collection_id and collection.archived_at is null
    )
  );

grant select on public.portfolio_models to anon, authenticated;
grant select on public.portfolio_collections to anon, authenticated;
grant select on public.portfolio_collection_models to anon, authenticated;
grant select (id, collection_id, object_path, public_url, alt_text, position)
  on public.portfolio_collection_photos to anon, authenticated;
grant all on public.portfolio_models to service_role;
grant all on public.portfolio_collections to service_role;
grant all on public.portfolio_collection_models to service_role;
grant all on public.portfolio_collection_photos to service_role;

create or replace function public.save_portfolio_collection(
  p_id uuid,
  p_name text,
  p_slug text,
  p_session_date date,
  p_location text,
  p_style text,
  p_lingerie_brand text,
  p_model_ids uuid[],
  p_photos jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  if cardinality(p_model_ids) < 1 or jsonb_array_length(p_photos) < 1 then
    raise exception 'at least one model and one photo are required';
  end if;

  insert into public.portfolio_collections (id, name, slug, session_date, location, style, lingerie_brand, archived_at, updated_at)
  values (coalesce(p_id, gen_random_uuid()), trim(p_name), p_slug, p_session_date, trim(p_location), p_style, nullif(trim(p_lingerie_brand), ''), null, now())
  on conflict (id) do update set
    name = excluded.name,
    slug = excluded.slug,
    session_date = excluded.session_date,
    location = excluded.location,
    style = excluded.style,
    lingerie_brand = excluded.lingerie_brand,
    archived_at = null,
    updated_at = now()
  returning id into saved_id;

  delete from public.portfolio_collection_models where collection_id = saved_id;
  insert into public.portfolio_collection_models (collection_id, model_id)
  select saved_id, model.model_id from unnest(p_model_ids) as model(model_id);

  delete from public.portfolio_collection_photos where collection_id = saved_id;
  insert into public.portfolio_collection_photos (collection_id, drive_file_id, object_path, public_url, alt_text, position)
  select saved_id, photo.drive_file_id, photo.object_path, photo.public_url, photo.alt_text, photo.position
  from jsonb_to_recordset(p_photos) as photo(drive_file_id text, object_path text, public_url text, alt_text text, position integer);

  return saved_id;
end;
$$;

revoke all on function public.save_portfolio_collection(uuid, text, text, date, text, text, text, uuid[], jsonb) from public, anon, authenticated;
grant execute on function public.save_portfolio_collection(uuid, text, text, date, text, text, text, uuid[], jsonb) to service_role;
