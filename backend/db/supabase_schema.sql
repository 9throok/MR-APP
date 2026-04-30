--
-- PostgreSQL database dump
--

\restrict eUvFTuSqjgqOiOoGLg7ue7GIt1dE43FAqZBfwgqcysSFRoZGAYSVDXlQskqM8UA

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: adverse_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adverse_events (
    id integer NOT NULL,
    dcr_id bigint,
    user_id text NOT NULL,
    doctor_name text,
    drug text NOT NULL,
    symptoms text[] NOT NULL,
    severity character varying(20) NOT NULL,
    patient_info jsonb,
    timeline text,
    status character varying(20) DEFAULT 'pending'::character varying,
    detected_at timestamp with time zone DEFAULT now(),
    reviewed_by text,
    review_notes text,
    reviewed_at timestamp with time zone,
    CONSTRAINT adverse_events_severity_check CHECK (((severity)::text = ANY ((ARRAY['mild'::character varying, 'moderate'::character varying, 'severe'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT adverse_events_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'confirmed'::character varying, 'dismissed'::character varying])::text[])))
);


--
-- Name: adverse_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.adverse_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: adverse_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.adverse_events_id_seq OWNED BY public.adverse_events.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    session_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    sources jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying])::text[])))
);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    product_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: dcr; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dcr (
    id bigint NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    date date,
    visit_time timestamp with time zone,
    product text NOT NULL,
    samples jsonb,
    call_summary text,
    doctor_feedback text,
    edetailing jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: dcr_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dcr_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dcr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dcr_id_seq OWNED BY public.dcr.id;


--
-- Name: distributors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.distributors (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    territory character varying(200) NOT NULL,
    code character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: distributors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.distributors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: distributors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.distributors_id_seq OWNED BY public.distributors.id;


--
-- Name: doctor_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_profiles (
    id integer NOT NULL,
    name text NOT NULL,
    specialty character varying(200),
    tier character varying(10) DEFAULT 'B'::character varying,
    territory character varying(200),
    preferred_visit_day character varying(20),
    hospital text,
    phone character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT doctor_profiles_tier_check CHECK (((tier)::text = ANY ((ARRAY['A'::character varying, 'B'::character varying, 'C'::character varying])::text[])))
);


--
-- Name: doctor_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.doctor_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: doctor_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.doctor_profiles_id_seq OWNED BY public.doctor_profiles.id;


--
-- Name: doctor_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_requests (
    id integer NOT NULL,
    requested_by text NOT NULL,
    name text NOT NULL,
    specialty character varying(200),
    tier character varying(10) DEFAULT 'B'::character varying,
    territory character varying(200),
    preferred_visit_day character varying(20),
    hospital text,
    phone character varying(50),
    notes text,
    status character varying(20) DEFAULT 'pending'::character varying,
    reviewed_by text,
    review_notes text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT doctor_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT doctor_requests_tier_check CHECK (((tier)::text = ANY ((ARRAY['A'::character varying, 'B'::character varying, 'C'::character varying])::text[])))
);


--
-- Name: doctor_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.doctor_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: doctor_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.doctor_requests_id_seq OWNED BY public.doctor_requests.id;


--
-- Name: drug_knowledge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drug_knowledge (
    id integer NOT NULL,
    product_id integer,
    filename text NOT NULL,
    content text NOT NULL,
    category character varying(100),
    uploaded_by text,
    uploaded_at timestamp with time zone DEFAULT now()
);


--
-- Name: drug_knowledge_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.drug_knowledge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: drug_knowledge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.drug_knowledge_id_seq OWNED BY public.drug_knowledge.id;


--
-- Name: follow_up_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follow_up_tasks (
    id integer NOT NULL,
    dcr_id bigint,
    user_id text NOT NULL,
    doctor_name text NOT NULL,
    task text NOT NULL,
    due_date date,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT follow_up_tasks_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'overdue'::character varying])::text[])))
);


--
-- Name: follow_up_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.follow_up_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: follow_up_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.follow_up_tasks_id_seq OWNED BY public.follow_up_tasks.id;


