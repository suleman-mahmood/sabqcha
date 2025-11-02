\restrict Sej2T6vuA5ySXY1alBFpsNZuaMwHshLn0Xxqd2oWachmaw4g8vJI4bi3gR3s8FY

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
-- Name: llm_content_extract_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.llm_content_extract_type AS ENUM (
    'RUBRIC',
    'MARKING_SCHEME',
    'GRADED_STUDENT_SOLUTION'
);


--
-- Name: program_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.program_type AS ENUM (
    'O_LEVEL',
    'A_LEVEL'
);


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
-- Name: llm_content_extract; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_content_extract (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    content text NOT NULL,
    content_type public.llm_content_extract_type NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: llm_content_extract_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.llm_content_extract ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.llm_content_extract_row_id_seq
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
-- Name: past_paper_bank; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.past_paper_bank (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    subject_row_id bigint NOT NULL,
    season text NOT NULL,
    year integer NOT NULL,
    paper integer NOT NULL,
    variant integer NOT NULL,
    question_file_path text NOT NULL,
    marking_scheme_file_path text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: past_paper_bank_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.past_paper_bank ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.past_paper_bank_row_id_seq
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
    room_row_id bigint NOT NULL,
    title text NOT NULL,
    answer_sheet_path text NOT NULL,
    rubric_path text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ms_llm_content_extract_row_id bigint,
    rubric_llm_content_extract_row_id bigint
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    subject_row_id bigint,
    ai_tutor_enabled boolean DEFAULT false NOT NULL
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
-- Name: student_past_paper_solution; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_past_paper_solution (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    past_paper_bank_row_id bigint NOT NULL,
    solution_file_path text NOT NULL,
    llm_content_extract_row_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sabqcha_user_row_id bigint
);


--
-- Name: student_past_paper_solution_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.student_past_paper_solution ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.student_past_paper_solution_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
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
-- Name: student_solution; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_solution (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    quiz_row_id bigint NOT NULL,
    title text NOT NULL,
    solution_path text NOT NULL,
    graded_llm_content_extract_row_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_solution_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.student_solution ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.student_solution_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: subject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subject (
    row_id bigint NOT NULL,
    public_id text NOT NULL,
    display_name text NOT NULL,
    code text NOT NULL,
    program public.program_type NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    rubric_content text
);


--
-- Name: subject_row_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.subject ALTER COLUMN row_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.subject_row_id_seq
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
-- Name: llm_content_extract llm_content_extract_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_content_extract
    ADD CONSTRAINT llm_content_extract_pkey PRIMARY KEY (row_id);


--
-- Name: llm_content_extract llm_content_extract_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_content_extract
    ADD CONSTRAINT llm_content_extract_public_id_key UNIQUE (public_id);


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
-- Name: past_paper_bank past_paper_bank_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.past_paper_bank
    ADD CONSTRAINT past_paper_bank_pkey PRIMARY KEY (row_id);


--
-- Name: past_paper_bank past_paper_bank_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.past_paper_bank
    ADD CONSTRAINT past_paper_bank_public_id_key UNIQUE (public_id);


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
-- Name: student_past_paper_solution student_past_paper_solution_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_past_paper_solution
    ADD CONSTRAINT student_past_paper_solution_pkey PRIMARY KEY (row_id);


--
-- Name: student_past_paper_solution student_past_paper_solution_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_past_paper_solution
    ADD CONSTRAINT student_past_paper_solution_public_id_key UNIQUE (public_id);


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
-- Name: student_solution student_solution_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_solution
    ADD CONSTRAINT student_solution_pkey PRIMARY KEY (row_id);


--
-- Name: student_solution student_solution_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_solution
    ADD CONSTRAINT student_solution_public_id_key UNIQUE (public_id);


--
-- Name: subject subject_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject
    ADD CONSTRAINT subject_code_key UNIQUE (code);


--
-- Name: subject subject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject
    ADD CONSTRAINT subject_pkey PRIMARY KEY (row_id);


--
-- Name: subject subject_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject
    ADD CONSTRAINT subject_public_id_key UNIQUE (public_id);


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
-- Name: past_paper_bank past_paper_bank_subject_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.past_paper_bank
    ADD CONSTRAINT past_paper_bank_subject_row_id_fkey FOREIGN KEY (subject_row_id) REFERENCES public.subject(row_id);


--
-- Name: quiz quiz_ms_llm_content_extract_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_ms_llm_content_extract_row_id_fkey FOREIGN KEY (ms_llm_content_extract_row_id) REFERENCES public.llm_content_extract(row_id);


--
-- Name: quiz quiz_room_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_room_row_id_fkey FOREIGN KEY (room_row_id) REFERENCES public.room(row_id);


--
-- Name: quiz quiz_rubric_llm_content_extract_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_rubric_llm_content_extract_row_id_fkey FOREIGN KEY (rubric_llm_content_extract_row_id) REFERENCES public.llm_content_extract(row_id);


--
-- Name: room room_subject_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT room_subject_row_id_fkey FOREIGN KEY (subject_row_id) REFERENCES public.subject(row_id);


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
-- Name: student_past_paper_solution student_past_paper_solution_llm_content_extract_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_past_paper_solution
    ADD CONSTRAINT student_past_paper_solution_llm_content_extract_row_id_fkey FOREIGN KEY (llm_content_extract_row_id) REFERENCES public.llm_content_extract(row_id);


--
-- Name: student_past_paper_solution student_past_paper_solution_past_paper_bank_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_past_paper_solution
    ADD CONSTRAINT student_past_paper_solution_past_paper_bank_row_id_fkey FOREIGN KEY (past_paper_bank_row_id) REFERENCES public.past_paper_bank(row_id);


--
-- Name: student_past_paper_solution student_past_paper_solution_sabqcha_user_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_past_paper_solution
    ADD CONSTRAINT student_past_paper_solution_sabqcha_user_row_id_fkey FOREIGN KEY (sabqcha_user_row_id) REFERENCES public.sabqcha_user(row_id);


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
-- Name: student_solution student_solution_graded_llm_content_extract_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_solution
    ADD CONSTRAINT student_solution_graded_llm_content_extract_row_id_fkey FOREIGN KEY (graded_llm_content_extract_row_id) REFERENCES public.llm_content_extract(row_id);


--
-- Name: student_solution student_solution_quiz_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_solution
    ADD CONSTRAINT student_solution_quiz_row_id_fkey FOREIGN KEY (quiz_row_id) REFERENCES public.quiz(row_id);


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

\unrestrict Sej2T6vuA5ySXY1alBFpsNZuaMwHshLn0Xxqd2oWachmaw4g8vJI4bi3gR3s8FY


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
    ('20251016061007'),
    ('20251018050651'),
    ('20251018061509'),
    ('20251025080248'),
    ('20251025143919'),
    ('20251026083021'),
    ('20251102153351');
