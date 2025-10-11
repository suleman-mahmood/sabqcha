-- migrate:up

alter table student_room add column score bigint not null default 0;
alter table student drop column score;

-- migrate:down

alter table student_room drop column score;
alter table student add column score bigint not null default 0;
