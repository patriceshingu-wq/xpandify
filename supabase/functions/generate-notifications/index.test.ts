import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("generate-notifications - should return success response", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-notifications`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    }
  );

  const body = await response.json();

  assertEquals(response.status, 200);
  assertExists(body.success);
  assertEquals(body.success, true);
  assertExists(body.generated);
  assertExists(body.emailsSent);
});

Deno.test("generate-notifications - should return notifications array", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-notifications`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    }
  );

  const body = await response.json();
  await response.text().catch(() => {}); // Consume body if needed

  assertExists(body.notifications);
  assertEquals(Array.isArray(body.notifications), true);
});

Deno.test("generate-notifications - should return emails array", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-notifications`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    }
  );

  const body = await response.json();

  assertExists(body.emails);
  assertEquals(Array.isArray(body.emails), true);
});

Deno.test("generate-notifications - should handle CORS preflight", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-notifications`,
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
