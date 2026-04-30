import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Metadata and Initial Data...');

  // 1. Seed Categories
  const categories = ['Laptop', 'Monitor', 'Phone', 'Server', 'Peripheral'];
  for (const name of categories) {
    await prisma.assetCategory.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  // 2. Seed Departments
  const departments = ['Engineering', 'Design', 'Marketing', 'Operations', 'Human Resources'];
  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  // 3. Personnel
  await prisma.personnel.upsert({
    where: { email: 'alex.r@primus.pro' },
    update: { userRole: 'admin' },
    create: {
      id: 'P-001',
      name: 'Alex Rivera',
      role: 'Senior Designer',
      department: 'Design',
      email: 'alex.r@primus.pro',
      avatar: 'https://picsum.photos/seed/alex/100/100',
      password: 'password123',
      userRole: 'admin',
      joinedDate: new Date('2022-03-12')
    },
  });

  // 4. Sample Notifications
  const notifications = [
    {
      userId: 'P-001',
      title: 'New Urgent Ticket',
      message: 'A new urgent ticket has been created for Asset MBP-2023-084.',
      type: 'ticket',
      priority: 'High',
      link: '/tickets',
      isRead: false
    },
    {
      userId: 'P-001',
      title: 'Asset Assigned',
      message: 'You have been assigned a new asset: Dell UltraSharp 27.',
      type: 'asset',
      priority: 'Medium',
      link: '/inventory',
      isRead: true
    },
    {
      userId: 'P-001',
      title: 'System Update',
      message: 'The inventory system will be down for maintenance at 2:00 AM.',
      type: 'system',
      priority: 'Low',
      isRead: false
    }
  ];

  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
