import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { meeting_id } = await req.json();
    if (!meeting_id) {
      return new Response(JSON.stringify({ error: "meeting_id required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch meeting with agenda items and participants
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .select("*, organizer:people!meetings_organizer_id_fkey(first_name, last_name, email)")
      .eq("id", meeting_id)
      .single();

    if (meetingError || !meeting) {
      return new Response(JSON.stringify({ error: "Meeting not found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: agendaItems } = await supabaseAdmin
      .from("meeting_agenda_items")
      .select("*, action_owner:people!meeting_agenda_items_action_owner_id_fkey(first_name, last_name)")
      .eq("meeting_id", meeting_id)
      .order("order_index", { ascending: true });

    const { data: participants } = await supabaseAdmin
      .from("meeting_participants")
      .select("person:people!meeting_participants_person_id_fkey(first_name, last_name, email)")
      .eq("meeting_id", meeting_id);

    // Build email HTML
    const meetingDate = new Date(meeting.date_time).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const agendaHtml = (agendaItems || []).map((item: any) => {
      const actionBadge = item.action_required
        ? `<span style="background:#ef4444;color:white;padding:2px 8px;border-radius:4px;font-size:12px;">Action Required</span>`
        : "";
      const owner = item.action_owner
        ? `<br/><small>Owner: ${item.action_owner.first_name} ${item.action_owner.last_name}${item.action_due_date ? ` | Due: ${item.action_due_date}` : ""}</small>`
        : "";
      const notes = item.discussion_notes
        ? `<br/><em style="color:#666;">${item.discussion_notes}</em>`
        : "";
      return `<li style="margin-bottom:12px;">${item.topic_en} ${actionBadge}${owner}${notes}</li>`;
    }).join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1e3a5f;">Meeting Summary</h2>
        <p><strong>${meeting.title_en}</strong><br/>${meetingDate}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
        ${agendaItems && agendaItems.length > 0
          ? `<h3>Agenda & Notes</h3><ul style="padding-left:20px;">${agendaHtml}</ul>`
          : "<p><em>No agenda items recorded.</em></p>"}
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
        <p style="color:#999;font-size:12px;">Sent from Xpandify</p>
      </div>`;

    // Collect recipient emails
    const emails: string[] = [];
    if (meeting.organizer?.email) emails.push(meeting.organizer.email);
    participants?.forEach((p: any) => {
      if (p.person?.email && !emails.includes(p.person.email)) {
        emails.push(p.person.email);
      }
    });

    if (emails.length === 0) {
      return new Response(JSON.stringify({ error: "No participant emails found" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send via Resend through gateway
    if (!resendApiKey || !lovableApiKey) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
    const emailResponse = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": resendApiKey,
      },
      body: JSON.stringify({
        from: "Xpandify <noreply@xpandify.wearemc.church>",
        to: emails,
        subject: `Meeting Summary: ${meeting.title_en}`,
        html,
      }),
    });

    const emailResult = await emailResponse.json();

    return new Response(JSON.stringify({ success: true, sent_to: emails.length, result: emailResult }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
