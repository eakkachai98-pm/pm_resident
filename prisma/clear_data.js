import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearTransactionsOnly() {
  console.log('🧹 [MODE: TRANSACTIONS ONLY] ลบเฉพาะข้อมูลธุรกรรม (เก็บข้อมูลผู้เช่าและห้องพักไว้)...');
  
  // ลบข้อมูลรายวัน/รายเดือน ที่เกิดขึ้นจากการทำงาน
  await prisma.maintenanceTicket.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.technicianBlockedSlot.deleteMany();
  await prisma.technicianAvailability.deleteMany();
  await prisma.tenantDocument.deleteMany();
  
  console.log('✅ ลบข้อมูลแจ้งซ่อม, บิล, ตารางช่าง และเอกสาร เสร็จสิ้น!');
}

async function factoryReset() {
  console.log('🔥 [MODE: FACTORY RESET] ลบข้อมูลทั้งหมดทิ้ง เพื่อเริ่มระบบใหม่...');
  
  // ต้องลบจากตารางลูก (ที่พึ่งพาตารางอื่น) ไปหาตารางแม่ เพื่อหลีกเลี่ยง Foreign Key Constraint Errors
  await prisma.maintenanceTicket.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenantDocument.deleteMany();
  await prisma.technicianBlockedSlot.deleteMany();
  await prisma.technicianAvailability.deleteMany();
  
  // ตารางแม่
  await prisma.room.deleteMany();
  // ไม่ลบ Admin ทิ้ง (เพื่อไม่ให้เข้าสู่ระบบไม่ได้) เลือกลบเฉพาะลูกบ้านและช่าง
  await prisma.user.deleteMany({
    where: {
      role: {
        not: 'ADMIN'
      }
    }
  });

  console.log('✅ FACTORY RESET เสร็จสิ้น! ฐานข้อมูลว่างเปล่า (ยกเว้น Admin)');
  console.log('👉 คุณสามารถรันคำสั่ง "node prisma/import_json.js" เพื่อสร้างข้อมูลตั้งต้นใหม่ได้เลย');
}

async function main() {
  const mode = process.argv[2];

  if (mode === '--transactions') {
    await clearTransactionsOnly();
  } else if (mode === '--factory-reset') {
    await factoryReset();
  } else {
    console.log(`
⚠️ โปรดระบุ Mode ที่ต้องการล้างข้อมูล:

ตัวเลือกที่ 1: ลบเฉพาะข้อมูล Transaction (บิล, แจ้งซ่อม) แต่เก็บผู้เช่าไว้
> node prisma/clear_data.js --transactions

ตัวเลือกที่ 2: ลบข้อมูลทุกอย่างทิ้ง (Factory Reset) ยกเว้น Admin เพื่อจะนำเข้า JSON ใหม่
> node prisma/clear_data.js --factory-reset
    `);
  }
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
