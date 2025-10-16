-- migrate:up

alter table task_set_attempt add column student_row_id bigint references student(row_id);


-- migrate:down

alter table task_set_attempt drop column student_row_id;
