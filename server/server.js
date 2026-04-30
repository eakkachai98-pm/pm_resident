import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const app = express();
const PORT = 5000;

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- AUTH ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      const isPlaintextMatch = password === user.password;
      
      if (isMatch || isPlaintextMatch) {
        if (isPlaintextMatch && !isMatch) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json({
          ...userWithoutPassword,
          userRole: userWithoutPassword.role === 'RESIDENT' ? 'user' : userWithoutPassword.role.toLowerCase() // map 'ADMIN' to 'admin' for frontend compatibility
        });
        return;
      }
    }
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- ROOMS ---
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        leases: {
          where: { isActive: true },
          include: { tenant: true }
        }
      },
      orderBy: { roomNumber: 'asc' }
    });
    // Format for frontend compatibility initially
    res.json(rooms.map(r => ({
      id: r.id,
      name: `Room ${r.roomNumber}`,
      type: r.roomType,
      status: r.status === 'AVAILABLE' ? 'Active' : (r.status === 'OCCUPIED' ? 'Assigned' : 'In Maintenance'),
      location: `Floor ${r.floor}`,
      price: r.price,
      assignedUser: r.leases.length > 0 ? {
        name: r.leases[0].tenant.name,
        role: r.leases[0].tenant.role
      } : { name: 'Unoccupied', role: '' }
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/rooms/:id/status', async (req, res) => {
  try {
    const updated = await prisma.room.update({
      where: { id: req.params.id },
      data: { status: req.body.status } // 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- USERS (Tenants/Staff/Admin) ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { leases: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- LEASES ---
app.get('/api/leases', async (req, res) => {
  try {
    const leases = await prisma.lease.findMany({ include: { room: true, tenant: true }});
    res.json(leases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- INVOICES (Billing) ---
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({ include: { lease: { include: { room: true, tenant: true } } }});
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- MAINTENANCE TICKETS ---
app.get('/api/maintenance', async (req, res) => {
  try {
    const tickets = await prisma.maintenanceTicket.findMany({ include: { room: true, reporter: true, assignee: true } });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/maintenance', async (req, res) => {
  try {
    const { roomId, reporterId, title, description, category, scheduledDate, scheduledSlot } = req.body;
    const newTicket = await prisma.maintenanceTicket.create({
      data: { roomId, reporterId, title, description, category, scheduledDate, scheduledSlot }
    });
    await prisma.room.update({ where: { id: roomId }, data: { status: 'MAINTENANCE' } });
    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/maintenance/:id', async (req, res) => {
  try {
    const { status, assigneeId, repairNotes, repairImage, rating, feedback } = req.body;
    const data = {};
    if (status) data.status = status;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;
    if (repairNotes !== undefined) data.repairNotes = repairNotes;
    if (repairImage !== undefined) data.repairImage = repairImage;
    if (rating !== undefined) data.rating = rating;
    if (feedback !== undefined) data.feedback = feedback;
    
    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
    } else if (status) {
      data.resolvedAt = null;
    }
    const updated = await prisma.maintenanceTicket.update({
      where: { id: req.params.id },
      data
    });
    if (status === 'RESOLVED') {
      await prisma.room.update({ where: { id: updated.roomId }, data: { status: 'AVAILABLE' } });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/maintenance/:id/rate', async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const updated = await prisma.maintenanceTicket.update({
      where: { id: req.params.id },
      data: { rating, feedback }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- METER & USAGE (IoT Mock) ---
app.get('/api/meters/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    // Get historical monthly data
    const history = await prisma.meterReading.findMany({
      where: { roomId },
      orderBy: { billingMonth: 'asc' },
      take: 6
    });
    
    // Mock Real-time data
    const realtime = {
      electric: {
        currentPower: (Math.random() * 2 + 0.5).toFixed(2), // kW
        todayUsage: (Math.random() * 10 + 2).toFixed(1), // kWh
        status: 'Online'
      },
      water: {
        currentFlow: (Math.random() * 5).toFixed(1), // L/min
        todayUsage: (Math.random() * 200 + 50).toFixed(0), // Liters
        status: 'Online'
      }
    };
    
    res.json({ history, realtime });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to simulate webhook saving monthly data to DB
app.post('/api/meters/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { billingMonth, waterMeter, electricMeter } = req.body;
    
    const newReading = await prisma.meterReading.create({
      data: {
        roomId,
        billingMonth,
        waterMeter: parseFloat(waterMeter),
        electricMeter: parseFloat(electricMeter)
      }
    });
    res.status(201).json(newReading);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- ANALYTICS & ACTIVITIES ---
app.get('/api/analytics', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany();
    const invoices = await prisma.invoice.findMany();
    const tickets = await prisma.maintenanceTicket.findMany();

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
    const availableRooms = rooms.filter(r => r.status === 'AVAILABLE').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'MAINTENANCE').length;
    
    const pendingInvoices = invoices.filter(i => i.status !== 'PAID').length;
    
    // Revenue Data (Group by month)
    const revenueMap = {};
    invoices.forEach(inv => {
      if (inv.status === 'PAID') {
        revenueMap[inv.billingMonth] = (revenueMap[inv.billingMonth] || 0) + inv.totalAmount;
      }
    });
    const revenueData = Object.keys(revenueMap).sort().slice(-6).map(month => ({
      name: month,
      value: revenueMap[month]
    }));

    // Ticket Status Data
    const ticketData = [
      { name: 'Open', value: tickets.filter(t => t.status === 'OPEN').length },
      { name: 'In Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS').length },
      { name: 'Resolved', value: tickets.filter(t => t.status === 'RESOLVED').length }
    ];

    res.json({
      summary: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        pendingInvoices
      },
      revenueData: revenueData.length > 0 ? revenueData : [{ name: 'No Data', value: 0 }],
      ticketData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const tickets = await prisma.maintenanceTicket.findMany({ 
      include: { reporter: true, room: true },
      orderBy: { createdAt: 'desc' },
      take: 25
    });
    const invoices = await prisma.invoice.findMany({
      include: { lease: { include: { tenant: true, room: true } } },
      orderBy: { createdAt: 'desc' },
      take: 25
    });

    const activities = [
      ...tickets.map(t => ({
        id: `T-${t.id}`,
        assetId: t.room.roomNumber,
        description: `Maintenance Ticket: ${t.title} (${t.status})`,
        user: t.reporter.name,
        time: t.createdAt
      })),
      ...invoices.map(i => ({
        id: `I-${i.id}`,
        assetId: i.lease.room.roomNumber,
        description: `Invoice for ${i.billingMonth} - ฿${i.totalAmount} (${i.status})`,
        user: i.lease.tenant.name,
        time: i.createdAt
      }))
    ].sort((a, b) => b.time - a.time).slice(0, 50);

    // Format time for frontend
    res.json(activities.map(a => ({
      ...a,
      time: new Date(a.time).toLocaleString()
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TEMPORARY FALLBACK ROUTES FOR FRONTEND COMPATIBILITY DURING MIGRATION
app.get('/api/assets', (req, res) => res.redirect('/api/rooms'));
app.get('/api/personnel', (req, res) => res.redirect('/api/users'));
app.get('/api/tickets', (req, res) => res.redirect('/api/maintenance'));
app.get('/api/notifications/:id', (req, res) => res.json([])); // Disable notifications temp
app.get('/api/tasks', (req, res) => res.json([]));

app.listen(PORT, () => console.log(`Resident soft Backend running on http://localhost:${PORT}`));
