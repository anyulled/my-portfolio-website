# ADR 001: GCP Authentication Strategy for Vercel Cron Jobs

## Status

Accepted

## Context

The application needs to interact with Google Cloud Storage (GCS) during a recurring Vercel Cron job (`/api/cron/resize-images`) to process and optimize images. Authentication in the Vercel environment presents several challenges:

1. **Workload Identity Federation (OIDC)**: While supported during Vercel builds and potentially standard API requests, OIDC injection in the Vercel Cron runtime is inconsistent.
2. **Authorization Header Conflict**: Vercel Cron jobs use the `Authorization` header to pass a `CRON_SECRET` for securing the endpoint. This conflicts with attempts to manually pass OIDC identity tokens in the same header.
3. **Google Auth Library Persistence**: The library often requires a physical file path for the `credential_source`, which is difficult to manage in ephemeral serverless environments without `/tmp` hacks.

## Decision

We have decided to use **GCP Service Account Keys** explicitly provided via environment variables as the refined authentication strategy for all backend GCP interactions.

### Implementation Details

- The Service Account `vercel@devbcn.iam.gserviceaccount.com` is used.
- Credentials are provided via three environment variables:
  - `GCP_PROJECT_ID`
  - `GCP_CLIENT_EMAIL`
  - `GCP_PRIVATE_KEY`
- The `storage-client.ts` factory includes sanitization logic to handle common Vercel environment variable formatting issues (e.g., escaped newlines or unintended wrapping quotes).

## Consequences

### Positive

- **Reliability**: Service Account keys are deterministic and do not depend on ephemeral platform-specific injection logic.
- **Support**: This is the best-supported path for the Google Cloud Client SDKs in standalone Node.js environments.
- **Simplicity**: No complex header extraction or temporary file hacks are required in the codebase.

### Negative

- **Key Management**: Requires manual rotation and secure storage of the JSON key.
- **Security Responsibility**: The user must ensure the `GCP_PRIVATE_KEY` is kept secure in Vercel and not committed to source control.

## Alternatives Considered

### 1. Workload Identity Federation (OIDC)

- **Status**: Rejected after experimentation.
- **Reason**: The OIDC token was not consistently available in the Cron environment, and the `Authorization` header conflict made manual extraction unreliable.

### 2. Header-based Token Injection

- **Status**: Rejected.
- **Reason**: Proved incompatible with existing Vercel security protocols (Cron Secrets).
