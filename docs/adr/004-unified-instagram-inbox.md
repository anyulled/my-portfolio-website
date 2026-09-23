# Use a unified Instagram inbox with account provenance

The client will present conversations from `anyulled` and `sensuelleboudoir` in one inbox to simplify triage, while storing and displaying the originating professional account on every conversation and sending responses through that same account. This keeps the operational workflow unified without merging the identities or credentials of the two Instagram accounts.

The first version has a sole operator. Multiuser roles and permissions are intentionally excluded until a concrete need appears.

Inbound messages are synchronized from Meta's Conversations API every 15 minutes by the existing external cron job. The webhook callback is intentionally not part of the production ingestion path because sub-minute delivery is not required.
