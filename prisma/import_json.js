import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting JSON import...');
  const filePath = path.join(__dirname, '../json_ห้องพัก.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const payload = data.payload;

  const defaultPassword = await bcrypt.hash('password123', 10);

  let roomsCreated = 0;
  let usersCreated = 0;
  let leasesCreated = 0;
  let metersCreated = 0;

  for (const item of payload) {
    const roomNumber = item.room_name;
    const ownerName = item.room_owner || `Tenant ${roomNumber}`;
    const rent = parseFloat(item.rent || 0);

    // 1. Create or find Room
    let room = await prisma.room.findFirst({ where: { roomNumber } });
    if (!room) {
      room = await prisma.room.create({
        data: {
          roomNumber,
          floor: parseInt(roomNumber.substring(1, 2)) || 1,
          roomType: 'Standard',
          price: rent,
          status: 'OCCUPIED'
        }
      });
      roomsCreated++;
      console.log(`Created Room: ${roomNumber}`);
    }

    // 2. Create or find User
    const email = `tenant_${roomNumber.toLowerCase()}@residentsoft.com`;
    let user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: ownerName,
          email,
          password: defaultPassword,
          role: 'RESIDENT',
          phone: '',
          nationality: 'Thai',
          preferredLanguage: 'th'
        }
      });
      usersCreated++;
      console.log(`Created User: ${ownerName}`);
    }

    // 3. Process Meter History Map
    const meterMap = new Map(); // key: YYYY-MM
    let earliestDate = new Date('2024-01-01');

    if (item.water?.history) {
      for (const entry of item.water.history) {
        if (!entry.datetime) continue;
        const d = new Date(entry.datetime);
        if (isNaN(d.getTime())) continue;
        
        const yyyy_mm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!meterMap.has(yyyy_mm)) meterMap.set(yyyy_mm, { water: 0, electric: 0, date: d });
        meterMap.get(yyyy_mm).water = parseFloat(entry.value) || 0;
      }
    }

    if (item.electricity?.history) {
      for (const entry of item.electricity.history) {
        if (!entry.datetime) continue;
        const d = new Date(entry.datetime);
        if (isNaN(d.getTime())) continue;
        
        const yyyy_mm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!meterMap.has(yyyy_mm)) meterMap.set(yyyy_mm, { water: 0, electric: 0, date: d });
        meterMap.get(yyyy_mm).electric = parseFloat(entry.value) || 0;
      }
    }

    if (meterMap.size > 0) {
      const dates = Array.from(meterMap.values()).map(v => v.date.getTime()).filter(t => !isNaN(t));
      if (dates.length > 0) {
        earliestDate = new Date(Math.min(...dates));
      }
    }

    if (isNaN(earliestDate.getTime())) {
      earliestDate = new Date('2024-01-01T00:00:00.000Z');
    }

    // 4. Create Lease
    let lease = await prisma.lease.findFirst({
      where: { roomId: room.id, tenantId: user.id }
    });
    
    if (!lease) {
      lease = await prisma.lease.create({
        data: {
          roomId: room.id,
          tenantId: user.id,
          startDate: earliestDate,
          isActive: true
        }
      });
      leasesCreated++;
      console.log(`Created Lease for ${roomNumber}`);
    }

    // 5. Insert Meter Readings to DB
    for (const [billingMonth, values] of meterMap.entries()) {
      const existing = await prisma.meterReading.findFirst({
        where: { roomId: room.id, billingMonth }
      });
      if (!existing) {
        await prisma.meterReading.create({
          data: {
            roomId: room.id,
            billingMonth,
            waterMeter: values.water,
            electricMeter: values.electric,
            createdAt: values.date
          }
        });
        metersCreated++;
      }
    }
  }

  console.log('\n--- Import Summary ---');
  console.log(`Rooms Created: ${roomsCreated}`);
  console.log(`Users Created: ${usersCreated}`);
  console.log(`Leases Created: ${leasesCreated}`);
  console.log(`Meter Readings Created: ${metersCreated}`);
  console.log('Import completed successfully!');
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
