# Portfolio collection administration

The private `/admin/portfolio` page uses the existing Supabase Magic Link for the configured sole operator. It reads images from the Google Drive `tearsheets` folder and publishes selected WebP copies to the existing public homepage GCS bucket.

## Setup

1. Apply `supabase/migrations/20260926120000_create_portfolio_collections.sql` to the project configured by `SUPABASE_URL`.
2. Enable the Google Drive API in the GCP project used by the application.
3. Share only the Drive `tearsheets` folder with the service account configured by `GCP_CLIENT_EMAIL` or `GCP_SERVICE_ACCOUNT_EMAIL`, with Viewer access.
4. Set `GOOGLE_DRIVE_TEARSHEETS_FOLDER_ID` to the ID of that folder in local and deployed environments.
5. Confirm the existing service account can create and delete objects in `GCP_HOMEPAGE_BUCKET`, and that the bucket's public-read policy is intentional for portfolio images.

The Drive credential is used by server code with the Drive read-only scope. Credentials and Drive file IDs are never returned by the public portfolio routes. Admin mutations verify the sole operator session before using the Supabase service-role key.

## Publishing behavior

Saving a collection downloads its selected Drive files, converts them to WebP at up to 2560 pixels with quality 80, and writes them under `portfolio/<collection-id>/` in the homepage bucket. The collection is committed to Supabase only after the image copies succeed. Editing replaces the collection's image records and removes prior objects after the database commit. Archiving hides a collection while retaining its data and image copies.
