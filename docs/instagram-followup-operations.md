# Instagram pricing follow-up operations

## cron-job.org job

Create one external job with these settings:

- Method: `POST`
- URL: `https://boudoir.barcelona/api/instagram-followups`
- Schedule: every 15 minutes
- Header: `Authorization: Bearer <INSTAGRAM_FOLLOWUP_CRON_TOKEN>`

Configure the token in cron-job.org and in the `boudoir-barcelona` Vercel project as the sensitive variable `INSTAGRAM_FOLLOWUP_CRON_TOKEN`. Never commit or print its value.

The endpoint returns `202` after authenticating and scheduling the work. The response does not mean that a message was sent; inspect the Vercel execution log and the Supabase follow-up state for delivery results.

## Processing rules

Each execution first synchronizes inbound messages from both connected Instagram accounts through the Conversations API, then processes pricing follow-ups. Only pricing conversations with a successful initial response are eligible. A follow-up is due 22 hours after the customer's first message, is cancelled when the customer sends another message, and is sent at most once. Delivery is attempted no later than 30 minutes before the 24-hour messaging window closes.

The processor retries at most three times. A final failure sets the conversation to `needs_attention` and stores a sanitized error for the admin panel.

## Troubleshooting

1. Check the cron-job.org execution status and HTTP response.
2. Check Vercel logs using the returned request identifier.
3. Inspect `instagram_conversations_sync_completed` for account, message, duplicate, and failure counts.
4. Inspect `follow_up_due_at`, `follow_up_claimed_at`, `follow_up_sent_at`, `follow_up_cancelled_at`, `follow_up_attempts`, and `follow_up_last_error` in `instagram_conversations`.
5. Verify that the connected account token and `instagram_business_manage_messages` permission are still valid.

Do not include access tokens, the follow-up token, or complete Instagram message bodies in incident reports.
