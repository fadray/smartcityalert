--
-- PostgreSQL database dump
--

\restrict dAeGsYMBiT7X39MgR43EjAnlNpxGwNQVk0t054epQfkk2ysL0cumkqyLSg00n9p

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.responders DROP CONSTRAINT IF EXISTS responders_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.responders DROP CONSTRAINT IF EXISTS responders_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_incident_id_fkey;
ALTER TABLE IF EXISTS ONLY public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_reported_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_assigned_to_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incidents DROP CONSTRAINT IF EXISTS incidents_reported_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incidents DROP CONSTRAINT IF EXISTS incidents_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.whatsapp_messages DROP CONSTRAINT IF EXISTS fk_whatsapp_processed_by;
ALTER TABLE IF EXISTS ONLY public.whatsapp_messages DROP CONSTRAINT IF EXISTS fk_whatsapp_incident;
DROP INDEX IF EXISTS public.idx_whatsapp_incident_id;
DROP INDEX IF EXISTS public.idx_whatsapp_from_number;
DROP INDEX IF EXISTS public.idx_whatsapp_created_at;
DROP INDEX IF EXISTS public.idx_users_role;
DROP INDEX IF EXISTS public.idx_users_phone;
DROP INDEX IF EXISTS public.idx_users_email_unique;
DROP INDEX IF EXISTS public.idx_responders_available;
DROP INDEX IF EXISTS public.idx_notifications_user_id;
DROP INDEX IF EXISTS public.idx_notifications_is_read;
DROP INDEX IF EXISTS public.idx_notifications_created_at;
DROP INDEX IF EXISTS public.idx_maintenance_requests_status;
DROP INDEX IF EXISTS public.idx_maintenance_requests_priority;
DROP INDEX IF EXISTS public.idx_maintenance_requests_department;
DROP INDEX IF EXISTS public.idx_incidents_status;
DROP INDEX IF EXISTS public.idx_incidents_department;
DROP INDEX IF EXISTS public.idx_assets_next_maintenance;
DROP INDEX IF EXISTS public.idx_assets_location;
ALTER TABLE IF EXISTS ONLY public.workflow_config DROP CONSTRAINT IF EXISTS workflow_config_pkey;
ALTER TABLE IF EXISTS ONLY public.whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_phone_key;
ALTER TABLE IF EXISTS ONLY public.responders DROP CONSTRAINT IF EXISTS responders_pkey;
ALTER TABLE IF EXISTS ONLY public.responders DROP CONSTRAINT IF EXISTS responders_badge_number_key;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.incidents DROP CONSTRAINT IF EXISTS incidents_pkey;
ALTER TABLE IF EXISTS ONLY public.escalation_rules DROP CONSTRAINT IF EXISTS escalation_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_pkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_name_key;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_code_key;
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS assets_pkey;
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS assets_asset_tag_key;
DROP TABLE IF EXISTS public.workflow_config;
DROP TABLE IF EXISTS public.whatsapp_messages;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.responders;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.maintenance_requests;
DROP TABLE IF EXISTS public.incidents;
DROP TABLE IF EXISTS public.escalation_rules;
DROP TABLE IF EXISTS public.departments;
DROP TABLE IF EXISTS public.assets;
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    asset_tag character varying(100) NOT NULL,
    location character varying(255) NOT NULL,
    manufacturer character varying(255),
    model character varying(255),
    purchase_date date,
    warranty_expiry date,
    last_maintenance_date date,
    next_maintenance_date date,
    is_active boolean DEFAULT true,
    maintenance_history jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#3B82F6'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: escalation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escalation_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    incident_type character varying(50),
    severity_level integer,
    current_level integer,
    target_role character varying(50),
    timeout_minutes integer DEFAULT 30,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    incident_type character varying(50) NOT NULL,
    department_id uuid,
    severity_level integer DEFAULT 1,
    status character varying(50) DEFAULT 'pending'::character varying,
    latitude numeric(10,8),
    longitude numeric(11,8),
    reported_by_id uuid,
    assigned_to_id uuid,
    current_workflow_level integer DEFAULT 1,
    resolved_at timestamp with time zone,
    resolution_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_fully_approved boolean DEFAULT false,
    images jsonb DEFAULT '[]'::jsonb,
    escalation_history jsonb DEFAULT '[]'::jsonb,
    resolution_proofs jsonb DEFAULT '[]'::jsonb,
    approvals jsonb DEFAULT '[]'::jsonb,
    assignee_type character varying(50) DEFAULT 'responder'::character varying,
    CONSTRAINT incidents_severity_level_check CHECK (((severity_level >= 1) AND (severity_level <= 5)))
);


--
-- Name: maintenance_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    location character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    priority character varying(50) DEFAULT 'medium'::character varying,
    department_id uuid,
    reported_by_id uuid,
    assigned_to_id uuid,
    images text[],
    scheduled_date date,
    completion_date date,
    estimated_cost numeric(10,2),
    actual_cost numeric(10,2),
    technician_notes text,
    verification_notes text,
    parts_used text[],
    requires_verification boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying,
    incident_id uuid,
    is_read boolean DEFAULT false,
    email_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: responders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    department_id uuid,
    badge_number character varying(50),
    responder_level integer DEFAULT 1,
    is_available boolean DEFAULT true,
    latitude numeric(10,8),
    longitude numeric(11,8),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    full_name character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    department_id uuid,
    is_active boolean DEFAULT true,
    fcm_token text,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: whatsapp_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    from_number character varying(20) NOT NULL,
    message_body text NOT NULL,
    media_url text,
    media_type character varying(50),
    status character varying(50) DEFAULT 'received'::character varying,
    detected_incident_type character varying(50),
    extracted_data jsonb DEFAULT '{}'::jsonb,
    incident_id uuid,
    processed_by_id uuid,
    twilio_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: workflow_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    acknowledgment_rules jsonb,
    assignment_rules jsonb,
    escalation_levels jsonb,
    closure_rules jsonb,
    department_id character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assets (id, name, asset_tag, location, manufacturer, model, purchase_date, warranty_expiry, last_maintenance_date, next_maintenance_date, is_active, maintenance_history, created_at, updated_at) FROM stdin;
82efe6af-2026-4039-95ea-eb37807ac9ad	Generator Set	GEN-001	Main Power House	Cummins	C250D5	2023-01-15	\N	\N	2024-06-15	t	[]	2026-06-02 09:43:01.499728+00	2026-06-02 09:43:01.499728+00
a609db4f-7473-4dec-8938-6e56fc0cedb7	Water Pump	PMP-001	Water Treatment Plant	Grundfos	CR120	2023-03-20	\N	\N	2024-07-20	t	[]	2026-06-02 09:43:01.499728+00	2026-06-02 09:43:01.499728+00
e0e7d04c-36d2-4739-837f-e992c9eb769f	Security Camera System	CAM-001	Main Gate	Hikvision	DS-2CD2	2023-06-10	\N	\N	2024-09-10	t	[]	2026-06-02 09:43:01.499728+00	2026-06-02 09:43:01.499728+00
aff3a322-de10-43bb-9c03-51b37bce2ff7	Fire Alarm Panel	FAP-001	Building A	Honeywell	Notifier	2022-11-05	\N	\N	2024-05-05	t	[]	2026-06-02 09:43:01.499728+00	2026-06-02 09:43:01.499728+00
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, name, code, description, color, is_active, created_at, updated_at) FROM stdin;
5b1a6391-1586-4b2c-8f26-872827d919f9	Medical	MED	\N	#10B981	t	2026-05-31 21:27:12.311762+00	2026-05-31 21:27:12.311762+00
bced65cb-b882-467e-8b44-6e5d650d0da6	Transport	TRA	Transport	#3B82F6	t	2026-05-31 23:03:15.142786+00	2026-05-31 23:03:15.142786+00
71db1ff7-495f-488f-b4df-c0392691f6d4	Environmental Health	ENV	Environmental Health	#3B82F6	t	2026-06-01 08:51:14.433497+00	2026-06-01 08:51:14.433497+00
bd8cddfd-7177-4b01-8292-5b7305912933	Test Department	TEST	Test department for UI	#10B981	t	2026-06-05 10:06:22.711661+00	2026-06-05 10:06:22.711661+00
072c22a6-fec9-4a98-bb86-3b4fc37d5112	Fire	FIR	Fire Dept.	#ff145b	t	2026-05-31 21:27:12.311762+00	2026-06-05 11:42:26.177154+00
835b9088-106e-4500-b12c-70837668f096	Fire Service	FIRE	Handles fire outbreaks and emergencies	#EF4444	t	2026-06-06 09:21:26.782522+00	2026-06-06 09:21:26.782522+00
1c0d789e-ba06-42a7-a010-664beffb0190	Security	SEC	Security threats and suspicious activities	#3B82F6	t	2026-05-31 21:27:12.311762+00	2026-06-05 11:41:52.209604+00
3b8f1f70-f057-4305-a6ed-476cf3c5b6bb	Maintenance	MAINT	Infrastructure and facility maintenance	#F59E0B	t	2026-05-31 21:27:12.311762+00	2026-05-31 21:27:12.311762+00
23252894-aea1-4f77-91a4-9ce850a61c53	Traffic Management	TRAFFIC	Traffic congestion and accident management	#8B5CF6	t	2026-06-06 09:23:31.585963+00	2026-06-06 09:23:31.585963+00
816957b3-bb29-4641-91e1-5807ea151645	Drainage Services	DRAIN	Flooding and drainage issues	#06B6D4	t	2026-06-06 09:23:31.604276+00	2026-06-06 09:23:31.604276+00
210f042a-0bac-451d-ae92-6d5cfd461e6c	Health Services	HEALTH	Medical emergencies and health services	#10B981	t	2026-06-06 09:24:57.621852+00	2026-06-06 09:24:57.621852+00
\.


