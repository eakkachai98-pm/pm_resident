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
    console.log('No RESIDENT user found. Using STAFF as reporter.');
    resident = staff;
  }

  // Find a room
  let room = await prisma.room.findFirst();

  if (!room) {
    console.log('No rooms found. Please run your main seed script first.');
    return;
  }

  // Delete old test tickets
  await prisma.maintenanceTicket.deleteMany({
    where: { title: 'ท่อน้ำซิงค์ล้างจานรั่วซึม (Test Ticket for Signature)' }
  });

  // Create the ticket
  const ticket = await prisma.maintenanceTicket.create({
    data: {
      title: 'ท่อน้ำซิงค์ล้างจานรั่วซึม (Test Ticket for Signature)',
      description: 'ทดสอบฟีเจอร์ลายเซ็น: ท่อน้ำใต้ซิงค์ในครัวมีน้ำหยดตลอดเวลา รบกวนช่างเข้ามาดูให้หน่อยครับ',
      category: 'Water',
      status: 'IN_PROGRESS',
      roomId: room.id,
      reporterId: resident.id,
      assigneeId: staff.id,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledSlot: 'Morning'
    }
  });

  console.log('Test Ticket created successfully!');
  console.log('Ticket Details:');
  console.log('- Title:', ticket.title);
  console.log('- Assigned To:', staff.name, '(', staff.email, ')');
  console.log('Please log in with the technician account above to see the task and test the signature pad.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
