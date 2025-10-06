-- migrate:up

create table sabqcha_user (
  id int primary key generated always as identity,
  public_id text not null unique,

  display_name text not null,
  score int not null default 0,

  created_at timestamptz not null default now()
);

create table transcription (
  id int primary key generated always as identity,
  public_id text not null unique,

  file_path text not null,
  title text not null,
  sabqcha_user_row_id int not null references sabqcha_user(id),
  transcribed_content text not null,

  created_at timestamptz not null default now()
);

create table mcq (
  id int primary key generated always as identity,
  public_id text not null unique,
  transcription_row_id int not null references transcription(id),

  question text not null,
  options text[] not null,
  answer text not null,

  created_at timestamptz not null default now()
);

-- migrate:down
