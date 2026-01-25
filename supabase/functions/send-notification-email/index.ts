import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationPayload {
  to: string;
  subject: string;
  type: 'meeting_reminder' | 'course_deadline' | 'assignment' | 'general';
  data: {
    recipientName?: string;
    title?: string;
    message?: string;
    dateTime?: string;
    link?: string;
  };
}

function generateEmailHtml(type: string, data: EmailNotificationPayload['data']): string {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9fafb;
  `;

  const cardStyles = `
    background-color: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  `;

  const buttonStyles = `
    display: inline-block;
    background-color: #2563eb;
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    margin-top: 16px;
  `;

  const getTypeIcon = (notificationType: string): string => {
    switch (notificationType) {
      case 'meeting_reminder':
        return '📅';
      case 'course_deadline':
        return '⏰';
      case 'assignment':
        return '📚';
      default:
        return '🔔';
    }
  };

  const getTypeColor = (notificationType: string): string => {
    switch (notificationType) {
      case 'meeting_reminder':
        return '#3b82f6';
      case 'course_deadline':
        return '#f59e0b';
      case 'assignment':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const icon = getTypeIcon(type);
  const color = getTypeColor(type);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${baseStyles}">
      <div style="${cardStyles}">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 48px;">${icon}</span>
        </div>
        
        <h1 style="color: ${color}; font-size: 24px; margin: 0 0 16px 0; text-align: center;">
          ${data.title || 'Notification'}
        </h1>
        
        ${data.recipientName ? `
          <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
            Hi ${data.recipientName},
          </p>
        ` : ''}
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          ${data.message || ''}
        </p>
        
        ${data.dateTime ? `
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;">
            <strong>When:</strong> ${data.dateTime}
          </p>
        ` : ''}
        
        ${data.link ? `
          <div style="text-align: center;">
            <a href="${data.link}" style="${buttonStyles}">
              View Details
            </a>
          </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          This is an automated notification from your Church Staff Management system.
        </p>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: EmailNotificationPayload = await req.json();
    
    if (!payload.to || !payload.subject) {
      throw new Error("Missing required fields: 'to' and 'subject' are required");
    }

    console.log(`Sending ${payload.type} email to: ${payload.to}`);

    const html = generateEmailHtml(payload.type, payload.data);

    // Use Resend's default domain for testing, or your verified domain for production
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "notifications@resend.dev";

    const emailResponse = await resend.emails.send({
      from: `Church Staff <${fromEmail}>`,
      to: [payload.to],
      subject: payload.subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
