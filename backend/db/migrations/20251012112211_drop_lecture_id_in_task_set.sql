-- migrate:up

alter table task_set drop column lecture_row_id;

-- migrate:down

