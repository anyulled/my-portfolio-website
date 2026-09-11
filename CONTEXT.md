# Instagram Model Outreach

This context defines the language for handling inbound professional model enquiries for the photography business.

## Instagram

**Professional Account**:
An Instagram business or creator identity authorized to receive and respond to direct messages through Meta's supported messaging platform.
_Avoid_: Personal account, Instagram user

**Paid Session Enquiry**:
An inbound message from a model expressing interest in being hired for a photography session in exchange for compensation.
_Avoid_: Proposal, booking, collaboration request

**Authorized Response**:
A predefined invitation to complete the model enquiry form; it does not accept or negotiate dates, fees, usage rights, exclusivity, or any other condition.
_Avoid_: Offer, agreement, acceptance

**Ambiguous Enquiry**:
An inbound message whose intent, professional role, or request for compensation cannot be established with high confidence.
_Avoid_: Low-priority lead, uncertain proposal

**Model Enquiry Submission**:
A completed submission through the dedicated booking form containing an itinerant model's contact details and the availability, fee, and photography conditions needed to evaluate a paid session enquiry.
_Avoid_: Booking, application, contract

**Itinerant Model**:
A professional model who travels between locations and offers availability for photography sessions under stated conditions.
_Avoid_: Client, customer, talent lead

**Unified Instagram Inbox**:
A single operational view of conversations received by both professional accounts while preserving the originating account for every conversation and response.
_Avoid_: Shared account, merged identity, common Instagram account

**Sole Operator**:
The single authorized person who accesses the unified inbox and owns the final business responsibility for the workflow.
_Avoid_: Team, collaborator, multiuser administrator

**Detected Language**:
The language inferred from the inbound conversation and used for the authorized response, while the booking form remains responsible for rendering its localized interface and messages.
_Avoid_: Account locale, browser language, fixed response language

**Response Deduplication**:
The rule that permits at most one automatic authorized response for each Instagram conversation.
_Avoid_: Rate limit, retry suppression, message cooldown

**Barcelona Paid Availability Enquiry**:
An inbound Instagram conversation that identifies a model, explicitly indicates availability in Barcelona, and expresses interest in a paid photography session.
_Avoid_: General DM, local enquiry, unpaid collaboration

**Explicit Model Identification**:
An unambiguous statement in the Instagram conversation that the sender is a model or offers modeling services.
_Avoid_: Profile inference, visual inference, contextual guess

**Reviewable Model Lead**:
An inbound conversation identified by the agent as potentially relevant to an itinerant model opportunity and presented to the Sole Operator for a send-or-discard decision.
_Avoid_: Approved lead, automatic lead, booking

**Manual Approval**:
The Sole Operator's explicit decision that authorizes one localized form invitation to be sent through the originating Instagram account.
_Avoid_: Automatic send, implicit approval, acceptance

**Potential Client Enquiry**:
An inbound conversation that expresses interest in booking photography for the sender or another client rather than offering the sender's modeling services.
_Avoid_: Model lead, paid availability enquiry, customer DM

**Response Route**:
The selected business outcome for a conversation: model booking form, client pricing page, or manual review when required information is missing or unclear.
_Avoid_: Prompt, intent label, reply template

**Review Decision**:
One of the three Sole Operator actions for an ambiguous conversation: send the model form, send pricing, or ignore.
_Avoid_: Approve, reject, generic response decision

**Relevant Conversation Record**:
The minimum retained record needed to evaluate or execute a response route: triggering message, limited context, originating account, Instagram conversation identifier, detected language, classification, confidence, and processing state.
_Avoid_: Full transcript, archive, message dump

**Conversation Retention Period**:
One year after the last activity on a Relevant Conversation Record, after which the record is eligible for automatic deletion.
_Avoid_: Indefinite retention, permanent archive, lifetime storage

**Lead Correlation Token**:
An opaque reference carried by a response link so a completed booking form can be associated with its originating conversation and professional account without exposing Instagram credentials or raw integration data.
_Avoid_: Access token, public conversation ID, secret parameter

**Bounded Response Template**:
A predefined localized message for a response route whose variable content is limited to safe presentation data and links, without negotiation or business commitments.
_Avoid_: Free-form reply, generated offer, conversational agent

**Privacy Notice**:
The concise information shown with the model booking form and linked to the privacy policy, explaining the purpose and handling of submitted data without replacing any consent that may separately be required.
_Avoid_: Marketing consent, model release, blanket consent
