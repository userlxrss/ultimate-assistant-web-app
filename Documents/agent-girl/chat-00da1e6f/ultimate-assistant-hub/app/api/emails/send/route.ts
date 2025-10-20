import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, handleApiError } from '@/utils/api-response';
import { validateRequest } from '@/utils/validation';
import { validationSchemas } from '@/validations';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { data, error } = await validateRequest(request, validationSchemas.sendEmail);

    if (error) {
      return error;
    }

    const { to, cc, bcc, subject, content, htmlContent, attachments } = data;

    // Create email record
    const email = await db.email.create({
      data: {
        messageId: uuidv4(),
        userId: user.id,
        subject,
        from: user.email, // Assuming user email is available
        to,
        cc: cc || [],
        bcc: bcc || [],
        content,
        htmlContent,
        attachments: attachments || [],
        isRead: true,
        isDraft: false,
        sentAt: new Date(),
        receivedAt: new Date()
      },
      select: {
        id: true,
        messageId: true,
        subject: true,
        from: true,
        to: true,
        cc: true,
        bcc: true,
        content: true,
        htmlContent: true,
        attachments: true,
        sentAt: true,
        createdAt: true
      }
    });

    // Send email via SMTP or Gmail API
    try {
      await sendEmailViaSMTP({
        to,
        cc,
        bcc,
        subject,
        content,
        htmlContent,
        attachments
      });

      // Update email status to sent
      await db.email.update({
        where: { id: email.id },
        data: { gmailId: `sent_${Date.now()}` } // Mock Gmail ID
      });

    } catch (sendError) {
      console.error('Failed to send email:', sendError);

      // Update email to mark as failed (you might want to add a status field)
      await db.email.update({
        where: { id: email.id },
        data: {
          labels: ['failed'],
          content: `[FAILED TO SEND]\n\n${content}`
        }
      });

      throw sendError;
    }

    return createSuccessResponse({
      ...email,
      status: 'sent'
    }, undefined, 201);

  } catch (error) {
    return handleApiError(error);
  }
});

async function sendEmailViaSMTP(emailData: {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  htmlContent?: string;
  attachments?: string[];
}) {
  // Create transporter using SMTP
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: emailData.to.join(', '),
    cc: emailData.cc?.join(', ') || undefined,
    bcc: emailData.bcc?.join(', ') || undefined,
    subject: emailData.subject,
    text: emailData.content,
    html: emailData.htmlContent || undefined,
    // attachments: emailData.attachments?.map(att => ({ path: att })) // For actual file attachments
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);

  return info;
}