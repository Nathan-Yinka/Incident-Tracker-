# Backend - Incident Tracker API

NestJS backend API for the Incident Tracker application.

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Relational database
- **Prisma ORM** - Database toolkit
- **JWT** - Authentication
- **Winston** - Logging
- **bcrypt** - Password hashing

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- npm or yarn

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup**:
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed database
   npm run prisma:seed
   ```

4. **Start development server**:
   ```bash
   npm run start:dev
   ```

   Or use the startup script (handles dependencies, migrations, admin creation, and build automatically):
   ```bash
   ./start.sh
   ```

## Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply migrations
- `npm run prisma:seed` - Seed the database
- `npm run prisma:studio` - Open Prisma Studio

## Docker

Build and run with Docker:

```bash
docker build -t incident-tracker-backend .
docker run -p 3000:3000 --env-file .env incident-tracker-backend
```

Or use docker-compose from the root directory.

### Startup Script

The backend includes a startup script (`start.sh`) that automates the entire startup process:

1. **Dependency Check**: Installs npm packages if `node_modules` doesn't exist
2. **Prisma Client**: Generates Prisma Client if not already generated
3. **Database Check**: Verifies database connectivity (exits with helpful error if database is not running)
4. **Migrations**: Runs database migrations automatically
5. **Admin User**: Checks if admin user exists (from `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars) and creates it if missing
6. **Build Check**: Automatically builds the application if `dist/src/main.js` doesn't exist
7. **Start Server**: Starts the NestJS backend server

**Usage**:
```bash
./start.sh
```

**Environment Variables Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_EMAIL` (optional) - Email for admin user auto-creation
- `ADMIN_PASSWORD` (optional) - Password for admin user auto-creation

The script works for both local development and Docker environments. It provides clear error messages if prerequisites are missing.

## API Endpoints

All API endpoints are prefixed with `/api`.

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Incidents
- `GET /api/incidents` - List incidents
- `GET /api/incidents/draft` - Get draft
- `POST /api/incidents` - Create incident
- `GET /api/incidents/:id` - Get incident
- `PATCH /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Delete incident (admin only)
- `POST /api/incidents/auto-save` - Auto-save draft
- `GET /api/incidents/:id/audit` - Get audit trail

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/:id/password` - Change password
- `PATCH /api/admin/users/:id/role` - Update role
- `GET /api/admin/audit` - Get all audit logs
- `GET /api/admin/audit/:incidentId` - Get audit by incident

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Health
- `GET /api/health` - Health check

## Environment Variables

See `.env.example` for required environment variables.

## Database Models

See `prisma/schema.prisma` for database schema definitions.

## Architecture

- **Modular Design**: Feature-based modules (auth, incidents, admin, etc.)
- **Base Classes**: `BaseService`, `BaseController`, `BaseGuard` for common functionality
- **Dependency Injection**: NestJS DI container
- **Structured Logging**: Winston logger (no console.log)
- **Error Handling**: Global exception filter with standardized responses

