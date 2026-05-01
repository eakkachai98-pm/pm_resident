import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: (process.env.SMTP_PORT) === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Generic function to send an email.
 */
export async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not sent: SMTP_USER or SMTP_PASS not configured in .env');
    return false;
  }
  
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: '"Resident soft System" <noreply@residentsoft.com>',
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #111827;">Resident soft Notification</h2>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            ${html}
          </div>
          <hr style="margin-top: 20px; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #6b7280;">This is an automated message, please do not reply.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Trigger: New Ticket Created
 * Notifies all Admins and Staff
 */
export async function notifyTicketCreated(ticket, reporter, room) {
  const staffMembers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'STAFF'] } }
  });

  const subject = `[New Ticket] ${ticket.category} Issue in Room ${room.roomNumber}`;
  const html = `
    <p><strong>A new maintenance ticket has been created.</strong></p>
    <ul>
      <li><strong>Room:</strong> ${room.roomNumber}</li>
      <li><strong>Reporter:</strong> ${reporter.name}</li>
      <li><strong>Category:</strong> ${ticket.category}</li>
      <li><strong>Issue:</strong> ${ticket.title}</li>
      <li><strong>Date Requested:</strong> ${ticket.scheduledDate || 'Not specified'} (${ticket.scheduledSlot || 'Any time'})</li>
    </ul>
    <p>Please log in to the dashboard to view details and accept the task.</p>
  `;

  for (const staff of staffMembers) {
    if (staff.email) {
      await sendEmail({ to: staff.email, subject, html });
    }
  }
}

/**
 * Trigger: Ticket Status Updated
 * Notifies the Reporter (Resident)
 */
export async function notifyTicketStatusUpdate(ticketId) {
  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id: ticketId },
    include: { reporter: true, room: true }
  });

  if (!ticket || !ticket.reporter || !ticket.reporter.email) return;

  const subject = `[Ticket Update] Your issue in Room ${ticket.room.roomNumber} is now ${ticket.status}`;
  
  let html = `<p><strong>Update on your maintenance request: "${ticket.title}"</strong></p>`;
  html += `<p>The status of your ticket has been updated to: <strong>${ticket.status}</strong></p>`;
  
  if (ticket.status === 'RESOLVED') {
    html += `<p><strong>Resolution Notes from Technician:</strong><br/>${ticket.repairNotes || 'No notes provided.'}</p>`;
    html += `<p>Please log in to your dashboard to view details and leave a rating for the technician.</p>`;
  }

  await sendEmail({ to: ticket.reporter.email, subject, html });
}

/**
 * Trigger: New Invoice Created
 * Notifies the Tenant
 */
export async function notifyInvoiceCreated(invoiceId) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lease: { include: { tenant: true, room: true } } }
  });

  if (!invoice || !invoice.lease.tenant || !invoice.lease.tenant.email) return;

  const tenant = invoice.lease.tenant;
  const room = invoice.lease.room;

  const subject = `[New Bill] Invoice for Room ${room.roomNumber} (${invoice.billingMonth})`;
  const html = `
    <p>Dear ${tenant.name},</p>
    <p>A new invoice for your room has been generated.</p>
    <ul>
      <li><strong>Billing Month:</strong> ${invoice.billingMonth}</li>
      <li><strong>Room Rent:</strong> ฿${invoice.roomRent.toFixed(2)}</li>
      <li><strong>Water Charge:</strong> ฿${invoice.waterCharge.toFixed(2)}</li>
      <li><strong>Electric Charge:</strong> ฿${invoice.electricCharge.toFixed(2)}</li>
      <li><strong>Total Amount:</strong> <strong>฿${invoice.totalAmount.toFixed(2)}</strong></li>
    </ul>
    <p>Please log in to the system to view the full invoice and submit your payment slip.</p>
  `;

  await sendEmail({ to: tenant.email, subject, html });
}
