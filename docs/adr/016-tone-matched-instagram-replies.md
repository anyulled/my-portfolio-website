# ADR 016: Tone-matched Instagram replies

- Status: Accepted
- Date: 2026-10-09
- Supersedes: ADR 012 for initial replies, operator-approved replies and pricing follow-ups

## Context

The operator requests personal replies matching the sender tone rather than fixed templates, with automatic answers only above 90% confidence.

## Decision

Keep classification and generation separate. Normalize intent first, then require the existing classifier confidence to be strictly greater than 0.90 for an automatic actionable route. Scores at or below 0.90 go to pending review. Unrelated messages remain ignored, and incomplete intent remains under review regardless of confidence. Operator approval explicitly authorizes the selected initial response independent of classification confidence.

Generate the reply body with the existing server-side AI SDK Groq provider and a Zod structured-output schema. Supply the original stored inbound message for approved replies and follow-ups; supply the triggering inbound message for webhook replies. Match language, formality, warmth and restrained emoji usage. Treat sender text as untrusted data. The trusted action restricts the response to collecting model proposal information or sharing pricing. Never negotiate prices, fees, availability, dates or rights or claim a booking.

The model does not generate links. Reject empty, oversized or URL-containing bodies and append only the server-selected pricing or correlated model-form URL. Generation failure sends no template and releases the delivery claim through the existing failure flow.

Pricing follow-ups also require stored classification confidence above 0.90. Generate only after acquiring the claim and before beginning delivery. Preserve the existing Meta messaging window, cancellation, retry limits and reconciliation rules. Historical messages are not replayed.

## Consequences

Replies require an additional Groq call. The threshold applies to the classifier's self-reported intent score; it is not a measured probability of reply accuracy. The schema validates structure and link boundaries; language and business-policy adherence require model evaluation alongside the deterministic delivery tests.
