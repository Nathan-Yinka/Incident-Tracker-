#!/bin/sh

set -e

echo "Starting backend initialization..."

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Installing dependencies..."
  npm install
fi

# Check if Prisma Client is generated, generate if not
if [ ! -d "node_modules/.prisma" ] || [ ! -d "node_modules/@prisma/client" ]; then
  echo "Prisma Client not found. Generating Prisma Client..."
  npx prisma generate
fi

# Check database connectivity
echo "Checking database connection..."
node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  (async () => {
    try {
      await prisma.\$connect();
      console.log('Database connection successful');
      await prisma.\$disconnect();
      process.exit(0);
    } catch (error) {
      console.error('========================================');
      console.error('ERROR: Cannot connect to database!');
      console.error('========================================');
      console.error('');
      console.error('Please ensure the database is running:');
      console.error('');
      console.error('For Docker:');
      console.error('  1. Make sure PostgreSQL service is running in docker-compose');
      console.error('  2. Check: docker-compose ps');
      console.error('  3. Start database: docker-compose up postgres -d');
      console.error('');
      console.error('For local development:');
      console.error('  1. Ensure PostgreSQL is installed and running');
      console.error('  2. Check DATABASE_URL in .env file');
      console.error('  3. Verify PostgreSQL service: pg_isready');
      console.error('');
      console.error('Database URL:', process.env.DATABASE_URL || 'Not set');
      console.error('Error:', error.message);
      console.error('');
      await prisma.\$disconnect();
      process.exit(1);
    }
  })();
" || exit 1

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Check if admin user exists, create if not
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "Checking for admin user: $ADMIN_EMAIL"
  
  # Use Node.js to check and create admin user
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    const prisma = new PrismaClient();
    
    (async () => {
      try {
        const existingAdmin = await prisma.user.findUnique({
          where: { email: process.env.ADMIN_EMAIL }
        });
        
        if (!existingAdmin) {
          console.log('Admin user not found. Creating admin user...');
          const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
          
          await prisma.user.create({
            data: {
              email: process.env.ADMIN_EMAIL,
              passwordHash: passwordHash,
              role: 'ADMIN'
            }
          });
          
          console.log('Admin user created successfully');
        } else {
          console.log('Admin user already exists');
        }
      } catch (error) {
        console.error('Error checking/creating admin user:', error.message);
        process.exit(1);
      } finally {
        await prisma.\$disconnect();
      }
    })();
  "
else
  echo "Warning: ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin user creation."
fi

# Check if application is built, build if not
echo "Checking if application is built..."
MAIN_JS="dist/src/main.js"
if [ ! -f "$MAIN_JS" ]; then
  echo "Application not built. Building now..."
  echo "Running: npm run build"
  
  # Run build and capture output
  if npm run build 2>&1; then
    # Verify build was successful
    if [ ! -f "$MAIN_JS" ]; then
      echo "========================================="
      echo "ERROR: Build failed!"
      echo "========================================="
      echo ""
      echo "The build process did not create $MAIN_JS"
      echo "Please check the build errors above and fix them."
      echo ""
      exit 1
    fi
    echo "Build completed successfully!"
  else
    echo "========================================="
    echo "ERROR: Build failed!"
    echo "========================================="
    echo ""
    echo "The build process encountered errors."
    echo "Please check the build output above for details."
    echo ""
    exit 1
  fi
else
  echo "Application is already built."
fi

# Start the backend server
echo "Starting backend server..."
exec node dist/src/main.js
