-- migrate:up

create type program_type as enum (
  'O_LEVEL',
  'A_LEVEL'
);

create table subject (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  display_name text not null,
  code text not null unique,
  program program_type not null,

  created_at timestamptz not null default now()
);

create table past_paper_bank (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  subject_row_id bigint not null references subject(row_id),
  season text not null,
  year int not null,
  paper int not null,
  variant int not null,
  question_file_path text not null,
  marking_scheme_file_path text not null,

  created_at timestamptz not null default now()
);

alter table room add column subject_row_id bigint references subject(row_id);

create table student_past_paper_solution (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  past_paper_bank_row_id bigint not null references past_paper_bank(row_id),
  solution_file_path text not null,
  llm_content_extract_row_id bigint not null references llm_content_extract(row_id),

  created_at timestamptz not null default now()
);

-- migrate:down

drop table student_past_paper_solution;
alter table room drop column subject_row_id;
drop table past_paper_bank;
drop table subject;
drop type program_type;

