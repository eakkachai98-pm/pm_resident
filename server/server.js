import express from 'express';
// trigger restart
import cors from 'cors';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { notifyTicketCreated, notifyTicketStatusUpdate } from './notifications.js';

const app = express();
const PORT = 5000;

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const DEFAULT_WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const SLOT_CAPACITY = 3;
const WEEKDAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseWorkingDays(rawWorkingDays) {
  if (Array.isArray(rawWorkingDays)) {
    return [...new Set(rawWorkingDays.filter((day) => WEEKDAY_CODES.includes(day)))];
  }

  if (typeof rawWorkingDays === 'string') {
    try {
      return parseWorkingDays(JSON.parse(rawWorkingDays));
    } catch (error) {
      return [];
    }
  }

  return [];
}

function normalizeWorkingDays(rawWorkingDays) {
  if (rawWorkingDays === undefined || rawWorkingDays === null) {
    return [...DEFAULT_WORKING_DAYS];
  }

  return parseWorkingDays(rawWorkingDays);
}

function getDayCodeFromDateString(dateString) {
  const [year, month, day] = `${dateString}`.split('-').map(Number);
  return WEEKDAY_CODES[new Date(year, month - 1, day).getDay()];
}

function doesBlockSlotMatch(blockType, slot) {
  return blockType === 'Full Day' || blockType === slot;
}

function isTechnicianAvailableForSlot(technician, dateString, slot) {
  const workingDays = normalizeWorkingDays(technician.workingDays);

  if (!workingDays.includes(getDayCodeFromDateString(dateString))) {
    return false;
  }

  return !technician.blockedSlots.some(
    (blockedSlot) => blockedSlot.date === dateString && doesBlockSlotMatch(blockedSlot.type, slot)
  );
}

