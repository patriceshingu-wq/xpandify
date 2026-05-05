// Orgchart Sync Edge Function (Phase 2)
//
// Triggered by an authenticated POST from xpandify's admin UI. Diffs the
// orgchart public REST API against xpandify's local linked rows and either
// auto-applies safe changes or queues destructive ones for human review.
//
// Auth: caller must be super_admin or admin (verified by user_roles → app_roles).
// Concurrency: refuses (409) if another run with status='running' exists.
// Transaction model: classify-then-apply, not interleaved. If the orgchart
// fetch fails, no local mutations are made.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ORG_API_BASE = "https://zdousystfprapsbntppx.supabase.co/functions/v1/org-api";

interface OrgPerson {
  id: string;
  personName: string;
  status: string;
  parentId: string | null;
  ministry: string | null;
}
interface OrgMinistry {
  id: string;
  title: string;
  status: string;
}
interface OrgTreeNode {
  id: string;
  title: string;
  category: string;
  status: string;
  children: OrgTreeNode[];
}

interface LocalMinistry {
  id: string;
  name_en: string;
  name_fr: string | null;
  status: string | null;
  orgchart_id: string;
  parent_ministry_id: string | null;
  leader_id: string | null;
  deleted_at: string | null;
}
interface LocalPerson {
  id: string;
  first_name: string;
  last_name: string;
  orgchart_id: string;
  deleted_at: string | null;
}

interface ReviewQueueRow {
  sync_run_id: string;
  change_type: 'ministry_deleted' | 'person_deleted' | 'ministry_reparented' | 'membership_dropped';
  entity_type: 'ministry' | 'person' | 'people_ministries';
  entity_id: string;
  orgchart_id: string | null;
  before: Record<string, unknown>;
  after: Record<string, unknown> | null;
}

