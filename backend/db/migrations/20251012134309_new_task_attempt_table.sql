-- migrate:up

create table task_set_attempt (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  task_set_row_id bigint not null references task_set(row_id),
  user_attempts jsonb not null,

  time_elapsed int not null,
  correct_count int not null,
  incorrect_count int not null,
  skip_count int not null,

  created_at timestamptz not null default now()
);

-- migrate:down

drop table task_set_attempt;
