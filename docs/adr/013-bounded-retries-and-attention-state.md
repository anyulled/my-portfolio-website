# Use bounded idempotent retries and an attention state

Transient failures from Groq, Meta, or email delivery may be retried a bounded number of times using the conversation and response identifiers as idempotency keys. Persistent failures will mark the record as `needs_attention` in the private panel instead of silently dropping the lead or risking duplicate messages.
