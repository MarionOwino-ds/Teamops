-- TeamOps sessions — migration 003
-- Persists session tokens so users stay signed in across server restarts.
-- Tokens are stored as SHA-256 hashes; the raw token is only ever sent to the client.

create table if not exists sessions (
  token_hash text primary key,
  user_id    integer not null references users(id) on delete cascade,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at text not null
);

create index if not exists idx_sessions_user on sessions(user_id);
create index if not exists idx_sessions_expires on sessions(expires_at);