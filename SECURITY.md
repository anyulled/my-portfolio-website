# Security Policy

## Supported version

Security fixes target the current `main` branch.

## Reporting

Report vulnerabilities privately through GitHub Security Advisories. Do not publish credentials, exploit details, personal data, or client information in a public issue.

## Repository requirements

- Store local secrets only in ignored `.env.local` files and deployment secrets in the relevant provider.
- Keep `.env.example` value-free.
- Compare environment-variable names without displaying values.
- Require bearer authentication before cron handlers construct or call integration clients.
- Never enable `HARNESS_MODE=fixture` in Vercel production.
- Run the security and secret-scanning checks before merge.
- Rotate a credential only after confirming exposure and obtaining explicit authorization for the external change.
