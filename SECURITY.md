# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

Instead, report it privately by:
- Opening a private security advisory on GitHub
- Or contacting the maintainers directly

## What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Measures

- API keys are stored as environment variables, never in code
- Pi payment approval/completion requires server-side API key
- Blockchain validation for withdrawals
- Firestore security rules enforce data access control
- CORS headers on all API endpoints

## Response Time

We aim to acknowledge security reports within 48 hours and provide a fix within 7 days.
