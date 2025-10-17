\restrict ajxqBLetZAMp9hVoXw7ihIKeZGydQkvs9aF3ekyiNPIMfmTE6UrQx0PLajcd2ZX

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg120+1)
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: week_day; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.week_day AS ENUM (
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: device_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_user (
    row_id bigint NOT NULL,
    device_id text NOT NULL,
    sabqcha_user_row_id bigint NOT NULL
);


--
-- Name: device_user_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.device_user ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.device_user_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: job; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    identifier text NOT NULL,
    in_progress boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: job_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.job ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.job_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lecture; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lecture (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    file_path text NOT NULL,
    title text NOT NULL,
    transcribed_content text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lecture_group_row_id bigint NOT NULL
);


--
-- Name: lecture_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lecture_group (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    room_row_id bigint NOT NULL
);


--
-- Name: lecture_group_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lecture_group ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lecture_group_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lecture_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lecture ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lecture_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mistake_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mistake_analysis (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    task_set_row_id bigint NOT NULL,
    student_row_id bigint NOT NULL,
    analysis jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mistake_analysis_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.mistake_analysis ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mistake_analysis_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    room_id bigint NOT NULL,
    title text NOT NULL,
    answer_sheet_content text NOT NULL,
    rubric_content text NOT NULL,
    answer_sheet_path text NOT NULL,
    rubric_path text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.quiz ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.quiz_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: room; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    display_name text NOT NULL,
    invite_code text NOT NULL,
    teacher_row_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: room_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.room ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.room_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sabqcha_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sabqcha_user (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    display_name text NOT NULL,
    email text,
    password text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sabqcha_user_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sabqcha_user ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sabqcha_user_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    sabqcha_user_row_id bigint NOT NULL,
    is_expired boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: session_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.session ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.session_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: student; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student (
    row_id bigint NOT NULL,
    sabqcha_user_row_id bigint NOT NULL
);


--
-- Name: student_room; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_room (
    student_row_id bigint NOT NULL,
    room_row_id bigint NOT NULL,
    score bigint DEFAULT 0 NOT NULL
);


--
-- Name: student_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.student ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.student_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: student_solutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_solutions (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    quiz_row_id bigint NOT NULL,
    solution_content text NOT NULL,
    solutions_path text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_solutions_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.student_solutions ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.student_solutions_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    task_set_row_id bigint NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    options text[] NOT NULL
);


--
-- Name: task_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.task ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.task_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: task_set; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_set (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    day public.week_day NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lecture_group_row_id bigint
);


--
-- Name: task_set_attempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_set_attempt (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    task_set_row_id bigint NOT NULL,
    user_attempts jsonb NOT NULL,
    time_elapsed integer NOT NULL,
    correct_count integer NOT NULL,
    incorrect_count integer NOT NULL,
    skip_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    student_row_id bigint
);


--
-- Name: task_set_attempt_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.task_set_attempt ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.task_set_attempt_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: task_set_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.task_set ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.task_set_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: teacher; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher (
    row_id bigint NOT NULL,
    sabqcha_user_row_id bigint NOT NULL
);


--
-- Name: teacher_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.teacher ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.teacher_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: device_user device_user_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_user
    ADD CONSTRAINT device_user_device_id_key UNIQUE (device_id);


--
-- Name: device_user device_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_user
    ADD CONSTRAINT device_user_pkey PRIMARY KEY (row_id);


--
-- Name: job job_identifier_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_identifier_key UNIQUE (identifier);


--
-- Name: job job_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (row_id);


--
-- Name: job job_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_public_id_key UNIQUE (public_id);


--
-- Name: lecture_group lecture_group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecture_group
    ADD CONSTRAINT lecture_group_pkey PRIMARY KEY (row_id);


--
-- Name: lecture_group lecture_group_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecture_group
    ADD CONSTRAINT lecture_group_public_id_key UNIQUE (public_id);


--
-- Name: lecture lecture_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecture
    ADD CONSTRAINT lecture_pkey PRIMARY KEY (row_id);


--
-- Name: lecture lecture_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecture
    ADD CONSTRAINT lecture_public_id_key UNIQUE (public_id);


--
-- Name: mistake_analysis mistake_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mistake_analysis
    ADD CONSTRAINT mistake_analysis_pkey PRIMARY KEY (row_id);


--
-- Name: mistake_analysis mistake_analysis_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mistake_analysis
    ADD CONSTRAINT mistake_analysis_public_id_key UNIQUE (public_id);


--
-- Name: quiz quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_pkey PRIMARY KEY (row_id);


--
-- Name: quiz quiz_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_public_id_key UNIQUE (public_id);


--
-- Name: room room_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT room_pkey PRIMARY KEY (row_id);


--
-- Name: room room_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT room_public_id_key UNIQUE (public_id);


--
-- Name: sabqcha_user sabqcha_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sabqcha_user
    ADD CONSTRAINT sabqcha_user_pkey PRIMARY KEY (row_id);


--
-- Name: sabqcha_user sabqcha_user_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sabqcha_user
    ADD CONSTRAINT sabqcha_user_public_id_key UNIQUE (public_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (row_id);


--
-- Name: session session_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_public_id_key UNIQUE (public_id);


--
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_pkey PRIMARY KEY (row_id);


--
-- Name: student_room student_room_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_room
    ADD CONSTRAINT student_room_pkey PRIMARY KEY (student_row_id, room_row_id);


--
-- Name: student_solutions student_solutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_solutions
    ADD CONSTRAINT student_solutions_pkey PRIMARY KEY (row_id);


--
-- Name: student_solutions student_solutions_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_solutions
    ADD CONSTRAINT student_solutions_public_id_key UNIQUE (public_id);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (row_id);


--
-- Name: task task_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_public_id_key UNIQUE (public_id);


--
-- Name: task_set_attempt task_set_attempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_set_attempt
    ADD CONSTRAINT task_set_attempt_pkey PRIMARY KEY (row_id);


--
-- Name: task_set_attempt task_set_attempt_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_set_attempt
    ADD CONSTRAINT task_set_attempt_public_id_key UNIQUE (public_id);


--
-- Name: task_set task_set_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_set
    ADD CONSTRAINT task_set_pkey PRIMARY KEY (row_id);


--
-- Name: task_set task_set_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_set
    ADD CONSTRAINT task_set_public_id_key UNIQUE (public_id);


--
-- Name: teacher teacher_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher
    ADD CONSTRAINT teacher_pkey PRIMARY KEY (row_id);


--
-- Name: device_user device_user_sabqcha_user_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_user
    ADD CONSTRAINT device_user_sabqcha_user_row_id_fkey FOREIGN KEY (sabqcha_user_row_id) REFERENCES public.sabqcha_user(row_id);


--
-- Name: lecture_group lecture_group_room_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecture_group
    ADD CONSTRAINT lecture_group_room_row_id_fkey FOREIGN KEY (room_row_id) REFERENCES public.room(row_id);


--
-- Name: lecture lecture_lecture_group_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecture
    ADD CONSTRAINT lecture_lecture_group_row_id_fkey FOREIGN KEY (lecture_group_row_id) REFERENCES public.lecture_group(row_id);


--
-- Name: mistake_analysis mistake_analysis_student_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mistake_analysis
    ADD CONSTRAINT mistake_analysis_student_row_id_fkey FOREIGN KEY (student_row_id) REFERENCES public.student(row_id);


--
-- Name: mistake_analysis mistake_analysis_task_set_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mistake_analysis
    ADD CONSTRAINT mistake_analysis_task_set_row_id_fkey FOREIGN KEY (task_set_row_id) REFERENCES public.task_set(row_id);


--
-- Name: quiz quiz_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(row_id) ON DELETE CASCADE;


--
-- Name: room room_teacher_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT room_teacher_row_id_fkey FOREIGN KEY (teacher_row_id) REFERENCES public.teacher(row_id);


--
-- Name: session session_sabqcha_user_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_sabqcha_user_row_id_fkey FOREIGN KEY (sabqcha_user_row_id) REFERENCES public.sabqcha_user(row_id);


--
-- Name: student_room student_room_room_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_room
    ADD CONSTRAINT student_room_room_row_id_fkey FOREIGN KEY (room_row_id) REFERENCES public.room(row_id);


--
-- Name: student_room student_room_student_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_room
    ADD CONSTRAINT student_room_student_row_id_fkey FOREIGN KEY (student_row_id) REFERENCES public.student(row_id);


--
-- Name: student student_sabqcha_user_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_sabqcha_user_row_id_fkey FOREIGN KEY (sabqcha_user_row_id) REFERENCES public.sabqcha_user(row_id);


--
-- Name: student_solutions student_solutions_quiz_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_solutions
    ADD CONSTRAINT student_solutions_quiz_row_id_fkey FOREIGN KEY (quiz_row_id) REFERENCES public.quiz(row_id) ON DELETE CASCADE;


--
-- Name: task_set_attempt task_set_attempt_student_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_set_attempt
    ADD CONSTRAINT task_set_attempt_student_row_id_fkey FOREIGN KEY (student_row_id) REFERENCES public.student(row_id);


--
-- Name: task_set_attempt task_set_attempt_task_set_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_set_attempt
    ADD CONSTRAINT task_set_attempt_task_set_row_id_fkey FOREIGN KEY (task_set_row_id) REFERENCES public.task_set(row_id);


--
-- Name: task_set task_set_lecture_group_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_set
    ADD CONSTRAINT task_set_lecture_group_row_id_fkey FOREIGN KEY (lecture_group_row_id) REFERENCES public.lecture_group(row_id);


--
-- Name: task task_task_set_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_task_set_row_id_fkey FOREIGN KEY (task_set_row_id) REFERENCES public.task_set(row_id);


--
-- Name: teacher teacher_sabqcha_user_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher
    ADD CONSTRAINT teacher_sabqcha_user_row_id_fkey FOREIGN KEY (sabqcha_user_row_id) REFERENCES public.sabqcha_user(row_id);


--
-- PostgreSQL database dump complete
--

\unrestrict ajxqBLetZAMp9hVoXw7ihIKeZGydQkvs9aF3ekyiNPIMfmTE6UrQx0PLajcd2ZX


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20251009084223'),
    ('20251011145552'),
    ('20251012080313'),
    ('20251012083132'),
    ('20251012105540'),
    ('20251012112211'),
    ('20251012134309'),
    ('20251012161356'),
    ('20251015200630'),
    ('20251016040045'),
    ('20251016055812'),
    ('20251016061007');
