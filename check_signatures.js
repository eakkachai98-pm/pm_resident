import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tickets = await prisma.maintenanceTicket.findMany({
    where: { status: 'RESOLVED' },
    select: { id: true, title: true, residentSignature: true }
  });
  console.log('Resolved Tickets:');
  tickets.forEach(t => {
    console.log(`ID: ${t.id}, Title: ${t.title}`);
    console.log(`Signature: ${t.residentSignature ? t.residentSignature.substring(0, 50) + '...' : 'NONE'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
