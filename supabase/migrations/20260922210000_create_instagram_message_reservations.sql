create table if not exists instagram_message_reservations (
  instagram_message_id text primary key,
  account_id uuid not null references instagram_accounts(id) on delete cascade,
  instagram_conversation_id text not null,
  reserved_at timestamptz not null default now()
);

create index if not exists instagram_message_reservations_retention_idx
  on instagram_message_reservations (reserved_at);

alter table instagram_message_reservations enable row level security;
