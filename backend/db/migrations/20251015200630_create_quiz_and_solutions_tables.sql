-- migrate:up

create table quiz (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,
  room_id bigint not null references room(row_id) on delete cascade,
  title text not null,
  answer_sheet_content text not null,
  rubric_content text not null,
  answer_sheet_path text not null,
  rubric_path text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now()
);

create table student_solutions (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,
  quiz_row_id bigint not null references quiz(row_id) on delete cascade,
  title text not null,
  solution_path text not null,
  solution_content text not null default '',
  created_at timestamptz not null default now()
);

-- migrate:down

drop table student_solutions cascade;
drop table quiz cascade;
