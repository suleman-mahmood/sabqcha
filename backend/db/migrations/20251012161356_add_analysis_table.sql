-- migrate:up

create table task_set_analysis (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  task_set_row_id bigint not null references task_set(row_id),
  in_progress bool not null,
  analysis jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- migrate:down