--
-- Name: knowledge_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_chunks (
    id integer NOT NULL,
    knowledge_id integer NOT NULL,
    product_id integer,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    token_count integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    embedding public.vector(768),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: knowledge_chunks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knowledge_chunks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knowledge_chunks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knowledge_chunks_id_seq OWNED BY public.knowledge_chunks.id;


--
-- Name: mr_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mr_targets (
    id bigint NOT NULL,
    user_id text NOT NULL,
    product_id integer,
    period character varying(7) NOT NULL,
    target_qty integer NOT NULL,
    target_value numeric(12,2) NOT NULL,
    set_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT mr_targets_target_qty_check CHECK ((target_qty >= 0)),
    CONSTRAINT mr_targets_target_value_check CHECK ((target_value >= (0)::numeric))
);


--
-- Name: mr_targets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mr_targets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mr_targets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mr_targets_id_seq OWNED BY public.mr_targets.id;


--
-- Name: nba_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nba_recommendations (
    id integer NOT NULL,
    user_id text NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    recommendations jsonb NOT NULL,
    generated_at timestamp with time zone DEFAULT now()
);


--
-- Name: nba_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nba_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nba_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nba_recommendations_id_seq OWNED BY public.nba_recommendations.id;


--
-- Name: pharmacy_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pharmacy_profiles (
    id integer NOT NULL,
    name text NOT NULL,
    type character varying(50) DEFAULT 'retail'::character varying,
    tier character varying(10) DEFAULT 'B'::character varying,
    territory character varying(200),
    preferred_visit_day character varying(20),
    address text,
    phone character varying(50),
    contact_person text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pharmacy_profiles_tier_check CHECK (((tier)::text = ANY ((ARRAY['A'::character varying, 'B'::character varying, 'C'::character varying])::text[]))),
    CONSTRAINT pharmacy_profiles_type_check CHECK (((type)::text = ANY ((ARRAY['retail'::character varying, 'hospital'::character varying, 'chain'::character varying])::text[])))
);


--
-- Name: pharmacy_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pharmacy_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pharmacy_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pharmacy_profiles_id_seq OWNED BY public.pharmacy_profiles.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: rcpa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rcpa (
    id integer NOT NULL,
    user_id text NOT NULL,
    pharmacy text NOT NULL,
    doctor_name text,
    our_brand text NOT NULL,
    our_value numeric(10,2) DEFAULT 0,
    competitor_brand text NOT NULL,
    competitor_company text,
    competitor_value numeric(10,2) DEFAULT 0,
    date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rcpa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rcpa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rcpa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rcpa_id_seq OWNED BY public.rcpa.id;


--
-- Name: secondary_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.secondary_sales (
    id bigint NOT NULL,
    user_id text NOT NULL,
    territory character varying(200) NOT NULL,
    distributor_id integer,
    product_id integer,
    sale_date date NOT NULL,
    quantity integer NOT NULL,
    value numeric(12,2) NOT NULL,
    batch_number character varying(100),
    notes text,
    uploaded_by text NOT NULL,
    upload_batch_id character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT secondary_sales_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT secondary_sales_value_check CHECK ((value >= (0)::numeric))
);


--
-- Name: secondary_sales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.secondary_sales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: secondary_sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.secondary_sales_id_seq OWNED BY public.secondary_sales.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255),
    password_hash text NOT NULL,
    role character varying(20) DEFAULT 'mr'::character varying NOT NULL,
    name character varying(200) NOT NULL,
    territory character varying(200),
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['mr'::character varying, 'manager'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: adverse_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adverse_events ALTER COLUMN id SET DEFAULT nextval('public.adverse_events_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: dcr id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dcr ALTER COLUMN id SET DEFAULT nextval('public.dcr_id_seq'::regclass);


--
-- Name: distributors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distributors ALTER COLUMN id SET DEFAULT nextval('public.distributors_id_seq'::regclass);


--
-- Name: doctor_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_profiles ALTER COLUMN id SET DEFAULT nextval('public.doctor_profiles_id_seq'::regclass);


--
-- Name: doctor_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_requests ALTER COLUMN id SET DEFAULT nextval('public.doctor_requests_id_seq'::regclass);


--
-- Name: drug_knowledge id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drug_knowledge ALTER COLUMN id SET DEFAULT nextval('public.drug_knowledge_id_seq'::regclass);


--
-- Name: follow_up_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_up_tasks ALTER COLUMN id SET DEFAULT nextval('public.follow_up_tasks_id_seq'::regclass);


--
-- Name: knowledge_chunks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunks ALTER COLUMN id SET DEFAULT nextval('public.knowledge_chunks_id_seq'::regclass);


--
-- Name: mr_targets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mr_targets ALTER COLUMN id SET DEFAULT nextval('public.mr_targets_id_seq'::regclass);


--
-- Name: nba_recommendations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_recommendations ALTER COLUMN id SET DEFAULT nextval('public.nba_recommendations_id_seq'::regclass);


--
-- Name: pharmacy_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacy_profiles ALTER COLUMN id SET DEFAULT nextval('public.pharmacy_profiles_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: rcpa id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rcpa ALTER COLUMN id SET DEFAULT nextval('public.rcpa_id_seq'::regclass);


--
-- Name: secondary_sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_sales ALTER COLUMN id SET DEFAULT nextval('public.secondary_sales_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: adverse_events adverse_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adverse_events
    ADD CONSTRAINT adverse_events_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: dcr dcr_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dcr
    ADD CONSTRAINT dcr_pkey PRIMARY KEY (id);


--
-- Name: distributors distributors_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distributors
    ADD CONSTRAINT distributors_code_key UNIQUE (code);


--
-- Name: distributors distributors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distributors
    ADD CONSTRAINT distributors_pkey PRIMARY KEY (id);


--
-- Name: doctor_profiles doctor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_profiles
    ADD CONSTRAINT doctor_profiles_pkey PRIMARY KEY (id);


--
-- Name: doctor_requests doctor_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_requests
    ADD CONSTRAINT doctor_requests_pkey PRIMARY KEY (id);


--
-- Name: drug_knowledge drug_knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drug_knowledge
    ADD CONSTRAINT drug_knowledge_pkey PRIMARY KEY (id);


--
-- Name: follow_up_tasks follow_up_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_up_tasks
    ADD CONSTRAINT follow_up_tasks_pkey PRIMARY KEY (id);


--
-- Name: knowledge_chunks knowledge_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunks
    ADD CONSTRAINT knowledge_chunks_pkey PRIMARY KEY (id);


--
-- Name: mr_targets mr_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mr_targets
    ADD CONSTRAINT mr_targets_pkey PRIMARY KEY (id);


--
-- Name: mr_targets mr_targets_user_id_product_id_period_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mr_targets
    ADD CONSTRAINT mr_targets_user_id_product_id_period_key UNIQUE (user_id, product_id, period);


--
-- Name: nba_recommendations nba_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_recommendations
    ADD CONSTRAINT nba_recommendations_pkey PRIMARY KEY (id);


--
-- Name: nba_recommendations nba_recommendations_user_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nba_recommendations
    ADD CONSTRAINT nba_recommendations_user_id_date_key UNIQUE (user_id, date);


--
-- Name: pharmacy_profiles pharmacy_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacy_profiles
    ADD CONSTRAINT pharmacy_profiles_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: rcpa rcpa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rcpa
    ADD CONSTRAINT rcpa_pkey PRIMARY KEY (id);


--
-- Name: secondary_sales secondary_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_sales
    ADD CONSTRAINT secondary_sales_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_id_key UNIQUE (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_ae_dcr; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ae_dcr ON public.adverse_events USING btree (dcr_id);


--
-- Name: idx_ae_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ae_severity ON public.adverse_events USING btree (severity);


--
-- Name: idx_ae_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ae_status ON public.adverse_events USING btree (status);


--
-- Name: idx_ae_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ae_user ON public.adverse_events USING btree (user_id);


--
-- Name: idx_chat_messages_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_session ON public.chat_messages USING btree (session_id, created_at);


--
-- Name: idx_chat_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_sessions_user ON public.chat_sessions USING btree (user_id, updated_at DESC);


--
-- Name: idx_chunks_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chunks_fts ON public.knowledge_chunks USING gin (to_tsvector('english'::regconfig, content));


--
-- Name: idx_chunks_knowledge; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chunks_knowledge ON public.knowledge_chunks USING btree (knowledge_id);


--
-- Name: idx_chunks_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chunks_product ON public.knowledge_chunks USING btree (product_id);


--
-- Name: idx_chunks_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chunks_tags ON public.knowledge_chunks USING gin (tags);


--
-- Name: idx_dcr_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dcr_date ON public.dcr USING btree (date DESC);


--
-- Name: idx_dcr_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dcr_product ON public.dcr USING btree (product);


--
-- Name: idx_dcr_user_doctor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dcr_user_doctor ON public.dcr USING btree (user_id, name);


--
-- Name: idx_dcr_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dcr_user_id ON public.dcr USING btree (user_id);


--
-- Name: idx_distributors_territory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_distributors_territory ON public.distributors USING btree (territory);


--
-- Name: idx_doctor_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_name ON public.doctor_profiles USING btree (name);


--
-- Name: idx_doctor_territory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_territory ON public.doctor_profiles USING btree (territory);


--
-- Name: idx_doctor_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_tier ON public.doctor_profiles USING btree (tier);


--
-- Name: idx_dr_requested_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dr_requested_by ON public.doctor_requests USING btree (requested_by);


--
-- Name: idx_dr_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dr_status ON public.doctor_requests USING btree (status);


--
-- Name: idx_knowledge_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_category ON public.drug_knowledge USING btree (category);


--
-- Name: idx_knowledge_content_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_content_fts ON public.drug_knowledge USING gin (to_tsvector('english'::regconfig, content));


--
-- Name: idx_knowledge_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_product ON public.drug_knowledge USING btree (product_id);


--
-- Name: idx_mt_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mt_period ON public.mr_targets USING btree (period);


--
-- Name: idx_mt_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mt_product_id ON public.mr_targets USING btree (product_id);


--
-- Name: idx_mt_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mt_user_id ON public.mr_targets USING btree (user_id);


--
-- Name: idx_nba_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nba_user_date ON public.nba_recommendations USING btree (user_id, date);


--
-- Name: idx_pharmacy_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pharmacy_name ON public.pharmacy_profiles USING btree (name);


--
-- Name: idx_pharmacy_territory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pharmacy_territory ON public.pharmacy_profiles USING btree (territory);


--
-- Name: idx_rcpa_competitor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rcpa_competitor ON public.rcpa USING btree (competitor_brand);


--
-- Name: idx_rcpa_competitor_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rcpa_competitor_company ON public.rcpa USING btree (competitor_company);


--
-- Name: idx_rcpa_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rcpa_date ON public.rcpa USING btree (date DESC);


--
-- Name: idx_rcpa_our_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rcpa_our_brand ON public.rcpa USING btree (our_brand);


--
-- Name: idx_rcpa_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rcpa_user ON public.rcpa USING btree (user_id);


--
-- Name: idx_ss_distributor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ss_distributor ON public.secondary_sales USING btree (distributor_id);


--
-- Name: idx_ss_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ss_product_id ON public.secondary_sales USING btree (product_id);


--
-- Name: idx_ss_sale_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ss_sale_date ON public.secondary_sales USING btree (sale_date DESC);


--
-- Name: idx_ss_territory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ss_territory ON public.secondary_sales USING btree (territory);


--
-- Name: idx_ss_upload; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ss_upload ON public.secondary_sales USING btree (upload_batch_id);


--
-- Name: idx_ss_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ss_user_id ON public.secondary_sales USING btree (user_id);


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_due_date ON public.follow_up_tasks USING btree (due_date);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.follow_up_tasks USING btree (status);


--
-- Name: idx_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_id ON public.follow_up_tasks USING btree (user_id);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_user_id ON public.users USING btree (user_id);


--
-- Name: adverse_events adverse_events_dcr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adverse_events
    ADD CONSTRAINT adverse_events_dcr_id_fkey FOREIGN KEY (dcr_id) REFERENCES public.dcr(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE;


--
-- Name: chat_sessions chat_sessions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: drug_knowledge drug_knowledge_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drug_knowledge
    ADD CONSTRAINT drug_knowledge_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: follow_up_tasks follow_up_tasks_dcr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_up_tasks
    ADD CONSTRAINT follow_up_tasks_dcr_id_fkey FOREIGN KEY (dcr_id) REFERENCES public.dcr(id) ON DELETE CASCADE;


--
-- Name: knowledge_chunks knowledge_chunks_knowledge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunks
    ADD CONSTRAINT knowledge_chunks_knowledge_id_fkey FOREIGN KEY (knowledge_id) REFERENCES public.drug_knowledge(id) ON DELETE CASCADE;


--
-- Name: knowledge_chunks knowledge_chunks_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunks
    ADD CONSTRAINT knowledge_chunks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: mr_targets mr_targets_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mr_targets
    ADD CONSTRAINT mr_targets_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: secondary_sales secondary_sales_distributor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_sales
    ADD CONSTRAINT secondary_sales_distributor_id_fkey FOREIGN KEY (distributor_id) REFERENCES public.distributors(id);


--
-- Name: secondary_sales secondary_sales_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_sales
    ADD CONSTRAINT secondary_sales_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- PostgreSQL database dump complete
--

\unrestrict eUvFTuSqjgqOiOoGLg7ue7GIt1dE43FAqZBfwgqcysSFRoZGAYSVDXlQskqM8UA

