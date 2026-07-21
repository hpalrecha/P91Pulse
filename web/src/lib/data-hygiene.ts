// Shared data-hygiene helpers for the admin tabs (Dashboard / User Mgmt / Lead Mgmt).
// One definition of "test row" and "de-dupe by phone" so every tab filters the same way
// instead of each reinventing client-side filters. See docs/data-flow/5-SYNC-PLAN-*.md (P2/P3).

// Internal/test accounts that should never appear in partner/lead lists. `jaggi` is the
// owner/admin test identity (jaggi123@gmail.com); `test` catches seeded/QA rows.
const TEST_RE = /(jaggi|test)/i;

/** True if a record looks like internal/test/QA data (matched on name/email/username). */
export function isTestRecord(rec: any): boolean {
  if (!rec) return false;
  return TEST_RE.test(rec.name || "") ||
    TEST_RE.test(rec.email || "") ||
    TEST_RE.test(rec.username || "");
}

/** Last 10 digits — the de-facto person identity (matches the backend partner-match rule). */
function phoneKey(phone: any): string {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

function rowRecency(r: any): number {
  const t = Date.parse(r?.updatedAt || r?.updated_at || r?.erp_modified || "");
  return Number.isNaN(t) ? (Number(r?.id) || 0) : t;
}

/**
 * Collapse duplicate rows that share a phone number (the Lead+Opportunity split — one person,
 * many `customers` rows). Keeps the most-recently-updated row per phone; rows without a usable
 * phone are all kept (we can't safely merge them). This is the display-side approximation of the
 * real `party_name` merge documented in Doc 6 — it does not mutate the DB.
 */
export function dedupeByPhone<T>(rows: T[]): T[] {
  const best = new Map<string, T>();
  const out: T[] = [];
  for (const r of rows) {
    const key = phoneKey((r as any).phone);
    if (!key) { out.push(r); continue; }
    const prev = best.get(key);
    if (!prev || rowRecency(r) >= rowRecency(prev)) best.set(key, r);
  }
  return out.concat(Array.from(best.values()));
}

/** Distinct non-empty values of a field, sorted — for building filter dropdowns from live data. */
export function distinctValues(rows: any[], field: string): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = r?.[field];
    if (v !== null && v !== undefined && String(v).trim() !== "") set.add(String(v));
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
