# Vigil Health Monitoring System

## Overview

Vigil is a comprehensive health monitoring system built with a microservices architecture.
The system consists of a React Native mobile app and several backend services orchestrated with Kubernetes and managed via Tilt for development.

## Architecture

```
  ┌────────────────┐       ┌───────────────┐
  │   Mobile App   │       │    Web App    │
  │ (React Native) │       │  (Empty/TBD)  │
  └─────────┬──────┘       └───────┬───────┘
            │                      │
            └──────────┬───────────┘
                       │
                 ┌─────▼─────┐
                 │   Ngrok   │
                 └─────┬─────┘
            ┌──────────▼───────────┐
            │   Gateway Service    │
            │      (Express)       │
            └──────────┬───────────┘
                       │
     ┌─────────────────┼──────────────────┐
     │                 │                  │
┌────▼──────┐    ┌─────▼──────┐    ┌──────▼─────┐
│    ML     │    │   Digest   │    │  Supabase  │
│  Service  │    │  Service   │    │ (Database) │
└───────────┘    └────────────┘    └────────────┘
```

## Repository Structure

```
vigil/
├── apps/
│   ├── mobile/          # React Native Expo app
│   └── web/             # Empty Next.js placeholder
├── services/
│   ├── portal/          # Main API gateway (NestJS)
│   ├── ml/              # Analytics microservice
│   └── digest/          # Report digest service
├── infra/k8s/           # Kubernetes configurations
└── Tiltfile             # Development orchestration
```

## Services

### Gateway Service (`services/gateway/`)

#### Purpose

Main API gateway handling authentication, routing, and core business logic.

#### Tech Stack

- Node.js with Express.js
- TypeScript
- Clerk for authentication
- Supabase for database operations
- TSpec for OpenAPI generation
- Docker containerized

#### Key Features

- User authentication via Clerk
- Symptom reporting API
- Report retrieval and management
- Health check endpoints
- Auto-generated OpenAPI specs via TSpec

#### API Endpoints

- `POST /v1/internal/readings` - Trigger a reading analysis jog.

- `GET /v1/reports` - Get user reports.
- `POST /v1/reports` - Create symptom report.

- `GET /v1/heatmap` - Get the latest reading heatmap.

#### Environment variables

```typescript
// Environment variables required:
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
PORT (default: 3000)
```

#### Database Integration

- Uses Supabase client for database operations
- Type-safe database operations with generated types
- Command: `npm run supabase-gen` generates TypeScript types

### Analytics Service (`services/analytics/`)

#### Purpose

Handles data analytics and insights generation.

#### Tech Stack

- Node.js with Express.js
- TypeScript
- Docker containerized

#### Status

Basic structure implemented, needs full analytics logic

**⚠️ TODO**: Implement analytics algorithms and data processing

## Applications

### Mobile (`apps/mobile/`)

#### Tech Stack

- React Native with Expo (SDK 54);
- TypeScript;
- Expo Router for navigation;
- Clerk for authentication;
- Native fetch for API calls.

#### Key Features

- Clerk authentication integration;
- Symptom reporting interface;
- Reports viewing and management;
- Settings and profile management.

#### Authentication Flow

**⚠️ RECENT FIX**: Authentication redirect loop resolved

- Issue was in `app/_layout.tsx` with conflicting redirect logic
- Fixed by implementing single auth routing point in root layout

#### API Integration

- Uses generated API client from OpenAPI spec
- Base URL configured via environment variables
- Bearer token authentication
- Direct fetch calls (no React Query wrapper)

#### Environment variables

```typescript
EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok.io
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

#### Navigation Structure

```
app/
├── _layout.tsx          # Root layout with auth routing
├── (auth)/
│   ├── _layout.tsx      # Auth layout
│   ├── sign-in.tsx      # Sign in screen
│   └── sign-up.tsx      # Sign up screen
└── (home)/
    ├── _layout.tsx      # Home layout with tabs
    ├── index.tsx        # Reports list
    ├── report.tsx       # Report symptoms
    └── settings.tsx     # User settings
