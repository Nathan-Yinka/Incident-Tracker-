# Frontend - Incident Tracker UI

React frontend application for the Incident Tracker system.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **React Query** - Server state management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## Prerequisites

- Node.js 20+
- npm or yarn

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Docker

Build and run with Docker:

```bash
docker build -t incident-tracker-frontend .
docker run -p 80:80 incident-tracker-frontend
```

Or use docker-compose from the root directory.

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:3000)

**Important**: For Docker builds, this variable is passed as a build argument to the Dockerfile, so it must be set in `docker-compose.yml` build args or in the root `.env` file that docker-compose reads.

## Project Structure

```
src/
  components/     # Reusable UI components
  pages/          # Page components
  hooks/          # Custom React hooks
  services/       # API services
  types/          # TypeScript types
```

## Features

- JWT-based authentication
- Incident management (CRUD)
- Draft auto-save
- Real-time notifications
- Admin dashboard
- Responsive design

## Development

The app runs on `http://localhost:5173` in development mode.

Hot module replacement (HMR) is enabled for fast development.

