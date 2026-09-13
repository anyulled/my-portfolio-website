alter table instagram_accounts
  add column if not exists instagram_webhook_user_id text;

create unique index if not exists instagram_accounts_webhook_user_id_idx
  on instagram_accounts (instagram_webhook_user_id)
  where instagram_webhook_user_id is not null;
