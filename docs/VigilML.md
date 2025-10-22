# VigilML

VigilML is the pipeline and algorithm that uses embeddings and statistical algorithms
to group symptom reports into clusters based on symptoms, location and time.

## Pipeline

The user reports their symptoms on the mobile app, which sends a request to the **VigilML** gRPC server.
The plain text is parsed using an AI model to get a symptom dictionary with format `{ "symptom": intensity }` where $1 \leq \text{intensity} \leq 3$, and a probable inferred cause.
A summary is generated based on the symptoms, mapping intensity to the adjectives `mild`, `moderate` and `severe`. For example, `severe fever, severe muscle pain: dengue fever`.
An embedding is then generated from the symptom summary, which finishes the process of generating a symptom report. The data is stored in a row on the PostgreSQL database.

**VigilML** fetches the relevant symptom reports from the database when processing the actual clusters.
The processing is done by `cluster_reports()`, which uses the DBSCAN algorithm to cluster the reports based on the feature matrix, or rather, a list of feature vectors describing each report.
Whenever clustering is done, clusters are matched with old ones by `match_clusters()`, which associates them and enables the visualization of a cluster's evolution.
Then, a new cluster snapshot is taking by `compute_snapshot()`.

## Database

The database leverages several extensions for processing.
Functions are implemented as Supabase RPCs in SQL.

### Extensions

The following PostgreSQL extensions are enabled:

- `pgvector`: Stores and queries 768-dimensional symptom embeddings.
- `PostGIS`: Handles geospatial data (points, projections to UTM).
- `earthdistance`: Calculates geodesic distances between lat/lon points.

### Schemas

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS earthdistance;
```

#### `reports`

Stores individual symptom reports with spatial, symptomatic, and temporal data.

```sql
CREATE TABLE public.reports (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  lat numeric NOT NULL,
  lon numeric NOT NULL,
  symptoms jsonb NOT NULL,
  notes text,
  cause text,
  embedding USER-DEFINED,
  geom USER-DEFINED DEFAULT st_setsrid(st_makepoint((lon)::double precision, (lat)::double precision), 4326),
  cluster_id text,
  summary text,
  CONSTRAINT reports_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_reports_geom ON reports USING GIST (geom);
CREATE INDEX idx_reports_timestamp ON reports (timestamp);
CREATE INDEX idx_reports_embedding ON reports USING hnsw (embedding vector_cosine_ops);
```

- **Columns**

  - `id`: Unique report identifier (64-bit BIGINT, auto-incrementing via BIGSERIAL).
  - `user_id`: Identifier for the user submitting the report.
  - `lat`, `lon`: Latitude and longitude (degrees).
  - `geom`: Generated PostGIS point (SRID 4326) from lon and lat.
  - `symptoms`: JSONB object, e.g., {"fever": 3, "cough": 1} (intensities: 1=mild, 2=medium, 3=severe).
  - `cause`: Reported cause (e.g., "flu").
  - `timestamp`: Report submission time (default: current time).
  - `embedding`: 768-dimensional vector (pgvector) from symptom string (e.g., "mild cough, severe fever").
  - `cluster_id`: UUID linking the report to a cluster for evolution tracking.

- **Indexes**

  - `GIST` on `geom`: Optimizes geospatial queries.
  - `timestamp`: Speeds up time-based filtering.
  - `hnsw` on `embedding`: Enables fast cosine similarity searches.

#### `cluser_snapshots`

Stores cluster snapshots to facilitate cluster evolution and tracking.

```sql
CREATE TABLE cluster_snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    time_window_start TIMESTAMPTZ,
    time_window_end TIMESTAMPTZ,
    cluster_id UUID,
    temp_label INT,
    centroid GEOMETRY(Point, 4326),
    avg_embedding VECTOR(768),
    report_count INT,
    common_symptoms JSONB,
    report_ids BIGINT[]
);
```

## Visualization

The Jupyter notebook includes functions for plotting the feature vectors, and plotting snapshots into map sections.
