alter table instagram_conversations
  add column if not exists follow_up_due_at timestamptz,
  add column if not exists follow_up_claimed_at timestamptz,
  add column if not exists follow_up_claim_token uuid,
  add column if not exists follow_up_delivery_started_at timestamptz,
  add column if not exists follow_up_sent_at timestamptz,
  add column if not exists follow_up_cancelled_at timestamptz,
  add column if not exists follow_up_attempts integer not null default 0,
  add column if not exists follow_up_last_error text,
  add column if not exists follow_up_provider_message_id text;

alter table instagram_conversations
  add constraint instagram_conversations_follow_up_attempts_check
  check (follow_up_attempts >= 0) not valid;

create or replace function complete_instagram_response(
  target_conversation_id uuid,
  source_message_at timestamptz,
  scheduled_follow_up_at timestamptz
)
returns boolean
language sql
security invoker
set search_path = public
as $$
  with completed_response as (
    update instagram_conversations
    set processing_state = 'completed',
        response_sent_at = clock_timestamp(),
        response_claimed_at = null,
        last_error = null,
        follow_up_due_at = case
          when scheduled_follow_up_at is not null
            and last_message_at <= source_message_at
            then scheduled_follow_up_at
          else null
        end,
        follow_up_claimed_at = null,
        follow_up_claim_token = null,
        follow_up_delivery_started_at = null,
        follow_up_sent_at = null,
        follow_up_cancelled_at = case
          when scheduled_follow_up_at is not null
            and last_message_at > source_message_at
            then clock_timestamp()
          else null
        end,
        follow_up_attempts = 0,
        follow_up_last_error = null,
        follow_up_provider_message_id = null
    where id = target_conversation_id
      and response_sent_at is null
    returning id
  )
  select exists(select 1 from completed_response);
$$;

revoke execute on function complete_instagram_response(uuid, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function complete_instagram_response(uuid, timestamptz, timestamptz)
  to service_role;
