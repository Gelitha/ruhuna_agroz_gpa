// University of Ruhuna - Faculty of Agriculture
// Lightweight Vercel Serverless API for Temporary Supabase Beta Testing Database
// Keeps SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY strictly server-side.

import { createHash, timingSafeEqual } from 'node:crypto';

const MAX_PAYLOAD_BYTES = 65536; // 64 KB hard limit
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 45;

// In-memory sliding window rate limiter (per warm serverless instance)
const rateLimitMap = new Map<string, number[]>();

const PII_KEYS = new Set([
  'name',
  'studentname',
  'registrationnumber',
  'regno',
  'indexnumber',
  'email',
  'phone',
  'address',
  'backup',
  'localstorage',
  'password',
  'token',
  'geolocation',
  'lat',
  'lng',
  'ip'
]);

const VALID_PROGRAMMES = new Set(['ARMT', 'ABM', 'GT']);
const VALID_SEMESTERS = new Set(['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2']);

function isServerBetaActive(): boolean {
  if (process.env.VITE_BETA_MODE !== 'true') return false;
  const endDateStr = process.env.VITE_BETA_END_DATE;
  if (!endDateStr) return true;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(endDateStr.trim())
    ? `${endDateStr.trim()}T23:59:59.999Z`
    : endDateStr.trim();
  const endMs = Date.parse(normalized);
  if (Number.isNaN(endMs)) return true;
  return Date.now() <= endMs;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(key) || []).filter(ts => ts > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitMap.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);

  if (rateLimitMap.size > 2000) {
    for (const [k, list] of rateLimitMap.entries()) {
      if (list.every(ts => ts <= windowStart)) {
        rateLimitMap.delete(k);
      }
    }
  }
  return true;
}

function findPiiKey(value: unknown, depth = 0): string | null {
  if (depth > 8 || value === null || value === undefined || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findPiiKey(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (PII_KEYS.has(k.toLowerCase())) return k;
    const found = findPiiKey(v, depth + 1);
    if (found) return found;
  }
  return null;
}

function sanitizeObject(value: unknown, depth = 0): unknown {
  if (depth > 6) return null;
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.slice(0, 2000);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 250).map(item => sanitizeObject(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PII_KEYS.has(k.toLowerCase())) continue;
      out[k.slice(0, 64)] = sanitizeObject(v, depth + 1);
    }
    return out;
  }
  return null;
}

function isValidAnonId(val: unknown): val is string {
  return typeof val === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(val);
}

function isValidAnonSecret(val: unknown): val is string {
  return typeof val === 'string' && /^[a-zA-Z0-9_-]{16,128}$/.test(val);
}

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

function hashesMatch(storedHex: string, candidateHex: string): boolean {
  if (storedHex.length !== candidateHex.length) return false;
  try {
    return timingSafeEqual(Buffer.from(storedHex, 'hex'), Buffer.from(candidateHex, 'hex'));
  } catch {
    return false;
  }
}

function validateAcademicSnapshot(snapshot: Record<string, unknown> | null): string | null {
  if (!snapshot) return 'Missing snapshot object';
  if (typeof snapshot.snapshotHash !== 'string' || !/^[a-fA-F0-9]{6,64}$/.test(snapshot.snapshotHash)) {
    return 'Invalid snapshotHash';
  }
  if (typeof snapshot.programme !== 'string' || !VALID_PROGRAMMES.has(snapshot.programme)) {
    return 'Invalid programme';
  }
  if (
    snapshot.academicYear !== undefined &&
    (typeof snapshot.academicYear !== 'number' ||
      !Number.isInteger(snapshot.academicYear) ||
      snapshot.academicYear < 1 ||
      snapshot.academicYear > 4)
  ) {
    return 'Invalid academicYear';
  }
  if (
    snapshot.currentSemester !== undefined &&
    (typeof snapshot.currentSemester !== 'string' || !VALID_SEMESTERS.has(snapshot.currentSemester))
  ) {
    return 'Invalid currentSemester';
  }
  if (!Array.isArray(snapshot.courses)) {
    return 'Invalid courses array';
  }
  for (const c of snapshot.courses.slice(0, 250)) {
    if (!c || typeof c !== 'object') return 'Invalid course entry';
    const course = c as Record<string, unknown>;
    if (typeof course.code !== 'string' || course.code.length === 0 || course.code.length > 24) {
      return 'Invalid course code';
    }
    if (typeof course.credits !== 'number' || course.credits < 0 || course.credits > 30) {
      return 'Invalid course credits';
    }
  }
  if (snapshot.gpaSummary && typeof snapshot.gpaSummary === 'object') {
    const gpa = snapshot.gpaSummary as Record<string, unknown>;
    for (const field of ['actualCgpa', 'projectedCgpa']) {
      if (gpa[field] !== undefined && (typeof gpa[field] !== 'number' || gpa[field] < 0 || gpa[field] > 4.0)) {
        return `Invalid ${field}`;
      }
    }
  }
  return null;
}

