# Treat Supabase persistence as the booking submission boundary

The booking endpoint will persist a valid Model Enquiry Submission in Supabase before attempting email delivery. A successful database write is the accepted submission; email delivery is tracked separately and may remain `email_pending` for retry, while a database failure prevents the endpoint from claiming success.
