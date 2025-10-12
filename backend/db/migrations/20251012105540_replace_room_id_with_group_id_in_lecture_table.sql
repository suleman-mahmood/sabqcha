-- migrate:up

alter table lecture drop column room_row_id;
alter table lecture alter column lecture_group_row_id set not null;

-- migrate:down

