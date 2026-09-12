# Instagram client setup

## Supabase

Apply `supabase/migrations/20260911150000_create_instagram_model_workflow.sql` to the project configured by `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Configure the sole operator with `INSTAGRAM_ADMIN_EMAIL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## AI

Configure `GROQ_API_KEY`. The default model is `openai/gpt-oss-20b`; override it with `GROQ_MODEL` when required.

## Meta

Create or select the Meta app at https://developers.facebook.com/apps/ and add the Instagram product required by the selected Instagram API. Use the app credentials and callback configuration below; there is one Meta app for both professional Instagram accounts.

Configure `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, `META_INSTAGRAM_SCOPES`, `INSTAGRAM_GRAPH_API_VERSION`, and `INSTAGRAM_OAUTH_STATE_SECRET`.

Set `META_REDIRECT_URI` to `https://boudoir.barcelona/api/instagram/oauth/callback`. Keep the real values in `.env.local` for local development and in the `boudoir-barcelona` Vercel project for deployed environments. The tracked `.env` file contains placeholders only.

Set the Meta webhook callback to `/api/instagram/webhook` and set `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` to the verification token configured in Meta.

Open `/instagram`, sign in with the configured email through the magic link, and connect each professional account independently. Do not put access tokens or secrets in client-side variables.

The production Vercel cron refreshes active long-lived Instagram tokens once they have 14 days or less remaining. It uses `CRON_SECRET` for authorization and requires no additional environment variable. If a token is already expired, reconnect that Instagram account from `/instagram`.

Production use requires the Meta app to be configured for the approved Instagram permissions and webhook subscription. Until then, keep the app in test mode with the authorized test accounts.
