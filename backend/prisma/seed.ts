import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: 'ADMIN' as any,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      passwordHash: hashedPassword,
      role: 'USER' as any,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      passwordHash: hashedPassword,
      role: 'USER' as any,
    },
  });

  const incident1 = await prisma.incident.create({
    data: {
      title: 'Server Outage',
      description: 'Users reporting inability to access the main application',
      severity: 'HIGH' as any,
      status: 'OPEN' as any,
      userId: user1.id,
      assignedToId: admin.id,
    },
  });

  const incident2 = await prisma.incident.create({
    data: {
      title: 'Database Performance Issue',
      description: 'Slow query response times observed',
      severity: 'MEDIUM' as any,
      status: 'IN_PROGRESS' as any,
      userId: user2.id,
    },
  });

  // Check if draft already exists for user1 before creating
  const existingDraft = await prisma.incident.findFirst({
    where: {
      userId: user1.id,
      isDraft: true,
      status: 'DRAFT',
    },
  });

  let draftIncident;
  if (!existingDraft) {
    draftIncident = await prisma.incident.create({
      data: {
        title: 'Draft Incident',
        description: 'This is a draft incident',
        severity: 'LOW' as any,
        status: 'DRAFT' as any,
        isDraft: true,
        userId: user1.id,
      },
    });
  } else {
    draftIncident = existingDraft;
    console.log('Draft already exists, using existing draft');
  }

  await prisma.auditLog.create({
    data: {
      incidentId: incident1.id,
      userId: user1.id,
      action: 'CREATED',
      newValue: JSON.stringify(incident1) as any,
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      incidentId: incident1.id,
      type: 'INCIDENT_CREATED' as any,
      message: `New incident '${incident1.title}' created by ${user1.email}`,
    },
  });

  console.log('Database seeded successfully');
  console.log('Admin:', admin.email);
  console.log('Users:', user1.email, user2.email);
  console.log('Incidents created:', 3);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
