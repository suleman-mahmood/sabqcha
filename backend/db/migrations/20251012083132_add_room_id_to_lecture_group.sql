-- migrate:up

alter table lecture_group add column room_row_id bigint not null references room(row_id);

-- migrate:down

alter table lecture_group drop column room_row_id;

