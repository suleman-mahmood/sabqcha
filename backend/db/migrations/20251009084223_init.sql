-- migrate:up

create table sabqcha_user (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  display_name text not null,
  email text,
  password text,

  created_at timestamptz not null default now()
);

create table session (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  sabqcha_user_row_id bigint not null references sabqcha_user(row_id),
  is_expired bool default false,

  created_at timestamptz not null default now()
);

create table teacher (
  row_id bigint primary key generated always as identity,
  sabqcha_user_row_id bigint not null references sabqcha_user(row_id)
);

create table device_user (
  row_id bigint primary key generated always as identity,

  device_id text not null unique,
  sabqcha_user_row_id bigint not null references sabqcha_user(row_id)
);

create table student (
  row_id bigint primary key generated always as identity,

  sabqcha_user_row_id bigint not null references sabqcha_user(row_id),
  score bigint not null default 0
);

create table room (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  display_name text not null,
  invite_code text not null,
  teacher_row_id bigint not null references teacher(row_id),

  created_at timestamptz not null default now()
);

create table student_room (
  student_row_id bigint not null references student(row_id),
  room_row_id bigint not null references room(row_id),

  primary key (student_row_id, room_row_id)
);

create table lecture (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  room_row_id bigint not null references room(row_id),
  file_path text not null,
  title text not null,
  transcribed_content text,

  created_at timestamptz not null default now()
);

create type week_day as enum (
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY'
);

create table task_set (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  lecture_row_id bigint not null references lecture(row_id),
  day week_day not null,

  created_at timestamptz not null default now()
);

create table task (
  row_id bigint primary key generated always as identity,
  public_id text not null unique,

  task_set_row_id bigint not null references task_set(row_id),
  question text not null,
  answer text not null,
  options text[] not null
);


-- migrate:down

drop table task;
drop table task_set;
drop type week_day;
drop table lecture;
drop table student_room;
drop table room;
drop table student;
drop table teacher;
drop table sabqcha_user;
