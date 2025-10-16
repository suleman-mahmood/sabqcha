-- migrate:up

create table job (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  identifier text not null unique,
  in_progress bool not null,

  created_at timestamptz not null default now()
);

-- migrate:down

drop table job;