async function supabaseRequest<T = unknown>(
  table: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  query = '',
  prefer = 'return=minimal',
  actionContext = 'unknown'
): Promise<{ ok: boolean; status: number; data?: T }> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { ok: false, status: 500 };
  }

  const endpoint = `${url.replace(/\/+$/, '')}/rest/v1/${table}${query}`;
  const response = await fetch(endpoint, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: prefer
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error('[beta-api] Supabase upstream error', {
      action: actionContext,
      table,
      method,
      status: response.status,
      detail: errText.slice(0, 240)
    });
    return { ok: false, status: response.status };
  }

  if (method === 'GET') {
    const data = (await response.json().catch(() => undefined)) as T | undefined;
    return { ok: true, status: response.status, data };
  }

  return { ok: true, status: response.status };
}

async function verifyUserOwnership(
  anonId: string,
  secretHash: string,
  actionContext: string
): Promise<{ exists: boolean; verified: boolean; hasNullSecret: boolean }> {
  const encodedId = encodeURIComponent(anonId);
  const res = await supabaseRequest<Array<{ anon_id: string; secret_hash: string | null }>>(
    'beta_users',
    'GET',
    undefined,
    `?anon_id=eq.${encodedId}&select=anon_id,secret_hash&limit=1`,
    'return=representation',
    actionContext
  );

  if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
    return { exists: false, verified: false, hasNullSecret: false };
  }

  const row = res.data[0];
  if (!row.secret_hash) {
    return { exists: true, verified: false, hasNullSecret: true };
  }

  return {
    exists: true,
    verified: hashesMatch(row.secret_hash, secretHash),
    hasNullSecret: false
  };
}

