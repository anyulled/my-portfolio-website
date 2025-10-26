create extension if not exists "uuid-ossp";

create table if not exists pricing_packages (
    id uuid primary key default uuid_generate_v4(),
    inserted_at timestamptz not null default now(),
    express_price numeric,
    experience_price numeric,
    deluxe_price numeric
);
