import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing old data...');
  // WARNING: Delete order matters due to foreign keys
  await prisma.invoice.deleteMany({});
  await prisma.meterReading.deleteMany({});
  await prisma.maintenanceTicket.deleteMany({});
  await prisma.lease.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding Users...');
  
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@residentsoft.com',
      password: 'password123',
      role: 'ADMIN',
      phone: '081-111-1111'
    }
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Maintenance Staff',
      email: 'staff@residentsoft.com',
      password: 'password123',
      role: 'STAFF',
      phone: '082-222-2222'
    }
  });

  const resident = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'resident@residentsoft.com',
      password: 'password123',
      role: 'RESIDENT',
      phone: '083-333-3333'
    }
  });

  console.log('Seeding Rooms...');
  
  const roomsData = [];

  // Floor 1: 3 Commercial Rooms (101-103)
  for (let i = 1; i <= 3; i++) {
    const roomNumber = `10${i}`;
    roomsData.push({
      roomNumber,
      floor: 1,
      roomType: 'Commercial',
      price: 15000,
      status: 'AVAILABLE'
    });
  }

  // Floor 2 to 7: 20 Standard Rooms per floor
  for (let floor = 2; floor <= 7; floor++) {
    for (let i = 1; i <= 20; i++) {
      const formattedNum = i < 10 ? `0${i}` : `${i}`;
      const roomNumber = `${floor}${formattedNum}`;
      roomsData.push({
        roomNumber,
        floor: floor,
        roomType: 'Standard',
        price: 5000,
        status: 'AVAILABLE'
      });
    }
  }

  // Insert all 123 rooms
  await prisma.room.createMany({
    data: roomsData
  });

  console.log(`Created ${roomsData.length} rooms successfully!`);

  // Create an example lease for the 'resident' user in room 201
  const room201 = await prisma.room.findUnique({ where: { roomNumber: '201' } });
  
  if (room201) {
    console.log('Seeding example lease for Room 201...');
    // Update room status
    await prisma.room.update({
      where: { id: room201.id },
      data: { status: 'OCCUPIED' }
    });

    // Create Lease
    await prisma.lease.create({
      data: {
        roomId: room201.id,
        tenantId: resident.id,
        startDate: new Date(),
        depositAmount: 10000,
        isActive: true
      }
    });
  }

  console.log('Seeding finished successfully.');
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