async function getLatestConsent(
  anonId: string,
  actionContext: string
): Promise<{ analyticsConsent: boolean; academicConsent: boolean; action: string } | null> {
  const encodedId = encodeURIComponent(anonId);
  const res = await supabaseRequest<
    Array<{ analytics_consent: boolean; academic_consent: boolean; action: string }>
  >(
    'beta_consents',
    'GET',
    undefined,
    `?anon_id=eq.${encodedId}&select=analytics_consent,academic_consent,action&order=created_at.desc&limit=1`,
    'return=representation',
    actionContext
  );

  if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
    return null;
  }

  const row = res.data[0];
  return {
    analyticsConsent: Boolean(row.analytics_consent),
    academicConsent: Boolean(row.academic_consent),
    action: row.action
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ ok: false, error: 'Beta database not configured' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({ ok: false, error: 'Payload too large' });
  }

  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
    }
    if (JSON.stringify(body).length > MAX_PAYLOAD_BYTES) {
      return res.status(413).json({ ok: false, error: 'Payload exceeds size limit' });
    }
  } catch {
    return res.status(400).json({ ok: false, error: 'Malformed JSON' });
  }

  const anonId = body.anonId;
  const anonSecret = body.anonSecret;
  const action = body.action;

  if (!isValidAnonId(anonId) || !isValidAnonSecret(anonSecret) || typeof action !== 'string') {
    return res.status(400).json({ ok: false, error: 'Missing or invalid credentials/action' });
  }

  // Reject any unexpected personal information anywhere in the payload
  const piiKey = findPiiKey(body);
  if (piiKey) {
    return res.status(400).json({ ok: false, error: 'Personal information is not permitted' });
  }

  // Allow users to delete submitted data even after the beta period ends; block all other actions
  if (action !== 'delete_user_data' && !isServerBetaActive()) {
    return res.status(410).json({ ok: false, error: 'Beta testing period is inactive or ended' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
  if (!checkRateLimit(`${clientIp}:${anonId}`)) {
    return res.status(429).json({ ok: false, error: 'Rate limit exceeded' });
  }

  const secretHash = hashSecret(anonSecret);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    switch (action) {
      case 'consent': {
        const ownership = await verifyUserOwnership(anonId, secretHash, action);
        if (ownership.exists && !ownership.verified && !ownership.hasNullSecret) {
          return res.status(403).json({ ok: false, error: 'Invalid ownership credential' });
        }

        const analyticsConsent = Boolean(body.analyticsConsent);
        const academicConsent = Boolean(body.academicConsent);
        const consentAction = ['granted', 'updated', 'withdrawn', 'deleted'].includes(String(body.consentAction))
          ? String(body.consentAction)
          : 'updated';

        const device = (sanitizeObject(body.device) as Record<string, unknown>) || {};
        if (analyticsConsent || academicConsent || ownership.hasNullSecret) {
          await supabaseRequest(
            'beta_users',
            'POST',
            {
              anon_id: anonId,
              secret_hash: secretHash,
              device_category: String(device.deviceCategory || 'unknown').slice(0, 32),
              browser: String(device.browser || 'unknown').slice(0, 64),
              os: String(device.os || 'unknown').slice(0, 64),
              screen_dimensions: String(device.screenDimensions || 'unknown').slice(0, 32),
              language_preference: String(device.languagePreference || 'en').slice(0, 16),
              last_seen_at: new Date().toISOString(),
              expires_at: expiresAt
            },
            '?on_conflict=anon_id',
            'resolution=merge-duplicates,return=minimal',
            action
          );
        }

        const consentRes = await supabaseRequest(
          'beta_consents',
          'POST',
          {
            anon_id: anonId,
            analytics_consent: analyticsConsent,
            academic_consent: academicConsent,
            consent_version: String(body.consentVersion || '1.0').slice(0, 16),
            action: consentAction,
            expires_at: expiresAt
          },
          '',
          'return=minimal',
          action
        );

        return res.status(consentRes.ok ? 200 : 502).json({ ok: consentRes.ok });
      }

      case 'session': {
        const ownership = await verifyUserOwnership(anonId, secretHash, action);
        if (!ownership.verified) {
          return res.status(403).json({ ok: false, error: 'Unauthorized browser credential' });
        }

        const consent = await getLatestConsent(anonId, action);
        if (!consent || !consent.analyticsConsent || consent.action === 'withdrawn' || consent.action === 'deleted') {
          return res.status(403).json({ ok: false, error: 'Analytics consent required' });
        }

        const sessionId = String(body.sessionId || '').slice(0, 64);
        if (!sessionId) return res.status(400).json({ ok: false, error: 'Missing sessionId' });

        const sessionRes = await supabaseRequest(
          'beta_sessions',
          'POST',
          {
            session_id: sessionId,
            anon_id: anonId,
            last_active_at: new Date().toISOString(),
            duration_seconds: Math.max(0, Math.min(86400, Number(body.durationSeconds) || 0)),
            views_visited: sanitizeObject(body.viewsVisited) || [],
            performance_metrics: sanitizeObject(body.performanceMetrics) || {},
            device_info: sanitizeObject(body.device) || {},
            expires_at: expiresAt
          },
          '?on_conflict=session_id',
          'resolution=merge-duplicates,return=minimal',
          action
        );

        return res.status(sessionRes.ok ? 200 : 502).json({ ok: sessionRes.ok });
      }

      case 'snapshot': {
        const ownership = await verifyUserOwnership(anonId, secretHash, action);
        if (!ownership.verified) {
          return res.status(403).json({ ok: false, error: 'Unauthorized browser credential' });
        }

        const consent = await getLatestConsent(anonId, action);
        if (!consent || !consent.academicConsent || consent.action === 'withdrawn' || consent.action === 'deleted') {
          return res.status(403).json({ ok: false, error: 'Academic diagnostic consent required' });
        }

        const snapshot = sanitizeObject(body.snapshot) as Record<string, unknown> | null;
        const validationError = validateAcademicSnapshot(snapshot);
        if (validationError || !snapshot) {
          return res.status(400).json({ ok: false, error: validationError || 'Invalid academic snapshot' });
        }

        const snapRes = await supabaseRequest(
          'beta_academic_snapshots',
          'POST',
          {
            anon_id: anonId,
            session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null,
            snapshot_hash: String(snapshot.snapshotHash).slice(0, 64),
            programme: String(snapshot.programme).slice(0, 16),
            academic_year: typeof snapshot.academicYear === 'number' ? snapshot.academicYear : null,
            current_semester: typeof snapshot.currentSemester === 'string' ? snapshot.currentSemester.slice(0, 16) : null,
            profile_count: typeof snapshot.profileCount === 'number' ? Math.max(1, Math.min(50, snapshot.profileCount)) : 1,
            courses: snapshot.courses || [],
            gpa_summary: snapshot.gpaSummary || {},
            planning_diagnostics: snapshot.planningDiagnostics || {},
            discrepancies: snapshot.discrepancies || [],
            expires_at: expiresAt
          },
          '?on_conflict=anon_id,snapshot_hash',
          'resolution=ignore-duplicates,return=minimal',
          action
        );

        return res.status(snapRes.ok ? 200 : 502).json({ ok: snapRes.ok });
      }

      case 'event': {
        const ownership = await verifyUserOwnership(anonId, secretHash, action);
        if (!ownership.verified) {
          return res.status(403).json({ ok: false, error: 'Unauthorized browser credential' });
        }

        const consent = await getLatestConsent(anonId, action);
        if (!consent || !consent.analyticsConsent || consent.action === 'withdrawn' || consent.action === 'deleted') {
          return res.status(403).json({ ok: false, error: 'Analytics consent required' });
        }

        const eventName = String(body.eventName || '').slice(0, 64);
        if (!eventName) return res.status(400).json({ ok: false, error: 'Missing eventName' });

        const evtRes = await supabaseRequest(
          'beta_events',
          'POST',
          {
            anon_id: anonId,
            session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null,
            event_name: eventName,
            feature_area: typeof body.featureArea === 'string' ? body.featureArea.slice(0, 64) : null,
            metadata: sanitizeObject(body.metadata) || {},
            expires_at: expiresAt
          },
          '',
          'return=minimal',
          action
        );

        return res.status(evtRes.ok ? 200 : 502).json({ ok: evtRes.ok });
      }

      case 'error': {
        const ownership = await verifyUserOwnership(anonId, secretHash, action);
        if (!ownership.verified) {
          return res.status(403).json({ ok: false, error: 'Unauthorized browser credential' });
        }

        const consent = await getLatestConsent(anonId, action);
        if (!consent || !consent.analyticsConsent || consent.action === 'withdrawn' || consent.action === 'deleted') {
          return res.status(403).json({ ok: false, error: 'Analytics consent required' });
        }

        const message = String(body.message || '').slice(0, 1000);
        if (!message) return res.status(400).json({ ok: false, error: 'Missing error message' });

        const errRes = await supabaseRequest(
          'beta_errors',
          'POST',
          {
            anon_id: anonId,
            session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null,
            error_type: String(body.errorType || 'runtime').slice(0, 64),
            message,
            source: typeof body.source === 'string' ? body.source.slice(0, 256) : null,
            stack_preview: typeof body.stackPreview === 'string' ? body.stackPreview.slice(0, 1000) : null,
            context: sanitizeObject(body.context) || {},
            expires_at: expiresAt
          },
          '',
          'return=minimal',
          action
        );

        return res.status(errRes.ok ? 200 : 502).json({ ok: errRes.ok });
      }

      case 'feedback': {
        const ownership = await verifyUserOwnership(anonId, secretHash, action);
        if (ownership.exists && !ownership.verified && !ownership.hasNullSecret) {
          return res.status(403).json({ ok: false, error: 'Unauthorized browser credential' });
        }

        const message = String(body.message || '').trim().slice(0, 2000);
        if (!message) return res.status(400).json({ ok: false, error: 'Feedback message is required' });

        if (!ownership.exists || ownership.hasNullSecret) {
          await supabaseRequest(
            'beta_users',
            'POST',
            {
              anon_id: anonId,
              secret_hash: secretHash,
              last_seen_at: new Date().toISOString(),
              expires_at: expiresAt
            },
            '?on_conflict=anon_id',
            'resolution=merge-duplicates,return=minimal',
            action
          );
        }

        const rawRating = body.rating !== undefined && body.rating !== null ? Number(body.rating) : null;
        const rating = rawRating !== null && rawRating >= 1 && rawRating <= 5 ? Math.round(rawRating) : null;

        const fbRes = await supabaseRequest(
          'beta_feedback',
          'POST',
          {
            anon_id: anonId,
            session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null,
            category: String(body.category || 'general').slice(0, 32),
            rating,
            message,
            page_context: typeof body.pageContext === 'string' ? body.pageContext.slice(0, 64) : null,
            metadata: sanitizeObject(body.metadata) || {},
            expires_at: expiresAt
          },
          '',
          'return=minimal',
          action
        );

        return res.status(fbRes.ok ? 200 : 502).json({ ok: fbRes.ok });
      }

      case 'delete_user_data': {
        const ownership = await verifyUserOwnership(anonId, secretHash, action);
        if (ownership.exists && !ownership.verified) {
          return res.status(403).json({ ok: false, error: 'Unauthorized deletion request' });
        }

        const encodedId = encodeURIComponent(anonId);
        const tables = [
          'beta_events',
          'beta_errors',
          'beta_academic_snapshots',
          'beta_sessions',
          'beta_feedback',
          'beta_consents',
          'beta_users'
        ];
        const results = await Promise.all(
          tables.map(t => supabaseRequest(t, 'DELETE', undefined, `?anon_id=eq.${encodedId}`, 'return=minimal', action))
        );
        const allOk = results.every(r => r.ok);
        return res.status(allOk ? 200 : 502).json({ ok: allOk });
      }

      default:
        return res.status(400).json({ ok: false, error: 'Unknown action' });
    }
  } catch (err) {
    console.error('[beta-api] Unexpected error', {
      action,
      message: err instanceof Error ? err.message.slice(0, 200) : 'Unknown error'
    });
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
