import * as nodemailer from 'nodemailer';

// Create email transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    console.log('Attempting to send email invitation...');
    
    const transporter = createTransporter();
    
    console.log('Email transporter config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASSWORD,
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || '',
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function sendOrganizationInvitation({
  to,
  organizationName,
  inviterName,
  inviteUrl,
  expiresAt,
}: {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
}) {
  const subject = `You're invited to join ${organizationName} on TaskFlow`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Organization Invitation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: #1f2937;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
        }
        .footer {
          background: #f1f1f1;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .expiry {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          padding: 10px;
          border-radius: 4px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚀 TaskFlow</h1>
        <p>You've been invited to collaborate!</p>
      </div>
      
      <div class="content">
        <h2>Hi there!</h2>
        
        <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on TaskFlow.</p>
        
        <p>TaskFlow is a powerful project management platform that helps teams collaborate effectively and get things done.</p>
        
        <div style="text-align: center;">
          <a href="${inviteUrl}" class="button">Accept Invitation</a>
        </div>
        
        <div class="expiry">
          <strong>⏰ Important:</strong> This invitation expires on ${expiresAt.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}.
        </div>
        
        <p>If you don't have a TaskFlow account yet, you'll be able to create one when you accept the invitation.</p>
        
        <p>If you have any questions, feel free to reach out to ${inviterName} or our support team.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <p><small>If the button above doesn't work, copy and paste this link into your browser:</small></p>
        <p><small><a href="${inviteUrl}">${inviteUrl}</a></small></p>
      </div>
      
      <div class="footer">
        <p>This invitation was sent by ${inviterName} via TaskFlow.</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
You've been invited to join ${organizationName} on TaskFlow!

${inviterName} has invited you to collaborate on TaskFlow, a powerful project management platform.

Accept your invitation: ${inviteUrl}

This invitation expires on ${expiresAt.toLocaleDateString()}.

If you don't have a TaskFlow account yet, you'll be able to create one when you accept the invitation.

If you have any questions, feel free to reach out to ${inviterName}.

---
This invitation was sent by ${inviterName} via TaskFlow.
If you didn't expect this invitation, you can safely ignore this email.
  `;

  try {
    return await sendEmail({
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error('Failed to send email invitation:', error);
    throw error;
  }
}
