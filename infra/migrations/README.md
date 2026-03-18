# SafeCode Migrations

Sprint 1 foundation includes baseline schema:

- `0001_core_schema.sql`

Apply it using your PostgreSQL migration runner or psql:

```bash
psql "$DATABASE_URL" -f infra/migrations/0001_core_schema.sql
```