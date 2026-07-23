# LA Plus SpacetimeDB sidecar

This is the local real-time coordination layer for LA Plus. It is deliberately
separate from the SQLite asset index.

## Permitted data

- case IDs and opaque external-vault references
- masked identity fields such as SSN last four
- workflow state, approvals, role assignments, and audit events
- agent run status, request hashes, and operator decisions

## Prohibited data

- full SSNs, identity documents, passwords, or portal credentials
- raw claims evidence, payment details, or full SQLite asset records
- agent authority to submit claims, send outreach, or change permissions

## Local launch

```powershell
docker compose -f sidecar/docker-compose.yml up -d
```

The service binds only to `127.0.0.1:3001`; LA Plus remains on port 3000.

Before publishing a module or connecting a client, define an authorization
model with least-privilege roles and keep the module private. A production
deployment must use TLS, authenticated users, explicit subscriptions, and a
separate secrets/vault service.
