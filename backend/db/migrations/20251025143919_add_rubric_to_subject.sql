-- migrate:up

alter table subject add column rubric_content text;

-- migrate:down

alter table subject drop column rubric_content;
