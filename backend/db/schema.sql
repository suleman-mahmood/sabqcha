\restrict yKzRuyoxeIlWJKqXsObLMEJzJTYoXVaZtSCZIH8LCZYuL6ChcRexfgJbvbblLTl

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: mcq; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcq (
    id integer NOT NULL,
    public_id text NOT NULL,
    transcription_row_id integer NOT NULL,
    question text NOT NULL,
    options text[] NOT NULL,
    answer text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mcq_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.mcq ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mcq_id_seq
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
    id integer NOT NULL,
    public_id text NOT NULL,
    display_name text NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sabqcha_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sabqcha_user ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sabqcha_user_id_seq
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
-- Name: transcription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transcription (
    id integer NOT NULL,
    public_id text NOT NULL,
    file_path text NOT NULL,
    title text NOT NULL,
    sabqcha_user_row_id integer NOT NULL,
    transcribed_content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: transcription_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.transcription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.transcription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mcq mcq_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq
    ADD CONSTRAINT mcq_pkey PRIMARY KEY (id);


--
-- Name: mcq mcq_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq
    ADD CONSTRAINT mcq_public_id_key UNIQUE (public_id);


--
-- Name: sabqcha_user sabqcha_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sabqcha_user
    ADD CONSTRAINT sabqcha_user_pkey PRIMARY KEY (id);


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
-- Name: transcription transcription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcription
    ADD CONSTRAINT transcription_pkey PRIMARY KEY (id);


--
-- Name: transcription transcription_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcription
    ADD CONSTRAINT transcription_public_id_key UNIQUE (public_id);


--
-- Name: mcq mcq_transcription_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq
    ADD CONSTRAINT mcq_transcription_row_id_fkey FOREIGN KEY (transcription_row_id) REFERENCES public.transcription(id);


--
-- Name: transcription transcription_sabqcha_user_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcription
    ADD CONSTRAINT transcription_sabqcha_user_row_id_fkey FOREIGN KEY (sabqcha_user_row_id) REFERENCES public.sabqcha_user(id);


--
-- PostgreSQL database dump complete
--

\unrestrict yKzRuyoxeIlWJKqXsObLMEJzJTYoXVaZtSCZIH8LCZYuL6ChcRexfgJbvbblLTl


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20251006171045');
