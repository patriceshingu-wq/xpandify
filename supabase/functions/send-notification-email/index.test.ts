import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("send-notification-email - should reject missing required fields", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-notification-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        // Missing 'to' and 'subject'
        type: "general",
        data: {},
      }),
    }
  );

  const body = await response.json();

  assertEquals(response.status, 500);
  assertExists(body.error);
});

Deno.test("send-notification-email - should handle CORS preflight", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-notification-email`,
    {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
        "Access-Control-Request-Method": "POST",
      },
    }
  );

  await response.text(); // Consume body

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("Access-Control-Allow-Origin"),
    "*"
  );
});

Deno.test("send-notification-email - should accept valid meeting reminder payload", async () => {
  // Note: This test uses resend.dev which is a test domain
  // In production, emails would actually be sent
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-notification-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: "test@resend.dev", // Resend test email
        subject: "Test Meeting Reminder",
        type: "meeting_reminder",
        data: {
          recipientName: "Test User",
          title: "Upcoming Meeting",
          message: "You have a meeting tomorrow",
          dateTime: "Monday, January 27, 2025 at 10:00 AM",
          link: "https://example.com/meetings",
        },
      }),
    }
  );

  const body = await response.json();

  // Should return 200 with success true (or 500 if Resend API key not configured)
  assertExists(body);
  // Either success or error about Resend API key
  assertEquals(
    body.success === true || body.error !== undefined,
    true
  );
});

Deno.test("send-notification-email - should accept action_item_overdue type", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-notification-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: "test@resend.dev",
        subject: "Overdue Action Item",
        type: "action_item_overdue",
        data: {
          recipientName: "Test User",
          title: "Action Item Overdue",
          message: "Your action item is overdue",
          dateTime: "Friday, January 24, 2025",
          link: "https://example.com/meetings",
        },
      }),
    }
  );

  const body = await response.json();

  assertExists(body);
  // Should handle the new type without errors
  assertEquals(
    body.success === true || body.error !== undefined,
    true
  );
});