```

### Web Application (`apps/web/`)

**Status**: Empty Next.js application - not implemented

**⚠️ TODO**: Decide on web application requirements and implement

### Development Environment

## Kubernetes Configuration (`k8s/`)

### Components

- `gateway-deployment.yaml` - Gateway service deployment
- `gateway-service.yaml` - Gateway service exposure
- `secrets.yaml` - Environment secrets (base64 encoded)
- `analytics-*.yaml` - Analytics service configs
- `digest-*.yaml` - Digest service configs

### Secrets management

```yaml
# Secrets are base64 encoded in secrets.yaml
CLERK_PUBLISHABLE_KEY: <base64-encoded>
CLERK_SECRET_KEY: <base64-encoded>
SUPABASE_URL: <base64-encoded>
SUPABASE_ANON_KEY: <base64-encoded>
```

**⚠️ SECURITY**: Secrets in version control

- Consider using proper secret management (e.g., Kubernetes secrets, Vault)
- Current setup is for development only

## Tilt Configuration

Development orchestration and hot reloading

### Features

- Automatic Docker builds
- Kubernetes deployment
- Port forwarding
- Live reload for services

### Usage

```bash
tilt up  # Start all services
tilt down  # Stop all services
```

**Services Exposed**:

- Gateway: `localhost:3000`
- Analytics: `localhost:3001`

## Database Schema (Supabase)

The application uses Supabase as the database backend with PostgreSQL.

### Type Generation

```bash
# Generate TypeScript types from Supabase schema on supported services.
npm run supabase-gen
```

## API Documentation

### Authentication

All API endpoints require Bearer token authentication:

```
Authorization: Bearer <clerk-session-token>
```

### OpenAPI Generation

The gateway service uses TSpec to generate OpenAPI specifications:

```bash
npm run openapi-gen  # Generate OpenAPI spec
```

### Endpoints

#### `GET /api/reports`

Get all reports for authenticated user.

**Response**:

```json
{
    "reports": [ ... ]
}
```

#### `POST /api/reports`

Create a new symptom report.

**Request Body**:

```json
{
  "text": "I feel nauseous, with a mild fever and muscle pain."
}
```

**Response**: Created `SymptomReport` object.

## Development Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Kubernetes (minikube/kind/Docker Desktop)
- Tilt
- Supabase account and project

### Getting Started

1. **Clone and Install**:

```bash
git clone <repository>
cd vigil
npm install  # Install root dependencies
```

2. **Setup Mobile App**:

```bash
cd apps/mobile
npm install
```

3. **Setup Services**:

```bash
# Each service
cd services/gateway && npm install
cd services/analytics && npm install
cd services/digest && npm install
```

4. **Configure Supabase**:

   - Create a Supabase project
   - Set up database tables
   - Get your project URL and anon key

5. **Configure Secrets**:

```bash
# Update k8s/secrets.yaml with your values
# Base64 encode your secrets:
echo -n "your-secret" | base64
```

6. **Generate Database Types**:

```bash
cd services/gateway
npm run supabase-gen
```

7. **Start Development Environment**:

```bash
tilt up
```

8. **Run Mobile App**:

```bash
cd apps/mobile
npx expo start
```

## Environment Variables

### Mobile App (`.env`)

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok.io
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Gateway Service

```bash
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
PORT=3000
NODE_ENV=development
```

## Known Issues & TODOs

### 🔧 High Priority

1. **Implement Vectorial Autoregression** (`services/analytics/`)
   - No current trend analysis,
   - **Action**: Implement algorithm to predict cluster evolutions.

### 🔍 Low Priority

1. **API Documentation**

   - TSpec configuration needs refinement
   - **Action**: Improve OpenAPI spec generation and documentation

2. **CI/CD**

   - No automated deployment pipeline
   - **Action**: Set up GitHub Actions or similar

## Production Considerations

### Deployment

- [ ] Configure Supabase production environment
- [ ] Set up production Kubernetes cluster
- [ ] Set up SSL/TLS certificates
- [ ] Implement rate limiting
- [ ] Add request logging and monitoring
- [ ] Configure Supabase RLS policies

### Scaling

- [ ] Database connection pooling with Supabase
- [ ] Service mesh (Istio) for microservices communication
- [ ] Horizontal pod autoscaling
- [ ] Load balancing configuration

### Security

- [ ] Input validation and sanitization
- [ ] SQL injection prevention (via Supabase)
- [ ] Rate limiting per user/IP
- [ ] Security headers configuration
- [ ] Supabase Row Level Security (RLS)
- [ ] Vulnerability scanning

## Supabase Configuration

### Required Tables

```sql
-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  symptoms TEXT[] NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
  notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (TODO)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- Add policies to ensure users can only access their own reports
```

### Type Generation

The gateway service automatically generates TypeScript types from your Supabase schema:

```bash
npm run supabase-gen
```

This creates `src/generated/database.types.ts` with type-safe database operations.

## Contributing

1. Follow TypeScript strict mode
2. Use conventional commits
3. Add tests for new features
4. Update documentation for API changes
5. Ensure Docker builds pass
6. Test authentication flows thoroughly
7. Update Supabase types after schema changes

## License

MIT - Gabriel Spalato Marques - 2025
