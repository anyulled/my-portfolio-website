create table if not exists instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  instagram_user_id text not null unique,
  access_token text not null,
  token_expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists instagram_conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references instagram_accounts(id) on delete cascade,
  instagram_conversation_id text not null,
  participant_id text not null,
  participant_username text,
  last_message_at timestamptz not null,
  detected_language text not null default 'en',
  classification text not null check (classification in ('model_form', 'pricing', 'manual_review', 'ignored')),
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  processing_state text not null check (processing_state in ('pending', 'processed', 'needs_attention', 'completed')),
  response_route text check (response_route in ('model_form', 'pricing')),
  response_correlation_token uuid unique,
  response_claimed_at timestamptz,
  response_sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, instagram_conversation_id)
);

create table if not exists instagram_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references instagram_conversations(id) on delete cascade,
  instagram_message_id text not null unique,
  message_text text not null,
  sent_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists model_booking_submissions (
  id uuid primary key default gen_random_uuid(),
  lead_correlation_token uuid unique,
  source_account_handle text,
  source_conversation_id text,
  full_name text not null,
  social_account text not null,
  email text not null,
  country text not null,
  height numeric not null,
  chest numeric not null,
  waist numeric not null,
  hips numeric not null,
  tattoos text,
  hair_color text not null,
  eye_color text not null,
  implants text not null,
  start_date date not null,
  end_date date not null,
  rates text not null,
  model_release text not null,
  payment_types text[] not null,
  email_state text not null default 'pending' check (email_state in ('pending', 'sent', 'failed')),
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instagram_conversations_review_idx
  on instagram_conversations (processing_state, updated_at desc);

create index if not exists model_booking_submissions_retention_idx
  on model_booking_submissions (created_at);

alter table instagram_accounts enable row level security;
alter table instagram_conversations enable row level security;
alter table instagram_messages enable row level security;
alter table model_booking_submissions enable row level security;
