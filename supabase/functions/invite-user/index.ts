import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteUserPayload {
  email: string;
  person: {
    first_name: string;
    last_name: string;
    preferred_name?: string;
    phone?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    primary_language: 'en' | 'fr';
    person_type: 'staff' | 'volunteer' | 'congregant';
    status: 'active' | 'inactive' | 'on_leave';
    supervisor_id?: string;
    start_date?: string;
    campus_id?: string;
    title?: string;
    notes?: string;
  };
  role_id?: string;
  redirect_to?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the caller is authenticated and has admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create a client with the user's token to verify their identity
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the user making the request
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin or pastor_supervisor role
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select(`
        app_roles (name)
      `)
      .eq('user_id', user.id);

    if (rolesError) {
      throw rolesError;
    }

    const roleNames = userRoles?.map((ur: { app_roles: { name: string } | null }) => ur.app_roles?.name) || [];
    const canInvite = roleNames.some((role: string | undefined) =>
      role && ['super_admin', 'admin', 'pastor_supervisor'].includes(role)
    );

    if (!canInvite) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to invite users' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload: InviteUserPayload = await req.json();

    if (!payload.email || !payload.person?.first_name || !payload.person?.last_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, first_name, last_name' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Inviting user: ${payload.email}`);

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some(u => u.email?.toLowerCase() === payload.email.toLowerCase());

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Invite the user via Supabase Auth
    const redirectTo = payload.redirect_to || `${req.headers.get('origin')}/auth`;

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      payload.email,
      {
        redirectTo,
        data: {
          first_name: payload.person.first_name,
          last_name: payload.person.last_name,
          primary_language: payload.person.primary_language || 'en',
        },
      }
    );

    if (inviteError) {
      console.error("Invite error:", inviteError);
      throw inviteError;
    }

    const newUserId = inviteData.user?.id;
    if (!newUserId) {
      throw new Error("Failed to create user - no user ID returned");
    }

    console.log(`User created with ID: ${newUserId}`);

    // Create the person record linked to the new user
    const personData = {
      user_id: newUserId,
      email: payload.email,
      first_name: payload.person.first_name,
      last_name: payload.person.last_name,
      preferred_name: payload.person.preferred_name || null,
      phone: payload.person.phone || null,
      date_of_birth: payload.person.date_of_birth || null,
      gender: payload.person.gender || null,
      primary_language: payload.person.primary_language || 'en',
      person_type: payload.person.person_type || 'staff',
      status: payload.person.status || 'active',
      supervisor_id: payload.person.supervisor_id || null,
      start_date: payload.person.start_date || null,
      campus_id: payload.person.campus_id || null,
      title: payload.person.title || null,
      notes: payload.person.notes || null,
    };

    const { data: personRecord, error: personError } = await supabaseAdmin
      .from('people')
      .insert(personData)
      .select()
      .single();

    if (personError) {
      console.error("Person creation error:", personError);
      // Try to clean up the created auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw personError;
    }

    console.log(`Person record created with ID: ${personRecord.id}`);

    // Assign role if provided
    if (payload.role_id) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUserId, role_id: payload.role_id });

      if (roleError) {
        console.error("Role assignment error:", roleError);
        // Don't fail the whole operation for role assignment
      } else {
        console.log(`Role assigned: ${payload.role_id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user_id: newUserId,
          person_id: personRecord.id,
          email: payload.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error inviting user:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
