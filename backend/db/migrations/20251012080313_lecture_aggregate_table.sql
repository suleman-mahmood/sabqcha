-- migrate:up

create table lecture_group (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  created_at timestamptz not null default now()
);

alter table lecture add column lecture_group_row_id bigint references lecture_group(row_id);
alter table task_set add column lecture_group_row_id bigint references lecture_group(row_id);

-- migrate:down

alter table lecture drop column lecture_group_row_id;
alter table task_set drop column lecture_group_row_id;
drop table lecture_group;
