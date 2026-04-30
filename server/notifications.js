import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getTransporter() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass'] } }
  });
  const config = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});

  return nodemailer.createTransport({
    host: config.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(config.smtpPort || process.env.SMTP_PORT || '587'),
    secure: (config.smtpPort || process.env.SMTP_PORT) === '465',
    auth: {
      user: config.smtpUser || process.env.SMTP_USER,
      pass: config.smtpPass || process.env.SMTP_PASS
    }
  });
}

/**
 * Generic function to create a notification and optionally send an email.
 */
export async function createNotification({
  userId,
  title,
  message,
  type = 'system',
  priority = 'Medium',
  link = null,
  sendEmail = false
}) {
  try {
    const user = await prisma.personnel.findUnique({ where: { id: userId } });
    if (!user) return null;

    // 1. Create In-App Notification if user prefers it
    let notification = null;
    if (user.notifyInApp) {
      notification = await prisma.notification.create({
        data: { userId, title, message, type, priority, link }
      });
    }

    // 2. Send Email if requested AND user prefers it
    if (sendEmail && user.notifyEmail && user.email) {
      const mailOptions = {
        from: '"Primus Pro System" <noreply@primus.pro>',
        to: user.email,
        subject: `[Primus Pro] ${title}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #111827;">IT Fixit System Notification</h2>
            <p><strong>${title}</strong></p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0;">
              ${message.replace(/\n/g, '<br/>')}
            </div>
            ${link ? `<a href="${process.env.APP_URL || 'http://localhost:5173'}${link}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Details</a>` : ''}
            <hr style="margin-top: 20px; border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #6b7280;">This is an automated message, please do not reply.</p>
          </div>
        `
      };
      
      const transporter = await getTransporter();
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${user.email}`);
    }

    return notification;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
  }
}

/**
 * Trigger: New Ticket Created
 * Notifies all Admins and Staff
 */
export async function notifyTicketCreated(ticket, reporterName) {
  const staff = await prisma.personnel.findMany({
    where: { userRole: { in: ['admin', 'staff'] } }
  });

  for (const person of staff) {
    await createNotification({
      userId: person.id,
      title: `New Ticket (${ticket.priority})`,
      message: `${reporterName} created a new ticket: "${ticket.subject}"`,
      type: 'ticket',
      priority: ticket.priority,
      link: '/tickets'
    });
  }
}

/**
 * Trigger: Ticket Status Updated
 * Notifies the Reporter
 */
export async function notifyTicketStatusUpdate(ticket) {
  let message = `Your ticket "${ticket.subject}" status has been updated to: ${ticket.status}`;
  
  if (ticket.status === 'Resolved' && ticket.resolution) {
    message += `\n\nResolution Notes:\n${ticket.resolution}`;
  }

  await createNotification({
    userId: ticket.reporterId,
    title: `Ticket Update: ${ticket.status}`,
    message: message,
    type: 'ticket',
    priority: 'Medium',
    link: '/user-dashboard',
    sendEmail: true // Email for status updates
  });
}

/**
 * Trigger: Asset Assigned
 * Notifies the new owner
 */
export async function notifyAssetAssigned(asset, personnelId) {
  await createNotification({
    userId: personnelId,
    title: 'New Asset Assigned',
    message: `You have been assigned a new asset: ${asset.name} (${asset.id})`,
    type: 'asset',
    priority: 'Medium',
    link: '/user-dashboard',
    sendEmail: true
  });
}
