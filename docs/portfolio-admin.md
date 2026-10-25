# Portfolio collection administration

The private `/admin/portfolio` page uses the existing Supabase Magic Link for the configured sole operator. It reads images from the Google Drive `tearsheets` folder and publishes selected WebP copies to the existing public homepage GCS bucket.

## Setup

1. Add the `SUPABASE_DB_PASSWORD` GitHub repository secret. The migration workflow uses the existing `SUPABASE_PAT` secret and `SUPABASE_URL` repository variable.
2. Grant the Supabase personal access token the project settings, API keys, and API key secrets read scopes required by `supabase link`.
3. Merge migration files into `main`; GitHub Actions previews and applies pending migrations when migration files change. Changes to the migration workflow also run it so the initial workflow rollout can apply migrations that are already committed.
4. Enable the Google Drive API in the GCP project used by the application.
5. Share only the Drive `tearsheets` folder with the service account configured by `GCP_CLIENT_EMAIL` or `GCP_SERVICE_ACCOUNT_EMAIL`, with Viewer access.
6. Set `GOOGLE_DRIVE_TEARSHEETS_FOLDER_ID` to the ID of that folder in local and deployed environments.
7. Confirm the existing service account can create and delete objects in `GCP_HOMEPAGE_BUCKET`, and that the bucket's public-read policy is intentional for portfolio images.

The migration job links the project from `SUPABASE_URL`, runs `npm run supabase:migrate:remote -- --dry-run`, then applies pending migrations with `npm run supabase:migrate:remote`. It runs for changes under `supabase/migrations/**` and when the workflow itself changes. The existing `npm run supabase:migrate` command stays local. The production migration workflow does not control Vercel's application deployment.

If the migration job reports out-of-sync history, reconcile the remote migration history before retrying. Do not run `migration repair` automatically; it changes migration tracking without applying SQL.

The Drive credential is used by server code with the Drive read-only scope. Credentials and Drive file IDs are never returned by the public portfolio routes. Admin mutations verify the sole operator session before using the Supabase service-role key.

## Publishing behavior

Saving a collection downloads its selected Drive files, converts them to WebP at up to 2560 pixels with quality 80, and writes them under `portfolio/<collection-id>/` in the homepage bucket. The collection is committed to Supabase only after the image copies succeed. Editing replaces the collection's image records and removes prior objects after the database commit. Archiving hides a collection while retaining its data and image copies.
