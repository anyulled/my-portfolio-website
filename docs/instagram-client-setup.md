# Instagram client setup

## Supabase

Apply the Instagram migrations in `supabase/migrations` to the project configured by `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Configure the sole operator with `INSTAGRAM_ADMIN_EMAIL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## AI

Configure `GROQ_API_KEY`. The default model is `openai/gpt-oss-20b`; override it with `GROQ_MODEL` when required.

Configure the sensitive `INSTAGRAM_FOLLOWUP_CRON_TOKEN` in Vercel and use the same value as the `Authorization: Bearer` header in the external cron-job.org job described in `docs/instagram-followup-operations.md`. Do not add its value to tracked environment files.

## Meta

Create or select the Meta app at https://developers.facebook.com/apps/ and add the Instagram product required by the selected Instagram API. Use the app credentials and callback configuration below; there is one Meta app for both professional Instagram accounts.

Configure `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, `META_INSTAGRAM_SCOPES`, `INSTAGRAM_GRAPH_API_VERSION`, and `INSTAGRAM_OAUTH_STATE_SECRET`.

Set `META_REDIRECT_URI` to `https://boudoir.barcelona/api/instagram/oauth/callback`. Keep the real values in `.env.local` for local development and in the `boudoir-barcelona` Vercel project for deployed environments. The tracked `.env` file contains placeholders only.

Open `/instagram`, sign in with the configured email through the magic link, and connect each professional account independently. Do not put access tokens or secrets in client-side variables.

The production Vercel cron refreshes active long-lived Instagram tokens once they have 14 days or less remaining. It uses `CRON_SECRET` for authorization and requires no additional environment variable. If a token is already expired, reconnect that Instagram account from `/instagram`.

The external cron-job.org job synchronizes the Conversations API for both accounts every 15 minutes before processing pricing follow-ups. Production use requires the Meta app to have the approved Instagram messaging permissions. Until then, keep the app in test mode with the authorized test accounts.

## Sender and connected account profiles

Inbox cards distinguish the other participant from the connected professional account. Both profiles include the available username, name, photo, biography, and follower count. Meta uses `profile_pic` and `follower_count` for messaging-scoped participants, while professional accounts expose `profile_picture_url` and `followers_count`; the client retries the messaging field set when Meta rejects the professional field request.

The OAuth account ID and messaging/webhook ID may differ. Synchronization filters both known IDs, and processing checks the resolved account handle before classifying or persisting a self message. Outgoing replies are counted as skipped and do not trigger automation.

Historical participant corrections must use the exact stored message metadata. Check that Meta identifies the stored participant as the connected account and that exactly one other recipient exists before updating only `participant_id` and `participant_username`. Never infer a participant from message text, delete history, or replay automation to repair identity.