--
-- Data for Name: escalation_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.escalation_rules (id, incident_type, severity_level, current_level, target_role, timeout_minutes, is_active, created_at) FROM stdin;
34de52ab-0a2d-47f5-9241-cafaaa5af962	general	3	1	supervisor	30	t	2026-05-31 21:27:12.314718+00
0277426a-473f-4e6a-b882-f38e7af7135e	general	3	2	hod	60	t	2026-05-31 21:27:12.314718+00
38534b28-6b37-47ea-8eef-083b9f656ee1	general	3	3	dept_director	120	t	2026-05-31 21:27:12.314718+00
3d8b8da8-4825-4146-b2e3-073ab33eda1b	general	3	4	overall_manager	180	t	2026-05-31 21:27:12.314718+00
e3579392-a818-443d-94a2-f335a082343a	general	3	5	overall_director	240	t	2026-05-31 21:27:12.314718+00
\.


--
-- Data for Name: incidents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incidents (id, title, description, incident_type, department_id, severity_level, status, latitude, longitude, reported_by_id, assigned_to_id, current_workflow_level, resolved_at, resolution_notes, created_at, updated_at, is_fully_approved, images, escalation_history, resolution_proofs, approvals, assignee_type) FROM stdin;
c84c3f26-64d1-4ec5-854e-5e27623a2f98	Broken Pipe	Broken pipe at the estate 11	maintenance	3b8f1f70-f057-4305-a6ed-476cf3c5b6bb	2	resolved	\N	\N	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	3	\N	\N	2026-05-31 21:52:42.046854+00	2026-06-01 08:45:42.894+00	f	[]	[]	[]	[]	responder
6f48197f-5a32-4a04-9c2e-165c18ccd0fb	Final Test	Testing proper history appending	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	resolved	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	1	\N	\N	2026-06-04 09:51:58.818426+00	2026-06-04 09:51:59.117+00	f	[]	[{"id": "1780566719117", "level": 1, "action": "status_change", "reason": "Status changed from in_progress to resolved", "new_value": "resolved", "old_value": "in_progress", "timestamp": "2026-06-04T09:51:59.117Z", "user_name": "System", "user_role": "admin"}]	[]	[]	responder
d76d383f-bac8-4ed2-ab18-803473f18a0f	House on Fire	Electricity	maintenance	bced65cb-b882-467e-8b44-6e5d650d0da6	4	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-02 12:50:45.649155+00	2026-06-02 13:25:00.109296+00	f	[]	[]	[]	[]	responder
15fa79a5-535c-497d-86f6-81fdc3de8469	History Test 2	Testing multiple updates	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	resolved	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	1	\N	\N	2026-06-04 09:42:30.209591+00	2026-06-04 09:42:30.681279+00	f	[]	[{"id": "1780566150676", "level": 1, "action": "status_change", "reason": "Status changed from in_progress to resolved", "new_value": "resolved", "old_value": "in_progress", "timestamp": "2026-06-04T09:42:30.676Z", "user_name": "System", "user_role": "admin"}]	[]	[]	responder
0e2989f3-bda2-4b80-8f07-416d5fe33046	Debug Test	Testing with logs	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	resolved	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	1	\N	\N	2026-06-04 09:55:52.45798+00	2026-06-04 09:55:52.867+00	f	[]	[{"id": "1780566952867", "level": 1, "action": "status_change", "reason": "Status changed from in_progress to resolved", "new_value": "resolved", "old_value": "in_progress", "timestamp": "2026-06-04T09:55:52.867Z", "user_name": "System", "user_role": "admin"}]	[]	[]	responder
196a863d-1a52-4552-b5ab-0258b4c91dea	History Test	Testing history	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	resolved	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	1	\N	\N	2026-06-04 10:02:37.9505+00	2026-06-04 10:02:38.452+00	f	[]	[{"id": "1780567358452", "level": 1, "action": "status_change", "reason": "Status changed from in_progress to resolved", "new_value": "resolved", "old_value": "in_progress", "timestamp": "2026-06-04T10:02:38.452Z", "user_name": "System", "user_role": "admin"}]	[]	[]	responder
297fc435-edb9-441a-9450-6845210f5672	ttt	ttt	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	3	\N	\N	2026-06-02 12:31:41.847525+00	2026-06-03 16:05:00.070661+00	f	{}	[{"level": 3, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-03T16:05:00.055Z"}]	{}	{}	user
b11ad9e2-689b-414c-914d-a70101e03e72	hii	hello	fire	072c22a6-fec9-4a98-bb86-3b4fc37d5112	5	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	91a9c41f-d478-4370-a773-b41a375c79ba	3	\N	\N	2026-06-02 12:39:36.115706+00	2026-06-03 16:05:00.104259+00	f	{}	[{"level": 3, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-03T16:05:00.097Z"}]	{}	{}	user
4f7879ea-db3d-4084-82fd-b04546d112d6	Test No Images	Test Description	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	closed	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	3	\N	\N	2026-06-03 14:33:25.685978+00	2026-06-03 16:37:04.319+00	f	{}	[{"level": 3, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-03T16:05:00.119Z"}]	{}	{}	user
640a957c-81fe-46df-98ab-5118f64f2e83	Food Scarce	Food  Scarce	medical	1c0d789e-ba06-42a7-a010-664beffb0190	5	resolved	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	8	\N	\N	2026-06-03 13:16:30.533019+00	2026-06-04 15:04:54.344+00	f	{}	[{"id": "1780565663240", "level": 8, "action": "status_change", "reason": "Status changed from in_progress to pending_approval", "new_value": "pending_approval", "old_value": "in_progress", "timestamp": "2026-06-04T09:34:23.240Z", "user_name": "System", "user_role": "admin"}, {"id": "1780585494344", "level": 8, "action": "status_change", "reason": "Status changed from pending_approval to resolved", "new_value": "resolved", "old_value": "pending_approval", "timestamp": "2026-06-04T15:04:54.344Z", "user_name": "System", "user_role": "admin"}]	{}	{}	user
6707620c-2a3d-4a4c-a374-3689c85490e1	dfghjk	rtyui	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	resolved	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	3	\N	\N	2026-06-02 13:03:09.700617+00	2026-06-04 16:00:49.34+00	f	{}	[{"level": 3, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-04T07:50:00.108Z"}, {"id": "1780588849340", "level": 3, "action": "status_change", "reason": "Status changed from escalated to resolved", "new_value": "resolved", "old_value": "escalated", "timestamp": "2026-06-04T16:00:49.340Z", "user_name": "System", "user_role": "admin"}]	{}	{}	user
fa245d90-b7cf-4ac6-9e80-6e07a49871ab	try 1	try 1	medical	5b1a6391-1586-4b2c-8f26-872827d919f9	5	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	93855ac1-4de5-4575-bb29-a244bd3b1ed7	3	\N	\N	2026-06-02 12:52:23.960433+00	2026-06-04 07:50:00.053856+00	f	{}	[{"level": 3, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-04T07:50:00.029Z"}]	{}	{}	user
c3607818-1bc6-4e59-a32e-9eed9cc4b2b3	fff	ffff	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	3	\N	\N	2026-06-02 12:32:35.549725+00	2026-06-04 07:50:00.09164+00	f	{}	[{"level": 3, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-04T07:50:00.074Z"}]	{}	{}	user
de660ad8-8e51-4db5-9fb0-13dfe0bc5979	Phone	damaged	medical	1c0d789e-ba06-42a7-a010-664beffb0190	1	closed	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	4	\N	\N	2026-06-02 13:09:07.672174+00	2026-06-04 17:22:07.85+00	f	{}	[{"id": "1780565710142", "level": 4, "action": "status_change", "reason": "Status changed from escalated to resolved", "new_value": "resolved", "old_value": "escalated", "timestamp": "2026-06-04T09:35:10.142Z", "user_name": "System", "user_role": "admin"}, {"id": "1780593727850", "level": 4, "action": "status_change", "reason": "Status changed from resolved to closed", "new_value": "closed", "old_value": "resolved", "timestamp": "2026-06-04T17:22:07.850Z", "user_name": "System", "user_role": "admin"}]	{}	{}	user
58cf9fee-3744-4a74-822b-84d1cf4a2ee3	Notification Test	Testing if notifications work	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-04 17:26:40.307837+00	2026-06-04 18:20:21.44454+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-04T18:20:26.022Z"}]	{}	{}	responder
77e697a4-1878-4be2-af02-b8904932ea57	Notification Test	Testing if notifications work	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-04 17:45:04.295816+00	2026-06-04 18:20:23.232402+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-04T18:20:27.956Z"}]	{}	{}	responder
ec93e903-fe60-4454-a1e6-0adf72ef606f	rest 2	rtyui	fire	072c22a6-fec9-4a98-bb86-3b4fc37d5112	4	escalated	\N	\N	8ff04089-7ecb-4551-8496-38abd6dbc999	91a9c41f-d478-4370-a773-b41a375c79ba	8	2026-06-01 08:42:21.01+00	\N	2026-05-31 22:17:02.280446+00	2026-06-04 08:55:00.084286+00	t	{}	[{"level": 8, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-04T08:55:00.078Z"}]	{}	{}	user
351b9de4-a327-467e-97a3-2d92ecf64566	Test Not	Test Not	security	1c0d789e-ba06-42a7-a010-664beffb0190	4	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	2	\N	\N	2026-06-05 06:19:06.3154+00	2026-06-05 06:50:00.119589+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T06:50:00.086Z"}]	{}	{}	user
6b0149fc-c5db-442d-9d1f-d3097062640b	Broken Pipe	Broken Pipe	security	1c0d789e-ba06-42a7-a010-664beffb0190	4	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-05 06:23:26.835327+00	2026-06-05 06:55:00.098518+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T06:55:00.095Z"}]	{}	{}	responder
beeca0f3-1baa-4495-aebf-e1cde54be382	Frex2	frex2	fire	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-05 06:34:27.943993+00	2026-06-05 07:05:00.142137+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T07:05:00.132Z"}]	{}	{}	responder
e095cd0f-6fb3-4c33-9e6b-9556b931b14d	History Test	Testing history	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	resolved	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	4	\N	\N	2026-06-04 14:43:36.76167+00	2026-06-04 17:14:35.544+00	f	{}	[{"level": 4, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-04T17:05:00.044Z"}, {"id": "1780592913112", "level": 4, "action": "status_change", "reason": "Status changed from escalated to in_progress", "new_value": "in_progress", "old_value": "escalated", "timestamp": "2026-06-04T17:08:33.114Z", "user_name": "System", "user_role": "admin"}, {"id": "1780592979664", "level": 4, "action": "status_change", "reason": "Status changed from in_progress to pending_approval", "new_value": "pending_approval", "old_value": "in_progress", "timestamp": "2026-06-04T17:09:39.664Z", "user_name": "System", "user_role": "admin"}, {"id": "1780593275544", "level": 4, "action": "status_change", "reason": "Status changed from pending_approval to resolved", "new_value": "resolved", "old_value": "pending_approval", "timestamp": "2026-06-04T17:14:35.544Z", "user_name": "System", "user_role": "admin"}]	{}	{}	user
36907158-cea2-478c-af3e-2a98ed7e5a01	Gmail SSL Test	Testing email with SSL on port 465	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-05 09:11:27.151205+00	2026-06-05 09:45:00.072111+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T09:45:00.067Z"}]	{}	{}	responder
4242d220-cf1f-4b4d-b332-ae491b881e28	Gmail Test	Testing Gmail integration	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	3	\N	\N	2026-06-05 08:45:15.201472+00	2026-06-05 09:55:00.054251+00	f	{}	[{"level": 3, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T09:55:00.052Z"}]	{}	{}	user
a005dd7d-e166-486d-a964-8f0982c4faaf	test unlimitr	test unlimitr	security	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-05 09:39:17.222863+00	2026-06-05 10:10:00.163647+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T10:10:00.141Z"}]	{}	{}	responder
80e27970-375d-4422-b999-486e1a803af6	FIRE Report via WhatsApp	FIRE at Campground Zone B!	fire	835b9088-106e-4500-b12c-70837668f096	5	escalated	0.00000000	0.00000000	0809328b-2c6c-4235-8888-35e9f5a89c47	\N	2	\N	\N	2026-06-06 09:58:09.569004+00	2026-06-06 10:30:00.073172+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-06T10:30:00.064Z"}]	{}	{}	responder
c2078890-ec39-413c-89f4-cdedcb00645d	FIRE Report via WhatsApp	FIRE at Campground Zone B!	fire	835b9088-106e-4500-b12c-70837668f096	5	escalated	0.00000000	0.00000000	0809328b-2c6c-4235-8888-35e9f5a89c47	\N	2	\N	\N	2026-06-06 10:02:25.828238+00	2026-06-06 10:35:00.133165+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-06T10:35:00.116Z"}]	{}	{}	responder
603b2857-dced-4eb5-b637-8c2b535e90d0	MEDICAL Report via WhatsApp	MEDICAL: Someone collapsed near Gate A	medical	210f042a-0bac-451d-ae92-6d5cfd461e6c	5	escalated	0.00000000	0.00000000	cb4e7d97-8f7b-4734-8ae3-ff5bab3c3bde	\N	2	\N	\N	2026-06-06 10:02:26.120498+00	2026-06-06 10:35:00.305397+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-06T10:35:00.157Z"}]	{}	{}	responder
d06175aa-99e8-43c9-8a12-862a00f9b695	FIRE Report via WhatsApp	FIRE test	fire	835b9088-106e-4500-b12c-70837668f096	5	escalated	0.00000000	0.00000000	17735483-3a70-49a4-bc75-bf2086411606	\N	2	\N	\N	2026-06-06 10:16:33.676187+00	2026-06-06 10:50:00.608244+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-06T10:53:06.788Z"}]	{}	{}	responder
be4d46ef-256b-4277-be5c-a522b6592278	MEDICAL Report via WhatsApp	MEDICAL: Someone collapsed near Gate A, need ambulance!	medical	210f042a-0bac-451d-ae92-6d5cfd461e6c	5	escalated	0.00000000	0.00000000	cb4e7d97-8f7b-4734-8ae3-ff5bab3c3bde	\N	2	\N	\N	2026-06-06 10:24:03.141328+00	2026-06-06 10:55:00.203314+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-06T10:55:00.188Z"}]	{}	{}	responder
39d6b3a2-002d-4975-904b-a9ebb9ba5e10	hooo	ertyu	medical	5b1a6391-1586-4b2c-8f26-872827d919f9	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-06 10:34:56.26997+00	2026-06-06 11:05:00.1845+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-06T11:05:00.170Z"}]	{}	{}	responder
2721ccb6-3e14-4fb4-a94f-de048f611f32	Notification Test 2	Testing if notifications are sent properly	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	3	\N	\N	2026-06-04 17:18:01.487672+00	2026-06-05 06:30:00.042106+00	f	{}	[{"level": 3, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T06:30:00.034Z"}]	{}	{}	user
e7631b8e-b1e8-481c-87f9-48f2ced5eb1a	Gate Police	Calling Cabs shiuting	security	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-05 06:16:51.802242+00	2026-06-05 06:50:00.152731+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T06:50:00.147Z"}]	{}	{}	responder
8427646d-ecb9-4b19-86f9-3ead1c6b50e6	Frex	frex	fire	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-05 06:29:09.209714+00	2026-06-05 07:00:28.676935+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T07:00:27.700Z"}]	{}	{}	responder
aaa57317-82c4-41f4-9e40-4e6591b8bf5f	wertyui	ertyui	security	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	2	\N	\N	2026-06-05 07:29:39.483278+00	2026-06-05 08:00:00.069495+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T08:00:00.042Z"}]	{}	{}	user
3d6d083a-9366-4d9b-bf94-6c527074632d	Gmail SSL Test	Testing email with SSL on port 465	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	closed	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	1	\N	\N	2026-06-05 09:01:42.480651+00	2026-06-05 09:29:23.401+00	f	[]	[{"id": "1780651362517", "level": 1, "action": "status_change", "reason": "Status changed from pending to acknowledged", "new_value": "acknowledged", "old_value": "pending", "timestamp": "2026-06-05T09:22:42.517Z", "user_name": "System", "user_role": "admin"}, {"id": "1780651376301", "level": 1, "action": "assignment", "reason": "Incident assigned to Pentalk TV", "comments": "", "new_value": "47c3920f-df28-4fad-b60c-bbf2c58c641c", "old_value": "unassigned", "timestamp": "2026-06-05T09:22:56.301Z", "user_role": "Supervisor", "assignee_name": "Pentalk TV"}, {"id": "1780651418290", "level": 1, "action": "status_change", "reason": "Status changed from assigned to in_progress", "new_value": "in_progress", "old_value": "assigned", "timestamp": "2026-06-05T09:23:38.290Z", "user_name": "System", "user_role": "admin"}, {"id": "1780651534406", "level": 1, "action": "status_change", "reason": "Status changed from in_progress to pending_approval", "new_value": "pending_approval", "old_value": "in_progress", "timestamp": "2026-06-05T09:25:34.406Z", "user_name": "System", "user_role": "admin"}, {"id": "1780651763401", "level": 1, "action": "status_change", "reason": "Status changed from pending_approval to closed", "new_value": "closed", "old_value": "pending_approval", "timestamp": "2026-06-05T09:29:23.401Z", "user_name": "System", "user_role": "admin"}]	[]	[]	user
9154d0e3-6c58-4056-a1ab-6cf60146fd75	NIFFY	NIFFY	security	1c0d789e-ba06-42a7-a010-664beffb0190	3	escalated	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	\N	2	\N	\N	2026-06-05 09:31:07.451557+00	2026-06-05 10:05:00.061948+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-05T10:05:00.054Z"}]	{}	{}	responder
7d44a717-403a-478f-a767-882bc05217cc	Test Assign Incident	Test Description for Assignment	medical	1c0d789e-ba06-42a7-a010-664beffb0190	3	closed	0.00000000	0.00000000	8ff04089-7ecb-4551-8496-38abd6dbc999	47c3920f-df28-4fad-b60c-bbf2c58c641c	5	\N	\N	2026-06-03 14:27:46.691683+00	2026-06-06 06:25:35.509+00	f	{}	[{"level": 5, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-04T15:05:00.109Z"}, {"id": "1780589116035", "level": 5, "action": "status_change", "reason": "Status changed from escalated to pending_approval", "new_value": "pending_approval", "old_value": "escalated", "timestamp": "2026-06-04T16:05:16.035Z", "user_name": "System", "user_role": "admin"}, {"id": "1780720474971", "level": 5, "action": "status_change", "reason": "Status changed from pending_approval to resolved", "new_value": "resolved", "old_value": "pending_approval", "timestamp": "2026-06-06T04:34:34.971Z", "user_name": "System", "user_role": "admin"}, {"id": "1780727135509", "level": 5, "action": "status_change", "reason": "Status changed from resolved to closed", "new_value": "closed", "old_value": "resolved", "timestamp": "2026-06-06T06:25:35.509Z", "user_name": "System", "user_role": "admin"}]	{}	{}	user
6dead830-66dd-4e2b-9386-e7d4b6da3bb9	FIRE Report via WhatsApp	FIRE at Campground Zone B!	fire	835b9088-106e-4500-b12c-70837668f096	5	escalated	0.00000000	0.00000000	0809328b-2c6c-4235-8888-35e9f5a89c47	\N	2	\N	\N	2026-06-06 10:00:58.826501+00	2026-06-06 10:35:00.513519+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-06T10:35:00.454Z"}]	{}	{}	responder
419d0ad1-cd9a-4b1c-a5b2-52d707a8700a	FIRE Report via WhatsApp	FIRE test	fire	835b9088-106e-4500-b12c-70837668f096	5	escalated	0.00000000	0.00000000	17735483-3a70-49a4-bc75-bf2086411606	\N	2	\N	\N	2026-06-06 10:12:40.464965+00	2026-06-06 10:45:00.211124+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-06T10:45:00.173Z"}]	{}	{}	responder
c16d59ab-467f-4d2d-a566-c4e5019f10ad	FIRE Report via WhatsApp	FIRE at Campground!	fire	835b9088-106e-4500-b12c-70837668f096	5	escalated	0.00000000	0.00000000	17735483-3a70-49a4-bc75-bf2086411606	\N	2	\N	\N	2026-06-06 10:23:04.381754+00	2026-06-06 10:50:01.447789+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-06T10:53:07.493Z"}]	{}	{}	responder
7c2ff4ed-1f6a-435b-bf53-0d1bb0bde471	FIRE Report via WhatsApp	FIRE at Campground!	fire	835b9088-106e-4500-b12c-70837668f096	5	escalated	0.00000000	0.00000000	17735483-3a70-49a4-bc75-bf2086411606	\N	2	\N	\N	2026-06-06 10:28:39.974461+00	2026-06-06 11:00:00.140415+00	f	{}	[{"level": 2, "reason": "Auto-escalated due to timeout", "timestamp": "2026-06-06T11:00:00.125Z"}]	{}	{}	responder
\.


--
-- Data for Name: maintenance_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_requests (id, title, description, location, status, priority, department_id, reported_by_id, assigned_to_id, images, scheduled_date, completion_date, estimated_cost, actual_cost, technician_notes, verification_notes, parts_used, requires_verification, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, type, priority, incident_id, is_read, email_sent, created_at) FROM stdin;
4a96c105-bdd0-4152-91bf-e7c4d0698a7d	8ff04089-7ecb-4551-8496-38abd6dbc999	Test Notification	This is a test notification to verify the bell works	test	medium	\N	t	f	2026-06-04 17:04:58.403404+00
8ad35a05-86e3-4f7a-9f33-0b277b5724b4	8ff04089-7ecb-4551-8496-38abd6dbc999	Test Notification	This is a test notification to verify the bell works	test	medium	\N	t	f	2026-06-04 17:13:44.25031+00
e1c6bc6e-117a-44a5-8631-2c828dd35d82	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: Phone	Status changed from resolved to closed by System Administrator	status_change	medium	de660ad8-8e51-4db5-9fb0-13dfe0bc5979	f	f	2026-06-04 17:22:10.181719+00
3c8f43cc-aa0f-4bf5-b969-4c05e4ab587e	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: Phone	Status changed from resolved to closed by System Administrator	status_change	medium	de660ad8-8e51-4db5-9fb0-13dfe0bc5979	f	f	2026-06-04 17:22:12.532512+00
cc984e6d-c911-4b2f-acc8-ba9b5fc7f203	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	Notification Test - medical - Severity Level 3	new_incident	medium	58cf9fee-3744-4a74-822b-84d1cf4a2ee3	f	f	2026-06-04 17:26:44.085553+00
a3101c28-abbf-408a-b63b-ad663f9cc990	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	Notification Test - medical - Severity Level 3	new_incident	medium	58cf9fee-3744-4a74-822b-84d1cf4a2ee3	f	f	2026-06-04 17:26:46.95113+00
30456d85-8f22-4e58-855f-e1c0f24d2c47	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	Notification Test - medical - Severity Level 3	new_incident	medium	77e697a4-1878-4be2-af02-b8904932ea57	f	f	2026-06-04 17:45:15.759706+00
a97893a7-d9d0-4869-b66c-8a18dd7fc842	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	Notification Test - medical - Severity Level 3	new_incident	medium	77e697a4-1878-4be2-af02-b8904932ea57	f	f	2026-06-04 17:45:18.009487+00
1987680a-7e96-4808-b49b-dc3042246603	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Notification Test - medical - Severity Level 3	new_incident	medium	58cf9fee-3744-4a74-822b-84d1cf4a2ee3	t	f	2026-06-04 17:26:40.727297+00
b9b396a3-c27e-48da-b9f1-df7644aba94c	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Notification Test - medical - Severity Level 3	new_incident	medium	77e697a4-1878-4be2-af02-b8904932ea57	t	f	2026-06-04 17:45:04.366842+00
b658b709-b1cf-4e78-897c-5c53e7a4090d	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Phone	Status changed from resolved to closed by System Administrator	status_change	medium	de660ad8-8e51-4db5-9fb0-13dfe0bc5979	t	f	2026-06-04 17:22:08.077838+00
32bee11d-7787-439f-bdae-50b7592180f0	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Notification Test 2	Status changed from acknowledged to in_progress by System Administrator	status_change	medium	2721ccb6-3e14-4fb4-a94f-de048f611f32	t	f	2026-06-04 17:19:42.28299+00
dd84f237-1463-4c03-a3bd-2ee1b10fb0d7	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Notification Test 2	Status changed from pending to acknowledged by System Administrator	status_change	medium	2721ccb6-3e14-4fb4-a94f-de048f611f32	t	f	2026-06-04 17:18:07.794223+00
3683fcc4-0d1f-40a1-aa86-fb90c3b57533	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Notification Test 2 - medical - Severity Level 3	new_incident	medium	2721ccb6-3e14-4fb4-a94f-de048f611f32	t	f	2026-06-04 17:18:01.775734+00
5b3f710c-1cb4-4a9d-ba6c-16f2a67f8c6f	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: History Test	Status changed from pending_approval to resolved by System Administrator	status_change	medium	e095cd0f-6fb3-4c33-9e6b-9556b931b14d	t	f	2026-06-04 17:14:35.597085+00
81043de1-f46d-4680-baea-2f41b43c3d8e	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: History Test	Status changed from in_progress to pending_approval by System Administrator	status_change	medium	e095cd0f-6fb3-4c33-9e6b-9556b931b14d	t	f	2026-06-04 17:09:39.795405+00
b91e16fa-a72d-4b55-a8e1-fd6beec2c208	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: History Test	Status changed from escalated to in_progress by System Administrator	status_change	medium	e095cd0f-6fb3-4c33-9e6b-9556b931b14d	t	f	2026-06-04 17:08:33.251332+00
34906790-b1ab-427e-973e-1ebe2254b083	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: History Test	Status changed from escalated to in_progress by System Administrator	status_change	medium	e095cd0f-6fb3-4c33-9e6b-9556b931b14d	t	f	2026-06-04 17:01:07.339993+00
c6c2e574-f9de-4531-83dd-b74a281c8c65	47c3920f-df28-4fad-b60c-bbf2c58c641c	📋 Incident Assigned to You	You have been assigned to: History Test by System Administrator	assignment	high	e095cd0f-6fb3-4c33-9e6b-9556b931b14d	t	f	2026-06-04 16:27:46.271255+00
10ca0f02-7288-48db-b397-a071329ae6cf	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: History Test	Status changed from resolved to escalated by System Administrator	status_change	medium	e095cd0f-6fb3-4c33-9e6b-9556b931b14d	t	f	2026-06-04 16:25:18.323168+00
984b1649-1190-4fad-a0bb-fecece62a2e1	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: History Test	Status changed from in_progress to resolved by System Administrator	status_change	medium	e095cd0f-6fb3-4c33-9e6b-9556b931b14d	t	f	2026-06-04 16:23:55.479883+00
dd9ef4e6-4f97-4ca4-8b0c-0a1f19c2782d	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: History Test	Status changed from escalated to in_progress by System Administrator	status_change	medium	e095cd0f-6fb3-4c33-9e6b-9556b931b14d	t	f	2026-06-04 16:23:09.865808+00
7c9830f7-444c-4f0e-a886-07b8a576bc7b	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	Gate Police - security - Severity Level 3	new_incident	medium	e7631b8e-b1e8-481c-87f9-48f2ced5eb1a	f	f	2026-06-05 06:16:51.946307+00
ff40217f-1d5a-453a-aa60-d316c2f2e500	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	Gate Police - security - Severity Level 3	new_incident	medium	e7631b8e-b1e8-481c-87f9-48f2ced5eb1a	f	f	2026-06-05 06:18:07.806122+00
3f710d5f-6652-4f42-9ef9-6e6a19b546fb	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	Test Not - security - Severity Level 4	new_incident	high	351b9de4-a327-467e-97a3-2d92ecf64566	f	f	2026-06-05 06:19:06.434758+00
8c9aa64f-6407-4c61-a4d2-a0bda1d5de25	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: Gate Police	Status changed from pending to acknowledged by System Administrator	status_change	medium	e7631b8e-b1e8-481c-87f9-48f2ced5eb1a	f	f	2026-06-05 06:20:03.453306+00
f76d2a85-3bee-4dc7-8e20-285958e5e80d	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: Gate Police	Status changed from pending to acknowledged by System Administrator	status_change	medium	e7631b8e-b1e8-481c-87f9-48f2ced5eb1a	f	f	2026-06-05 06:20:03.546129+00
ace71a3c-0b59-4406-af82-bfd44acdbc2a	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	Test Not - security - Severity Level 4	new_incident	high	351b9de4-a327-467e-97a3-2d92ecf64566	f	f	2026-06-05 06:20:21.492288+00
1c8cffa4-e07f-4ebe-873e-983ab212204b	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Gate Police - security - Severity Level 3	new_incident	medium	e7631b8e-b1e8-481c-87f9-48f2ced5eb1a	t	f	2026-06-05 06:19:22.871774+00
e93a4fa6-baa2-4c75-89f9-bc9ff5aabc96	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Gate Police	Status changed from pending to acknowledged by System Administrator	status_change	medium	e7631b8e-b1e8-481c-87f9-48f2ced5eb1a	t	f	2026-06-05 06:20:03.559513+00
26c24624-10aa-4e59-99b1-15cbab2a27f7	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: Test Not	Status changed from pending to acknowledged by System Administrator	status_change	medium	351b9de4-a327-467e-97a3-2d92ecf64566	f	f	2026-06-05 06:21:03.688509+00
8f53e31b-2103-481b-ae99-0c908b888515	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: Test Not	Status changed from pending to acknowledged by System Administrator	status_change	medium	351b9de4-a327-467e-97a3-2d92ecf64566	f	f	2026-06-05 06:21:03.713022+00
834a6b2e-58ec-4440-9715-e89d5535e0d6	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Test Not - security - Severity Level 4	new_incident	high	351b9de4-a327-467e-97a3-2d92ecf64566	t	f	2026-06-05 06:21:36.538697+00
41689341-05f6-4774-9146-9f72314bdd54	47c3920f-df28-4fad-b60c-bbf2c58c641c	📋 Incident Assigned to You	You have been assigned to: Test Not by System Administrator	assignment	high	351b9de4-a327-467e-97a3-2d92ecf64566	t	f	2026-06-05 06:21:29.57502+00
49fcc63b-e8b8-4bb9-9a02-0105b09b7a71	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Test Not	Status changed from pending to acknowledged by System Administrator	status_change	medium	351b9de4-a327-467e-97a3-2d92ecf64566	t	f	2026-06-05 06:21:03.730494+00
67e56688-bd07-4757-924f-0298f579ab53	0809328b-2c6c-4235-8888-35e9f5a89c47	👥 Incident Assigned	Test Not has been assigned to Pentalk TV by System Administrator	assignment	medium	351b9de4-a327-467e-97a3-2d92ecf64566	f	f	2026-06-05 06:22:44.630699+00
32b01463-01ad-4d1e-8208-32a8ce7b29f3	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	Broken Pipe - security - Severity Level 4	new_incident	high	6b0149fc-c5db-442d-9d1f-d3097062640b	f	f	2026-06-05 06:23:26.892872+00
c4249b40-3b25-4f88-be4a-45134356151e	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	Broken Pipe - security - Severity Level 4	new_incident	high	6b0149fc-c5db-442d-9d1f-d3097062640b	f	f	2026-06-05 06:24:42.607965+00
48b5f334-5ed1-42b0-838e-958beff4f307	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Broken Pipe - security - Severity Level 4	new_incident	high	6b0149fc-c5db-442d-9d1f-d3097062640b	f	f	2026-06-05 06:25:57.633886+00
ed33605f-1f09-416d-a1b1-c9186db6b7f6	47c3920f-df28-4fad-b60c-bbf2c58c641c	📋 Incident Assigned to You	You have been assigned to: Notification Test 2 by System Administrator	assignment	high	2721ccb6-3e14-4fb4-a94f-de048f611f32	f	f	2026-06-05 06:26:07.198952+00
0365d89f-18bb-44b7-b5a0-b80b1c75a307	0809328b-2c6c-4235-8888-35e9f5a89c47	👥 Incident Assigned	Notification Test 2 has been assigned to Pentalk TV by System Administrator	assignment	medium	2721ccb6-3e14-4fb4-a94f-de048f611f32	f	f	2026-06-05 06:27:22.22072+00
c6e5ecaf-4c97-473c-926b-991bceb2446a	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	Frex - fire - Severity Level 3	new_incident	medium	8427646d-ecb9-4b19-86f9-3ead1c6b50e6	f	f	2026-06-05 06:29:09.342806+00
65ae8525-75cc-467b-b529-23e58b29ff03	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	Frex - fire - Severity Level 3	new_incident	medium	8427646d-ecb9-4b19-86f9-3ead1c6b50e6	f	f	2026-06-05 06:30:25.089436+00
40122457-99f6-49fa-a7bc-2ca8961be4ff	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Frex - fire - Severity Level 3	new_incident	medium	8427646d-ecb9-4b19-86f9-3ead1c6b50e6	f	f	2026-06-05 06:31:40.1483+00
0ba5d26f-f239-4803-a404-09cb0dfd1040	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	Frex2 - fire - Severity Level 3	new_incident	medium	beeca0f3-1baa-4495-aebf-e1cde54be382	f	f	2026-06-05 06:34:28.133739+00
1758dfba-c543-4baf-a30b-70f74fc3dd68	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	Frex2 - fire - Severity Level 3	new_incident	medium	beeca0f3-1baa-4495-aebf-e1cde54be382	f	f	2026-06-05 06:35:43.820883+00
cea74d40-e7b8-44e6-a1c4-a2b52edebfaa	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Frex2 - fire - Severity Level 3	new_incident	medium	beeca0f3-1baa-4495-aebf-e1cde54be382	f	f	2026-06-05 06:36:58.646662+00
70729013-f560-4d84-a071-3ace86126ee6	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	wertyui - security - Severity Level 3	new_incident	medium	aaa57317-82c4-41f4-9e40-4e6591b8bf5f	f	f	2026-06-05 07:29:39.591627+00
431225a3-5c39-48ab-87d0-125c4eb60d4c	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	wertyui - security - Severity Level 3	new_incident	medium	aaa57317-82c4-41f4-9e40-4e6591b8bf5f	f	f	2026-06-05 07:29:39.674719+00
7e4d2f30-5a89-4c70-b19b-8f0ef8669427	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	wertyui - security - Severity Level 3	new_incident	medium	aaa57317-82c4-41f4-9e40-4e6591b8bf5f	f	f	2026-06-05 07:29:39.749788+00
ec7fa8f5-b554-465c-acaa-05529d829683	47c3920f-df28-4fad-b60c-bbf2c58c641c	📋 Incident Assigned to You	You have been assigned to: wertyui by System Administrator	assignment	high	aaa57317-82c4-41f4-9e40-4e6591b8bf5f	f	f	2026-06-05 07:30:18.455823+00
833e2a61-8710-40fb-8554-83a9f6f552a9	0809328b-2c6c-4235-8888-35e9f5a89c47	👥 Incident Assigned	wertyui has been assigned to Pentalk TV by System Administrator	assignment	medium	aaa57317-82c4-41f4-9e40-4e6591b8bf5f	f	f	2026-06-05 07:30:18.50163+00
eaba9ed2-0cae-40f2-8310-d1bce2f3de8c	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	Gmail Test - medical - Severity Level 3	new_incident	medium	4242d220-cf1f-4b4d-b332-ae491b881e28	f	f	2026-06-05 08:45:15.264712+00
cf5ae552-0b6f-4de8-9e76-8b502a87dc80	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	Gmail Test - medical - Severity Level 3	new_incident	medium	4242d220-cf1f-4b4d-b332-ae491b881e28	f	f	2026-06-05 08:45:15.299017+00
88fbaee2-6a15-4c6f-ac4c-1f7215ae0caf	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Gmail Test - medical - Severity Level 3	new_incident	medium	4242d220-cf1f-4b4d-b332-ae491b881e28	f	f	2026-06-05 08:45:15.309081+00
30a3047f-bc7e-468e-b98e-224169f45a62	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	Gmail SSL Test - medical - Severity Level 3	new_incident	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:01:42.540101+00
9686646f-907b-437d-b536-042a3ed021a5	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	Gmail SSL Test - medical - Severity Level 3	new_incident	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:01:42.564974+00
f4384019-6b17-448f-b0d7-18d5b41a22eb	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Gmail SSL Test - medical - Severity Level 3	new_incident	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:01:42.575329+00
b6e9e219-d853-4ed4-981e-08a5e6ba3fe8	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	Gmail SSL Test - medical - Severity Level 3	new_incident	medium	36907158-cea2-478c-af3e-2a98ed7e5a01	f	f	2026-06-05 09:11:27.200716+00
c8a33a66-2d89-4784-8844-abe9b53dc8f8	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	Gmail SSL Test - medical - Severity Level 3	new_incident	medium	36907158-cea2-478c-af3e-2a98ed7e5a01	f	f	2026-06-05 09:11:27.226182+00
1f9382eb-9b11-4a0d-9608-89f11181dfb4	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	Gmail SSL Test - medical - Severity Level 3	new_incident	medium	36907158-cea2-478c-af3e-2a98ed7e5a01	f	f	2026-06-05 09:11:27.243512+00
dbdb6d16-b32b-4026-a03b-57cab4a1cb3e	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: Gmail SSL Test	Status changed from pending to acknowledged by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:22:42.60444+00
24131466-9307-4468-85a6-964d66bbe0e2	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: Gmail SSL Test	Status changed from pending to acknowledged by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:22:42.659778+00
6b7d209b-f8ac-4c76-8255-354b766e7c87	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Gmail SSL Test	Status changed from pending to acknowledged by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:22:42.674344+00
3c43c7fa-25b3-4829-9b01-bfc992d66747	47c3920f-df28-4fad-b60c-bbf2c58c641c	📋 Incident Assigned to You	You have been assigned to: Gmail SSL Test by System Administrator	assignment	high	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:22:56.354714+00
4a18b559-0686-4df3-bdb1-ab778d7700b6	0809328b-2c6c-4235-8888-35e9f5a89c47	👥 Incident Assigned	Gmail SSL Test has been assigned to Pentalk TV by System Administrator	assignment	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:22:56.407168+00
48fabf93-9be7-4bfe-a90b-1923de375437	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: Gmail SSL Test	Status changed from assigned to in_progress by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:23:38.328286+00
4c430022-caeb-4088-a9eb-c54c65b8c058	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: Gmail SSL Test	Status changed from assigned to in_progress by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:23:38.340867+00
fc76b2fd-bfc7-41cd-a285-17407dbe7d3f	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Gmail SSL Test	Status changed from assigned to in_progress by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:23:38.351324+00
c1a347ac-8159-4f1e-abbd-d7b3b154cea6	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: Gmail SSL Test	Status changed from in_progress to pending_approval by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:25:34.459618+00
c35f6f8e-cf70-46a0-a36e-590668922c84	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: Gmail SSL Test	Status changed from in_progress to pending_approval by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:25:34.475964+00
7a6977d2-79cf-49cc-b9b9-ffbbd44a0176	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Gmail SSL Test	Status changed from in_progress to pending_approval by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:25:34.488114+00
8f00642e-75a9-4a17-ab41-87c4b2918e90	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: Gmail SSL Test	Status changed from pending_approval to closed by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:29:23.469696+00
96d3369e-5abb-4399-9f35-29846e53dab3	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: Gmail SSL Test	Status changed from pending_approval to closed by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:29:23.488629+00
a15d08e0-2234-400c-aa42-09b3ebb96683	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Gmail SSL Test	Status changed from pending_approval to closed by System Administrator	status_change	medium	3d6d083a-9366-4d9b-bf94-6c527074632d	f	f	2026-06-05 09:29:23.50597+00
e76a294c-4cbb-4f8d-aee9-483dfb6f7af2	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	NIFFY - security - Severity Level 3	new_incident	medium	9154d0e3-6c58-4056-a1ab-6cf60146fd75	f	f	2026-06-05 09:31:07.580149+00
7849f3d0-380c-49e6-b179-fbe1e751fe79	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	NIFFY - security - Severity Level 3	new_incident	medium	9154d0e3-6c58-4056-a1ab-6cf60146fd75	f	f	2026-06-05 09:31:07.617112+00
871b8a8c-48e9-4f65-a60b-173ad790318a	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	NIFFY - security - Severity Level 3	new_incident	medium	9154d0e3-6c58-4056-a1ab-6cf60146fd75	f	f	2026-06-05 09:31:07.664392+00
4d2dcb6e-9051-4124-a758-81df51b7619c	0809328b-2c6c-4235-8888-35e9f5a89c47	🚨 New Incident Reported	test unlimitr - security - Severity Level 3	new_incident	medium	a005dd7d-e166-486d-a964-8f0982c4faaf	f	f	2026-06-05 09:39:17.359731+00
2204a169-7240-415d-b9ac-6ddeba0e8f5b	26427cba-5b60-48be-9882-5937caa529ec	🚨 New Incident Reported	test unlimitr - security - Severity Level 3	new_incident	medium	a005dd7d-e166-486d-a964-8f0982c4faaf	f	f	2026-06-05 09:39:17.416823+00
2fe975da-4318-42d7-9f69-fd4555b8e530	47c3920f-df28-4fad-b60c-bbf2c58c641c	🚨 New Incident Reported	test unlimitr - security - Severity Level 3	new_incident	medium	a005dd7d-e166-486d-a964-8f0982c4faaf	f	f	2026-06-05 09:39:17.501803+00
3b1b2e67-6e57-4d42-a4f6-6a9c44242e7e	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: test unlimitr	Status changed from pending to assigned by System Administrator	status_change	medium	a005dd7d-e166-486d-a964-8f0982c4faaf	f	f	2026-06-05 09:43:34.851935+00
c9ed1bfb-8ba0-4995-afb0-0c88d7f4bc7d	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: test unlimitr	Status changed from pending to assigned by System Administrator	status_change	medium	a005dd7d-e166-486d-a964-8f0982c4faaf	f	f	2026-06-05 09:43:34.867316+00
9975b221-4e4d-4656-9b98-f11fdfc9f852	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: test unlimitr	Status changed from pending to assigned by System Administrator	status_change	medium	a005dd7d-e166-486d-a964-8f0982c4faaf	f	f	2026-06-05 09:43:34.8837+00
e6446cec-3f75-4458-9714-c9b6aa86edea	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: Gmail Test	Status changed from escalated to resolved by System Administrator	status_change	medium	4242d220-cf1f-4b4d-b332-ae491b881e28	f	f	2026-06-05 09:52:56.420593+00
32a20a38-e420-4c13-925d-2747ffb9e9a8	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: Gmail Test	Status changed from escalated to resolved by System Administrator	status_change	medium	4242d220-cf1f-4b4d-b332-ae491b881e28	f	f	2026-06-05 09:52:56.445431+00
22ec3616-9dd8-4450-ad66-03a69fea9d62	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Gmail Test	Status changed from escalated to resolved by System Administrator	status_change	medium	4242d220-cf1f-4b4d-b332-ae491b881e28	f	f	2026-06-05 09:52:56.458867+00
ae18caf6-276b-439c-8a74-0cf76b1315c6	47c3920f-df28-4fad-b60c-bbf2c58c641c	📋 Incident Assigned to You	You have been assigned to: Gmail Test by System Administrator	assignment	high	4242d220-cf1f-4b4d-b332-ae491b881e28	f	f	2026-06-05 09:53:16.875318+00
43278c9f-b08d-4373-adf5-27721507c749	0809328b-2c6c-4235-8888-35e9f5a89c47	👥 Incident Assigned	Gmail Test has been assigned to Pentalk TV by System Administrator	assignment	medium	4242d220-cf1f-4b4d-b332-ae491b881e28	f	f	2026-06-05 09:53:16.901597+00
a0719eef-dc42-49f1-9f79-7af0ff746f77	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: Test Assign Incident	Status changed from pending_approval to resolved by System Administrator	status_change	medium	7d44a717-403a-478f-a767-882bc05217cc	f	f	2026-06-06 04:34:35.137715+00
7b9f131e-1972-4d09-bd77-97baaf9eb830	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: Test Assign Incident	Status changed from pending_approval to resolved by System Administrator	status_change	medium	7d44a717-403a-478f-a767-882bc05217cc	f	f	2026-06-06 04:34:35.236529+00
7cc98145-34e9-4e66-8dc4-51c8f7a6d367	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Test Assign Incident	Status changed from pending_approval to resolved by System Administrator	status_change	medium	7d44a717-403a-478f-a767-882bc05217cc	f	f	2026-06-06 04:34:35.248525+00
ab1c2a0c-9ca1-40d4-b348-bb6c7e1c5581	0809328b-2c6c-4235-8888-35e9f5a89c47	📊 Status Update: Test Assign Incident	Status changed from resolved to closed by System Administrator	status_change	medium	7d44a717-403a-478f-a767-882bc05217cc	f	f	2026-06-06 06:25:35.69955+00
2332084a-1efe-4dff-b16c-533b8b9c088c	26427cba-5b60-48be-9882-5937caa529ec	📊 Status Update: Test Assign Incident	Status changed from resolved to closed by System Administrator	status_change	medium	7d44a717-403a-478f-a767-882bc05217cc	f	f	2026-06-06 06:25:35.763195+00
71718344-620a-4df5-8393-4bfcd687d372	47c3920f-df28-4fad-b60c-bbf2c58c641c	📊 Status Update: Test Assign Incident	Status changed from resolved to closed by System Administrator	status_change	medium	7d44a717-403a-478f-a767-882bc05217cc	f	f	2026-06-06 06:25:35.778686+00
f0abed6c-69f3-4c97-9f53-a2de38e49537	93855ac1-4de5-4575-bb29-a244bd3b1ed7	🚨 New Incident Reported	hooo - medical - Severity Level 3	new_incident	medium	39d6b3a2-002d-4975-904b-a9ebb9ba5e10	f	f	2026-06-06 10:34:56.841671+00
237d5100-c4b3-49c6-bf1e-27c1d7dfe3b9	7039ad34-1be9-420a-ba21-b27a51c599b6	🚨 New Incident Reported	hooo - medical - Severity Level 3	new_incident	medium	39d6b3a2-002d-4975-904b-a9ebb9ba5e10	f	f	2026-06-06 10:34:56.918781+00
\.


--
-- Data for Name: responders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.responders (id, user_id, department_id, badge_number, responder_level, is_available, latitude, longitude, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, phone, email, full_name, password, role, department_id, is_active, fcm_token, last_login, created_at, updated_at) FROM stdin;
cb4e7d97-8f7b-4734-8ae3-ff5bab3c3bde	+2348123456790	\N	Jane Smith	$2b$10$TUWl5dCuT./l/Rn4/J3bt.gzdf8jCno/f9F5cRP2rOB9WgKQAHgDu	resident	\N	t	\N	\N	2026-06-06 10:02:26.098526+00	2026-06-06 10:02:26.098526+00
17735483-3a70-49a4-bc75-bf2086411606	+2348123456000		Test User	$2b$10$jFXVBaebv4awfOWt1TQ//O.zaqMCF2uAaUPZspcZq7EmRqA53oc52	resident	\N	t	\N	\N	2026-06-06 10:12:40.386473+00	2026-06-06 10:12:40.386473+00
0809328b-2c6c-4235-8888-35e9f5a89c47	+2348123456789	supervisor@test.com	Test Supervisor	$2b$10$jHUHGF1sXUpToEIaXWmR1u8NRYjS3U2NOSnA8tBON/4sKMciaTdm2	supervisor	1c0d789e-ba06-42a7-a010-664beffb0190	t	\N	\N	2026-06-04 17:20:30.07886+00	2026-06-04 17:20:30.07886+00
26427cba-5b60-48be-9882-5937caa529ec	+2348987654321	responder@test.com	Test Responder	$2b$10$GXOUs.9YkwX6FyS81a7wRuAKdtPCx7p1U0syNx0unMtlMwMU99dYe	responder	1c0d789e-ba06-42a7-a010-664beffb0190	t	\N	\N	2026-06-04 17:20:34.748573+00	2026-06-04 17:20:34.748573+00
8ff04089-7ecb-4551-8496-38abd6dbc999	+2348012345678	admin@smartcityalert.com	System Administrator	$2b$10$KhsY/9F.OgXc1Zgt8gjT8.v.CqzRrq3Xsym3q8lw.DkbgzHyoGTq6	admin	1c0d789e-ba06-42a7-a010-664beffb0190	t	\N	2026-06-18 22:45:43.871+00	2026-05-31 21:27:12.343739+00	2026-06-18 22:45:43.87218+00
93855ac1-4de5-4575-bb29-a244bd3b1ed7	07037158361	olubowale.oluwanifemi94@gmail.com	OLUWANIFEMI OLUBOWALE	$2b$10$/EUS7ZINX2mquoCJUWvws.ACUAcrMVqwEiMYXFXa5ReRE0dnMx2NC	responder	5b1a6391-1586-4b2c-8f26-872827d919f9	t	\N	\N	2026-06-03 12:29:21.199704+00	2026-06-03 12:29:21.199704+00
7039ad34-1be9-420a-ba21-b27a51c599b6	12345678	necasoftsolutions@gmail.com	James 	$2b$10$FgukPVr3uDAVL2lO2SHixet6u.kc3eHu/cEoHlwWEW1UC0a4u3OKC	responder	5b1a6391-1586-4b2c-8f26-872827d919f9	t	\N	\N	2026-06-01 08:49:41.164205+00	2026-06-03 15:28:28.850057+00
91a9c41f-d478-4370-a773-b41a375c79ba	07049942809	hhh@www.com	Azeez Sanni	$2b$10$UKyPA/KsJNQhtxfk137.3OGYCqjwDjkjq26m//HoxFRiVgc2Rnjj.	responder	072c22a6-fec9-4a98-bb86-3b4fc37d5112	t	\N	\N	2026-06-03 16:00:01.077461+00	2026-06-03 16:00:01.077461+00
47c3920f-df28-4fad-b60c-bbf2c58c641c	07037158351	olubukolafadaiya@gmail.com	Pentalk TV	$2b$10$37ZVh4quUt2mJQ9jQWPwUOISURq6zNbfOt3tr5gnt8Xr/K2VvxhbC	responder	1c0d789e-ba06-42a7-a010-664beffb0190	t	\N	2026-06-05 06:14:26.342+00	2026-05-31 23:02:42.750874+00	2026-06-05 09:08:31.55962+00
\.


--
-- Data for Name: whatsapp_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.whatsapp_messages (id, from_number, message_body, media_url, media_type, status, detected_incident_type, extracted_data, incident_id, processed_by_id, twilio_metadata, created_at) FROM stdin;
4b417720-7e7f-43e6-8f20-a01c8c2d8d12	+2348123456000	FIRE at Campground!	\N	\N	processed	fire	{"raw": "FIRE at Campground!", "type": "fire", "severity": 5}	c16d59ab-467f-4d2d-a566-c4e5019f10ad	17735483-3a70-49a4-bc75-bf2086411606	{"timestamp": "2026-06-06T10:23:04.434Z", "profileName": "Test User"}	2026-06-06 10:23:04.441126+00
bd4687f6-8b33-4dd6-a86e-ca8531a02509	+2348123456790	MEDICAL: Someone collapsed near Gate A, need ambulance!	\N	\N	processed	medical	{"raw": "MEDICAL: Someone collapsed near Gate A, need ambulance!", "type": "medical", "severity": 5}	be4d46ef-256b-4277-be5c-a522b6592278	cb4e7d97-8f7b-4734-8ae3-ff5bab3c3bde	{"timestamp": "2026-06-06T10:24:03.192Z", "profileName": "Jane Smith"}	2026-06-06 10:24:03.193226+00
7adbf3f2-af3e-471c-a058-b7f6c9b92daa	+2348123456000	FIRE at Campground!	\N	\N	processed	fire	{"raw": "FIRE at Campground!", "type": "fire", "severity": 5}	7c2ff4ed-1f6a-435b-bf53-0d1bb0bde471	17735483-3a70-49a4-bc75-bf2086411606	{"timestamp": "2026-06-06T10:28:40.013Z", "profileName": "Test User"}	2026-06-06 10:28:40.016841+00
\.


--
-- Data for Name: workflow_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workflow_config (id, name, is_active, acknowledgment_rules, assignment_rules, escalation_levels, closure_rules, department_id, created_at, updated_at) FROM stdin;
a5e94507-3d70-471e-8e27-6a5d58864c9a	default	t	{"roles": ["responder", "supervisor"], "timeout_minutes": 30, "auto_acknowledge": false}	{"auto_assign": false, "assignment_type": "manual", "timeout_minutes": 60}	[{"role": "responder", "level": 1, "next_role": "supervisor", "timeout_minutes": 30, "notification_enabled": true}, {"role": "supervisor", "level": 2, "next_role": "hod", "timeout_minutes": 60, "notification_enabled": true}, {"role": "hod", "level": 3, "next_role": "dept_director", "timeout_minutes": 120, "notification_enabled": true}, {"role": "dept_director", "level": 4, "next_role": "overall_manager", "timeout_minutes": 180, "notification_enabled": true}, {"role": "overall_manager", "level": 5, "next_role": "overall_director", "timeout_minutes": 240, "notification_enabled": true}, {"role": "overall_director", "level": 6, "next_role": "admin", "timeout_minutes": 300, "notification_enabled": true}]	{"approval_roles": ["supervisor", "hod", "dept_director"], "required_roles": ["responder", "supervisor"], "require_approval": true}	\N	2026-06-06 05:36:17.289+00	2026-06-06 05:36:17.289+00
\.


--
-- Name: assets assets_asset_tag_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_asset_tag_key UNIQUE (asset_tag);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: escalation_rules escalation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escalation_rules
    ADD CONSTRAINT escalation_rules_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: responders responders_badge_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responders
    ADD CONSTRAINT responders_badge_number_key UNIQUE (badge_number);


--
-- Name: responders responders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responders
    ADD CONSTRAINT responders_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_messages whatsapp_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id);


--
-- Name: workflow_config workflow_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_config
    ADD CONSTRAINT workflow_config_pkey PRIMARY KEY (id);


--
-- Name: idx_assets_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assets_location ON public.assets USING btree (location);


--
-- Name: idx_assets_next_maintenance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assets_next_maintenance ON public.assets USING btree (next_maintenance_date);


--
-- Name: idx_incidents_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_department ON public.incidents USING btree (department_id);


--
-- Name: idx_incidents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_status ON public.incidents USING btree (status, created_at);


--
-- Name: idx_maintenance_requests_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_requests_department ON public.maintenance_requests USING btree (department_id);


--
-- Name: idx_maintenance_requests_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_requests_priority ON public.maintenance_requests USING btree (priority);


--
-- Name: idx_maintenance_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_requests_status ON public.maintenance_requests USING btree (status);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_responders_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_responders_available ON public.responders USING btree (is_available);


--
-- Name: idx_users_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_users_email_unique ON public.users USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_whatsapp_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_created_at ON public.whatsapp_messages USING btree (created_at);


--
-- Name: idx_whatsapp_from_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_from_number ON public.whatsapp_messages USING btree (from_number);


--
-- Name: idx_whatsapp_incident_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_incident_id ON public.whatsapp_messages USING btree (incident_id);


--
-- Name: whatsapp_messages fk_whatsapp_incident; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT fk_whatsapp_incident FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE SET NULL;


--
-- Name: whatsapp_messages fk_whatsapp_processed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT fk_whatsapp_processed_by FOREIGN KEY (processed_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: incidents incidents_reported_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_reported_by_id_fkey FOREIGN KEY (reported_by_id) REFERENCES public.users(id);


--
-- Name: maintenance_requests maintenance_requests_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id);


--
-- Name: maintenance_requests maintenance_requests_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: maintenance_requests maintenance_requests_reported_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_reported_by_id_fkey FOREIGN KEY (reported_by_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: responders responders_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responders
    ADD CONSTRAINT responders_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: responders responders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responders
    ADD CONSTRAINT responders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- PostgreSQL database dump complete
--

\unrestrict dAeGsYMBiT7X39MgR43EjAnlNpxGwNQVk0t054epQfkk2ysL0cumkqyLSg00n9p

