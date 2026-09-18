alter table instagram_conversations
  add column if not exists follow_up_due_at timestamptz,
  add column if not exists follow_up_claimed_at timestamptz,
  add column if not exists follow_up_sent_at timestamptz,
  add column if not exists follow_up_cancelled_at timestamptz,
  add column if not exists follow_up_attempts integer not null default 0,
  add column if not exists follow_up_last_error text;

alter table instagram_conversations
  add constraint instagram_conversations_follow_up_attempts_check
  check (follow_up_attempts >= 0);

create index if not exists instagram_conversations_follow_up_idx
  on instagram_conversations (follow_up_due_at)
  where response_route = 'pricing'
    and response_sent_at is not null
    and follow_up_sent_at is null
    and follow_up_cancelled_at is null;
