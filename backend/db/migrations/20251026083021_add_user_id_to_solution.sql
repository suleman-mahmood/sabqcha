-- migrate:up

alter table student_past_paper_solution add column sabqcha_user_row_id bigint references sabqcha_user(row_id);

-- migrate:down

alter table student_past_paper_solution drop column sabqcha_user_row_id;

