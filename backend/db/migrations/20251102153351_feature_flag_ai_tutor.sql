-- migrate:up

alter table room add column ai_tutor_enabled bool not null default false;

-- migrate:down

alter table room drop column ai_tutor_enabled;
