import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import nodemailer from "nodemailer";

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Get organization data
    const orgRef = doc(db, "organizations", params.organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const orgData = orgSnap.data();
    const orgName = orgData.name || "Your Organization";

    // Get SMTP configuration and test email address from request body
    const body = await request.json();
    let { host, port, username, password, useTLS, testEmailAddress } = body;
    
    if (!testEmailAddress) {
      return NextResponse.json({ error: "Test email address is required" }, { status: 400 });
    }
    
    // If SMTP config not provided in body, get from database
    if (!host || !username) {
      const savedSmtpConfig = orgData.smtpConfig;
      if (!savedSmtpConfig) {
        return NextResponse.json({ 
          error: "No SMTP configuration found. Please save SMTP settings first." 
        }, { status: 400 });
      }
      
      host = savedSmtpConfig.host;
      port = savedSmtpConfig.port;
      username = savedSmtpConfig.username;
      password = savedSmtpConfig.password;
      useTLS = savedSmtpConfig.useTLS;
    }

    if (!host || !username || !password) {
      return NextResponse.json({ 
        error: "Incomplete SMTP configuration. Host, username, and password are required." 
      }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: parseInt(port) === 465, // true for 465, false for other ports
      auth: {
        user: username,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });

    // Verify connection
    await transporter.verify();

    // Send test email
    const testEmailSubject = `SMTP Test from ${orgName}`;
    const testEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">SMTP Configuration Test</h2>
        <p>Hello,</p>
        <p>This is a test email from <strong>${orgName}</strong> to verify that your SMTP configuration is working correctly.</p>
        
        <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">✅ SMTP Configuration Successfully Tested</h3>
          <p style="margin-bottom: 0;">Your email settings are properly configured and working!</p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 20px; color: #6b7280; font-size: 14px;">
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Organization: ${orgName}</li>
            <li>SMTP Server: ${host}</li>
            <li>Port: ${port}</li>
            <li>Encryption: ${useTLS ? 'TLS/STARTTLS' : 'None'}</li>
            <li>Test Date: ${new Date().toLocaleString()}</li>
          </ul>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          This email was sent automatically from Taskflow AI to test your SMTP configuration.
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"${orgName}" <${username}>`,
      to: testEmailAddress,
      subject: testEmailSubject,
      html: testEmailBody,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true,
      message: `Test email sent successfully to ${testEmailAddress}`,
      details: {
        recipient: testEmailAddress,
        smtpServer: host,
        port: port,
        encryption: useTLS ? 'TLS/STARTTLS' : 'None'
      }
    });

  } catch (error) {
    console.error("SMTP test error:", error);
    
    // Provide more specific error messages
    let errorMessage = "SMTP test failed";
    if (error instanceof Error) {
      if (error.message.includes("authentication")) {
        errorMessage = "Authentication failed. Please check your username and password.";
      } else if (error.message.includes("connection")) {
        errorMessage = "Connection failed. Please check your SMTP server and port.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Connection timeout. Please check your network and server settings.";
      } else {
        errorMessage = `SMTP test failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
