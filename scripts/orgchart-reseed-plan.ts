#!/usr/bin/env -S npx tsx
/**
 * Orgchart Reseed Planner
 *
 * Reads:
 *   tmp/reseed/orgchart_tree.json       (live snapshot of mcorgchart /tree)
 *   tmp/reseed/orgchart_ministries.json (live snapshot of /ministries)
 *   tmp/reseed/orgchart_departments.json (live snapshot of /departments)
 *   tmp/reseed/ministries.csv           (xpandify export)
 *   tmp/reseed/people_ministries.csv    (xpandify export)
 *   tmp/reseed/goals_ministry.csv       (xpandify export, goals with owner_ministry_id)
 *   tmp/reseed/meetings_ministry.csv    (xpandify export)
 *   tmp/reseed/events_ministry.csv      (xpandify export)
 *
 * Writes:
 *   docs/orgchart-reseed-plan.md  — human-reviewable plan
 *   tmp/reseed/plan.json          — machine-readable plan, consumed by the
 *                                   apply / rollback SQL generators
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────
interface OrgTreeNode {
  id: string;
  title: string;
  category: string;
  status: string;
  children: OrgTreeNode[];
}
interface OrgMinistry {
  id: string;
  title: string;
  status: string;
  departmentCount: number;
  peopleCount: number;
  departments: { id: string; title: string; status: string }[];
}
interface OrgDepartment {
  id: string;
  title: string;
  status: string;
  ministry: string | null;
}
interface XpMinistry {
  id: string;
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  leader_id: string;
  parent_ministry_id: string;
  orgchart_id: string;
  status: string;
  deleted_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// CSV reader (handles quoted fields with commas)
// ─────────────────────────────────────────────────────────────────────────
function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const fields = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = fields[i] ?? ''));
    return row;
  });
}
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Load inputs
// ─────────────────────────────────────────────────────────────────────────
const tmp = resolve('tmp/reseed');
const tree: OrgTreeNode[] = JSON.parse(readFileSync(`${tmp}/orgchart_tree.json`, 'utf8')).data;
const orgMinistries: OrgMinistry[] = JSON.parse(readFileSync(`${tmp}/orgchart_ministries.json`, 'utf8')).data;
const orgDepartments: OrgDepartment[] = JSON.parse(readFileSync(`${tmp}/orgchart_departments.json`, 'utf8')).data;

const xpMinistries = parseCsv(readFileSync(`${tmp}/ministries.csv`, 'utf8')) as unknown as XpMinistry[];
const peopleMinistries = parseCsv(readFileSync(`${tmp}/people_ministries.csv`, 'utf8'));
const goals = parseCsv(readFileSync(`${tmp}/goals_ministry.csv`, 'utf8'));
const meetings = parseCsv(readFileSync(`${tmp}/meetings_ministry.csv`, 'utf8'));
const events = parseCsv(readFileSync(`${tmp}/events_ministry.csv`, 'utf8'));

// ─────────────────────────────────────────────────────────────────────────
// Build orgchart structure: top-level ministries + their departments + their nested teams
// ─────────────────────────────────────────────────────────────────────────
interface OrgNode {
  id: string;
  title: string;
  parentId: string | null;
  level: 'ministry' | 'department' | 'team';
}

const orgNodes: OrgNode[] = [];

// Walk tree, capturing ministry-system nodes and everything beneath them.
function walk(node: OrgTreeNode, parentId: string | null) {
  const cat = (node as { category?: string }).category;
  let level: OrgNode['level'] | null = null;
  if (cat === 'ministry-system') level = 'ministry';
  else if (cat === 'department') level = 'department';
  else if (cat === 'team' || cat === 'program') level = 'team';

  if (level) {
    orgNodes.push({ id: node.id, title: node.title, parentId, level });
    parentId = node.id;
  }
  // else: skip leadership/executive layers; do not propagate as parent.

  for (const c of node.children ?? []) walk(c, parentId);
}
for (const root of tree) walk(root, null);

// Sanity: orgMinistries should equal the ministry-level entries we collected.
const ministryIdsFromTree = new Set(orgNodes.filter((n) => n.level === 'ministry').map((n) => n.id));
const ministryIdsFromApi = new Set(orgMinistries.map((m) => m.id));
if (ministryIdsFromApi.size !== ministryIdsFromTree.size) {
  console.warn(
    `[warn] /tree gave ${ministryIdsFromTree.size} ministries; /ministries gave ${ministryIdsFromApi.size}. Investigate before applying.`,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Manual overrides — decisions Pastor / Kouame approved on the dry-run plan.
// Each override is a (short xp id prefix → orgchart node title) pair, looked up
// against orgNodes by exact title to resolve to a real orgchart_id.
// Soft-delete overrides specify a retarget xp id (short prefix).
// ─────────────────────────────────────────────────────────────────────────
type Override =
  | { xp_prefix: string; action: 'keep'; org_title: string; org_level: 'ministry' | 'department' | 'team' }
  | { xp_prefix: string; action: 'delete'; retarget_xp_prefix: string | null };

const OVERRIDES: Override[] = [
  // Approved fuzzy keeps
  { xp_prefix: '6dd3d295', action: 'keep', org_title: 'Communication Team', org_level: 'department' },
  { xp_prefix: '684a1fd6', action: 'keep', org_title: 'Discipleship & Spiritual Formation', org_level: 'ministry' },
  { xp_prefix: '557d577e', action: 'keep', org_title: 'Guest Services', org_level: 'department' },
  { xp_prefix: 'e0051635', action: 'keep', org_title: 'Membership Management', org_level: 'department' },
  { xp_prefix: 'efafcfae', action: 'keep', org_title: 'Next Steps English', org_level: 'department' },
  { xp_prefix: 'dfb94591', action: 'keep', org_title: 'Outreach & Mission', org_level: 'ministry' },
  { xp_prefix: 'a109b62d', action: 'keep', org_title: 'Guest Services', org_level: 'department' },
  { xp_prefix: 'f50612a7', action: 'keep', org_title: 'Sound', org_level: 'department' },
  { xp_prefix: '5179488b', action: 'keep', org_title: 'Technology', org_level: 'department' },
  { xp_prefix: '1cb97af6', action: 'keep', org_title: 'Ushers', org_level: 'department' },

  // Soft-deletes with explicit retarget overrides for rows whose ancestor walk fails
  { xp_prefix: 'e44e3134', action: 'delete', retarget_xp_prefix: '684a1fd6' }, // "Discipleship" goals → "Discipleship Ministry" (kept)
  { xp_prefix: '11111111-1111-1111-1111-111111111104', action: 'delete', retarget_xp_prefix: 'dfb94591' }, // "Outreach & Missions" → "Outreach Ministry"
  { xp_prefix: '2d308bd8', action: 'delete', retarget_xp_prefix: '6d6b7797' }, // "Prayer Teams" → "Prayer Ministry"
  { xp_prefix: '0b8ec928', action: 'delete', retarget_xp_prefix: '60475845' }, // "Kingdom Kidz" → "Kids Ministry"
  { xp_prefix: 'd1f16655', action: 'delete', retarget_xp_prefix: 'NEXTGEN' }, // resolved post-hoc to the inserted "Next Gen Ministry" row
  { xp_prefix: '69657b57', action: 'delete', retarget_xp_prefix: 'NEXTGEN' },
  { xp_prefix: '76b75fda', action: 'delete', retarget_xp_prefix: 'NEXTGEN' }, // "Young Adults Ministry"
  { xp_prefix: '79c14313', action: 'delete', retarget_xp_prefix: 'NEXTGEN' }, // "Students Ministry"
  { xp_prefix: 'd8e36ab9', action: 'delete', retarget_xp_prefix: 'SAC_WED' }, // "Sacraments & Special Services" → orgchart "Sacrements & Weddings"
];

// Indexes
const overrideByPrefix = new Map<string, Override>();
for (const o of OVERRIDES) overrideByPrefix.set(o.xp_prefix, o);
function findOverride(xpId: string): Override | undefined {
  for (const [prefix, ov] of overrideByPrefix.entries()) {
    if (xpId.startsWith(prefix)) return ov;
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────
// Match xpandify ministries to orgchart nodes
// ─────────────────────────────────────────────────────────────────────────
function norm(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\b(ministry|ministries|team|services|services|program|programs)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Match {
  xp: XpMinistry;
  // exactly one of these is non-null on a successful match
  matchedOrgNode: OrgNode | null;
  // when null, the row has no counterpart → soft-delete
  reason: string;
}

const matches: Match[] = [];
for (const xp of xpMinistries) {
  // Manual override has highest priority.
  const ov = findOverride(xp.id);
  if (ov) {
    if (ov.action === 'keep') {
      const node = orgNodes.find((n) => n.title === ov.org_title && n.level === ov.org_level);
      if (!node) {
        throw new Error(`Override for ${xp.id} (${xp.name_en}) names orgchart "${ov.org_title}" [${ov.org_level}] but no such node was found. Fix OVERRIDES.`);
      }
      matches.push({ xp, matchedOrgNode: node, reason: 'manual override (keep)' });
      continue;
    }
    if (ov.action === 'delete') {
      matches.push({ xp, matchedOrgNode: null, reason: 'manual override (delete)' });
      continue;
    }
  }

  const normXpEn = norm(xp.name_en);
  const normXpFr = norm(xp.name_fr);

  // Two-tier matching:
  //   1. exact normalized match → auto-decide (safe)
  //   2. fuzzy candidates → surface in the report for human review
  const exactHits = orgNodes.filter((n) => {
    const normOrg = norm(n.title);
    if (!normOrg) return false;
    return normOrg === normXpEn || (normXpFr && normOrg === normXpFr);
  });
  if (exactHits.length === 1) {
    matches.push({ xp, matchedOrgNode: exactHits[0], reason: 'exact name match' });
    continue;
  }
  if (exactHits.length > 1) {
    matches.push({
      xp,
      matchedOrgNode: null,
      reason: `ambiguous: ${exactHits.length} exact matches (${exactHits.map((h) => h.title).join(', ')})`,
    });
    continue;
  }
  // Fuzzy: collect substring matches (either direction) as candidates.
  const fuzzyHits = orgNodes.filter((n) => {
    const normOrg = norm(n.title);
    if (!normOrg) return false;
    if (normOrg.includes(normXpEn) || normXpEn.includes(normOrg)) return true;
    if (normXpFr && (normOrg.includes(normXpFr) || normXpFr.includes(normOrg))) return true;
    return false;
  });
  if (fuzzyHits.length === 0) {
    matches.push({ xp, matchedOrgNode: null, reason: 'no orgchart counterpart' });
  } else {
    matches.push({
      xp,
      matchedOrgNode: null,
      reason: `needs decision: ${fuzzyHits.length} candidate(s) — ${fuzzyHits.map((h) => `${h.title} [${h.level}]`).join('; ')}`,
    });
  }
}

// Detect xp→orgnode collisions (two xp rows mapping to the same orgnode → keep one)
const byOrgId = new Map<string, Match[]>();
for (const m of matches) {
  if (!m.matchedOrgNode) continue;
  const arr = byOrgId.get(m.matchedOrgNode.id) ?? [];
  arr.push(m);
  byOrgId.set(m.matchedOrgNode.id, arr);
}

// For collisions, pick the survivor by highest activity (goal+meeting+event+member counts), tie-break by oldest id.
function activityCount(xpId: string): number {
  let n = 0;
  for (const g of goals) if (g.owner_ministry_id === xpId) n++;
  for (const m of meetings) if (m.ministry_id === xpId) n++;
  for (const e of events) if (e.ministry_id === xpId) n++;
  for (const pm of peopleMinistries) if (pm.ministry_id === xpId) n++;
  return n;
}

for (const [orgId, group] of byOrgId.entries()) {
  if (group.length < 2) continue;
  group.sort((a, b) => {
    const aa = activityCount(a.xp.id);
    const bb = activityCount(b.xp.id);
    if (aa !== bb) return bb - aa;
    return a.xp.id.localeCompare(b.xp.id);
  });
  // Keep group[0] linked; convert the rest to "duplicate of survivor" → soft-delete + retarget
  for (let i = 1; i < group.length; i++) {
    group[i].matchedOrgNode = null;
    group[i].reason = `duplicate of ${group[0].xp.name_en} (${group[0].xp.id})`;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Build action list per xp row + new rows to insert for orgchart nodes
//   that have no xp counterpart
// ─────────────────────────────────────────────────────────────────────────
interface KeepAction {
  type: 'keep';
  xp_id: string;
  xp_name_en: string;
  new_name_en: string;
  new_name_fr: string;
  orgchart_id: string;
  new_parent_xp_id: string | null; // resolved post-hoc
  new_parent_orgchart_id: string | null;
  level: OrgNode['level'];
}
interface SoftDeleteAction {
  type: 'soft_delete';
  xp_id: string;
  xp_name_en: string;
  reason: string;
  // FK retargets — null target = orphan (no FK move)
  retarget_xp_id: string | null;
  retarget_label: string;
  goals_count: number;
  meetings_count: number;
  events_count: number;
  members_count: number;
}
interface InsertAction {
  type: 'insert';
  new_xp_id: string; // generated UUID v4
  name_en: string;
  name_fr: string;
  orgchart_id: string;
  parent_orgchart_id: string | null;
  parent_xp_id: string | null; // resolved post-hoc
  level: OrgNode['level'];
}
type Action = KeepAction | SoftDeleteAction | InsertAction;

const actions: Action[] = [];
const orgIdToXpId = new Map<string, string>(); // resolves parent_xp_id

// 1. KEEP actions for matched rows
for (const m of matches) {
  if (!m.matchedOrgNode) continue;
  const node = m.matchedOrgNode;
  actions.push({
    type: 'keep',
    xp_id: m.xp.id,
    xp_name_en: m.xp.name_en,
    new_name_en: node.title,
    new_name_fr: node.title, // orgchart titles are not bilingual today; use same value
    orgchart_id: node.id,
    new_parent_xp_id: null,
    new_parent_orgchart_id: node.parentId,
    level: node.level,
  });
  orgIdToXpId.set(node.id, m.xp.id);
}

// 2. INSERT actions for orgchart nodes with no matched xp row
for (const node of orgNodes) {
  if (orgIdToXpId.has(node.id)) continue;
  const newId = crypto.randomUUID();
  actions.push({
    type: 'insert',
    new_xp_id: newId,
    name_en: node.title,
    name_fr: node.title,
    orgchart_id: node.id,
    parent_orgchart_id: node.parentId,
    parent_xp_id: null,
    level: node.level,
  });
  orgIdToXpId.set(node.id, newId);
}

// 3. Resolve parent_xp_id on KEEP and INSERT now that orgIdToXpId is fully built
for (const a of actions) {
  if (a.type === 'keep') {
    a.new_parent_xp_id = a.new_parent_orgchart_id ? orgIdToXpId.get(a.new_parent_orgchart_id) ?? null : null;
  } else if (a.type === 'insert') {
    a.parent_xp_id = a.parent_orgchart_id ? orgIdToXpId.get(a.parent_orgchart_id) ?? null : null;
  }
}

// 4. SOFT-DELETE actions for unmatched xp rows + pick FK retargets
//    Retarget rule:
//      a. If row name normalizes to an orgchart node title, that's the target (already matched, won't happen here)
//      b. If row's parent_ministry_id is a kept xp row, retarget to parent
//      c. If parent_ministry_id is itself a soft-delete row, walk up to the first kept ancestor
//      d. Otherwise → orphan (null target)
const xpById = new Map(xpMinistries.map((x) => [x.id, x]));
const survivorIds = new Set(actions.filter((a) => a.type === 'keep').map((a) => (a as KeepAction).xp_id));

function findSurvivorAncestor(xpId: string, depth = 0): string | null {
  if (depth > 10) return null;
  const row = xpById.get(xpId);
  if (!row || !row.parent_ministry_id) return null;
  // Skip parent links to placeholder seed IDs (11111111-… etc.) that don't resolve.
  if (!xpById.has(row.parent_ministry_id)) return null;
  if (survivorIds.has(row.parent_ministry_id)) return row.parent_ministry_id;
  return findSurvivorAncestor(row.parent_ministry_id, depth + 1);
}

// Fallback: find a survivor by closest normalized name (substring either direction).
// Used when ancestry walk gives nothing.
function findSurvivorByName(xpName: string): { id: string; label: string } | null {
  const n = norm(xpName);
  if (!n) return null;
  for (const survivorId of survivorIds) {
    const s = xpById.get(survivorId);
    if (!s) continue;
    const sn = norm(s.name_en);
    if (sn === n) return { id: survivorId, label: s.name_en };
  }
  // Loose: pick a survivor whose name strictly contains the unmatched name as a whole word.
  for (const survivorId of survivorIds) {
    const s = xpById.get(survivorId);
    if (!s) continue;
    const sn = norm(s.name_en);
    if (sn && (sn.includes(` ${n} `) || sn.startsWith(`${n} `) || sn.endsWith(` ${n}`) || sn === n)) {
      return { id: survivorId, label: s.name_en };
    }
  }
  return null;
}

// Pre-resolve sentinel retargets to actual xp ids by orgchart title.
const insertedByTitle = new Map<string, string>();
for (const a of actions) {
  if (a.type !== 'insert') continue;
  insertedByTitle.set(a.name_en, a.new_xp_id);
}
const SENTINEL_TO_TITLE: Record<string, string> = {
  NEXTGEN: 'Next Gen Ministry',
  SAC_WED: 'Sacrements & Weddings',
};

for (const m of matches) {
  if (m.matchedOrgNode) continue;
  const xpId = m.xp.id;
  let retargetId: string | null = null;
  let retargetSource = '';

  // Highest priority: explicit override retarget.
  const ov = findOverride(xpId);
  if (ov && ov.action === 'delete' && ov.retarget_xp_prefix) {
    if (SENTINEL_TO_TITLE[ov.retarget_xp_prefix]) {
      const title = SENTINEL_TO_TITLE[ov.retarget_xp_prefix];
      const id = insertedByTitle.get(title);
      if (!id) throw new Error(`Override sentinel ${ov.retarget_xp_prefix} (${title}) did not resolve to an inserted row.`);
      retargetId = id;
      retargetSource = `override → ${title}`;
    } else {
      // Match by xp id prefix against existing rows.
      const target = xpMinistries.find((x) => x.id.startsWith(ov.retarget_xp_prefix!));
      if (!target) throw new Error(`Override retarget prefix ${ov.retarget_xp_prefix} for ${xpId} did not match any xp row.`);
      retargetId = target.id;
      retargetSource = `override → ${target.name_en}`;
    }
  }

  if (!retargetId) {
    retargetId = findSurvivorAncestor(xpId);
    if (retargetId) retargetSource = 'ancestor';
  }
  if (!retargetId) {
    const byName = findSurvivorByName(m.xp.name_en);
    if (byName) {
      retargetId = byName.id;
      retargetSource = 'name';
    }
  }
  let retargetName = '(unknown)';
  if (retargetId) {
    const existing = xpById.get(retargetId);
    if (existing) {
      retargetName = existing.name_en;
    } else {
      // Inserted row — look up by id reverse from insertedByTitle
      for (const [title, id] of insertedByTitle.entries()) {
        if (id === retargetId) { retargetName = title; break; }
      }
    }
  }
  const retargetLabel = retargetId
    ? `${retargetName} (via ${retargetSource})`
    : 'ORPHAN — needs manual target';

  actions.push({
    type: 'soft_delete',
    xp_id: xpId,
    xp_name_en: m.xp.name_en,
    reason: m.reason,
    retarget_xp_id: retargetId,
    retarget_label: retargetLabel,
    goals_count: goals.filter((g) => g.owner_ministry_id === xpId).length,
    meetings_count: meetings.filter((mg) => mg.ministry_id === xpId).length,
    events_count: events.filter((e) => e.ministry_id === xpId).length,
    members_count: peopleMinistries.filter((p) => p.ministry_id === xpId).length,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Write outputs
// ─────────────────────────────────────────────────────────────────────────
mkdirSync('docs', { recursive: true });

const md: string[] = [];
md.push('# Orgchart Reseed Plan — Dry Run');
md.push('');
md.push(`Generated: ${new Date().toISOString()}`);
md.push('');
md.push('Source of truth: mcorgchart `/tree` + `/ministries` + `/departments` (cached in `tmp/reseed/orgchart_*.json`).');
md.push('Xpandify state: CSV exports from prod (cached in `tmp/reseed/*.csv`).');
md.push('');
md.push('## Summary');
md.push('');
const keepCount = actions.filter((a) => a.type === 'keep').length;
const insertCount = actions.filter((a) => a.type === 'insert').length;
const deleteCount = actions.filter((a) => a.type === 'soft_delete').length;
const orphanCount = actions.filter((a) => a.type === 'soft_delete' && (a as SoftDeleteAction).retarget_xp_id === null && ((a as SoftDeleteAction).goals_count + (a as SoftDeleteAction).meetings_count + (a as SoftDeleteAction).events_count + (a as SoftDeleteAction).members_count > 0)).length;
md.push(`- **Keep + relink** xpandify rows: **${keepCount}**`);
md.push(`- **Insert** new xpandify rows for orgchart nodes missing locally: **${insertCount}**`);
md.push(`- **Soft-delete** xpandify rows with no orgchart counterpart: **${deleteCount}**`);
md.push(`- Soft-deletes whose attached data has no surviving ancestor (orphan risk): **${orphanCount}**`);
md.push('');
md.push(`Total xpandify ministries before: ${xpMinistries.length}. After: ${keepCount + insertCount} active + ${deleteCount} soft-deleted.`);
md.push('');

md.push('## Target tree (orgchart structure that xpandify will mirror)');
md.push('');
function renderTree(parentOrgId: string | null, depth: number) {
  const children = orgNodes.filter((n) => n.parentId === parentOrgId);
  for (const c of children) {
    const indent = '  '.repeat(depth);
    const xpId = orgIdToXpId.get(c.id);
    const action = actions.find((a) => (a.type === 'keep' && a.xp_id === xpId) || (a.type === 'insert' && a.new_xp_id === xpId));
    const tag = action?.type === 'keep' ? `keep ${(action as KeepAction).xp_id.slice(0, 8)}` : action?.type === 'insert' ? `insert ${(action as InsertAction).new_xp_id.slice(0, 8)}` : '?';
    md.push(`${indent}- ${c.title} _(${c.level}, ${tag}, orgchart_id=${c.id.slice(0, 8)})_`);
    renderTree(c.id, depth + 1);
  }
}
renderTree(null, 0);
md.push('');

md.push('## Keep + relink');
md.push('');
md.push('| xp id | current name | → new name | new parent | orgchart_id | level |');
md.push('|---|---|---|---|---|---|');
for (const a of actions.filter((x) => x.type === 'keep') as KeepAction[]) {
  const parent = a.new_parent_orgchart_id ? orgNodes.find((n) => n.id === a.new_parent_orgchart_id)?.title ?? '?' : '_(top level)_';
  md.push(`| \`${a.xp_id.slice(0, 8)}\` | ${a.xp_name_en} | ${a.new_name_en} | ${parent} | \`${a.orgchart_id.slice(0, 8)}\` | ${a.level} |`);
}
md.push('');

md.push('## Insert (new xpandify rows for orgchart nodes missing locally)');
md.push('');
md.push('| new xp id | name | parent | orgchart_id | level |');
md.push('|---|---|---|---|---|');
for (const a of actions.filter((x) => x.type === 'insert') as InsertAction[]) {
  const parent = a.parent_orgchart_id ? orgNodes.find((n) => n.id === a.parent_orgchart_id)?.title ?? '?' : '_(top level)_';
  md.push(`| \`${a.new_xp_id.slice(0, 8)}\` | ${a.name_en} | ${parent} | \`${a.orgchart_id.slice(0, 8)}\` | ${a.level} |`);
}
md.push('');

md.push('## Soft-delete + FK retarget');
md.push('');
md.push('Each row\'s goals / meetings / events / `people_ministries` get repointed to the **retarget** before the row is soft-deleted (`deleted_at = now()`). The row is preserved for audit and can be restored by the rollback script.');
md.push('');

const softDeletes = actions.filter((x) => x.type === 'soft_delete') as SoftDeleteAction[];
const needsDecision = softDeletes.filter((a) => a.reason.startsWith('needs decision') || a.reason.startsWith('ambiguous'));
const noCounterpart = softDeletes.filter((a) => a.reason === 'no orgchart counterpart');

md.push('### ⚠️ Needs your decision (had fuzzy candidates)');
md.push('');
md.push('Each row below has one or more orgchart candidates but no exact name match. Reply with one of:');
md.push('- `keep <xp_id_short> as <orgchart node title>` to relink to that orgchart node');
md.push('- `delete <xp_id_short>` to confirm soft-delete');
md.push('- `delete <xp_id_short> retarget <xp_id_short>` to override the retarget');
md.push('');
md.push('| xp id | name | candidates | retarget | goals | meetings | events | members |');
md.push('|---|---|---|---|---:|---:|---:|---:|');
for (const a of needsDecision) {
  md.push(`| \`${a.xp_id.slice(0, 8)}\` | ${a.xp_name_en} | ${a.reason.replace(/^needs decision: \d+ candidate\(s\) — /, '').replace(/^ambiguous: \d+ exact matches \(/, '').replace(/\)$/, '')} | ${a.retarget_label} | ${a.goals_count} | ${a.meetings_count} | ${a.events_count} | ${a.members_count} |`);
}
md.push('');

md.push('### Soft-delete (no orgchart counterpart at all)');
md.push('');
md.push('| xp id | name | retarget | goals | meetings | events | members |');
md.push('|---|---|---|---:|---:|---:|---:|');
for (const a of noCounterpart) {
  md.push(`| \`${a.xp_id.slice(0, 8)}\` | ${a.xp_name_en} | ${a.retarget_label} | ${a.goals_count} | ${a.meetings_count} | ${a.events_count} | ${a.members_count} |`);
}
md.push('');

md.push('## Orphan risk');
md.push('');
const orphans = (actions.filter((x) => x.type === 'soft_delete') as SoftDeleteAction[]).filter(
  (a) => a.retarget_xp_id === null && a.goals_count + a.meetings_count + a.events_count + a.members_count > 0,
);
if (orphans.length === 0) {
  md.push('_None._ Every soft-deleted row with attached data has a surviving ancestor.');
} else {
  md.push('These rows have attached data but no surviving ancestor. Apply will leave their FKs pointing at the soft-deleted row. **Manually pick a target before approving.**');
  md.push('');
  for (const o of orphans) {
    md.push(`- **${o.xp_name_en}** (\`${o.xp_id.slice(0, 8)}\`): ${o.goals_count} goals, ${o.meetings_count} meetings, ${o.events_count} events, ${o.members_count} members`);
  }
}
md.push('');

md.push('## Next steps');
md.push('');
md.push('1. Review this plan. Reply with any retargets you want to override (`X → Y instead`) or rows to keep that I marked for soft-delete.');
md.push('2. Once approved, the snapshot SQL (file 01) will be generated and committed.');
md.push('3. You paste file 01 into Supabase Studio, then file 02 (apply).');
md.push('4. The rollback SQL stays in `scripts/` — only paste if you need to undo.');

writeFileSync('docs/orgchart-reseed-plan.md', md.join('\n'));
writeFileSync('tmp/reseed/plan.json', JSON.stringify({ orgNodes, actions, orgIdToXpId: Array.from(orgIdToXpId.entries()) }, null, 2));

console.log(`Plan written: docs/orgchart-reseed-plan.md`);
console.log(`  keep:        ${keepCount}`);
console.log(`  insert:      ${insertCount}`);
console.log(`  soft-delete: ${deleteCount}`);
console.log(`  orphan risk: ${orphans.length}`);
