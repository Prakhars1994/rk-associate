// Nightly database backup to R2 (the quotation promises daily backups; the Supabase free plan has none).
// Runs from the Worker's cron trigger. Each run writes backups/YYYY-MM-DD.json.gz and prunes copies older than KEEP_DAYS.
import { serviceClient } from './api/lib/supabase.js';

export const BACKUP_TABLES = [
  'profiles', 'courses', 'course_modules', 'course_module_content', 'enrollments', 'module_progress',
  'free_resources', 'payments', 'tickets', 'ticket_comments', 'files', 'certificates', 'activity_logs', 'settings', 'enquiries',
];
export const KEEP_DAYS = 30;
const PAGE = 1000;

async function dumpTable(svc, table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await svc.from(table).select('*').range(from, from + PAGE - 1);
    if (error) {
      // A table missing in this database shouldn't stop the whole backup.
      if (error.code === '42P01' || error.code === 'PGRST205') return { rows: [], skipped: error.message };
      throw new Error(`${table}: ${error.message}`);
    }
    rows.push(...data);
    if (data.length < PAGE) return { rows };
  }
}

async function gzip(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function runBackup(env, now = new Date()) {
  const svc = serviceClient(env);
  const tables = {};
  const counts = {};
  const skipped = {};
  for (const t of BACKUP_TABLES) {
    const { rows, skipped: why } = await dumpTable(svc, t);
    tables[t] = rows;
    counts[t] = rows.length;
    if (why) skipped[t] = why;
  }
  const day = now.toISOString().slice(0, 10);
  const key = `backups/${day}.json.gz`;
  const body = await gzip(JSON.stringify({ created_at: now.toISOString(), tables }));
  await env.FILES.put(key, body, {
    httpMetadata: { contentType: 'application/json', contentEncoding: 'gzip' },
    customMetadata: { counts: JSON.stringify(counts), ...(Object.keys(skipped).length ? { skipped: JSON.stringify(skipped) } : {}) },
  });

  // Prune: keys sort by date, so anything before the cutoff day is old.
  const cutoff = new Date(now.getTime() - KEEP_DAYS * 864e5).toISOString().slice(0, 10);
  const listed = await env.FILES.list({ prefix: 'backups/' });
  const old = listed.objects.map((o) => o.key).filter((k) => k.slice(8, 18) < cutoff);
  if (old.length) await env.FILES.delete(old);

  return { key, bytes: body.byteLength, counts, skipped, pruned: old.length };
}
