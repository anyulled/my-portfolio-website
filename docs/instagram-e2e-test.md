# Instagram direct-message end-to-end test

This test validates the complete production path from an incoming Instagram direct message to the bounded response, the unified inbox state, and the booking or pricing destination. It must be run manually because a successful model enquiry sends a real Instagram reply.

## Preconditions

- The production Meta app is published.
- `anyulled` and `sensuelleboudoir` are connected at `/instagram`.
- The Meta webhook callback is `https://boudoir.barcelona/api/instagram/webhook`.
- The Meta app has the `messages` webhook subscription.
- The operator can sign in at `https://boudoir.barcelona/instagram`.
- The test sender is a separate Instagram account that is not one of the two managed accounts.

## Controlled test cases

Run one case at a time and record only the case result, timestamp, target account, and response status. Do not copy unrelated direct-message content into tickets or logs.

| Case                    | Test message intent                                                                                               | Expected classification | Expected result                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Clear model enquiry     | The sender identifies as a model, names Barcelona, and explicitly asks about a paid photography session or cachet | `model_form`            | One automatic reply in the message language containing `/booking-a-session?lead=...`; the conversation is completed and is not shown as pending |
| Ambiguous model enquiry | The sender mentions modelling but omits the city or the session/payment type                                      | `manual_review`         | No automatic reply; the conversation appears in the panel as pending and can be approved or ignored manually                                    |
| Clear client enquiry    | The sender clearly wants to book a photography session but is not offering modelling services                     | `pricing`               | One automatic reply containing `/pricing`; the conversation is completed                                                                        |
| Unrelated message       | The message has no clear model opportunity or client photography intent                                           | `ignore`                | No reply and no persisted conversation                                                                                                          |

Use equivalent messages in Italian, Spanish, or another supported language to verify that the response language follows the incoming message. The test sender should avoid personal data and should not send attachments.

## Verification

1. Send the selected test message to exactly one managed account.
2. Confirm that Meta delivers the event to the webhook and that the webhook responds successfully.
3. Open `/instagram` and confirm the expected panel state for the case.
4. Open the received reply and verify that it contains only the bounded route response and the expected site destination.
5. For the model-form case, submit the linked booking form with synthetic test data only and verify that the submission reaches the configured administrative email.
6. Confirm that retrying or redelivering the same Instagram event does not send a second reply.
7. Remove synthetic test data from the booking workflow only after confirming that the result has been recorded. Do not delete production conversations or submissions as part of this checklist.

## Failure evidence

If a case fails, capture the UTC timestamp, managed account handle, case name, HTTP status, and the reference returned by the admin panel. Check the Vercel function logs using that reference and inspect the Meta webhook delivery status. Never include access tokens, verification tokens, service-role keys, or complete direct-message bodies in the report.
