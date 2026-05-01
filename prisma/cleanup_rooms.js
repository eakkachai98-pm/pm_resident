import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const rooms = await prisma.room.findMany();
  
  // "เดิม" (Old) rooms from seed.js are just numbers like '101', '102'.
  // We will delete rooms that don't start with 'R' and are just numbers.
  // Wait, if we want to delete EVERYTHING that doesn't start with 'R', we can do !r.roomNumber.startsWith('R')
  // But let's safely target the old seeded rooms which are purely numeric:
  const toDelete = rooms.filter(r => /^\d+$/.test(r.roomNumber));
  
  const roomIds = toDelete.map(r => r.id);

  console.log(`Found ${roomIds.length} old rooms to delete (e.g. 101, 201).`);

  if (roomIds.length > 0) {
    // 1. Delete Invoices related to Leases in these rooms
    const leases = await prisma.lease.findMany({ where: { roomId: { in: roomIds } } });
    const leaseIds = leases.map(l => l.id);
    await prisma.invoice.deleteMany({ where: { leaseId: { in: leaseIds } } });
    
    // 2. Delete Leases
    await prisma.lease.deleteMany({ where: { roomId: { in: roomIds } } });
    
    // 3. Delete MeterReadings
    await prisma.meterReading.deleteMany({ where: { roomId: { in: roomIds } } });
    
    // 4. Delete MaintenanceTickets
    await prisma.maintenanceTicket.deleteMany({ where: { roomId: { in: roomIds } } });
    
    // 5. Delete the Rooms
    const deleteResult = await prisma.room.deleteMany({ where: { id: { in: roomIds } } });
    console.log(`Successfully deleted ${deleteResult.count} rooms.`);
  }

  console.log('Cleanup completed!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
