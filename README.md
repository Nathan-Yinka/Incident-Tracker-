# Incident Tracker

A production-ready full-stack incident tracking system built with NestJS and React. This application allows teams to log, track, and manage operational incidents such as system outages, delivery failures, or customer complaints.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Assumptions & Trade-offs](#assumptions--trade-offs)
- [Future Improvements](#future-improvements)

## 🛠️ Tech Stack

### Backend
- **Node.js 20+** with **TypeScript**
- **NestJS** - Progressive Node.js framework with modular architecture
- **PostgreSQL 16+** - Relational database
- **Prisma ORM** - Type-safe database access and migrations
- **JWT** - Token-based authentication (`@nestjs/jwt`, `passport-jwt`)
- **Winston** - Structured logging (no console.log)
- **bcrypt** - Password hashing
- **class-validator** & **class-transformer** - DTO validation and transformation
- **Docker** - Containerization

### Frontend
- **React 18+** with **TypeScript**
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **React Query (TanStack Query)** - Server state management and caching
- **Axios** - HTTP client with interceptors
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form state management
- **Docker** - Containerization with Nginx

### DevOps
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Frontend web server and reverse proxy
- **PostgreSQL** - Database service

## ✨ Features

### Core Features
- ✅ **JWT Authentication** - Secure token-based login system
- ✅ **Role-Based Access Control** - ADMIN and USER roles with appropriate permissions
- ✅ **Incident Management** - Full CRUD operations for incidents
- ✅ **Draft Functionality** - Auto-save drafts with single draft per user enforcement
- ✅ **Audit Trail** - Complete logging of all incident changes
- ✅ **Notifications System** - Real-time notifications for incident events
- ✅ **User Management** - Admin can create users and manage passwords/roles
- ✅ **Search & Filtering** - Filter incidents by severity, status, user, and search by title/description
- ✅ **Pagination** - Efficient data loading with pagination support

### Admin Features
- View all incidents across all users
- Create incidents and assign them to users
- Manage users (create, change passwords, update roles)
- View complete audit trail
- Access to all incident audit logs
- Receive notifications when users create incidents

### User Features
- Create and manage own incidents
- Draft auto-save functionality (debounced on input blur)
- View incident audit logs
- Filter and paginate incidents
- Receive notifications when incidents are updated or assigned

## 📦 Prerequisites

- **Docker & Docker Compose** (recommended for easiest setup)
- OR **Node.js 20+** and **PostgreSQL 16+** (for local development)
- **npm** or **yarn** package manager

## 🚀 Quick Start

### Docker (Recommended)

```bash
# 1. Clone or navigate to the project directory

# 2. Set up environment variables
cp backend/.env.example backend/.env    # Backend configuration (required)
# Note: Frontend .env is only needed for local dev (not Docker)
# Docker automatically sets VITE_API_URL in docker-compose.yml build args

# 3. Start all services
docker-compose up --build

# The backend startup script automatically:
# - Checks database connectivity
# - Runs migrations
# - Creates admin user (from ADMIN_EMAIL and ADMIN_PASSWORD in .env)
# - Starts the server

# 4. Seed additional data (optional, for sample incidents and users)
docker-compose exec backend npm run prisma:seed

# 5. Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000/api
# Backend Health Check: http://localhost:3000/ (root URL)
```

### Local Development

See [Setup Instructions](#setup-instructions) below for detailed local setup.

## 🛠️ Setup Instructions

### Backend Setup

**Option 1: Using the startup script (recommended)**:
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration (set ADMIN_EMAIL and ADMIN_PASSWORD)
./start.sh
```

The startup script automatically handles:
- Installing dependencies
- Generating Prisma Client
- Checking database connectivity
- Running migrations
- Creating admin user (if ADMIN_EMAIL and ADMIN_PASSWORD are set)
- Building the application
- Starting the server

**Option 2: Manual setup**:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

### Database Setup

The application uses Prisma for database management. All models are defined in `backend/prisma/schema.prisma`:

- **User** - Authentication and user management (id, email, passwordHash, role)
- **Incident** - Core incident data with draft support (id, title, description, severity, status, isDraft)
- **AuditLog** - Complete audit trail (id, incidentId, userId, action, oldValue, newValue)
- **Notifications** - User notifications (id, userId, incidentId, type, message, isRead)

**Enums**: Role (ADMIN, USER), Severity (LOW, MEDIUM, HIGH), Status (DRAFT, OPEN, IN_PROGRESS, RESOLVED), NotificationType (INCIDENT_CREATED, INCIDENT_UPDATED, INCIDENT_ASSIGNED)

Models are accessed via `PrismaService` throughout the codebase. See `backend/prisma/schema.prisma` for complete schema definitions.

**Quick Setup**:
```bash
cd backend
npm run db:setup
```

This will:
1. Generate Prisma Client
2. Run migrations
3. Seed the database

**Prisma Commands**:
```bash
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Create and apply migration
npm run prisma:seed        # Seed database
npm run prisma:studio      # Open Prisma Studio (database GUI)
```

## 🔧 Environment Variables

**📌 Important**: There are **2 different `.env.example` files** for different purposes:

1. **`backend/.env.example`** → Backend application configuration (required)
   - Contains: Database URL, JWT secret, port, admin credentials, logging config
   - Used by both local development and Docker (via `env_file` in docker-compose.yml)
   - **Required**: Copy to `backend/.env` and configure

2. **`frontend/.env.example`** → Frontend configuration (local development only)
   - Contains: `VITE_API_URL` for local development
   - **Only needed for local development** (when running frontend with `npm run dev`)
   - **NOT used in Docker** - Docker uses build args set directly in `docker-compose.yml`

**How it works:**
- **Docker**: `docker-compose.yml` sets `VITE_API_URL: http://backend:3000` directly as a build argument (no `.env` file needed)
- **Local Dev**: Use `frontend/.env` with `VITE_API_URL="http://localhost:3000"`

### Backend (`.env`)

```env
# Database Configuration
# For local development:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/incident_tracker?schema=public"
# Note: In Docker, DATABASE_URL is automatically set in docker-compose.yml environment section
# You don't need to change this value when using Docker

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="24h"

# Server Configuration
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3001"

# Logging Configuration
LOG_LEVEL="info"
LOG_DIR="./logs"

# Admin User Configuration (auto-created on first start)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="password123"
```

### Frontend (`.env`)

```env
# API Configuration
# IMPORTANT: This file is for LOCAL DEVELOPMENT ONLY
# When using Docker Compose, VITE_API_URL is set automatically via build args
# in docker-compose.yml to use the backend service name: http://backend:3000
#
# For local development (when running backend locally with npm run dev):
VITE_API_URL="http://localhost:3000"
```

**How it works in Docker:**
- `docker-compose.yml` sets `VITE_API_URL: http://backend:3000` directly as a build argument (hardcoded, no `.env` file needed)
- The frontend code detects this and automatically uses a relative URL `/api` instead
- Nginx (in the frontend container) proxies all `/api/*` requests to `http://backend:3000/api/*`
- This allows the browser to make requests to the same origin (`http://localhost:3001/api/*`) which nginx forwards to the backend
- This ensures the frontend works correctly both in Docker (via nginx proxy) and in local development (direct connection)

**Summary:**
- **Docker**: No frontend `.env` file needed - `VITE_API_URL` is set in `docker-compose.yml` build args
- **Local Dev**: Create `frontend/.env` with `VITE_API_URL="http://localhost:3000"`

## 🔐 Default Credentials

**Using startup script**: The admin user is automatically created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file on first startup.

**Using seed script**: After running `npm run prisma:seed`:

- **Admin**: `admin@example.com` / `password123`
- **User 1**: `user1@example.com` / `password123`
- **User 2**: `user2@example.com` / `password123`

## 📝 API Documentation

All endpoints require JWT authentication (except `/api/auth/login`).

Base URL: `http://localhost:3000/api`

### Authentication
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user info (protected)

### Incidents
- `GET /api/incidents` - List user's incidents (with pagination/filtering)
- `GET /api/incidents/draft` - Get user's draft incident
- `POST /api/incidents` - Create new incident
- `GET /api/incidents/:id` - Get incident details
- `PATCH /api/incidents/:id` - Update incident
- `PATCH /api/incidents/:id/assign` - Assign incident to user (admin only)
- `POST /api/incidents/auto-save` - Auto-save draft (debounced on input blur)
- `DELETE /api/incidents/:id` - Delete incident (admin only)
- `DELETE /api/incidents/draft` - Delete user's draft
- `GET /api/incidents/:id/audit` - Get audit trail for incident
- `GET /api/incidents/all` - Get all incidents (admin only)

### Admin
- `GET /api/admin/users` - List all users (with pagination)
- `POST /api/admin/users` - Create new user
- `PATCH /api/admin/users/:id/password` - Change user password
- `PATCH /api/admin/users/:id/role` - Update user role
- `GET /api/admin/audit` - Get all audit logs
- `GET /api/admin/audit/:incidentId` - Get audit for specific incident

### Notifications
- `GET /api/notifications` - Get user's notifications (with pagination)
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Health
- `GET /` - Health check endpoint at root URL (returns status, timestamp, uptime)
- `GET /api/health` - Health check endpoint (same as root)

## 🏗️ Architecture

### Backend Architecture

**Modular Design**: The backend follows NestJS modular architecture with clear separation of concerns:
- Each feature (auth, incidents, users, admin, audit, notifications) is a separate module
- Base classes (`BaseService`, `BaseController`, `BaseGuard`) provide common functionality
- Dependency injection ensures testability and maintainability

**Class-Based Architecture**: All services, controllers, and guards extend base classes for consistency and code reuse.

**Logging Strategy**: Winston logger is used throughout (no console.log). Structured logging with context, levels, and file rotation.

**Error Handling**: Global exception filter provides consistent error responses. Custom exceptions for different error types.

**Security**: 
- JWT-based authentication
- Role-based authorization with guards
- Input validation via DTOs
- Password hashing with bcrypt
- CORS configuration

**Startup Script**: The `start.sh` script automates:
- Dependency installation
- Prisma Client generation
- Database connectivity checks
- Migration execution
- Admin user creation
- Application building
- Server startup

### Frontend Architecture

**Component Structure**: 
- Pages for route-level components
- Reusable UI components (Layout, NotificationsDropdown, ProtectedRoute)
- Custom hooks for business logic (useAuth)

**State Management**:
- React Query for server state and caching
- React Hook Form for form state
- Context API for authentication state

**API Client**: Centralized Axios instance with interceptors for authentication and error handling. Automatically uses relative URLs (`/api`) in Docker (via nginx proxy) and full URLs in local development.

**Nginx Proxy**: The frontend Docker container uses Nginx to serve static files and proxy API requests. All `/api/*` requests are forwarded to the backend service at `http://backend:3000/api/*`.

**Type Safety**: Full TypeScript coverage with no `any` types. All API responses and data structures are typed.

## 🤔 Assumptions & Trade-offs

### Assumptions

1. **Two Roles Only**: ADMIN and USER roles are sufficient for this use case
2. **No User Registration**: Admin creates all users (no self-registration)
3. **JWT in localStorage**: Acceptable for internal tool (not ideal for high-security scenarios)
4. **No Email Verification**: Not needed for internal tool
5. **PostgreSQL Only**: PostgreSQL as primary database (no multi-database support)
6. **One Draft Per User**: Simplifies UX and reduces complexity
7. **Auto-save Debounce**: 2-second debounce on input blur (balance between UX and server load)
8. **Polling for Notifications**: WebSocket would be better but adds infrastructure complexity
9. **Offset-based Pagination**: Cursor-based would scale better but adds complexity
10. **Simple Audit Trail**: Full event sourcing would be more robust but overkill for this use case

### Trade-offs

1. **No Refresh Token Mechanism**: 
   - **Trade-off**: JWT expiration handles session (simpler but less secure for long sessions)
   - **Reason**: Reduces complexity, acceptable for internal tool

2. **Offset-based Pagination**: 
   - **Trade-off**: Cursor-based would scale better but adds complexity
   - **Reason**: Simpler implementation, sufficient for expected data volumes

3. **Simple Audit Trail**: 
   - **Trade-off**: Full event sourcing would be more robust but overkill
   - **Reason**: Current implementation meets requirements without excessive complexity

4. **Polling for Notifications**: 
   - **Trade-off**: WebSocket would be better but adds infrastructure complexity
   - **Reason**: Polling is simpler to implement and maintain

5. **Draft Auto-save is Debounced**: 
   - **Trade-off**: Not real-time, but reduces API calls and server load
   - **Reason**: Balance between UX and server performance

6. **Single Draft Limitation**: 
   - **Trade-off**: Could allow multiple drafts, but complicates UX
   - **Reason**: One draft per user simplifies the user experience

7. **JWT in localStorage**: 
   - **Trade-off**: Less secure than httpOnly cookies, but simpler for SPA
   - **Reason**: Acceptable for internal tool, easier to implement

## 🚀 Future Improvements

Given more time, I would prioritize the following improvements:

### High Priority

1. **Refresh Token Mechanism**: Implement refresh tokens for better security and longer sessions
2. **WebSocket Notifications**: Replace polling with WebSocket for real-time notifications
3. **Unit and Integration Tests**: Comprehensive test coverage for both backend and frontend
4. **Rate Limiting**: Prevent abuse and ensure fair resource usage
5. **Input Sanitization**: Additional security layer for user inputs
6. **Email Notifications**: Send email notifications in addition to in-app notifications

### Medium Priority

7. **Cursor-based Pagination**: Better performance at scale
8. **Advanced Search**: Full-text search capabilities with PostgreSQL
9. **Incident Comments/Notes**: Allow collaboration through comments
10. **File Attachments**: Support file uploads for incident documentation
11. **Multiple Drafts**: Allow users to manage multiple draft incidents
12. **Incident Templates**: Pre-defined templates for common incident types
13. **Bulk Operations**: Bulk assign, bulk status update for incidents
14. **Export Functionality**: CSV and PDF reports for incidents
15. **Dashboard with Analytics**: Charts and metrics for incident management

### Low Priority

16. **Real-time Collaborative Editing**: Multiple users editing incidents simultaneously
17. **SLA Tracking and Alerts**: Track and alert on incident SLAs
18. **Incident Categories/Tags**: Better organization with categories and tags
19. **CI/CD Pipeline**: Automated testing and deployment
20. **Monitoring Integration**: Sentry, DataDog, or similar for error tracking
21. **API Versioning**: Support for multiple API versions for backward compatibility
22. **GraphQL API**: Alternative to REST API for more flexible queries
23. **Mobile App**: React Native or native mobile applications
24. **Internationalization**: Multi-language support
25. **Dark Mode**: UI theme switching

## 🐳 Docker Services

The `docker-compose.yml` includes:

- **PostgreSQL** - Database (port 5432)
- **Backend** - NestJS API (port 3000)
- **Frontend** - React app served by Nginx (port 3001)

All services are connected via a custom Docker network for secure communication.

## 📚 Additional Documentation

- [Backend Documentation](./backend/README.md) - Detailed API documentation, setup, and architecture
- [Frontend Documentation](./frontend/README.md) - UI setup, structure, and features

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚢 Production Deployment

1. Update environment variables for production (especially `JWT_SECRET`, `ADMIN_PASSWORD`, `DATABASE_URL`)
2. Build Docker images: `docker-compose build`
3. Start services: `docker-compose up -d` (detached mode)

**Note**: Migrations and admin user creation are handled automatically by the startup script when the backend container starts.

**Important for Production:**
- Change `JWT_SECRET` to a strong, random value (minimum 32 characters)
- Use strong `ADMIN_PASSWORD`
- Set `NODE_ENV=production` in `backend/.env`
- Use secure database credentials
- Configure proper CORS origins in `backend/.env`

## 📄 License

This project is part of a technical assessment and is not licensed for public use.

