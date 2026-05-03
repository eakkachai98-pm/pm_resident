import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find a technician (STAFF)
  const staff = await prisma.user.findFirst({
    where: { role: 'STAFF' }
  });

  if (!staff) {
    console.log('No STAFF user found to assign the ticket to.');
    return;
  }

  // Find a resident (Reporter)
  let resident = await prisma.user.findFirst({
    where: { role: 'RESIDENT' }
  });

  if (!resident) {
    resident = staff;
  }

  // Find a room (let's just pick the first room to make sure it's the same)
  let room = await prisma.room.findFirst();

  if (!room) {
    console.log('No rooms found. Please run your main seed script first.');
    return;
  }

  console.log(`Setting up test history for Room ${room.roomNumber}...`);

  // Delete old test history tickets
  await prisma.maintenanceTicket.deleteMany({
    where: { title: { contains: '[History Test]' } }
  });

  // Calculate dates
  const today = new Date();
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(today.getDate() - 5);
  
  const twentyDaysAgo = new Date(today);
  twentyDaysAgo.setDate(today.getDate() - 20);

  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setDate(today.getDate() - 60);

  // 1. Create a Resolved Ticket 20 days ago (Same Category: Water)
  await prisma.maintenanceTicket.create({
    data: {
      title: '[History Test] ท่อน้ำซึมจุดแรก',
      description: 'ท่อน้ำซึม มีหยดน้ำไหลลงพื้น',
      category: 'Water',
      status: 'RESOLVED',
      roomId: room.id,
      reporterId: resident.id,
      assigneeId: staff.id,
      resolvedAt: twentyDaysAgo,
      repairNotes: 'เปลี่ยนซีนยางกันรั่วใหม่เรียบร้อย',
    }
  });
  console.log('✅ Created Past Ticket: Water (20 days ago)');

  // 2. Create a Resolved Ticket 60 days ago (Different Category: Electric)
  await prisma.maintenanceTicket.create({
    data: {
      title: '[History Test] หลอดไฟห้องน้ำขาด',
      description: 'ไฟห้องน้ำเปิดไม่ติด',
      category: 'Electric',
      status: 'RESOLVED',
      roomId: room.id,
      reporterId: resident.id,
      assigneeId: staff.id,
      resolvedAt: twoMonthsAgo,
      repairNotes: 'เปลี่ยนหลอด LED 12W ใหม่ 1 หลอด',
    }
  });
  console.log('✅ Created Past Ticket: Electric (60 days ago)');

  // 3. Create a NEW Active Ticket (Same Category: Water) to trigger the warning!
  const newTicket = await prisma.maintenanceTicket.create({
    data: {
      title: '[History Test] ท่อน้ำใต้อ่างล้างหน้าแตก',
      description: 'น้ำรั่วซึมหนักมาก ไหลเจิ่งนองพื้น',
      category: 'Water',
      status: 'IN_PROGRESS', // Give it to the staff immediately
      roomId: room.id,
      reporterId: resident.id,
      assigneeId: staff.id,
      scheduledDate: today.toISOString().split('T')[0],
      scheduledSlot: 'Morning'
    }
  });
  console.log('🚨 Created NEW Active Ticket: Water (Triggering Warning)');

  console.log('\n=============================================');
  console.log('TEST DATA CREATED SUCCESSFULLY!');
  console.log('Login as Technician:', staff.email);
  console.log('Click on the task: "[History Test] ท่อน้ำใต้อ่างล้างหน้าแตก"');
  console.log('You should see:');
  console.log('1. A yellow warning banner saying the room had a plumbing issue recently.');
  console.log('2. The Room badge should be clickable.');
  console.log('3. Clicking the Room badge should reveal the timeline with 2 past jobs.');
  console.log('=============================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
