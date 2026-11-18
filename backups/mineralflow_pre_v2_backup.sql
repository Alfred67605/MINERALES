--
-- PostgreSQL database dump
--

\restrict 5lxwjK6suov1SsQfHKFulaFFDtqbWyNu9YnwZF5Xj18eyu11J7LYNENkeDP0gJJ

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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
-- Name: EstadoLote; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoLote" AS ENUM (
    'DISPONIBLE',
    'VENDIDO'
);


ALTER TYPE public."EstadoLote" OWNER TO postgres;

--
-- Name: EstadoRegistro; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoRegistro" AS ENUM (
    'ACTIVO',
    'INACTIVO'
);


ALTER TYPE public."EstadoRegistro" OWNER TO postgres;

--
-- Name: EstadoVenta; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoVenta" AS ENUM (
    'CONFIRMADA',
    'ANULADA'
);


ALTER TYPE public."EstadoVenta" OWNER TO postgres;

--
-- Name: RolUsuario; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RolUsuario" AS ENUM (
    'ADMINISTRADOR',
    'ALMACENERO',
    'VENDEDOR',
    'CONSULTA'
);


ALTER TYPE public."RolUsuario" OWNER TO postgres;

--
-- Name: UnidadPeso; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UnidadPeso" AS ENUM (
    'KG',
    'TM'
);


