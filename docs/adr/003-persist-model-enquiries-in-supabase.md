# Persist itinerant model enquiries in Supabase

The existing dedicated booking form at `src/app/booking-a-session` will remain the single submission experience for itinerant models. Valid submissions will continue to generate an email notification and will also be persisted in Supabase so enquiries can be queried and managed without parsing email text; the public home-page contact form remains a separate client-facing flow.
