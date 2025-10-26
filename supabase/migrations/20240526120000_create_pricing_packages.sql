create extension if not exists "uuid-ossp";

create table if not exists pricing_packages (
                                                id uuid primary key default gen_random_uuid(),
    inserted_at timestamptz not null default now(),
    express_price numeric,
    experience_price numeric,
    deluxe_price numeric
);
