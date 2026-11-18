# ODOP Nexus Backend

Express.js backend API for the ODOP Nexus marketplace.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in the values in .env

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start
```

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status, timestamp, and environment.

## Architecture

```
Route → Middleware → Controller → Service → Supabase
```

## Environment Variables

See `.env.example` for all required variables.