async function fetchOrgApi<T>(path: string): Promise<T> {
  const res = await fetch(`${ORG_API_BASE}${path}`);
  if (!res.ok) throw new Error(`Org API ${path} returned ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

// Walk /tree once, capturing every node's parent so reparent detection works.
function indexTreeParents(tree: OrgTreeNode[]): Map<string, string | null> {
  const out = new Map<string, string | null>();
  function walk(node: OrgTreeNode, parent: string | null) {
    out.set(node.id, parent);
    for (const c of node.children ?? []) walk(c, node.id);
  }
  for (const root of tree) walk(root, null);
  return out;
}

function splitName(personName: string | undefined | null): { first: string; last: string } {
  const trimmed = (personName ?? '').trim();
  if (!trimmed) return { first: '', last: '' };
  const idx = trimmed.indexOf(' ');
  if (idx < 0) return { first: trimmed, last: '' };
  return { first: trimmed.slice(0, idx), last: trimmed.slice(idx + 1) };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check: caller must be admin/super_admin.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: callerUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select(`app_roles (name)`)
      .eq('user_id', callerUser.id);
    if (rolesError) throw rolesError;
    const roleNames = (userRoles ?? []).map((r: { app_roles: { name: string } | null }) => r.app_roles?.name).filter(Boolean);
    const canSync = roleNames.some((r: string) => ['super_admin', 'admin'].includes(r));
    if (!canSync) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin role required' }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Single-flight: refuse if another run is already in progress.
    const { data: running } = await supabaseAdmin
      .from('orgchart_sync_runs')
      .select('id')
      .eq('status', 'running')
      .limit(1);
    if (running && running.length > 0) {
      return new Response(JSON.stringify({ error: 'Sync already running', existing: running[0].id }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Insert running row up front so concurrent invocations see it.
    const { data: run, error: runErr } = await supabaseAdmin
      .from('orgchart_sync_runs')
      .insert({ triggered_by: callerUser.id, status: 'running' })
      .select('id')
      .single();
    if (runErr || !run) throw runErr ?? new Error('Failed to create run');
    const runId = run.id as string;

    const summary = {
      auto_applied: 0,
      queued_for_review: 0,
      errors: 0,
      ministries_seen: 0,
      people_seen: 0,
    };
    const queueRows: ReviewQueueRow[] = [];

    try {
      // Fetch orgchart and local snapshots in parallel.
      const [tree, orgPeople, orgMinistries, localMinistriesResp, localPeopleResp] = await Promise.all([
        fetchOrgApi<OrgTreeNode[]>('/tree'),
        fetchOrgApi<OrgPerson[]>('/people'),
        fetchOrgApi<OrgMinistry[]>('/ministries'),
        supabaseAdmin
          .from('ministries')
          .select('id, name_en, name_fr, status, orgchart_id, parent_ministry_id, leader_id, deleted_at')
          .not('orgchart_id', 'is', null)
          .is('deleted_at', null),
        supabaseAdmin
          .from('people')
          .select('id, first_name, last_name, orgchart_id, deleted_at')
          .not('orgchart_id', 'is', null)
          .is('deleted_at', null),
      ]);

      const localMinistries = (localMinistriesResp.data ?? []) as LocalMinistry[];
      const localPeople = (localPeopleResp.data ?? []) as LocalPerson[];

      // Build orgchart-side indexes.
      const treeParents = indexTreeParents(tree);
      // Flatten /tree nodes by id for status / title lookups (covers ministries + departments + teams).
      const orgNodeById = new Map<string, OrgTreeNode>();
      function flatten(n: OrgTreeNode) {
        orgNodeById.set(n.id, n);
        for (const c of n.children ?? []) flatten(c);
      }
      for (const root of tree) flatten(root);

      const orgPeopleById = new Map(orgPeople.map((p) => [p.id, p]));
      const orgMinistriesById = new Map(orgMinistries.map((m) => [m.id, m]));

      summary.ministries_seen = orgNodeById.size;
      summary.people_seen = orgPeople.length;

      // Local indexes for reverse FK ops (e.g. resolve a leader's local row from their orgchart_id).
      const localPersonByOrgId = new Map(localPeople.map((p) => [p.orgchart_id, p]));
      const localMinistryByOrgId = new Map(localMinistries.map((m) => [m.orgchart_id, m]));

      // ── Diff ministries linked to orgchart ──
      for (const local of localMinistries) {
        const orgNode = orgNodeById.get(local.orgchart_id);
        if (!orgNode) {
          // Linked node disappeared → queue ministry_deleted
          queueRows.push({
            sync_run_id: runId,
            change_type: 'ministry_deleted',
            entity_type: 'ministry',
            entity_id: local.id,
            orgchart_id: local.orgchart_id,
            before: { name_en: local.name_en, parent_ministry_id: local.parent_ministry_id },
            after: null,
          });
          continue;
        }

        // Auto-apply: rename
        const updates: Record<string, unknown> = {};
        if (orgNode.title && orgNode.title !== local.name_en) {
          updates.name_en = orgNode.title;
          updates.name_fr = orgNode.title; // orgchart titles aren't bilingual today
        }
        // Auto-apply: status flip
        if (orgNode.status && ['active', 'vacant', 'inactive'].includes(orgNode.status) && orgNode.status !== local.status) {
          updates.status = orgNode.status;
        }
        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          const { error: upErr } = await supabaseAdmin.from('ministries').update(updates).eq('id', local.id);
          if (upErr) summary.errors++;
          else summary.auto_applied++;
        }

        // Reparent detection: queue if orgchart's parent for this node maps to a different
        // local ministry than what xpandify has stored.
        const orgParentId = treeParents.get(local.orgchart_id) ?? null;
        const expectedLocalParent = orgParentId ? localMinistryByOrgId.get(orgParentId)?.id ?? null : null;
        if (local.parent_ministry_id !== expectedLocalParent) {
          queueRows.push({
            sync_run_id: runId,
            change_type: 'ministry_reparented',
            entity_type: 'ministry',
            entity_id: local.id,
            orgchart_id: local.orgchart_id,
            before: { parent_ministry_id: local.parent_ministry_id },
            after: { parent_ministry_id: expectedLocalParent, parent_orgchart_id: orgParentId },
          });
        }
      }

      // ── Diff people linked to orgchart ──
      for (const local of localPeople) {
        const orgPerson = orgPeopleById.get(local.orgchart_id);
        if (!orgPerson) {
          queueRows.push({
            sync_run_id: runId,
            change_type: 'person_deleted',
            entity_type: 'person',
            entity_id: local.id,
            orgchart_id: local.orgchart_id,
            before: { first_name: local.first_name, last_name: local.last_name },
            after: null,
          });
        }
        // Person renames are not auto-applied: orgchart's personName is not split into first/last
        // reliably enough to mutate user-facing identity without review.
      }

      // ── Insert new ministries that orgchart added since last sync ──
      for (const [orgId, orgNode] of orgNodeById.entries()) {
        if (!['ministry-system', 'department', 'team', 'program'].includes(orgNode.category)) continue;
        if (localMinistryByOrgId.has(orgId)) continue;
        // Find parent in xpandify (must already be linked).
        const orgParentId = treeParents.get(orgId) ?? null;
        const localParentId = orgParentId ? localMinistryByOrgId.get(orgParentId)?.id ?? null : null;
        const { error: insErr, data: inserted } = await supabaseAdmin
          .from('ministries')
          .insert({
            name_en: orgNode.title,
            name_fr: orgNode.title,
            orgchart_id: orgId,
            parent_ministry_id: localParentId,
            status: ['active', 'vacant', 'inactive'].includes(orgNode.status) ? orgNode.status : 'active',
          })
          .select('id')
          .single();
        if (insErr) {
          summary.errors++;
        } else if (inserted) {
          summary.auto_applied++;
          // Index newly inserted row so deeper children in this same run see it as a parent.
          localMinistryByOrgId.set(orgId, {
            id: inserted.id,
            name_en: orgNode.title,
            name_fr: orgNode.title,
            status: 'active',
            orgchart_id: orgId,
            parent_ministry_id: localParentId,
            leader_id: null,
            deleted_at: null,
          });
        }
      }

      // ── Insert new people that orgchart added (skip vacant slots) ──
      for (const orgP of orgPeople) {
        if (!orgP.personName || orgP.status === 'vacant') continue;
        if (localPersonByOrgId.has(orgP.id)) continue;
        const { first, last } = splitName(orgP.personName);
        const { error: insErr } = await supabaseAdmin.from('people').insert({
          first_name: first,
          last_name: last,
          orgchart_id: orgP.id,
          person_type: 'volunteer',
          status: 'active',
          primary_language: 'en',
        });
        if (insErr) summary.errors++;
        else summary.auto_applied++;
      }

      // ── Persist queued review items ──
      if (queueRows.length > 0) {
        const { error: qErr } = await supabaseAdmin.from('orgchart_sync_review_queue').insert(queueRows);
        if (qErr) {
          summary.errors++;
        } else {
          summary.queued_for_review = queueRows.length;
        }
      }

      // ── Mark run as succeeded ──
      await supabaseAdmin
        .from('orgchart_sync_runs')
        .update({ status: 'succeeded', finished_at: new Date().toISOString(), summary })
        .eq('id', runId);

      return new Response(JSON.stringify({ run_id: runId, summary }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (innerErr) {
      const message = innerErr instanceof Error ? innerErr.message : String(innerErr);
      await supabaseAdmin
        .from('orgchart_sync_runs')
        .update({ status: 'failed', finished_at: new Date().toISOString(), error_message: message, summary })
        .eq('id', runId);
      return new Response(JSON.stringify({ run_id: runId, error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
