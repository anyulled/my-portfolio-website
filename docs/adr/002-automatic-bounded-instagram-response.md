# Automatically classify bounded Instagram responses

Status: superseded by ADR-005

The Instagram agent will classify inbound messages and prepare a bounded response candidate. It must not accept, negotiate, or confirm fees, dates, usage rights, exclusivity, or any other condition.

The classifier will use a conservative threshold: ambiguous enquiries are not answered automatically and remain available for human review.

The authorized response will use the detected language of the inbound message, and the booking form will handle its own localized presentation.

Each conversation may receive at most one automatic authorized response. The decision must be persisted so webhook retries and repeated inbound messages cannot produce duplicate invitations.

Only conversations qualifying as a Barcelona paid availability enquiry are eligible for the model workflow; unrelated Instagram messages are excluded from Supabase and the unified inbox.

Barcelona must be named explicitly in the conversation. Location inferred from broader references such as Spain or Catalonia is insufficient for automatic processing.
