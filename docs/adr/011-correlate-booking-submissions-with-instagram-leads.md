# Correlate booking submissions with Instagram leads

Responses linking to `src/app/booking-a-session` will carry an opaque Lead Correlation Token. The booking endpoint will resolve and persist that token server-side so the resulting email and Supabase record can be associated with the originating Instagram conversation and professional account without exposing credentials or raw integration data to the model.
