# Agent Security Policy

The autonomous engineer is a privileged development system. It must assume repository, database, deployment, and user-data access are sensitive.

## Never commit

- API keys
- access tokens
- service-role credentials
- cookies
- private keys
- production environment files

## Approval required

Human approval is mandatory for any operation that:

- changes authentication or authorization;
- changes Row Level Security policies;
- modifies or deletes production data;
- creates a production database migration;
- changes secrets/environment variables;
- changes billing or paid infrastructure;
- directly deploys production;
- disables security controls.

## Safe development default

Use an isolated Git branch and preview deployment. The agent should prefer additive, reversible changes and must preserve the existing application contract whenever possible.

## Operational note

The current Supabase project has security-advisor warnings for executable `SECURITY DEFINER` functions and disabled leaked-password protection. Those are candidates for future review, not automatic fixes. The agent must not silently change authorization behavior.