ALTER TYPE public."UnidadPeso" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria (
    id text NOT NULL,
    usuario_id text,
    usuario_nombre text NOT NULL,
    accion text NOT NULL,
    entidad text NOT NULL,
    registro_id text NOT NULL,
    valor_anterior jsonb,
    valor_nuevo jsonb,
    fecha_hora timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.auditoria OWNER TO postgres;

--
-- Name: catalogo_leyes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.catalogo_leyes (
    id text NOT NULL,
    codigo text NOT NULL,
    mineral text NOT NULL,
    simbolo text NOT NULL,
    nombre_ley text NOT NULL,
    unidad_medida text NOT NULL,
    valor_minimo numeric(14,4) DEFAULT 0 NOT NULL,
    valor_maximo numeric(14,4) DEFAULT 100 NOT NULL,
    decimales integer DEFAULT 2 NOT NULL,
    estado public."EstadoRegistro" DEFAULT 'ACTIVO'::public."EstadoRegistro" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.catalogo_leyes OWNER TO postgres;

--
-- Name: compradores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compradores (
    id text NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    identificacion text,
    telefono text,
    direccion text,
    observaciones text,
    estado public."EstadoRegistro" DEFAULT 'ACTIVO'::public."EstadoRegistro" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.compradores OWNER TO postgres;

--
-- Name: compras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compras (
    id text NOT NULL,
    numero_compra text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    proveedor_id text NOT NULL,
    usuario_id text NOT NULL,
    observaciones text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.compras OWNER TO postgres;

--
-- Name: detalle_ventas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_ventas (
    id text NOT NULL,
    venta_id text NOT NULL,
    lote_id text NOT NULL,
    numero_lote_snapshot text NOT NULL,
    fecha_compra_snapshot timestamp(3) without time zone NOT NULL,
    proveedor_nombre_snapshot text NOT NULL,
    mina_origen_snapshot text,
    tipo_mineral_snapshot text NOT NULL,
    sacos_registrados integer NOT NULL,
    peso_registrado numeric(14,4) NOT NULL,
    unidad_peso_registrada public."UnidadPeso" NOT NULL,
    peso_kg_calculado numeric(14,4) NOT NULL,
    leyes_snapshot jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.detalle_ventas OWNER TO postgres;

--
-- Name: lote_leyes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lote_leyes (
    id text NOT NULL,
    lote_id text NOT NULL,
    catalogo_ley_id text NOT NULL,
    valor numeric(14,4) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.lote_leyes OWNER TO postgres;

--
-- Name: lotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lotes (
    id text NOT NULL,
    numero_lote text NOT NULL,
    compra_id text NOT NULL,
    proveedor_id text NOT NULL,
    usuario_id text NOT NULL,
    fecha_compra timestamp(3) without time zone NOT NULL,
    mina_origen text,
    cantidad_sacos integer NOT NULL,
    peso_neto numeric(14,4) NOT NULL,
    peso_seco numeric(14,4),
    humedad_pct numeric(6,2),
    unidad_peso public."UnidadPeso" DEFAULT 'KG'::public."UnidadPeso" NOT NULL,
    tipo_mineral text NOT NULL,
    estado public."EstadoLote" DEFAULT 'DISPONIBLE'::public."EstadoLote" NOT NULL,
    observaciones text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.lotes OWNER TO postgres;

--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proveedores (
    id text NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    mina_origen text,
    telefono text,
    observaciones text,
    estado public."EstadoRegistro" DEFAULT 'ACTIVO'::public."EstadoRegistro" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.proveedores OWNER TO postgres;

--
-- Name: resumen_leyes_venta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resumen_leyes_venta (
    id text NOT NULL,
    venta_id text NOT NULL,
    codigo_ley text NOT NULL,
    mineral text NOT NULL,
    simbolo text NOT NULL,
    nombre_ley text NOT NULL,
    unidad_medida text NOT NULL,
    ley_promedio numeric(14,4) NOT NULL,
    peso_base_ponderado_kg numeric(14,4) NOT NULL,
    lotes_incluidos integer NOT NULL,
    lotes_con_faltante integer DEFAULT 0 NOT NULL,
    criterio_ponderacion text DEFAULT 'PESO_NETO_CONVERTIDO_KG'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.resumen_leyes_venta OWNER TO postgres;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id text NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    hash_password text NOT NULL,
    rol public."RolUsuario" DEFAULT 'ALMACENERO'::public."RolUsuario" NOT NULL,
    estado public."EstadoRegistro" DEFAULT 'ACTIVO'::public."EstadoRegistro" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: ventas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ventas (
    id text NOT NULL,
    numero_venta text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    comprador_id text NOT NULL,
    usuario_id text NOT NULL,
    total_lotes integer NOT NULL,
    total_sacos integer NOT NULL,
    peso_total_kg numeric(14,4) NOT NULL,
    unidad_peso public."UnidadPeso" DEFAULT 'KG'::public."UnidadPeso" NOT NULL,
    criterio_peso text DEFAULT 'PESO_NETO_KG'::text NOT NULL,
    comprador_nombre_snapshot text NOT NULL,
    comprador_nit_snapshot text,
    estado public."EstadoVenta" DEFAULT 'CONFIRMADA'::public."EstadoVenta" NOT NULL,
    observaciones text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ventas OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
fc5f9903-5b03-4301-ba66-8449d46bc022	6c89d970ed20000ae7057eeb4ac46bb695ca23c4b6442a559ef1cfb0e66d66c9	2026-11-15 20:35:45.197726-04	20261116003545_init_mineralflow_schema	\N	\N	2026-11-15 20:35:45.054357-04	1
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, usuario_id, usuario_nombre, accion, entidad, registro_id, valor_anterior, valor_nuevo, fecha_hora) FROM stdin;
5b63f6ec-aab1-4ab1-b51a-11f91e6999c6	780cefc2-a9b4-4f44-ab07-8220da3ea291	Ing. Carlos Mamani Quispe (DEMO)	SEED_INICIAL_DEMO	Sistema	INIT-DEMO-2026	\N	{"mensaje": "Datos ficticios de demostración inicializados: 45 lotes DISPONIBLES y 6 lotes VENDIDOS."}	2026-11-16 01:00:56.342
81511e14-721a-4709-bb43-f7ff6fa6779d	780cefc2-a9b4-4f44-ab07-8220da3ea291	Ing. Carlos Mamani Quispe (DEMO)	LOGIN_EXITOSO	Usuario	780cefc2-a9b4-4f44-ab07-8220da3ea291	null	{"rol": "ADMINISTRADOR", "username": "admin"}	2026-11-16 01:31:13.986
\.


--
-- Data for Name: catalogo_leyes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.catalogo_leyes (id, codigo, mineral, simbolo, nombre_ley, unidad_medida, valor_minimo, valor_maximo, decimales, estado, created_at, updated_at) FROM stdin;
dda97316-8920-41c6-b1e1-50d9eee9b8f5	PB_PCT	Plomo	Pb	Ley de Plomo	%	0.0000	85.0000	2	ACTIVO	2026-11-16 01:00:56.205	2026-11-16 01:00:56.205
ec5ce49e-88d8-4181-a3e5-d0249f3e979d	ZN_PCT	Zinc	Zn	Ley de Zinc	%	0.0000	85.0000	2	ACTIVO	2026-11-16 01:00:56.205	2026-11-16 01:00:56.205
c6280b7d-b828-4207-8b63-bf39322fe4e7	AG_GT	Plata	Ag	Ley de Plata (g/t)	g/t	0.0000	25000.0000	1	ACTIVO	2026-11-16 01:00:56.205	2026-11-16 01:00:56.205
1da3b3b1-cd56-4a84-9bf4-cbe9000ae374	AG_DM	Plata	Ag	Ley de Plata (DM)	DM	0.0000	500.0000	2	ACTIVO	2026-11-16 01:00:56.205	2026-11-16 01:00:56.205
43e49e20-7efa-49c5-bee3-5a34ea36ca80	SN_PCT	Estaño	Sn	Ley de Estaño	%	0.0000	80.0000	2	ACTIVO	2026-11-16 01:00:56.205	2026-11-16 01:00:56.205
e533f3a1-1495-425f-9b54-ddf92ffc4b4e	CU_PCT	Cobre	Cu	Ley de Cobre	%	0.0000	75.0000	2	ACTIVO	2026-11-16 01:00:56.205	2026-11-16 01:00:56.205
\.


--
-- Data for Name: compradores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compradores (id, codigo, nombre, identificacion, telefono, direccion, observaciones, estado, created_at, updated_at) FROM stdin;
a2453333-6dc4-4a1a-b200-d34d22add39b	COMP-002	Empresa Metalúrgica Vinto Sur — División Comercial (FICTICIO)	NIT 1004928015	+591 2 5278010	Carretera Vinto Km 7 — Oruro	Comprador de concentrados de Estaño y complejos minerales (Ficticio)	ACTIVO	2026-11-16 01:00:56.237	2026-11-16 01:00:56.237
3f628dea-6b27-4ee1-8307-7c6521758dc3	COMP-001	Comercializadora Andina de Metales S.A. (FICTICIO)	NIT 1029384021	+591 2 2791100	Av. Arce N.º 2410, Zona Sopocachi — La Paz	Comprador mayorista de lotes agrupados para exportación vía Arica (Ficticio)	ACTIVO	2026-11-16 01:00:56.237	2026-11-16 01:00:56.237
6066380a-da8a-41f6-96c2-1338fce7b661	COMP-003	Consorcio Exportador Altiplano Minerals Ltda. (FICTICIO)	NIT 3049182019	+591 2 6229840	Zona Cantumarca, Parque Industrial — Potosí	Despachos consolidados de 20 a 50 lotes (Ficticio)	ACTIVO	2026-11-16 01:00:56.237	2026-11-16 01:00:56.237
\.


--
-- Data for Name: compras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compras (id, numero_compra, fecha, proveedor_id, usuario_id, observaciones, created_at, updated_at) FROM stdin;
bfb44e5b-d17b-4ede-8ab4-c2047a4c2698	CMP-2026-0001	2026-10-18 10:00:00	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	Compra histórica liquidada (DEMO)	2026-11-16 01:00:56.239	2026-11-16 01:00:56.239
2cf48cb8-dc42-4881-b44a-93ded0293bf4	CMP-2026-0002	2026-11-04 13:00:00	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	Recepción en almacén de Cooperativa Minera Cerro Rico Ltda. (FICTICIO) (DEMO)	2026-11-16 01:00:56.271	2026-11-16 01:00:56.271
6ef82d75-3477-41f6-8fc2-2362eb01bc97	CMP-2026-0003	2026-11-05 13:00:00	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	Recepción en almacén de Cooperativa Minera Huanuni Sur R.L. (FICTICIO) (DEMO)	2026-11-16 01:00:56.279	2026-11-16 01:00:56.279
47eb3a3b-8c1f-47e5-9e92-c7e334712d69	CMP-2026-0004	2026-11-06 13:00:00	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	Recepción en almacén de Sociedad Minera Colquiri Andina (FICTICIO) (DEMO)	2026-11-16 01:00:56.287	2026-11-16 01:00:56.287
8500e856-61e6-4015-ad5c-26759ba3b10b	CMP-2026-0005	2026-11-07 13:00:00	5ec577bb-7edb-43fc-9431-b1c7378e4340	00867f08-c6dd-4463-826c-d72b28cb4c92	Recepción en almacén de Cooperativa Minera Porco Imperial (FICTICIO) (DEMO)	2026-11-16 01:00:56.296	2026-11-16 01:00:56.296
f543a31c-bb9a-49a3-b030-cbfce5d001a1	CMP-2026-0006	2026-11-08 13:00:00	1089512b-d95a-4fc3-a011-ff42f2e27a65	00867f08-c6dd-4463-826c-d72b28cb4c92	Recepción en almacén de Ingenio Minero Poopó Central (FICTICIO) (DEMO)	2026-11-16 01:00:56.304	2026-11-16 01:00:56.304
20c9faca-98e8-414e-8213-50435e1ffb1a	CMP-2026-0007	2026-11-09 13:00:00	365bc245-7b88-4320-ab27-adf940ee5922	00867f08-c6dd-4463-826c-d72b28cb4c92	Recepción en almacén de Asociación Minera San Cristóbal Norte (FICTICIO) (DEMO)	2026-11-16 01:00:56.312	2026-11-16 01:00:56.312
2d538470-5b5b-4cef-a2e3-c6f858fbf043	CMP-2026-0008	2026-11-10 13:00:00	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	Recepción en almacén de Cooperativa Minera Cerro Rico Ltda. (FICTICIO) (DEMO)	2026-11-16 01:00:56.319	2026-11-16 01:00:56.319
58290438-2051-433e-816f-0dc7af060d7c	CMP-2026-0009	2026-11-11 13:00:00	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	Recepción en almacén de Cooperativa Minera Huanuni Sur R.L. (FICTICIO) (DEMO)	2026-11-16 01:00:56.327	2026-11-16 01:00:56.327
9e85337d-02e2-44d2-9bec-8ee7b5f905c9	CMP-2026-0010	2026-11-12 13:00:00	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	Recepción en almacén de Sociedad Minera Colquiri Andina (FICTICIO) (DEMO)	2026-11-16 01:00:56.335	2026-11-16 01:00:56.335
\.


--
-- Data for Name: detalle_ventas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_ventas (id, venta_id, lote_id, numero_lote_snapshot, fecha_compra_snapshot, proveedor_nombre_snapshot, mina_origen_snapshot, tipo_mineral_snapshot, sacos_registrados, peso_registrado, unidad_peso_registrada, peso_kg_calculado, leyes_snapshot, created_at) FROM stdin;
e04c697b-4748-429b-a9dc-d02475bcb8ac	33a62623-2268-4b30-9d0c-bc8d261ae1b8	5f10c661-cbbd-46af-bd70-c94abece642a	LT-2026-0001	2026-10-19 11:30:00	Cooperativa Minera Huanuni Sur R.L. (FICTICIO)	Distrito Huanuni — Oruro	Complejo Zn-Ag	30	1430.0000	KG	1430.0000	[{"valor": 43.4, "mineral": "Zinc", "simbolo": "Zn", "valorStr": "43.40", "codigoLey": "ZN_PCT", "nombreLey": "Ley de Zinc", "unidadMedida": "%"}, {"valor": 202.5, "mineral": "Plata", "simbolo": "Ag", "valorStr": "202.5", "codigoLey": "AG_GT", "nombreLey": "Ley de Plata (g/t)", "unidadMedida": "g/t"}]	2026-11-16 01:00:56.262
c7481894-62ae-4c7e-a59c-030f3465c6d6	33a62623-2268-4b30-9d0c-bc8d261ae1b8	7de990ec-f05e-4611-8391-6a890529cf14	LT-2026-0002	2026-10-20 11:30:00	Sociedad Minera Colquiri Andina (FICTICIO)	Veta Rosario — Colquiri	Complejo Zn-Ag	35	1610.0000	KG	1610.0000	[{"valor": 44.8, "mineral": "Zinc", "simbolo": "Zn", "valorStr": "44.80", "codigoLey": "ZN_PCT", "nombreLey": "Ley de Zinc", "unidadMedida": "%"}, {"valor": 225, "mineral": "Plata", "simbolo": "Ag", "valorStr": "225.0", "codigoLey": "AG_GT", "nombreLey": "Ley de Plata (g/t)", "unidadMedida": "g/t"}]	2026-11-16 01:00:56.262
499c4ec8-2752-4d02-90df-1f5f45961fae	33a62623-2268-4b30-9d0c-bc8d261ae1b8	36b5114b-99c9-4486-aa04-91c74905f834	LT-2026-0003	2026-10-21 11:30:00	Cooperativa Minera Porco Imperial (FICTICIO)	Yacimiento Porco — Potosí	Complejo Zn-Ag	40	1790.0000	KG	1790.0000	[{"valor": 46.2, "mineral": "Zinc", "simbolo": "Zn", "valorStr": "46.20", "codigoLey": "ZN_PCT", "nombreLey": "Ley de Zinc", "unidadMedida": "%"}, {"valor": 247.5, "mineral": "Plata", "simbolo": "Ag", "valorStr": "247.5", "codigoLey": "AG_GT", "nombreLey": "Ley de Plata (g/t)", "unidadMedida": "g/t"}]	2026-11-16 01:00:56.262
57af7bb2-44c8-4ac4-9428-2504ee56703a	e9ec6b97-c0ba-485c-875e-3792225b2679	dd39a29c-368b-4bd5-8240-fe991c9af05d	LT-2026-0004	2026-10-22 11:30:00	Ingenio Minero Poopó Central (FICTICIO)	Cuenca Poopó — Oruro	Complejo Zn-Ag	25	1970.0000	KG	1970.0000	[{"valor": 47.6, "mineral": "Zinc", "simbolo": "Zn", "valorStr": "47.60", "codigoLey": "ZN_PCT", "nombreLey": "Ley de Zinc", "unidadMedida": "%"}, {"valor": 270, "mineral": "Plata", "simbolo": "Ag", "valorStr": "270.0", "codigoLey": "AG_GT", "nombreLey": "Ley de Plata (g/t)", "unidadMedida": "g/t"}]	2026-11-16 01:00:56.268
56d38ea6-be91-4abd-869b-c54f414bfc85	e9ec6b97-c0ba-485c-875e-3792225b2679	089212c5-1ecd-443c-8485-50b0b805d64c	LT-2026-0005	2026-10-23 11:30:00	Asociación Minera San Cristóbal Norte (FICTICIO)	Nor Lípez — Potosí	Complejo Zn-Ag	30	2150.0000	KG	2150.0000	[{"valor": 49, "mineral": "Zinc", "simbolo": "Zn", "valorStr": "49.00", "codigoLey": "ZN_PCT", "nombreLey": "Ley de Zinc", "unidadMedida": "%"}, {"valor": 292.5, "mineral": "Plata", "simbolo": "Ag", "valorStr": "292.5", "codigoLey": "AG_GT", "nombreLey": "Ley de Plata (g/t)", "unidadMedida": "g/t"}]	2026-11-16 01:00:56.268
1c4f66c2-da25-4f4a-b77f-7b94e8d2fef6	e9ec6b97-c0ba-485c-875e-3792225b2679	4a70725b-f055-49f0-b2b1-f07e88193260	LT-2026-0006	2026-10-24 11:30:00	Cooperativa Minera Cerro Rico Ltda. (FICTICIO)	Cerro Rico — Potosí	Complejo Zn-Ag	35	2330.0000	KG	2330.0000	[{"valor": 50.4, "mineral": "Zinc", "simbolo": "Zn", "valorStr": "50.40", "codigoLey": "ZN_PCT", "nombreLey": "Ley de Zinc", "unidadMedida": "%"}, {"valor": 315, "mineral": "Plata", "simbolo": "Ag", "valorStr": "315.0", "codigoLey": "AG_GT", "nombreLey": "Ley de Plata (g/t)", "unidadMedida": "g/t"}]	2026-11-16 01:00:56.268
\.


--
-- Data for Name: lote_leyes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lote_leyes (id, lote_id, catalogo_ley_id, valor, created_at, updated_at) FROM stdin;
533df356-0950-4f60-b55f-08a85de4a2d4	5f10c661-cbbd-46af-bd70-c94abece642a	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	43.4000	2026-11-16 01:00:56.242	2026-11-16 01:00:56.242
bf817a30-3678-4a4c-8c0e-a18891e8160f	5f10c661-cbbd-46af-bd70-c94abece642a	c6280b7d-b828-4207-8b63-bf39322fe4e7	202.5000	2026-11-16 01:00:56.242	2026-11-16 01:00:56.242
ee0c6022-1d18-4995-80c2-570fa0f54d03	7de990ec-f05e-4611-8391-6a890529cf14	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	44.8000	2026-11-16 01:00:56.248	2026-11-16 01:00:56.248
434eafeb-ed87-4b2d-86fd-58b923a99b31	7de990ec-f05e-4611-8391-6a890529cf14	c6280b7d-b828-4207-8b63-bf39322fe4e7	225.0000	2026-11-16 01:00:56.248	2026-11-16 01:00:56.248
9edfecf6-44ed-4939-8d17-2bc7c3e5204c	36b5114b-99c9-4486-aa04-91c74905f834	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	46.2000	2026-11-16 01:00:56.251	2026-11-16 01:00:56.251
697781e3-90d6-41c7-ba19-6dea8b48cec1	36b5114b-99c9-4486-aa04-91c74905f834	c6280b7d-b828-4207-8b63-bf39322fe4e7	247.5000	2026-11-16 01:00:56.251	2026-11-16 01:00:56.251
15ce9339-0fae-4600-ab77-036b89a90baf	dd39a29c-368b-4bd5-8240-fe991c9af05d	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	47.6000	2026-11-16 01:00:56.254	2026-11-16 01:00:56.254
aab9f98a-1c9f-4ed8-ac8a-77b1134bbb48	dd39a29c-368b-4bd5-8240-fe991c9af05d	c6280b7d-b828-4207-8b63-bf39322fe4e7	270.0000	2026-11-16 01:00:56.254	2026-11-16 01:00:56.254
f05856d9-de46-4c1d-93d0-236d4964ffb4	089212c5-1ecd-443c-8485-50b0b805d64c	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	49.0000	2026-11-16 01:00:56.256	2026-11-16 01:00:56.256
25d0e7c5-cc92-4af2-8791-53cece91e874	089212c5-1ecd-443c-8485-50b0b805d64c	c6280b7d-b828-4207-8b63-bf39322fe4e7	292.5000	2026-11-16 01:00:56.256	2026-11-16 01:00:56.256
d62f9ca9-eec9-4028-8fd3-7095916aff2c	4a70725b-f055-49f0-b2b1-f07e88193260	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	50.4000	2026-11-16 01:00:56.258	2026-11-16 01:00:56.258
25998565-2c2a-4e4b-93ba-01b014670de8	4a70725b-f055-49f0-b2b1-f07e88193260	c6280b7d-b828-4207-8b63-bf39322fe4e7	315.0000	2026-11-16 01:00:56.258	2026-11-16 01:00:56.258
2264dfdc-4b53-48d3-a9ff-0b47f0623d42	7637389e-6d6b-4ce6-bb57-01afe91ee117	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	38.5000	2026-11-16 01:00:56.272	2026-11-16 01:00:56.272
90ffa4d1-cf02-4848-a5bb-d76dc29d6b89	7637389e-6d6b-4ce6-bb57-01afe91ee117	c6280b7d-b828-4207-8b63-bf39322fe4e7	210.0000	2026-11-16 01:00:56.272	2026-11-16 01:00:56.272
a0838b77-d078-4e32-842b-455cf26cf1c4	7637389e-6d6b-4ce6-bb57-01afe91ee117	dda97316-8920-41c6-b1e1-50d9eee9b8f5	8.2000	2026-11-16 01:00:56.272	2026-11-16 01:00:56.272
79e4ba41-f58e-41e7-837b-6fc866800f51	289948e6-bd52-404f-a954-bd60ef4dffe3	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	39.8500	2026-11-16 01:00:56.273	2026-11-16 01:00:56.273
71bccf6e-ac23-4777-98e6-472df162db2c	289948e6-bd52-404f-a954-bd60ef4dffe3	c6280b7d-b828-4207-8b63-bf39322fe4e7	238.5000	2026-11-16 01:00:56.273	2026-11-16 01:00:56.273
e6f586de-00f1-4877-9624-f92217fa1f9b	289948e6-bd52-404f-a954-bd60ef4dffe3	dda97316-8920-41c6-b1e1-50d9eee9b8f5	8.9500	2026-11-16 01:00:56.273	2026-11-16 01:00:56.273
3c47d805-20b4-4011-8f16-2d19603c3ce8	bf2196fb-f2d3-4542-a3b3-ff91f2b20f01	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	41.2000	2026-11-16 01:00:56.275	2026-11-16 01:00:56.275
4846dbaa-19d1-440f-b35d-24e78192cb02	bf2196fb-f2d3-4542-a3b3-ff91f2b20f01	c6280b7d-b828-4207-8b63-bf39322fe4e7	267.0000	2026-11-16 01:00:56.275	2026-11-16 01:00:56.275
6d6e5ee9-d4ad-488c-b75a-34d7170ba2b5	bf2196fb-f2d3-4542-a3b3-ff91f2b20f01	dda97316-8920-41c6-b1e1-50d9eee9b8f5	9.7000	2026-11-16 01:00:56.275	2026-11-16 01:00:56.275
86975f68-b48d-474c-8b41-863919facfb5	7919466d-bb48-4905-a240-b530b7334471	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	42.5500	2026-11-16 01:00:56.276	2026-11-16 01:00:56.276
a4f90b86-8b6b-402b-a885-c9f94164e038	7919466d-bb48-4905-a240-b530b7334471	c6280b7d-b828-4207-8b63-bf39322fe4e7	295.5000	2026-11-16 01:00:56.276	2026-11-16 01:00:56.276
ebef28eb-8b5e-4f5e-8607-977c54c4d087	7919466d-bb48-4905-a240-b530b7334471	dda97316-8920-41c6-b1e1-50d9eee9b8f5	10.4500	2026-11-16 01:00:56.276	2026-11-16 01:00:56.276
498cec43-bc7a-4164-b7b8-82bc44d8084c	2a5eaf3d-2f16-4a62-98d1-35d543f73c10	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	43.9000	2026-11-16 01:00:56.278	2026-11-16 01:00:56.278
5bf7efb4-ba9e-4ddb-abb4-e56ac683f2c2	2a5eaf3d-2f16-4a62-98d1-35d543f73c10	c6280b7d-b828-4207-8b63-bf39322fe4e7	324.0000	2026-11-16 01:00:56.278	2026-11-16 01:00:56.278
ea81dfa4-2f02-4d6d-854d-68ac6007c158	2a5eaf3d-2f16-4a62-98d1-35d543f73c10	dda97316-8920-41c6-b1e1-50d9eee9b8f5	11.2000	2026-11-16 01:00:56.278	2026-11-16 01:00:56.278
5074c2e4-2570-404d-9289-3f2920212ed9	71792c52-1ae7-4c2f-bd56-c843f1caa886	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	45.2500	2026-11-16 01:00:56.28	2026-11-16 01:00:56.28
5a15ef9f-ce22-4c0d-bb83-6abdfe57daa5	71792c52-1ae7-4c2f-bd56-c843f1caa886	c6280b7d-b828-4207-8b63-bf39322fe4e7	352.5000	2026-11-16 01:00:56.28	2026-11-16 01:00:56.28
77cc1b28-f675-4741-b218-481974798316	71792c52-1ae7-4c2f-bd56-c843f1caa886	dda97316-8920-41c6-b1e1-50d9eee9b8f5	11.9500	2026-11-16 01:00:56.28	2026-11-16 01:00:56.28
93bcf5c5-8a73-4a48-8e31-02b116000949	ce96b73d-25bf-408e-b3c9-9f0a18d1e807	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	46.6000	2026-11-16 01:00:56.281	2026-11-16 01:00:56.281
b00dd705-1ccf-4b31-a166-e0eaecac9bb4	ce96b73d-25bf-408e-b3c9-9f0a18d1e807	c6280b7d-b828-4207-8b63-bf39322fe4e7	381.0000	2026-11-16 01:00:56.281	2026-11-16 01:00:56.281
82251486-bfea-4d5e-8b4e-be2bf6822124	ce96b73d-25bf-408e-b3c9-9f0a18d1e807	dda97316-8920-41c6-b1e1-50d9eee9b8f5	12.7000	2026-11-16 01:00:56.281	2026-11-16 01:00:56.281
e283ab94-6540-4563-8ff9-964e7053c8bf	090673c2-3a0b-4c89-bc4a-bb2848879c5c	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	47.9500	2026-11-16 01:00:56.283	2026-11-16 01:00:56.283
b1b22806-7a41-437d-bd9d-cc88b928c788	090673c2-3a0b-4c89-bc4a-bb2848879c5c	c6280b7d-b828-4207-8b63-bf39322fe4e7	409.5000	2026-11-16 01:00:56.283	2026-11-16 01:00:56.283
78bed50a-14a8-4596-b9ca-0c92c2bc0a2f	090673c2-3a0b-4c89-bc4a-bb2848879c5c	dda97316-8920-41c6-b1e1-50d9eee9b8f5	13.4500	2026-11-16 01:00:56.283	2026-11-16 01:00:56.283
890b0e19-f7f6-44f0-a910-6afb735deca6	8fdbaa3c-0031-4d39-96a7-e13b7bfba2a2	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	49.3000	2026-11-16 01:00:56.284	2026-11-16 01:00:56.284
6ce14a9f-f268-46ce-a1fe-b068efa9af53	8fdbaa3c-0031-4d39-96a7-e13b7bfba2a2	c6280b7d-b828-4207-8b63-bf39322fe4e7	438.0000	2026-11-16 01:00:56.284	2026-11-16 01:00:56.284
7c9c4394-a75c-42a5-a93b-d8978222a867	8fdbaa3c-0031-4d39-96a7-e13b7bfba2a2	dda97316-8920-41c6-b1e1-50d9eee9b8f5	14.2000	2026-11-16 01:00:56.284	2026-11-16 01:00:56.284
6fcab1c6-6920-44d9-8c21-1a67dfe10bb7	b721dd83-4a9f-4fa7-b05a-a35067875074	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	50.6500	2026-11-16 01:00:56.286	2026-11-16 01:00:56.286
b97eb821-c6e7-4605-87c3-40cc80a18825	b721dd83-4a9f-4fa7-b05a-a35067875074	c6280b7d-b828-4207-8b63-bf39322fe4e7	466.5000	2026-11-16 01:00:56.286	2026-11-16 01:00:56.286
30591b59-5d97-4310-9a1f-3d784ea4df6d	b721dd83-4a9f-4fa7-b05a-a35067875074	dda97316-8920-41c6-b1e1-50d9eee9b8f5	14.9500	2026-11-16 01:00:56.286	2026-11-16 01:00:56.286
657fb3b1-d164-42cf-bdac-0cc146682da6	f5e8feb6-3ed9-48b6-b239-6f4d3214141b	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	52.0000	2026-11-16 01:00:56.288	2026-11-16 01:00:56.288
11fc454d-ba57-4230-b60c-2fd6c5dd0575	f5e8feb6-3ed9-48b6-b239-6f4d3214141b	c6280b7d-b828-4207-8b63-bf39322fe4e7	495.0000	2026-11-16 01:00:56.288	2026-11-16 01:00:56.288
74a3c922-6f48-4cc8-9ff4-e85435720165	f5e8feb6-3ed9-48b6-b239-6f4d3214141b	dda97316-8920-41c6-b1e1-50d9eee9b8f5	15.7000	2026-11-16 01:00:56.288	2026-11-16 01:00:56.288
ac51a295-cb77-42b3-9674-26dd45f08e36	2042c967-7dc0-484a-83bd-0caab72bcd57	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	53.3500	2026-11-16 01:00:56.289	2026-11-16 01:00:56.289
1750b851-bef1-47dd-8ed8-2ba665a665fa	2042c967-7dc0-484a-83bd-0caab72bcd57	c6280b7d-b828-4207-8b63-bf39322fe4e7	523.5000	2026-11-16 01:00:56.289	2026-11-16 01:00:56.289
ccf5a506-79f1-4120-867e-18a38dcbd275	2042c967-7dc0-484a-83bd-0caab72bcd57	dda97316-8920-41c6-b1e1-50d9eee9b8f5	16.4500	2026-11-16 01:00:56.289	2026-11-16 01:00:56.289
db93408b-22bf-472e-bdb5-21cea29ac211	0c7dcfe6-e28c-4330-b316-a1bc7877d1a6	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	54.7000	2026-11-16 01:00:56.29	2026-11-16 01:00:56.29
5e5c9070-b298-48a3-8445-0a6c9863f0f4	0c7dcfe6-e28c-4330-b316-a1bc7877d1a6	c6280b7d-b828-4207-8b63-bf39322fe4e7	552.0000	2026-11-16 01:00:56.29	2026-11-16 01:00:56.29
9f0d8070-ed21-4c09-ba71-75dc35501b5b	0c7dcfe6-e28c-4330-b316-a1bc7877d1a6	dda97316-8920-41c6-b1e1-50d9eee9b8f5	17.2000	2026-11-16 01:00:56.29	2026-11-16 01:00:56.29
7a09e28b-af5c-4069-ac62-551571780cd1	47625722-801c-4d36-aa1c-e904afc09a40	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	56.0500	2026-11-16 01:00:56.292	2026-11-16 01:00:56.292
387aa659-8375-4d61-af1f-278012fd114a	47625722-801c-4d36-aa1c-e904afc09a40	c6280b7d-b828-4207-8b63-bf39322fe4e7	580.5000	2026-11-16 01:00:56.292	2026-11-16 01:00:56.292
f074cbe3-99c1-4698-8553-ba978bece5ca	47625722-801c-4d36-aa1c-e904afc09a40	dda97316-8920-41c6-b1e1-50d9eee9b8f5	8.4500	2026-11-16 01:00:56.292	2026-11-16 01:00:56.292
66dbbd37-5e9e-44ee-82d2-c107150d661a	e70f404f-b7c1-49b0-8bcf-12566d34d125	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	39.4000	2026-11-16 01:00:56.294	2026-11-16 01:00:56.294
10282fdf-78fc-4458-8cf4-9911d909bb44	e70f404f-b7c1-49b0-8bcf-12566d34d125	c6280b7d-b828-4207-8b63-bf39322fe4e7	609.0000	2026-11-16 01:00:56.294	2026-11-16 01:00:56.294
9bc473d7-039e-419b-be00-cef9e89a1c59	e70f404f-b7c1-49b0-8bcf-12566d34d125	dda97316-8920-41c6-b1e1-50d9eee9b8f5	9.2000	2026-11-16 01:00:56.294	2026-11-16 01:00:56.294
1f89c8c6-e846-4d88-abff-0cf3a4ad1fc8	f1483acb-e07d-4b60-a75f-3ae5c5d2a709	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	40.7500	2026-11-16 01:00:56.297	2026-11-16 01:00:56.297
ec35ea40-25bc-498f-9d64-12a79296bd25	f1483acb-e07d-4b60-a75f-3ae5c5d2a709	c6280b7d-b828-4207-8b63-bf39322fe4e7	217.5000	2026-11-16 01:00:56.297	2026-11-16 01:00:56.297
e8e1531a-5075-4aab-96d6-622fec3711e4	f1483acb-e07d-4b60-a75f-3ae5c5d2a709	dda97316-8920-41c6-b1e1-50d9eee9b8f5	9.9500	2026-11-16 01:00:56.297	2026-11-16 01:00:56.297
437bdbe9-377a-4aef-82e5-22f65cc46343	8bb063f6-408e-47bd-83e6-c192d353f6b9	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	42.1000	2026-11-16 01:00:56.299	2026-11-16 01:00:56.299
b61ac834-62d3-4cc5-80ec-fdfb49d97e89	8bb063f6-408e-47bd-83e6-c192d353f6b9	c6280b7d-b828-4207-8b63-bf39322fe4e7	246.0000	2026-11-16 01:00:56.299	2026-11-16 01:00:56.299
35d205e1-8bb2-4964-be65-7b55c006e3ac	8bb063f6-408e-47bd-83e6-c192d353f6b9	dda97316-8920-41c6-b1e1-50d9eee9b8f5	10.7000	2026-11-16 01:00:56.299	2026-11-16 01:00:56.299
406241dc-4bf6-4850-bdcc-0573a8a147c0	8bf44476-9e84-480f-9b20-1822fce4d06b	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	43.4500	2026-11-16 01:00:56.3	2026-11-16 01:00:56.3
96612b7d-ef10-441f-9eda-03b8d37921c6	8bf44476-9e84-480f-9b20-1822fce4d06b	c6280b7d-b828-4207-8b63-bf39322fe4e7	274.5000	2026-11-16 01:00:56.3	2026-11-16 01:00:56.3
1d2803f7-1f98-41fd-bfd5-72ace466192e	8bf44476-9e84-480f-9b20-1822fce4d06b	dda97316-8920-41c6-b1e1-50d9eee9b8f5	11.4500	2026-11-16 01:00:56.3	2026-11-16 01:00:56.3
2780a03a-d30a-40c7-b6f4-8ad8f7493bff	dbb0fc2f-02c6-4211-9d87-ab13c85dab5f	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	44.8000	2026-11-16 01:00:56.302	2026-11-16 01:00:56.302
66f8df44-904c-4fb9-b718-f581be64c2d0	dbb0fc2f-02c6-4211-9d87-ab13c85dab5f	c6280b7d-b828-4207-8b63-bf39322fe4e7	303.0000	2026-11-16 01:00:56.302	2026-11-16 01:00:56.302
7e3f61e7-993b-4573-8fb6-ebd3bb8f31a7	dbb0fc2f-02c6-4211-9d87-ab13c85dab5f	dda97316-8920-41c6-b1e1-50d9eee9b8f5	12.2000	2026-11-16 01:00:56.302	2026-11-16 01:00:56.302
af589f6d-875c-4f3e-997d-5f54a5f11b61	e420349e-cc03-48c3-a715-86a6e1d8fd4f	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	46.1500	2026-11-16 01:00:56.303	2026-11-16 01:00:56.303
5e9e2009-cb82-4ca8-8b8b-e64f6fd072f9	e420349e-cc03-48c3-a715-86a6e1d8fd4f	c6280b7d-b828-4207-8b63-bf39322fe4e7	331.5000	2026-11-16 01:00:56.303	2026-11-16 01:00:56.303
08a9726f-3511-420b-99de-b71fb6fde63b	e420349e-cc03-48c3-a715-86a6e1d8fd4f	dda97316-8920-41c6-b1e1-50d9eee9b8f5	12.9500	2026-11-16 01:00:56.303	2026-11-16 01:00:56.303
5eb55158-0c4e-4db3-bae7-3d67f9aa550b	aabbb078-8789-42b9-bfba-8b2ee5227c7d	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	47.5000	2026-11-16 01:00:56.305	2026-11-16 01:00:56.305
acbd4d62-5193-4fa5-8339-f3ff4287d48d	aabbb078-8789-42b9-bfba-8b2ee5227c7d	c6280b7d-b828-4207-8b63-bf39322fe4e7	360.0000	2026-11-16 01:00:56.305	2026-11-16 01:00:56.305
48910762-555d-43a2-86e4-82a79dade482	aabbb078-8789-42b9-bfba-8b2ee5227c7d	dda97316-8920-41c6-b1e1-50d9eee9b8f5	13.7000	2026-11-16 01:00:56.305	2026-11-16 01:00:56.305
60a5de9c-efef-4186-82c9-dcfb51251275	ea21abc1-23f0-4587-bdb0-b52aec08d8b2	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	48.8500	2026-11-16 01:00:56.306	2026-11-16 01:00:56.306
ff88a413-77cc-4a84-b916-bbc9bbbb09f9	ea21abc1-23f0-4587-bdb0-b52aec08d8b2	c6280b7d-b828-4207-8b63-bf39322fe4e7	388.5000	2026-11-16 01:00:56.306	2026-11-16 01:00:56.306
8bb1852d-4a28-4666-96dd-5e14acec4286	ea21abc1-23f0-4587-bdb0-b52aec08d8b2	dda97316-8920-41c6-b1e1-50d9eee9b8f5	14.4500	2026-11-16 01:00:56.306	2026-11-16 01:00:56.306
6218bf26-7115-40a3-8887-ebf131140051	076dbb2a-4ace-452e-ba5e-da32bb08b33c	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	50.2000	2026-11-16 01:00:56.308	2026-11-16 01:00:56.308
154f1147-22f6-4b77-9b11-2e8033304935	076dbb2a-4ace-452e-ba5e-da32bb08b33c	c6280b7d-b828-4207-8b63-bf39322fe4e7	417.0000	2026-11-16 01:00:56.308	2026-11-16 01:00:56.308
5aab94c8-c32a-45cf-ad55-4e07d3af53dc	076dbb2a-4ace-452e-ba5e-da32bb08b33c	dda97316-8920-41c6-b1e1-50d9eee9b8f5	15.2000	2026-11-16 01:00:56.308	2026-11-16 01:00:56.308
8b300e70-cfbf-4b85-9a24-84c1a287c194	dd92deb0-d113-48fa-a5de-58751b089990	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	51.5500	2026-11-16 01:00:56.309	2026-11-16 01:00:56.309
28a78eae-ecc1-4ae8-9dd9-7aa98b3feda1	dd92deb0-d113-48fa-a5de-58751b089990	c6280b7d-b828-4207-8b63-bf39322fe4e7	445.5000	2026-11-16 01:00:56.309	2026-11-16 01:00:56.309
a0275590-0509-4632-a866-e024ea6a4346	dd92deb0-d113-48fa-a5de-58751b089990	dda97316-8920-41c6-b1e1-50d9eee9b8f5	15.9500	2026-11-16 01:00:56.309	2026-11-16 01:00:56.309
d5b6a3dd-9fdd-4796-a8f8-226a31fc2cf5	84f798ad-560c-4b7a-894c-ac34b2ee79be	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	52.9000	2026-11-16 01:00:56.31	2026-11-16 01:00:56.31
39ae8c90-61f2-4274-a476-49e7b7147b75	84f798ad-560c-4b7a-894c-ac34b2ee79be	c6280b7d-b828-4207-8b63-bf39322fe4e7	474.0000	2026-11-16 01:00:56.31	2026-11-16 01:00:56.31
9df17c52-f186-410d-a5f5-c6698f5e8ba6	84f798ad-560c-4b7a-894c-ac34b2ee79be	dda97316-8920-41c6-b1e1-50d9eee9b8f5	16.7000	2026-11-16 01:00:56.31	2026-11-16 01:00:56.31
c2c740cd-56ad-4d3b-80d0-de450c953121	e486d3f4-af73-4f50-9cf1-743252d44f90	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	54.2500	2026-11-16 01:00:56.313	2026-11-16 01:00:56.313
380e32be-afb7-448e-979b-ac9eb201bb7e	e486d3f4-af73-4f50-9cf1-743252d44f90	c6280b7d-b828-4207-8b63-bf39322fe4e7	502.5000	2026-11-16 01:00:56.313	2026-11-16 01:00:56.313
85c3dda6-ef4a-490f-8adc-60625572ffd2	e486d3f4-af73-4f50-9cf1-743252d44f90	dda97316-8920-41c6-b1e1-50d9eee9b8f5	17.4500	2026-11-16 01:00:56.313	2026-11-16 01:00:56.313
bef2ffd7-edf4-41b7-9055-7dafb5dc6563	ac2dfbb6-97ad-4792-b621-853780cc1d7c	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	55.6000	2026-11-16 01:00:56.314	2026-11-16 01:00:56.314
8c258ef4-1ff3-49d9-8fd3-10e44241d23b	ac2dfbb6-97ad-4792-b621-853780cc1d7c	c6280b7d-b828-4207-8b63-bf39322fe4e7	531.0000	2026-11-16 01:00:56.314	2026-11-16 01:00:56.314
83fadabe-5785-4d63-af5a-1d44d188b96b	ac2dfbb6-97ad-4792-b621-853780cc1d7c	dda97316-8920-41c6-b1e1-50d9eee9b8f5	8.7000	2026-11-16 01:00:56.314	2026-11-16 01:00:56.314
c3df917c-4feb-4a9c-b33e-a2af4c68a535	514b0c0b-ef4d-4b38-8385-e72b9f9af900	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	38.9500	2026-11-16 01:00:56.315	2026-11-16 01:00:56.315
6c163f5e-1b9e-4350-9c46-192b5ea231c6	514b0c0b-ef4d-4b38-8385-e72b9f9af900	c6280b7d-b828-4207-8b63-bf39322fe4e7	559.5000	2026-11-16 01:00:56.315	2026-11-16 01:00:56.315
8fcac043-5d2a-4087-9339-3d8a6cf0b453	514b0c0b-ef4d-4b38-8385-e72b9f9af900	dda97316-8920-41c6-b1e1-50d9eee9b8f5	9.4500	2026-11-16 01:00:56.315	2026-11-16 01:00:56.315
4564b72e-89cc-4c58-a7fb-393dc8dd69f8	d184745d-3b16-430e-97cf-12d6804a10e6	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	40.3000	2026-11-16 01:00:56.317	2026-11-16 01:00:56.317
0875ce3c-7d60-4ed3-b758-ea8c61e656fa	d184745d-3b16-430e-97cf-12d6804a10e6	c6280b7d-b828-4207-8b63-bf39322fe4e7	588.0000	2026-11-16 01:00:56.317	2026-11-16 01:00:56.317
592fda4f-4af8-47ec-9c56-e1f954a64b8d	d184745d-3b16-430e-97cf-12d6804a10e6	dda97316-8920-41c6-b1e1-50d9eee9b8f5	10.2000	2026-11-16 01:00:56.317	2026-11-16 01:00:56.317
5bb6f88e-0426-4df8-b842-0d05e03eadab	c689ea94-cabc-4a89-969b-cb9ff81c6701	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	41.6500	2026-11-16 01:00:56.318	2026-11-16 01:00:56.318
487c3d53-7b76-4127-882b-b0724c12dbe0	c689ea94-cabc-4a89-969b-cb9ff81c6701	c6280b7d-b828-4207-8b63-bf39322fe4e7	616.5000	2026-11-16 01:00:56.318	2026-11-16 01:00:56.318
7c85fe2d-6f56-4e3d-b347-a6b866cd73a8	c689ea94-cabc-4a89-969b-cb9ff81c6701	dda97316-8920-41c6-b1e1-50d9eee9b8f5	10.9500	2026-11-16 01:00:56.318	2026-11-16 01:00:56.318
ed5a1d7a-53d4-48a3-a93a-fd426cde3603	d2b85f22-39eb-401f-b35e-87a3216fdc37	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	43.0000	2026-11-16 01:00:56.32	2026-11-16 01:00:56.32
dbf787fd-3bcb-4fa0-9206-f1c1b750f35c	d2b85f22-39eb-401f-b35e-87a3216fdc37	c6280b7d-b828-4207-8b63-bf39322fe4e7	225.0000	2026-11-16 01:00:56.32	2026-11-16 01:00:56.32
f8739dae-ff55-4561-b017-4e23ab66e8c2	d2b85f22-39eb-401f-b35e-87a3216fdc37	dda97316-8920-41c6-b1e1-50d9eee9b8f5	11.7000	2026-11-16 01:00:56.32	2026-11-16 01:00:56.32
8b06ae74-daa0-4726-a56d-c2a370603044	84d16f45-37b1-40bc-b68c-112a28913861	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	44.3500	2026-11-16 01:00:56.322	2026-11-16 01:00:56.322
8946291d-5abd-404c-bf40-aa9750ed4169	84d16f45-37b1-40bc-b68c-112a28913861	c6280b7d-b828-4207-8b63-bf39322fe4e7	253.5000	2026-11-16 01:00:56.322	2026-11-16 01:00:56.322
7e20fa59-757b-4b85-82cd-0334e1df6a7c	84d16f45-37b1-40bc-b68c-112a28913861	dda97316-8920-41c6-b1e1-50d9eee9b8f5	12.4500	2026-11-16 01:00:56.322	2026-11-16 01:00:56.322
92c59558-aef8-46f4-80bb-cb6f5e47da5a	36812fb4-9945-40cd-9330-145a91d633de	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	45.7000	2026-11-16 01:00:56.323	2026-11-16 01:00:56.323
cff5b699-5481-403b-b731-dde02c10d1b0	36812fb4-9945-40cd-9330-145a91d633de	c6280b7d-b828-4207-8b63-bf39322fe4e7	282.0000	2026-11-16 01:00:56.323	2026-11-16 01:00:56.323
9b5a080d-66c6-40d6-bd4f-c1a2c1e3bdda	36812fb4-9945-40cd-9330-145a91d633de	dda97316-8920-41c6-b1e1-50d9eee9b8f5	13.2000	2026-11-16 01:00:56.323	2026-11-16 01:00:56.323
9f47be10-80dd-4788-b745-cb7f835704a9	5b3f409c-8ecf-460f-b406-e006a798910a	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	47.0500	2026-11-16 01:00:56.324	2026-11-16 01:00:56.324
b943a046-1c10-482d-b8b0-db346fa27fea	5b3f409c-8ecf-460f-b406-e006a798910a	c6280b7d-b828-4207-8b63-bf39322fe4e7	310.5000	2026-11-16 01:00:56.324	2026-11-16 01:00:56.324
980c9b65-ac8f-4246-8dd1-ae31ea870e8a	5b3f409c-8ecf-460f-b406-e006a798910a	dda97316-8920-41c6-b1e1-50d9eee9b8f5	13.9500	2026-11-16 01:00:56.324	2026-11-16 01:00:56.324
59d1dcb7-67f4-4555-b034-36d4d012168f	a5f4d50f-8331-42f7-8def-09050b102821	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	48.4000	2026-11-16 01:00:56.326	2026-11-16 01:00:56.326
fb6fbd53-2fcf-46a0-84b8-8987c89620b7	a5f4d50f-8331-42f7-8def-09050b102821	c6280b7d-b828-4207-8b63-bf39322fe4e7	339.0000	2026-11-16 01:00:56.326	2026-11-16 01:00:56.326
613513e4-7f6f-4652-9629-09b84a1623b3	a5f4d50f-8331-42f7-8def-09050b102821	dda97316-8920-41c6-b1e1-50d9eee9b8f5	14.7000	2026-11-16 01:00:56.326	2026-11-16 01:00:56.326
8a9e1d62-2341-4646-9137-34d44ffff85a	61dd510a-dca4-4b7d-8463-9d29dba33166	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	49.7500	2026-11-16 01:00:56.328	2026-11-16 01:00:56.328
dade8508-6abb-4c9f-9528-d6fbc2041e10	61dd510a-dca4-4b7d-8463-9d29dba33166	c6280b7d-b828-4207-8b63-bf39322fe4e7	367.5000	2026-11-16 01:00:56.328	2026-11-16 01:00:56.328
c6c2affb-6a00-4c87-b750-dfe0318c4d29	61dd510a-dca4-4b7d-8463-9d29dba33166	dda97316-8920-41c6-b1e1-50d9eee9b8f5	15.4500	2026-11-16 01:00:56.328	2026-11-16 01:00:56.328
4ebef81e-87e5-4954-ab1a-cd604836d8d1	40c8beb5-26e3-4e45-a9a6-ffc7fb947f08	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	51.1000	2026-11-16 01:00:56.329	2026-11-16 01:00:56.329
19b2a8ba-374f-45dd-ac93-5f8957acd158	40c8beb5-26e3-4e45-a9a6-ffc7fb947f08	c6280b7d-b828-4207-8b63-bf39322fe4e7	396.0000	2026-11-16 01:00:56.329	2026-11-16 01:00:56.329
b642dc17-6922-4173-aee1-4357fac0bfa1	40c8beb5-26e3-4e45-a9a6-ffc7fb947f08	dda97316-8920-41c6-b1e1-50d9eee9b8f5	16.2000	2026-11-16 01:00:56.329	2026-11-16 01:00:56.329
e5bc61f2-36d3-4e75-8389-f8f9ac2a7b76	00359a86-9534-4bfa-bf13-a417adafe9a0	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	52.4500	2026-11-16 01:00:56.33	2026-11-16 01:00:56.33
b7aa6a78-72a7-4403-9d05-947af3af4948	00359a86-9534-4bfa-bf13-a417adafe9a0	c6280b7d-b828-4207-8b63-bf39322fe4e7	424.5000	2026-11-16 01:00:56.33	2026-11-16 01:00:56.33
ef89c7dc-99f4-41ca-8489-ab718b6e4ed2	00359a86-9534-4bfa-bf13-a417adafe9a0	dda97316-8920-41c6-b1e1-50d9eee9b8f5	16.9500	2026-11-16 01:00:56.33	2026-11-16 01:00:56.33
00d4f100-05f0-4e6c-acdf-74f736d58b97	58ab8205-4ab1-417c-9fcc-c52f8d3adfc7	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	53.8000	2026-11-16 01:00:56.332	2026-11-16 01:00:56.332
aaed7d28-ac99-428a-9f72-4f18481685f8	58ab8205-4ab1-417c-9fcc-c52f8d3adfc7	c6280b7d-b828-4207-8b63-bf39322fe4e7	453.0000	2026-11-16 01:00:56.332	2026-11-16 01:00:56.332
00d2f641-7503-48c9-a4b2-f2fe946ea6fa	58ab8205-4ab1-417c-9fcc-c52f8d3adfc7	dda97316-8920-41c6-b1e1-50d9eee9b8f5	8.2000	2026-11-16 01:00:56.332	2026-11-16 01:00:56.332
11c8b4dd-d30a-4213-b43c-b1367c6852d2	94e1a6d5-eb78-4cb5-8346-2b665c67a0a1	ec5ce49e-88d8-4181-a3e5-d0249f3e979d	55.1500	2026-11-16 01:00:56.333	2026-11-16 01:00:56.333
76600cff-d0cb-4a86-a982-464b47f6bdc5	94e1a6d5-eb78-4cb5-8346-2b665c67a0a1	c6280b7d-b828-4207-8b63-bf39322fe4e7	481.5000	2026-11-16 01:00:56.333	2026-11-16 01:00:56.333
77b9e71b-9c76-4654-967e-a14fccea6a35	94e1a6d5-eb78-4cb5-8346-2b665c67a0a1	dda97316-8920-41c6-b1e1-50d9eee9b8f5	8.9500	2026-11-16 01:00:56.333	2026-11-16 01:00:56.333
99dfb2ce-5adc-4ddf-9186-58c5dfbe0e7a	af006cc0-df90-4b75-ab9b-eff94626cd84	43e49e20-7efa-49c5-bee3-5a34ea36ca80	57.0000	2026-11-16 01:00:56.335	2026-11-16 01:00:56.335
94569646-925a-4d3c-a622-5824b7e9f28b	af006cc0-df90-4b75-ab9b-eff94626cd84	1da3b3b1-cd56-4a84-9bf4-cbe9000ae374	30.0000	2026-11-16 01:00:56.335	2026-11-16 01:00:56.335
63fc2fbb-9e8e-4bb3-874f-16de4f27b9f9	58a73805-83d2-4a9e-babb-0adf74ea12da	43e49e20-7efa-49c5-bee3-5a34ea36ca80	58.1500	2026-11-16 01:00:56.336	2026-11-16 01:00:56.336
d83c6627-aaea-4057-b636-1fc11cda6b93	58a73805-83d2-4a9e-babb-0adf74ea12da	1da3b3b1-cd56-4a84-9bf4-cbe9000ae374	32.3000	2026-11-16 01:00:56.336	2026-11-16 01:00:56.336
96ba1d3e-c603-47f3-9529-cee400ea197b	0ada1de7-d4a2-4e48-a143-34c20c428921	43e49e20-7efa-49c5-bee3-5a34ea36ca80	59.3000	2026-11-16 01:00:56.338	2026-11-16 01:00:56.338
573195fc-578c-41fa-b468-286e55602c83	0ada1de7-d4a2-4e48-a143-34c20c428921	1da3b3b1-cd56-4a84-9bf4-cbe9000ae374	18.5000	2026-11-16 01:00:56.338	2026-11-16 01:00:56.338
38e9bc02-b6b5-4117-a848-a45ba387b79d	7193291b-1016-4d06-b5f4-d06ee1f5fc06	43e49e20-7efa-49c5-bee3-5a34ea36ca80	60.4500	2026-11-16 01:00:56.339	2026-11-16 01:00:56.339
f622dc99-c182-43c7-8701-291a9c4ab7a4	7193291b-1016-4d06-b5f4-d06ee1f5fc06	1da3b3b1-cd56-4a84-9bf4-cbe9000ae374	20.8000	2026-11-16 01:00:56.339	2026-11-16 01:00:56.339
7d844257-e2b8-4728-95a8-828772ba7d6d	6f342e30-daaa-4702-ad6d-1b027424e609	43e49e20-7efa-49c5-bee3-5a34ea36ca80	61.6000	2026-11-16 01:00:56.34	2026-11-16 01:00:56.34
7b193958-9c8d-4ebb-a0f7-62e648ba3c4f	6f342e30-daaa-4702-ad6d-1b027424e609	1da3b3b1-cd56-4a84-9bf4-cbe9000ae374	23.1000	2026-11-16 01:00:56.34	2026-11-16 01:00:56.34
\.


--
-- Data for Name: lotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lotes (id, numero_lote, compra_id, proveedor_id, usuario_id, fecha_compra, mina_origen, cantidad_sacos, peso_neto, peso_seco, humedad_pct, unidad_peso, tipo_mineral, estado, observaciones, created_at, updated_at) FROM stdin;
5f10c661-cbbd-46af-bd70-c94abece642a	LT-2026-0001	bfb44e5b-d17b-4ede-8ab4-c2047a4c2698	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-10-19 11:30:00	Distrito Huanuni — Oruro	30	1430.0000	\N	\N	KG	Complejo Zn-Ag	VENDIDO	Lote histórico de demostración #1	2026-11-16 01:00:56.242	2026-11-16 01:00:56.242
7de990ec-f05e-4611-8391-6a890529cf14	LT-2026-0002	bfb44e5b-d17b-4ede-8ab4-c2047a4c2698	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-10-20 11:30:00	Veta Rosario — Colquiri	35	1610.0000	\N	\N	KG	Complejo Zn-Ag	VENDIDO	Lote histórico de demostración #2	2026-11-16 01:00:56.248	2026-11-16 01:00:56.248
36b5114b-99c9-4486-aa04-91c74905f834	LT-2026-0003	bfb44e5b-d17b-4ede-8ab4-c2047a4c2698	5ec577bb-7edb-43fc-9431-b1c7378e4340	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-10-21 11:30:00	Yacimiento Porco — Potosí	40	1790.0000	\N	\N	KG	Complejo Zn-Ag	VENDIDO	Lote histórico de demostración #3	2026-11-16 01:00:56.251	2026-11-16 01:00:56.251
dd39a29c-368b-4bd5-8240-fe991c9af05d	LT-2026-0004	bfb44e5b-d17b-4ede-8ab4-c2047a4c2698	1089512b-d95a-4fc3-a011-ff42f2e27a65	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-10-22 11:30:00	Cuenca Poopó — Oruro	25	1970.0000	\N	\N	KG	Complejo Zn-Ag	VENDIDO	Lote histórico de demostración #4	2026-11-16 01:00:56.254	2026-11-16 01:00:56.254
089212c5-1ecd-443c-8485-50b0b805d64c	LT-2026-0005	bfb44e5b-d17b-4ede-8ab4-c2047a4c2698	365bc245-7b88-4320-ab27-adf940ee5922	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-10-23 11:30:00	Nor Lípez — Potosí	30	2150.0000	\N	\N	KG	Complejo Zn-Ag	VENDIDO	Lote histórico de demostración #5	2026-11-16 01:00:56.256	2026-11-16 01:00:56.256
4a70725b-f055-49f0-b2b1-f07e88193260	LT-2026-0006	bfb44e5b-d17b-4ede-8ab4-c2047a4c2698	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-10-24 11:30:00	Cerro Rico — Potosí	35	2330.0000	\N	\N	KG	Complejo Zn-Ag	VENDIDO	Lote histórico de demostración #6	2026-11-16 01:00:56.258	2026-11-16 01:00:56.258
7637389e-6d6b-4ce6-bb57-01afe91ee117	LT-2026-0101	2cf48cb8-dc42-4881-b44a-93ded0293bf4	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-04 13:00:00	Cerro Rico — Potosí	18	950.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.272	2026-11-16 01:00:56.272
289948e6-bd52-404f-a954-bd60ef4dffe3	LT-2026-0102	2cf48cb8-dc42-4881-b44a-93ded0293bf4	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-04 13:00:00	Cerro Rico — Potosí	21	1085.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.273	2026-11-16 01:00:56.273
bf2196fb-f2d3-4542-a3b3-ff91f2b20f01	LT-2026-0103	2cf48cb8-dc42-4881-b44a-93ded0293bf4	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-04 13:00:00	Cerro Rico — Potosí	24	1220.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.275	2026-11-16 01:00:56.275
7919466d-bb48-4905-a240-b530b7334471	LT-2026-0104	2cf48cb8-dc42-4881-b44a-93ded0293bf4	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-04 13:00:00	Cerro Rico — Potosí	27	1355.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.276	2026-11-16 01:00:56.276
2a5eaf3d-2f16-4a62-98d1-35d543f73c10	LT-2026-0105	2cf48cb8-dc42-4881-b44a-93ded0293bf4	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-04 13:00:00	Cerro Rico — Potosí	30	1490.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.278	2026-11-16 01:00:56.278
71792c52-1ae7-4c2f-bd56-c843f1caa886	LT-2026-0106	6ef82d75-3477-41f6-8fc2-2362eb01bc97	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-05 13:00:00	Distrito Huanuni — Oruro	33	1625.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.28	2026-11-16 01:00:56.28
ce96b73d-25bf-408e-b3c9-9f0a18d1e807	LT-2026-0107	6ef82d75-3477-41f6-8fc2-2362eb01bc97	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-05 13:00:00	Distrito Huanuni — Oruro	36	1760.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.281	2026-11-16 01:00:56.281
090673c2-3a0b-4c89-bc4a-bb2848879c5c	LT-2026-0108	6ef82d75-3477-41f6-8fc2-2362eb01bc97	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-05 13:00:00	Distrito Huanuni — Oruro	39	1895.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.283	2026-11-16 01:00:56.283
8fdbaa3c-0031-4d39-96a7-e13b7bfba2a2	LT-2026-0109	6ef82d75-3477-41f6-8fc2-2362eb01bc97	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-05 13:00:00	Distrito Huanuni — Oruro	18	2.0300	\N	\N	TM	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.284	2026-11-16 01:00:56.284
b721dd83-4a9f-4fa7-b05a-a35067875074	LT-2026-0110	6ef82d75-3477-41f6-8fc2-2362eb01bc97	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-05 13:00:00	Distrito Huanuni — Oruro	21	2165.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.286	2026-11-16 01:00:56.286
f5e8feb6-3ed9-48b6-b239-6f4d3214141b	LT-2026-0111	47eb3a3b-8c1f-47e5-9e92-c7e334712d69	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-06 13:00:00	Veta Rosario — Colquiri	24	2300.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.288	2026-11-16 01:00:56.288
2042c967-7dc0-484a-83bd-0caab72bcd57	LT-2026-0112	47eb3a3b-8c1f-47e5-9e92-c7e334712d69	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-06 13:00:00	Veta Rosario — Colquiri	27	2435.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.289	2026-11-16 01:00:56.289
0c7dcfe6-e28c-4330-b316-a1bc7877d1a6	LT-2026-0113	47eb3a3b-8c1f-47e5-9e92-c7e334712d69	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-06 13:00:00	Veta Rosario — Colquiri	30	2570.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.29	2026-11-16 01:00:56.29
47625722-801c-4d36-aa1c-e904afc09a40	LT-2026-0114	47eb3a3b-8c1f-47e5-9e92-c7e334712d69	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-06 13:00:00	Veta Rosario — Colquiri	33	2705.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.292	2026-11-16 01:00:56.292
e70f404f-b7c1-49b0-8bcf-12566d34d125	LT-2026-0115	47eb3a3b-8c1f-47e5-9e92-c7e334712d69	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-06 13:00:00	Veta Rosario — Colquiri	36	2840.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.294	2026-11-16 01:00:56.294
f1483acb-e07d-4b60-a75f-3ae5c5d2a709	LT-2026-0116	8500e856-61e6-4015-ad5c-26759ba3b10b	5ec577bb-7edb-43fc-9431-b1c7378e4340	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-07 13:00:00	Yacimiento Porco — Potosí	39	2975.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.297	2026-11-16 01:00:56.297
8bb063f6-408e-47bd-83e6-c192d353f6b9	LT-2026-0117	8500e856-61e6-4015-ad5c-26759ba3b10b	5ec577bb-7edb-43fc-9431-b1c7378e4340	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-07 13:00:00	Yacimiento Porco — Potosí	18	1010.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.299	2026-11-16 01:00:56.299
8bf44476-9e84-480f-9b20-1822fce4d06b	LT-2026-0118	8500e856-61e6-4015-ad5c-26759ba3b10b	5ec577bb-7edb-43fc-9431-b1c7378e4340	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-07 13:00:00	Yacimiento Porco — Potosí	21	1.1450	\N	\N	TM	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.3	2026-11-16 01:00:56.3
dbb0fc2f-02c6-4211-9d87-ab13c85dab5f	LT-2026-0119	8500e856-61e6-4015-ad5c-26759ba3b10b	5ec577bb-7edb-43fc-9431-b1c7378e4340	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-07 13:00:00	Yacimiento Porco — Potosí	24	1280.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.302	2026-11-16 01:00:56.302
e420349e-cc03-48c3-a715-86a6e1d8fd4f	LT-2026-0120	8500e856-61e6-4015-ad5c-26759ba3b10b	5ec577bb-7edb-43fc-9431-b1c7378e4340	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-07 13:00:00	Yacimiento Porco — Potosí	27	1415.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.303	2026-11-16 01:00:56.303
aabbb078-8789-42b9-bfba-8b2ee5227c7d	LT-2026-0121	f543a31c-bb9a-49a3-b030-cbfce5d001a1	1089512b-d95a-4fc3-a011-ff42f2e27a65	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-08 13:00:00	Cuenca Poopó — Oruro	30	1550.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.305	2026-11-16 01:00:56.305
ea21abc1-23f0-4587-bdb0-b52aec08d8b2	LT-2026-0122	f543a31c-bb9a-49a3-b030-cbfce5d001a1	1089512b-d95a-4fc3-a011-ff42f2e27a65	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-08 13:00:00	Cuenca Poopó — Oruro	33	1685.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.306	2026-11-16 01:00:56.306
076dbb2a-4ace-452e-ba5e-da32bb08b33c	LT-2026-0123	f543a31c-bb9a-49a3-b030-cbfce5d001a1	1089512b-d95a-4fc3-a011-ff42f2e27a65	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-08 13:00:00	Cuenca Poopó — Oruro	36	1820.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.308	2026-11-16 01:00:56.308
dd92deb0-d113-48fa-a5de-58751b089990	LT-2026-0124	f543a31c-bb9a-49a3-b030-cbfce5d001a1	1089512b-d95a-4fc3-a011-ff42f2e27a65	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-08 13:00:00	Cuenca Poopó — Oruro	39	1955.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.309	2026-11-16 01:00:56.309
84f798ad-560c-4b7a-894c-ac34b2ee79be	LT-2026-0125	f543a31c-bb9a-49a3-b030-cbfce5d001a1	1089512b-d95a-4fc3-a011-ff42f2e27a65	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-08 13:00:00	Cuenca Poopó — Oruro	18	2090.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.31	2026-11-16 01:00:56.31
e486d3f4-af73-4f50-9cf1-743252d44f90	LT-2026-0126	20c9faca-98e8-414e-8213-50435e1ffb1a	365bc245-7b88-4320-ab27-adf940ee5922	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-09 13:00:00	Nor Lípez — Potosí	21	2225.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.313	2026-11-16 01:00:56.313
ac2dfbb6-97ad-4792-b621-853780cc1d7c	LT-2026-0127	20c9faca-98e8-414e-8213-50435e1ffb1a	365bc245-7b88-4320-ab27-adf940ee5922	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-09 13:00:00	Nor Lípez — Potosí	24	2.3600	\N	\N	TM	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.314	2026-11-16 01:00:56.314
514b0c0b-ef4d-4b38-8385-e72b9f9af900	LT-2026-0128	20c9faca-98e8-414e-8213-50435e1ffb1a	365bc245-7b88-4320-ab27-adf940ee5922	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-09 13:00:00	Nor Lípez — Potosí	27	2495.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.315	2026-11-16 01:00:56.315
d184745d-3b16-430e-97cf-12d6804a10e6	LT-2026-0129	20c9faca-98e8-414e-8213-50435e1ffb1a	365bc245-7b88-4320-ab27-adf940ee5922	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-09 13:00:00	Nor Lípez — Potosí	30	2630.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.317	2026-11-16 01:00:56.317
c689ea94-cabc-4a89-969b-cb9ff81c6701	LT-2026-0130	20c9faca-98e8-414e-8213-50435e1ffb1a	365bc245-7b88-4320-ab27-adf940ee5922	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-09 13:00:00	Nor Lípez — Potosí	33	2765.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.318	2026-11-16 01:00:56.318
d2b85f22-39eb-401f-b35e-87a3216fdc37	LT-2026-0131	2d538470-5b5b-4cef-a2e3-c6f858fbf043	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-10 13:00:00	Cerro Rico — Potosí	36	2900.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.32	2026-11-16 01:00:56.32
84d16f45-37b1-40bc-b68c-112a28913861	LT-2026-0132	2d538470-5b5b-4cef-a2e3-c6f858fbf043	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-10 13:00:00	Cerro Rico — Potosí	39	3035.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.322	2026-11-16 01:00:56.322
36812fb4-9945-40cd-9330-145a91d633de	LT-2026-0133	2d538470-5b5b-4cef-a2e3-c6f858fbf043	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-10 13:00:00	Cerro Rico — Potosí	18	1070.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.323	2026-11-16 01:00:56.323
5b3f409c-8ecf-460f-b406-e006a798910a	LT-2026-0134	2d538470-5b5b-4cef-a2e3-c6f858fbf043	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-10 13:00:00	Cerro Rico — Potosí	21	1205.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.324	2026-11-16 01:00:56.324
a5f4d50f-8331-42f7-8def-09050b102821	LT-2026-0135	2d538470-5b5b-4cef-a2e3-c6f858fbf043	e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-10 13:00:00	Cerro Rico — Potosí	24	1340.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.326	2026-11-16 01:00:56.326
61dd510a-dca4-4b7d-8463-9d29dba33166	LT-2026-0136	58290438-2051-433e-816f-0dc7af060d7c	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-11 13:00:00	Distrito Huanuni — Oruro	27	1.4750	\N	\N	TM	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.328	2026-11-16 01:00:56.328
40c8beb5-26e3-4e45-a9a6-ffc7fb947f08	LT-2026-0137	58290438-2051-433e-816f-0dc7af060d7c	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-11 13:00:00	Distrito Huanuni — Oruro	30	1610.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.329	2026-11-16 01:00:56.329
00359a86-9534-4bfa-bf13-a417adafe9a0	LT-2026-0138	58290438-2051-433e-816f-0dc7af060d7c	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-11 13:00:00	Distrito Huanuni — Oruro	33	1745.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.33	2026-11-16 01:00:56.33
58ab8205-4ab1-417c-9fcc-c52f8d3adfc7	LT-2026-0139	58290438-2051-433e-816f-0dc7af060d7c	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-11 13:00:00	Distrito Huanuni — Oruro	36	1880.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.332	2026-11-16 01:00:56.332
94e1a6d5-eb78-4cb5-8346-2b665c67a0a1	LT-2026-0140	58290438-2051-433e-816f-0dc7af060d7c	3d285946-6cc9-4150-aa55-47d8aa867dc6	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-11 13:00:00	Distrito Huanuni — Oruro	39	2015.0000	\N	\N	KG	Complejo Zn-Ag-Pb	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.333	2026-11-16 01:00:56.333
af006cc0-df90-4b75-ab9b-eff94626cd84	LT-2026-0141	9e85337d-02e2-44d2-9bec-8ee7b5f905c9	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-12 13:00:00	Veta Rosario — Colquiri	18	2150.0000	\N	\N	KG	Concentrado de Estaño (Sn)	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.335	2026-11-16 01:00:56.335
58a73805-83d2-4a9e-babb-0adf74ea12da	LT-2026-0142	9e85337d-02e2-44d2-9bec-8ee7b5f905c9	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-12 13:00:00	Veta Rosario — Colquiri	21	2285.0000	\N	\N	KG	Concentrado de Estaño (Sn)	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.336	2026-11-16 01:00:56.336
0ada1de7-d4a2-4e48-a143-34c20c428921	LT-2026-0143	9e85337d-02e2-44d2-9bec-8ee7b5f905c9	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-12 13:00:00	Veta Rosario — Colquiri	24	2420.0000	\N	\N	KG	Concentrado de Estaño (Sn)	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.338	2026-11-16 01:00:56.338
7193291b-1016-4d06-b5f4-d06ee1f5fc06	LT-2026-0144	9e85337d-02e2-44d2-9bec-8ee7b5f905c9	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-12 13:00:00	Veta Rosario — Colquiri	27	2555.0000	\N	\N	KG	Concentrado de Estaño (Sn)	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 2 (DEMO)	2026-11-16 01:00:56.339	2026-11-16 01:00:56.339
6f342e30-daaa-4702-ad6d-1b027424e609	LT-2026-0145	9e85337d-02e2-44d2-9bec-8ee7b5f905c9	2ca722b4-bc89-4b15-b267-776018ea0f3e	00867f08-c6dd-4463-826c-d72b28cb4c92	2026-11-12 13:00:00	Veta Rosario — Colquiri	30	2.6900	\N	\N	TM	Concentrado de Estaño (Sn)	DISPONIBLE	Lote verificado en balanza camionera — Balanza N.º 1 (DEMO)	2026-11-16 01:00:56.34	2026-11-16 01:00:56.34
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proveedores (id, codigo, nombre, mina_origen, telefono, observaciones, estado, created_at, updated_at) FROM stdin;
365bc245-7b88-4320-ab27-adf940ee5922	PROV-006	Asociación Minera San Cristóbal Norte (FICTICIO)	Nor Lípez — Potosí	+591 2 6239900	Lotes de exportación con control granulométrico (Datos ficticios)	ACTIVO	2026-11-16 01:00:56.235	2026-11-16 01:00:56.235
3d285946-6cc9-4150-aa55-47d8aa867dc6	PROV-002	Cooperativa Minera Huanuni Sur R.L. (FICTICIO)	Distrito Huanuni — Oruro	+591 2 5281920	Suministro regular de concentrados de Estaño y complejos (Datos ficticios)	ACTIVO	2026-11-16 01:00:56.235	2026-11-16 01:00:56.235
5ec577bb-7edb-43fc-9431-b1c7378e4340	PROV-004	Cooperativa Minera Porco Imperial (FICTICIO)	Yacimiento Porco — Potosí	+591 2 6248310	Complejos polimetálicos Zn-Pb-Ag (Datos ficticios)	ACTIVO	2026-11-16 01:00:56.235	2026-11-16 01:00:56.235
e54df4b3-cc0a-41c7-9763-7a8cf0a5af44	PROV-001	Cooperativa Minera Cerro Rico Ltda. (FICTICIO)	Cerro Rico — Potosí	+591 2 6224100	Proveedor de complejos de Zinc-Plata de alta ley (Datos ficticios de demostración)	ACTIVO	2026-11-16 01:00:56.235	2026-11-16 01:00:56.235
2ca722b4-bc89-4b15-b267-776018ea0f3e	PROV-003	Sociedad Minera Colquiri Andina (FICTICIO)	Veta Rosario — Colquiri	+591 2 2441800	Lotes clasificados por tamiz y humedad controlada (Datos ficticios)	ACTIVO	2026-11-16 01:00:56.235	2026-11-16 01:00:56.235
1089512b-d95a-4fc3-a011-ff42f2e27a65	PROV-005	Ingenio Minero Poopó Central (FICTICIO)	Cuenca Poopó — Oruro	+591 2 5254411	Concentrados de flotación verificados en laboratorio (Datos ficticios)	ACTIVO	2026-11-16 01:00:56.235	2026-11-16 01:00:56.235
\.


--
-- Data for Name: resumen_leyes_venta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resumen_leyes_venta (id, venta_id, codigo_ley, mineral, simbolo, nombre_ley, unidad_medida, ley_promedio, peso_base_ponderado_kg, lotes_incluidos, lotes_con_faltante, criterio_ponderacion, created_at) FROM stdin;
9f499b55-7dda-486f-a9a0-7a7533f1363a	33a62623-2268-4b30-9d0c-bc8d261ae1b8	ZN_PCT	Zinc	Zn	Ley de Zinc	%	44.9043	4830.0000	3	0	PESO_NETO_CONVERTIDO_KG	2026-11-16 01:00:56.262
af179b54-e534-4649-81a6-0411baeccbef	33a62623-2268-4b30-9d0c-bc8d261ae1b8	AG_GT	Plata	Ag	Ley de Plata (g/t)	g/t	226.6770	4830.0000	3	0	PESO_NETO_CONVERTIDO_KG	2026-11-16 01:00:56.262
aae07da6-b06d-41c9-a968-bddba0834969	e9ec6b97-c0ba-485c-875e-3792225b2679	ZN_PCT	Zinc	Zn	Ley de Zinc	%	49.0781	6450.0000	3	0	PESO_NETO_CONVERTIDO_KG	2026-11-16 01:00:56.268
618c4317-4d3f-41a2-9e39-6162ba3bbb79	e9ec6b97-c0ba-485c-875e-3792225b2679	AG_GT	Plata	Ag	Ley de Plata (g/t)	g/t	293.7558	6450.0000	3	0	PESO_NETO_CONVERTIDO_KG	2026-11-16 01:00:56.268
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, email, username, hash_password, rol, estado, created_at, updated_at) FROM stdin;
00867f08-c6dd-4463-826c-d72b28cb4c92	Téc. Rubén Choque Condori (DEMO)	almacen@mineralflow.demo.bo	almacenero	$2b$10$H0jOv8u1ss2aFrB8Rb3snO.AKUJmX552O0rX2rkBKdCaOaJQ9gqn2	ALMACENERO	ACTIVO	2026-11-16 01:00:56.064	2026-11-16 01:00:56.064
780cefc2-a9b4-4f44-ab07-8220da3ea291	Ing. Carlos Mamani Quispe (DEMO)	admin@mineralflow.demo.bo	admin	$2b$10$H0jOv8u1ss2aFrB8Rb3snO.AKUJmX552O0rX2rkBKdCaOaJQ9gqn2	ADMINISTRADOR	ACTIVO	2026-11-16 01:00:56.064	2026-11-16 01:00:56.064
f0dc97e9-c19f-4782-8194-0ae3a506d703	Aud. Fernando Flores Ticona (DEMO)	consulta@mineralflow.demo.bo	consulta	$2b$10$H0jOv8u1ss2aFrB8Rb3snO.AKUJmX552O0rX2rkBKdCaOaJQ9gqn2	CONSULTA	ACTIVO	2026-11-16 01:00:56.064	2026-11-16 01:00:56.064
3ca844f0-dd01-40ee-bd4b-8a66e49016a9	Lic. Valeria Rojas Vargas (DEMO)	ventas@mineralflow.demo.bo	vendedor	$2b$10$H0jOv8u1ss2aFrB8Rb3snO.AKUJmX552O0rX2rkBKdCaOaJQ9gqn2	VENDEDOR	ACTIVO	2026-11-16 01:00:56.064	2026-11-16 01:00:56.064
\.


--
-- Data for Name: ventas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ventas (id, numero_venta, fecha, comprador_id, usuario_id, total_lotes, total_sacos, peso_total_kg, unidad_peso, criterio_peso, comprador_nombre_snapshot, comprador_nit_snapshot, estado, observaciones, created_at, updated_at) FROM stdin;
33a62623-2268-4b30-9d0c-bc8d261ae1b8	VTA-2026-0001	2026-10-25 15:20:00	3f628dea-6b27-4ee1-8307-7c6521758dc3	3ca844f0-dd01-40ee-bd4b-8a66e49016a9	3	105	4830.0000	KG	PESO_NETO_CONVERTIDO_KG	Comercializadora Andina de Metales S.A. (FICTICIO)	NIT 1029384021	CONFIRMADA	Despacho histórico consolidado (Datos ficticios de demostración)	2026-11-16 01:00:56.262	2026-11-16 01:00:56.262
e9ec6b97-c0ba-485c-875e-3792225b2679	VTA-2026-0002	2026-11-02 16:45:00	6066380a-da8a-41f6-96c2-1338fce7b661	3ca844f0-dd01-40ee-bd4b-8a66e49016a9	3	90	6450.0000	KG	PESO_NETO_CONVERTIDO_KG	Consorcio Exportador Altiplano Minerals Ltda. (FICTICIO)	NIT 3049182019	CONFIRMADA	Despacho histórico consolidado (Datos ficticios de demostración)	2026-11-16 01:00:56.268	2026-11-16 01:00:56.268
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: catalogo_leyes catalogo_leyes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogo_leyes
    ADD CONSTRAINT catalogo_leyes_pkey PRIMARY KEY (id);


--
-- Name: compradores compradores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compradores
    ADD CONSTRAINT compradores_pkey PRIMARY KEY (id);


--
-- Name: compras compras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_pkey PRIMARY KEY (id);


--
-- Name: detalle_ventas detalle_ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_ventas
    ADD CONSTRAINT detalle_ventas_pkey PRIMARY KEY (id);


--
-- Name: lote_leyes lote_leyes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lote_leyes
    ADD CONSTRAINT lote_leyes_pkey PRIMARY KEY (id);


--
-- Name: lotes lotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: resumen_leyes_venta resumen_leyes_venta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumen_leyes_venta
    ADD CONSTRAINT resumen_leyes_venta_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- Name: auditoria_entidad_registro_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auditoria_entidad_registro_id_idx ON public.auditoria USING btree (entidad, registro_id);


--
-- Name: auditoria_fecha_hora_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auditoria_fecha_hora_idx ON public.auditoria USING btree (fecha_hora);


--
-- Name: catalogo_leyes_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX catalogo_leyes_codigo_key ON public.catalogo_leyes USING btree (codigo);


--
-- Name: compradores_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX compradores_codigo_key ON public.compradores USING btree (codigo);


--
-- Name: compradores_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX compradores_estado_idx ON public.compradores USING btree (estado);


--
-- Name: compradores_nombre_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX compradores_nombre_idx ON public.compradores USING btree (nombre);


--
-- Name: compras_fecha_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX compras_fecha_idx ON public.compras USING btree (fecha);


--
-- Name: compras_numero_compra_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX compras_numero_compra_key ON public.compras USING btree (numero_compra);


--
-- Name: compras_proveedor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX compras_proveedor_id_idx ON public.compras USING btree (proveedor_id);


--
-- Name: detalle_ventas_lote_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX detalle_ventas_lote_id_key ON public.detalle_ventas USING btree (lote_id);


--
-- Name: detalle_ventas_venta_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX detalle_ventas_venta_id_idx ON public.detalle_ventas USING btree (venta_id);


--
-- Name: lote_leyes_lote_id_catalogo_ley_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX lote_leyes_lote_id_catalogo_ley_id_key ON public.lote_leyes USING btree (lote_id, catalogo_ley_id);


--
-- Name: lote_leyes_lote_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lote_leyes_lote_id_idx ON public.lote_leyes USING btree (lote_id);


--
-- Name: lotes_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lotes_estado_idx ON public.lotes USING btree (estado);


--
-- Name: lotes_fecha_compra_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lotes_fecha_compra_idx ON public.lotes USING btree (fecha_compra);


--
-- Name: lotes_numero_lote_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX lotes_numero_lote_key ON public.lotes USING btree (numero_lote);


--
-- Name: lotes_proveedor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lotes_proveedor_id_idx ON public.lotes USING btree (proveedor_id);


--
-- Name: lotes_tipo_mineral_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lotes_tipo_mineral_idx ON public.lotes USING btree (tipo_mineral);


--
-- Name: proveedores_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX proveedores_codigo_key ON public.proveedores USING btree (codigo);


--
-- Name: proveedores_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX proveedores_estado_idx ON public.proveedores USING btree (estado);


--
-- Name: proveedores_nombre_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX proveedores_nombre_idx ON public.proveedores USING btree (nombre);


--
-- Name: resumen_leyes_venta_venta_id_codigo_ley_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX resumen_leyes_venta_venta_id_codigo_ley_key ON public.resumen_leyes_venta USING btree (venta_id, codigo_ley);


--
-- Name: resumen_leyes_venta_venta_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX resumen_leyes_venta_venta_id_idx ON public.resumen_leyes_venta USING btree (venta_id);


--
-- Name: usuarios_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email);


--
-- Name: usuarios_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usuarios_username_key ON public.usuarios USING btree (username);


--
-- Name: ventas_comprador_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ventas_comprador_id_idx ON public.ventas USING btree (comprador_id);


--
-- Name: ventas_fecha_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ventas_fecha_idx ON public.ventas USING btree (fecha);


--
-- Name: ventas_numero_venta_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ventas_numero_venta_key ON public.ventas USING btree (numero_venta);


--
-- Name: auditoria auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: compras compras_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: compras compras_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalle_ventas detalle_ventas_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_ventas
    ADD CONSTRAINT detalle_ventas_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalle_ventas detalle_ventas_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_ventas
    ADD CONSTRAINT detalle_ventas_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lote_leyes lote_leyes_catalogo_ley_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lote_leyes
    ADD CONSTRAINT lote_leyes_catalogo_ley_id_fkey FOREIGN KEY (catalogo_ley_id) REFERENCES public.catalogo_leyes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lote_leyes lote_leyes_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lote_leyes
    ADD CONSTRAINT lote_leyes_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lotes lotes_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lotes lotes_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lotes lotes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: resumen_leyes_venta resumen_leyes_venta_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumen_leyes_venta
    ADD CONSTRAINT resumen_leyes_venta_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ventas ventas_comprador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES public.compradores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ventas ventas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 5lxwjK6suov1SsQfHKFulaFFDtqbWyNu9YnwZF5Xj18eyu11J7LYNENkeDP0gJJ

