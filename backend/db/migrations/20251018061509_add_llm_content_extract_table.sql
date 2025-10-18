-- migrate:up

create type llm_content_extract_type as enum (
  'RUBRIC',
  'MARKING_SCHEME',
  'GRADED_STUDENT_SOLUTION'
);

create table llm_content_extract (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  content text not null,
  content_type llm_content_extract_type not null,

  created_at timestamptz not null default now()
);

alter table quiz add column ms_llm_content_extract_row_id bigint references llm_content_extract(row_id);
alter table quiz add column rubric_llm_content_extract_row_id bigint references llm_content_extract(row_id);


drop table student_solutions;
create table student_solution (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  quiz_row_id bigint not null references quiz(row_id),
  title text not null,
  solution_path text not null,
  graded_llm_content_extract_row_id bigint references llm_content_extract(row_id),

  created_at timestamptz not null default now()
);

-- migrate:down

alter table quiz drop column ms_llm_content_extract_row_id;
alter table quiz drop column rubric_llm_content_extract_row_id;
drop table llm_content_extract;
drop type llm_content_extract_type;

