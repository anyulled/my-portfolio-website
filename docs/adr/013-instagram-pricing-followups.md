# Schedule one pricing follow-up within the Instagram messaging window

Pricing conversations may receive one additional localized follow-up approximately 22 hours after the customer's first message when the customer has not replied. The follow-up applies to both automatically routed and manually approved `pricing` conversations, uses a bounded template linking to `/pricing`, and never uses Groq to compose business text.

The follow-up is triggered by `cron-job.org` every 15 minutes through `POST /api/instagram-followups`. The route authenticates with `INSTAGRAM_FOLLOWUP_CRON_TOKEN`, returns `202 Accepted`, and schedules processing with Next.js `after()`. Supabase stores durable scheduling, cancellation, claim, attempt, delivery, and error state so concurrent invocations cannot send duplicates.

An inbound message after the initial response cancels the follow-up without retaining the new message body. The processor retries delivery at most three times and stops 30 minutes before the 24-hour Instagram messaging window closes. It does not use `HUMAN_AGENT` to extend that window.
