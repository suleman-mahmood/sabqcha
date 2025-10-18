-- migrate:up

drop table task_set_analysis;

create table mistake_analysis (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  task_set_row_id bigint not null references task_set(row_id),
  student_row_id bigint not null references student(row_id),
  analysis jsonb not null,

  created_at timestamptz not null default now()
);

-- migrate:down

drop table mistake_analysis;
