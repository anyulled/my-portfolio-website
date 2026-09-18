-- This migration stays a standalone statement because PostgreSQL forbids concurrent index builds inside a transaction.
create index concurrently if not exists instagram_conversations_follow_up_idx
  on instagram_conversations (follow_up_due_at)
  where response_route = 'pricing'
    and response_sent_at is not null
    and follow_up_sent_at is null
    and follow_up_cancelled_at is null;
