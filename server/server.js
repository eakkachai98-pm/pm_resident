import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { notifyTicketCreated, notifyTicketStatusUpdate, notifyAssetAssigned } from './notifications.js';

const app = express();
const PORT = 5000;

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

// --- Helper Functions ---

const formatAsset = (asset) => ({
  ...asset,
  assignedUser: asset.assignedTo ? {
    name: asset.assignedTo.name,
    role: asset.assignedTo.role,
    avatar: asset.assignedTo.avatar
  } : { name: 'Unassigned', role: '', avatar: '' }
});

// --- Routes ---

// AUTH
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.personnel.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email }
        ]
      }
    });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      // Fallback for unhashed plain-text passwords in DB during transition
      const isPlaintextMatch = password === user.password;
      
      if (isMatch || isPlaintextMatch) {
        // Automatically hash the plaintext password if it matched via plaintext
        if (isPlaintextMatch && !isMatch) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await prisma.personnel.update({
            where: { id: user.id },
            data: { password: hashedPassword }
          });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
        return;
      }
    }
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// METADATA
app.get('/api/metadata', async (req, res) => {
  try {
    const [categories, departments] = await Promise.all([
      prisma.assetCategory.findMany({ orderBy: { name: 'asc' } }),
      prisma.department.findMany({ orderBy: { name: 'asc' } })
    ]);
    res.json({ categories, departments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const item = await prisma.assetCategory.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await prisma.assetCategory.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const item = await prisma.department.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- SETTINGS (System Config) ---
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const config = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settingsObj = req.body;
    const upserts = Object.keys(settingsObj).map((key) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(settingsObj[key]) },
        create: { key, value: String(settingsObj[key]) },
      });
    });
    await Promise.all(upserts);
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ASSETS
app.get('/api/assets', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({ include: { assignedTo: true } });
    res.json(assets.map(formatAsset));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/assets/bulk', async (req, res) => {
  try {
    const assets = req.body; // Array of asset objects
    const dataToCreate = assets.map(a => ({
      ...a,
      id: a.id || `${a.type.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : new Date(),
      status: a.status || 'Active'
    }));

    const result = await prisma.asset.createMany({
      data: dataToCreate,
      skipDuplicates: true // Will not crash if ID already exists
    });

    res.status(201).json({ count: result.count, message: `Successfully imported ${result.count} assets` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/assets/:id', async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: { assignedTo: true }
    });
    asset ? res.json(formatAsset(asset)) : res.status(404).json({ message: 'Asset not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/assets', async (req, res) => {
  try {
    const { name, type, spec, serialNumber, assignedPersonnelId, location, department, image } = req.body;
    const newAsset = await prisma.asset.create({
      data: {
        id: `${type.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        name, type, spec, serialNumber, assignedPersonnelId, location, department, image,
        purchaseDate: new Date()
      },
      include: { assignedTo: true }
    });
    await prisma.activity.create({
      data: { assetId: newAsset.id, description: `New asset added: ${newAsset.name}`, user: 'Admin' }
    });
    
    if (assignedPersonnelId) {
      await notifyAssetAssigned(newAsset, assignedPersonnelId);
    }

    res.status(201).json(formatAsset(newAsset));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/assets/:id', async (req, res) => {
  try {
    const updated = await prisma.asset.update({
      where: { id: req.params.id },
      data: req.body,
      include: { assignedTo: true }
    });
    res.json(formatAsset(updated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    await prisma.asset.delete({ where: { id: req.params.id } });
    res.json({ message: 'Asset deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/assets/:id', async (req, res) => {
  try {
    const updated = await prisma.asset.update({
      where: { id: req.params.id },
      data: { status: req.body.status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PERSONNEL
app.get('/api/personnel', async (req, res) => {
  try {
    const people = await prisma.personnel.findMany({
      include: { _count: { select: { assets: true } } }
    });
    res.json(people.map(p => ({ ...p, assetCount: p._count.assets })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/personnel/bulk', async (req, res) => {
  try {
    const people = req.body;
    const dataToCreate = await Promise.all(people.map(async (p) => ({
      ...p,
      avatar: p.avatar || `https://picsum.photos/seed/${p.name}/100/100`,
      joinedDate: new Date(),
      password: await bcrypt.hash(p.password || 'password123', 10)
    })));

    const result = await prisma.personnel.createMany({
      data: dataToCreate,
      skipDuplicates: true
    });

    res.status(201).json({ count: result.count, message: `Successfully imported ${result.count} personnel` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/personnel', async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    
    const person = await prisma.personnel.create({ 
      data: {
        ...rest,
        password: hashedPassword,
        avatar: rest.avatar || `https://picsum.photos/seed/${rest.name}/100/100`,
        joinedDate: new Date()
      } 
    });
    const { password: _, ...personWithoutPassword } = person;
    res.status(201).json({ ...personWithoutPassword, assetCount: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/personnel/:id', async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    let dataToUpdate = { ...rest };
    
    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.personnel.update({
      where: { id: req.params.id },
      data: dataToUpdate
    });
    const { password: _, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/personnel/:id', async (req, res) => {
  try {
    await prisma.personnel.delete({ where: { id: req.params.id } });
    res.json({ message: 'Personnel deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TICKETS
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/assets/:id/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({ where: { assetId: req.params.id }, orderBy: { createdAt: 'desc' } });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const { assetId, reporterId, subject, priority, description } = req.body;
    const newTicket = await prisma.ticket.create({ data: { assetId, reporterId, subject, priority, description, status: 'Open' } });
    await prisma.asset.update({ where: { id: assetId }, data: { status: 'In Maintenance' } });
    const reporter = await prisma.personnel.findUnique({ where: { id: reporterId } });
    await prisma.activity.create({ data: { assetId, description: `Ticket created: ${subject}`, user: reporter ? reporter.name : 'Unknown', status: 'Warning' } });
    
    // Notify Staff/Admins
    await notifyTicketCreated(newTicket, reporter ? reporter.name : 'Unknown');

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { status, resolution, assigneeId } = req.body;
    const data = { status };
    if (assigneeId !== undefined) {
      data.assigneeId = assigneeId;
    }
    if (status === 'Resolved') {
      data.resolvedAt = new Date();
      data.resolution = resolution;
    } else {
      data.resolvedAt = null; // Clear if re-opened
      data.resolution = null;
    }
    const updated = await prisma.ticket.update({ where: { id: req.params.id }, data });
    if (status === 'Resolved') {
      await prisma.asset.update({ where: { id: updated.assetId }, data: { status: 'Active' } });
      await prisma.activity.create({ data: { assetId: updated.assetId, description: `Maintenance Completed: ${updated.subject}${resolution ? ' - ' + resolution : ''}`, user: 'Staff' } });
    }
    
    // Notify Reporter
    await notifyTicketStatusUpdate(updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/tickets/:id/rate', async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const updated = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { rating, feedback }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NOTIFICATIONS
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({ where: { NOT: { status: 'Resolved' } }, include: { reporter: true } });
    console.log('DEBUG: Prisma fetched tickets count:', tickets.length);
    if (tickets.length > 0) {
      console.log('DEBUG: First ticket sample:', { id: tickets[0].id, subject: tickets[0].subject, hasDescription: !!tickets[0].description });
    }
    res.json(tickets.map(t => ({ 
      id: t.id, 
      title: t.subject, 
      description: t.description, 
      person: `${t.reporter.name} (${t.reporter.department})`, 
      priority: t.priority, 
      status: t.status, 
      assetId: t.assetId,
      _debug_raw_desc: t.description // Temporary debug field
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const days = req.query.days;
    let where = {};
    if (days && days !== 'all') {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days));
      where = { time: { gte: date } };
    }
    const logs = await prisma.activity.findMany({ where, take: 50, orderBy: { time: 'desc' } });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const pendingCount = await prisma.ticket.count({ where: { NOT: { status: 'Resolved' } } });
    res.json({ pendingRepairs: pendingCount, overdueTasks: 3, completedWeek: 42 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const days = req.query.days;
    let where = {};
    if (days && days !== 'all') {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days));
      where = { createdAt: { gte: date } };
    }

    const [assets, tickets, categories] = await Promise.all([
      prisma.asset.findMany(),
      prisma.ticket.findMany({ where }),
      prisma.assetCategory.findMany()
    ]);

    // 1. Asset Distribution by Type
    const assetDist = categories.map(cat => ({
      name: cat.name,
      value: assets.filter(a => a.type === cat.name).length
    })).filter(d => d.value > 0);

    // 2. Ticket Status Breakdown
    const ticketStatus = [
      { name: 'Open', value: tickets.filter(t => t.status === 'Open').length },
      { name: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length },
      { name: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length },
      { name: 'Closed', value: tickets.filter(t => t.status === 'Closed').length }
    ];

    // 3. Asset Health Score (Summary)
    const activeAssets = assets.filter(a => a.status === 'Active').length;
    const maintenanceAssets = assets.filter(a => a.status === 'In Maintenance').length;
    const retiredAssets = assets.filter(a => a.status === 'Retired').length;

    res.json({
      assetDist,
      ticketStatus,
      summary: {
        totalAssets: assets.length,
        active: activeAssets,
        maintenance: maintenanceAssets,
        retired: retiredAssets,
        totalTickets: tickets.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
