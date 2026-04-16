// app/api/admin/contact-submissions/[id]/reply/route.ts
/*eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { ContactSubmissionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from 'nodemailer';

// ─── Email configuration ────────────────────────────────────────────────────────

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });
};

const LOGO_URL = "https://sheatwork.com/_next/image?url=%2Flogo.png&w=384&q=75";

const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  lightBg: '#f5f5f5',
  border: '#eee',
  text: '#333',
  lightText: '#999'
};

// ─── Email templates ───────────────────────────────────────────────────────────

const getReplyEmailHTML = (data: { 
  userName: string; 
  userEmail: string;
  originalSubject: string | null;
  originalMessage: string;
  replyMessage: string;
  adminName?: string;
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Response to Your Inquiry</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: ${COLORS.text}; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="text-align: center; padding: 20px 0; background: ${COLORS.gradient}; border-radius: 10px 10px 0 0;">
          <img src="${LOGO_URL}" alt="SheAtWork Logo" style="max-width: 150px; height: auto;">
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: ${COLORS.secondary}; margin-top: 0;">Response to Your Inquiry</h2>
          
          <p>Dear ${data.userName},</p>
          
          <p>Thank you for reaching out to us. Here's our response to your inquiry:</p>
          
          <div style="background-color: ${COLORS.lightBg}; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${data.replyMessage}</p>
          </div>
          
          ${data.originalSubject || data.originalMessage ? `
            <div style="margin-top: 30px; border-top: 1px solid ${COLORS.border}; padding-top: 20px;">
              <h3 style="color: ${COLORS.secondary}; font-size: 14px;">Original Message:</h3>
              ${data.originalSubject ? `<p style="font-size: 12px; color: ${COLORS.lightText};"><strong>Subject:</strong> ${data.originalSubject}</p>` : ''}
              <div style="background-color: #fafafa; padding: 12px; border-radius: 4px; font-size: 13px; color: #666; border-left: 3px solid ${COLORS.primary};">
                ${data.originalMessage.substring(0, 500)}${data.originalMessage.length > 500 ? '...' : ''}
              </div>
            </div>
          ` : ''}
          
          <p style="margin-top: 30px;">If you have any further questions, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>
          <strong>${data.adminName || 'The SheAtWork Team'}</strong></p>
          
          <hr style="border: none; border-top: 1px solid ${COLORS.border}; margin: 20px 0;">
          
          <p style="font-size: 12px; color: ${COLORS.lightText}; text-align: center;">
            This is a response to your inquiry submitted through our contact form.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─── POST /api/admin/contact-submissions/[id]/reply ───────────────────────────

export async function POST(req: NextRequest,  context: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await context.params;

    // Add your admin auth check here
    // For example: const session = await getServerSession();
    // if (!session?.user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get the contact submission from database
    const [submission] = await db
      .select()
      .from(ContactSubmissionsTable)
      .where(eq(ContactSubmissionsTable.id, id));

    if (!submission) {
      return NextResponse.json(
        { error: "Contact submission not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { replyMessage, adminName } = body;

    if (!replyMessage?.trim()) {
      return NextResponse.json(
        { error: "Reply message is required" },
        { status: 400 }
      );
    }

    if (replyMessage.trim().length > 10000) {
      return NextResponse.json(
        { error: "Reply message must be 10000 characters or fewer" },
        { status: 400 }
      );
    }

    // Send email reply
    const transporter = createTransporter();
    
    try {
      await transporter.sendMail({
        from: `"SheAtWork Support" <${process.env.MAIL_USERNAME}>`,
        to: submission.email,
        subject: `Re: ${submission.subject || "Your inquiry"}`,
        html: getReplyEmailHTML({
          userName: submission.name,
          userEmail: submission.email,
          originalSubject: submission.subject,
          originalMessage: submission.message,
          replyMessage: replyMessage.trim(),
          adminName: adminName?.trim() || undefined,
        }),
      });

      // Optionally update the submission with reply info
      // You might want to add fields like `lastRepliedAt`, `replyCount`, etc. to your schema
      // For now, we'll just update the updated_at if you have that field
      // await db.update(ContactSubmissionsTable)
      //   .set({ 
      //     lastRepliedAt: new Date().toISOString(),
      //     updatedAt: new Date().toISOString()
      //   })
      //   .where(eq(ContactSubmissionsTable.id, id));

      return NextResponse.json({
        success: true,
        message: "Reply sent successfully",
      });

    } catch (emailError) {
      console.error("[EMAIL REPLY ERROR]", emailError);
      return NextResponse.json(
        { error: "Failed to send email reply. Please check email configuration." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[POST /api/admin/contact-submissions/[id]/reply]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}