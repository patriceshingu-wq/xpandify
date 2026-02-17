import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify caller is admin via service role
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify caller is admin
  const token = authHeader.replace("Bearer ", "");
  const { data: { user: caller } } = await supabase.auth.getUser(token);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: isAdmin } = await supabase.rpc("is_admin_or_super", { check_user_id: caller.id });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const testUsers = [
    { email: "bideldjiki+admin@gmail.com", password: "testpassword@123" },
    { email: "bideldjiki+pastor@gmail.com", password: "testpassword@123" },
    { email: "bideldjiki+staff1@gmail.com", password: "testpassword@123" },
    { email: "bideldjiki+staff2@gmail.com", password: "testpassword@123" },
    { email: "bideldjiki+volunteer@gmail.com", password: "testpassword@123" },
  ];

  const results = [];

  for (const testUser of testUsers) {
    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === testUser.email);

    if (existing) {
      // Update password
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: testUser.password,
        email_confirm: true,
      });
      results.push({
        email: testUser.email,
        action: "password_updated",
        success: !error,
        error: error?.message,
      });
    } else {
      // Create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
      });
      results.push({
        email: testUser.email,
        action: "created",
        success: !error,
        userId: data?.user?.id,
        error: error?.message,
      });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