async function getTechnicianAvailabilitySnapshot() {
  const technicians = await prisma.user.findMany({
    where: { role: 'STAFF' },
    orderBy: { name: 'asc' },
    include: {
      technicianAvailability: true,
      technicianBlockedSlots: {
        orderBy: [{ date: 'asc' }, { type: 'asc' }]
      }
    }
  });

  return technicians.map((technician) => ({
    staffId: technician.id,
    staffName: technician.name,
    workingDays: technician.technicianAvailability
      ? normalizeWorkingDays(technician.technicianAvailability.workingDays)
      : [...DEFAULT_WORKING_DAYS],
    blockedSlots: technician.technicianBlockedSlots.map((blockedSlot) => ({
      id: blockedSlot.id,
      staffId: blockedSlot.staffId,
      date: blockedSlot.date,
      type: blockedSlot.type,
      reason: blockedSlot.reason
    })),
    updatedAt: technician.technicianAvailability?.updatedAt ?? null
  }));
}

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

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        leases: {
          where: { isActive: true },
          include: { tenant: true }
        }
      }
    });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/rooms/:id/tickets', async (req, res) => {
  try {
    const { id } = req.params;
    const tickets = await prisma.maintenanceTicket.findMany({
      where: { roomId: id },
      include: { reporter: true, assignee: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
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
      include: { leases: { include: { room: true } } }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/tenants', async (req, res) => {
  try {
    const { name, email, phone, roomId, startDate, nationality, identityNumber, preferredLanguage, emergencyContact, visaExpiryDate, tm30Reported } = req.body;
    
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status !== 'AVAILABLE') return res.status(400).json({ message: 'Room is already occupied or in maintenance' });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { 
          name, email, phone, role: 'RESIDENT', password: 'password123',
          nationality: nationality || 'Thai',
          identityNumber: identityNumber || null,
          preferredLanguage: preferredLanguage || 'th',
          emergencyContact: emergencyContact || null,
          visaExpiryDate: visaExpiryDate ? new Date(visaExpiryDate) : null,
          tm30Reported: tm30Reported || false
        }
      });
    }

    const lease = await prisma.lease.create({
      data: {
        roomId,
        tenantId: user.id,
        startDate: new Date(startDate || Date.now()),
        isActive: true
      }
    });

    await prisma.room.update({ where: { id: roomId }, data: { status: 'OCCUPIED' } });
    res.status(201).json({ user, lease });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, nationality, identityNumber, preferredLanguage, emergencyContact, visaExpiryDate, tm30Reported, roomId, startDate } = req.body;
    
    // 1. Update user info
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name, email, phone, nationality, identityNumber, preferredLanguage, emergencyContact,
        visaExpiryDate: visaExpiryDate ? new Date(visaExpiryDate) : null,
        tm30Reported
      }
    });

    // 2. Handle room/lease change if provided
    if (roomId || startDate) {
      const activeLease = await prisma.lease.findFirst({
        where: { tenantId: id, isActive: true },
        include: { room: true }
      });

      if (activeLease) {
        // Room transfer
        if (roomId && activeLease.roomId !== roomId) {
          const newRoom = await prisma.room.findUnique({ where: { id: roomId } });
          if (!newRoom || newRoom.status !== 'AVAILABLE') {
            return res.status(400).json({ message: 'Target room is not available.' });
          }
          
          // Terminate old lease
          const transferDate = startDate ? new Date(startDate) : new Date();
          await prisma.lease.update({
            where: { id: activeLease.id },
            data: { isActive: false, endDate: transferDate }
          });

          // Save final meters for old room
          const fWater = req.body.finalWaterMeter;
          const fElec = req.body.finalElectricMeter;
          if (fWater !== undefined || fElec !== undefined) {
            await prisma.meterReading.create({
              data: {
                roomId: activeLease.roomId,
                readingDate: transferDate,
                waterMeter: fWater ? parseFloat(fWater) : 0,
                electricMeter: fElec ? parseFloat(fElec) : 0,
                status: 'Unbilled',
                notes: 'Auto-generated: Final reading for Room Transfer'
              }
            });
          }

          // Free old room
          await prisma.room.update({ where: { id: activeLease.roomId }, data: { status: 'AVAILABLE' } });
          // Occupy new room
          await prisma.room.update({ where: { id: roomId }, data: { status: 'OCCUPIED' } });

          // Create new lease
          await prisma.lease.create({
            data: {
              roomId: roomId,
              tenantId: id,
              startDate: transferDate,
              isActive: true
            }
          });
        } else if (startDate) {
          // Just update start date of current lease
          await prisma.lease.update({
            where: { id: activeLease.id },
            data: { startDate: new Date(startDate) }
          });
        }
      }
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- LEASES & DOCUMENTS ---
app.get('/api/leases', async (req, res) => {
  try {
    const leases = await prisma.lease.findMany({ include: { room: true, tenant: true }});
    res.json(leases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/leases/:id/terminate', async (req, res) => {
  try {
    const leaseId = req.params.id;
    const { endDate, finalWaterMeter, finalElectricMeter } = req.body;
    
    const lease = await prisma.lease.findUnique({ where: { id: leaseId } });
    if (!lease) return res.status(404).json({ message: 'Lease not found' });

    // Update lease to inactive
    await prisma.lease.update({
      where: { id: leaseId },
      data: { isActive: false, endDate: new Date(endDate || Date.now()) }
    });

    // Update room back to available
    await prisma.room.update({
      where: { id: lease.roomId },
      data: { status: 'AVAILABLE' }
    });

    // Save final meter readings if provided
    if (finalWaterMeter !== undefined && finalElectricMeter !== undefined) {
      const dateObj = new Date(endDate || Date.now());
      const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      await prisma.meterReading.create({
        data: {
          roomId: lease.roomId,
          billingMonth: `${monthStr}-Final`,
          waterMeter: parseFloat(finalWaterMeter),
          electricMeter: parseFloat(finalElectricMeter)
        }
      });
    }

    res.json({ message: 'Lease terminated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/tenants/:id/documents', async (req, res) => {
  try {
    const docs = await prisma.tenantDocument.findMany({
      where: { tenantId: req.params.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, type: true, size: true, createdAt: true } // Exclude fileData to save bandwidth
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/documents/:id/download', async (req, res) => {
  try {
    const doc = await prisma.tenantDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json({ fileData: doc.fileData, name: doc.name, type: doc.type });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/tenants/:id/documents', async (req, res) => {
  try {
    const { name, type, size, fileData } = req.body;
    const newDoc = await prisma.tenantDocument.create({
      data: {
        tenantId: req.params.id,
        name,
        type,
        size,
        fileData
      }
    });
    res.status(201).json({ id: newDoc.id, name: newDoc.name, type: newDoc.type, size: newDoc.size, createdAt: newDoc.createdAt });
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

// --- METERS (IoT Data) ---
app.get('/api/meters/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { admin } = req.query; // If admin=true, show all history
    
    // Find active lease to know since when to show data
    const activeLease = await prisma.lease.findFirst({
      where: { roomId, isActive: true },
      orderBy: { startDate: 'desc' }
    });

    let history = [];
    if (admin === 'true') {
      // Admin sees everything
      history = await prisma.meterReading.findMany({
        where: { roomId },
        orderBy: { billingMonth: 'asc' }
      });
    } else if (activeLease) {
      // Get only meter readings since lease started (so new tenants don't see old history)
      history = await prisma.meterReading.findMany({
        where: {
          roomId,
          createdAt: { gte: activeLease.startDate }
        },
        orderBy: { billingMonth: 'asc' }
      });
    }

    res.json({
      realtime: {
        electric: { currentPower: (Math.random() * 2 + 1).toFixed(2) }, // Mock real-time
        water: { currentFlow: (Math.random() > 0.8 ? (Math.random() * 5).toFixed(1) : '0.0') } // Mock real-time
      },
      history
    });
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

    if (scheduledDate && !scheduledSlot) {
      res.status(400).json({ message: 'Please select a time slot for the requested date.' });
      return;
    }

    if (scheduledDate && scheduledSlot) {
      const availabilitySnapshot = await getTechnicianAvailabilitySnapshot();
      const techniciansAvailable = availabilitySnapshot.filter((technician) =>
        isTechnicianAvailableForSlot(technician, scheduledDate, scheduledSlot)
      );
      const slotCapacity = techniciansAvailable.length * SLOT_CAPACITY;

      if (availabilitySnapshot.length > 0 && techniciansAvailable.length === 0) {
        res.status(400).json({ message: 'No technician is available for the selected date and slot.' });
        return;
      }

      const existingBookings = await prisma.maintenanceTicket.count({
        where: {
          scheduledDate,
          scheduledSlot
        }
      });

      if (existingBookings >= (availabilitySnapshot.length > 0 ? slotCapacity : SLOT_CAPACITY)) {
        res.status(400).json({ message: 'This slot is already full. Please choose another time.' });
        return;
      }
    }

    const newTicket = await prisma.maintenanceTicket.create({
      data: { roomId, reporterId, title, description, category, scheduledDate, scheduledSlot },
      include: { reporter: true, room: true }
    });
    await prisma.room.update({ where: { id: roomId }, data: { status: 'MAINTENANCE' } });
    
    // Trigger Email Notification asynchronously
    notifyTicketCreated(newTicket, newTicket.reporter, newTicket.room).catch(console.error);

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/maintenance/:id', async (req, res) => {
  try {
    const { status, assigneeId, repairNotes, repairImage, residentSignature, rating, feedback } = req.body;
    const data = {};
    if (status) data.status = status;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;
    if (repairNotes !== undefined) data.repairNotes = repairNotes;
    if (repairImage !== undefined) data.repairImage = repairImage;
    if (residentSignature !== undefined) data.residentSignature = residentSignature;
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
    
    // Trigger Email Notification
    if (status) {
      notifyTicketStatusUpdate(updated.id).catch(console.error);
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

// --- TECHNICIAN AVAILABILITY ---
app.get('/api/technician/availability', async (req, res) => {
  try {
    const availabilitySnapshot = await getTechnicianAvailabilitySnapshot();
    res.json(availabilitySnapshot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/technician/availability', async (req, res) => {
  try {
    const { staffId, workingDays } = req.body;

    if (!staffId) {
      res.status(400).json({ message: 'staffId is required.' });
      return;
    }

    const technician = await prisma.user.findFirst({
      where: {
        id: staffId,
        role: 'STAFF'
      }
    });

    if (!technician) {
      res.status(404).json({ message: 'Technician not found.' });
      return;
    }

    const sanitizedWorkingDays = parseWorkingDays(workingDays);

    const savedAvailability = await prisma.technicianAvailability.upsert({
      where: { staffId },
      update: {
        workingDays: JSON.stringify(sanitizedWorkingDays)
      },
      create: {
        staffId,
        workingDays: JSON.stringify(sanitizedWorkingDays)
      }
    });

    res.json({
      staffId,
      staffName: technician.name,
      workingDays: normalizeWorkingDays(savedAvailability.workingDays),
      blockedSlots: [],
      updatedAt: savedAvailability.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/technician/blocked-slots', async (req, res) => {
  try {
    const { staffId, date, type, reason } = req.body;

    if (!staffId || !date || !type) {
      res.status(400).json({ message: 'staffId, date, and type are required.' });
      return;
    }

    if (!['Full Day', 'Morning', 'Afternoon'].includes(type)) {
      res.status(400).json({ message: 'Invalid blocked slot type.' });
      return;
    }

    const technician = await prisma.user.findFirst({
      where: {
        id: staffId,
        role: 'STAFF'
      }
    });

    if (!technician) {
      res.status(404).json({ message: 'Technician not found.' });
      return;
    }

    const existingBlocks = await prisma.technicianBlockedSlot.findMany({
      where: {
        staffId,
        date
      }
    });

    const hasConflict = existingBlocks.some((blockedSlot) => {
      if (blockedSlot.type === 'Full Day' || type === 'Full Day') {
        return true;
      }

      return blockedSlot.type === type;
    });

    if (hasConflict) {
      res.status(409).json({ message: 'This blocked slot already exists or overlaps with an existing block.' });
      return;
    }

    const blockedSlot = await prisma.technicianBlockedSlot.create({
      data: {
        staffId,
        date,
        type,
        reason: reason?.trim() || null
      }
    });

    res.status(201).json(blockedSlot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/technician/blocked-slots/:id', async (req, res) => {
  try {
    await prisma.technicianBlockedSlot.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
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
