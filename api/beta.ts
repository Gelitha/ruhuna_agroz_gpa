// University of Ruhuna - Faculty of Agriculture
// Lightweight Vercel Serverless API for Temporary Supabase Beta Testing Database
// Keeps SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY strictly server-side.

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
  'backup',
  'localstorage',
  'password',
  'token',
  'geolocation',
  'lat',
  'lng',
  'ip'
]);

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

  // Prevent unbounded memory growth
  if (rateLimitMap.size > 2000) {
    for (const [k, list] of rateLimitMap.entries()) {
      if (list.every(ts => ts <= windowStart)) {
        rateLimitMap.delete(k);
      }
    }
  }
  return true;
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

async function supabaseRequest(
  table: string,
  method: 'POST' | 'DELETE',
  body?: unknown,
  query = '',
  prefer = 'return=minimal'
): Promise<{ ok: boolean; status: number }> {
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

  return { ok: response.ok, status: response.status };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!isServerBetaActive()) {
    return res.status(410).json({ ok: false, error: 'Beta testing period is inactive or ended' });
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
  const action = body.action;
  if (!isValidAnonId(anonId) || typeof action !== 'string') {
    return res.status(400).json({ ok: false, error: 'Missing or invalid anonId/action' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
  if (!checkRateLimit(`${clientIp}:${anonId}`)) {
    return res.status(429).json({ ok: false, error: 'Rate limit exceeded' });
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    switch (action) {
      case 'consent': {
        const analyticsConsent = Boolean(body.analyticsConsent);
        const academicConsent = Boolean(body.academicConsent);
        const consentAction = ['granted', 'updated', 'withdrawn', 'deleted'].includes(String(body.consentAction))
          ? String(body.consentAction)
          : 'updated';

        const device = (sanitizeObject(body.device) as Record<string, unknown>) || {};
        if (analyticsConsent || academicConsent) {
          await supabaseRequest(
            'beta_users',
            'POST',
            {
              anon_id: anonId,
              device_category: String(device.deviceCategory || 'unknown').slice(0, 32),
              browser: String(device.browser || 'unknown').slice(0, 64),
              os: String(device.os || 'unknown').slice(0, 64),
              screen_dimensions: String(device.screenDimensions || 'unknown').slice(0, 32),
              language_preference: String(device.languagePreference || 'en').slice(0, 16),
              last_seen_at: new Date().toISOString(),
              expires_at: expiresAt
            },
            '?on_conflict=anon_id',
            'resolution=merge-duplicates,return=minimal'
          );
        }

        const consentRes = await supabaseRequest('beta_consents', 'POST', {
          anon_id: anonId,
          analytics_consent: analyticsConsent,
          academic_consent: academicConsent,
          consent_version: String(body.consentVersion || '1.0').slice(0, 16),
          action: consentAction,
          expires_at: expiresAt
        });

        return res.status(consentRes.ok ? 200 : 502).json({ ok: consentRes.ok });
      }

      case 'session': {
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
          'resolution=merge-duplicates,return=minimal'
        );

        return res.status(sessionRes.ok ? 200 : 502).json({ ok: sessionRes.ok });
      }

      case 'snapshot': {
        const snapshot = sanitizeObject(body.snapshot) as Record<string, unknown> | null;
        if (!snapshot || typeof snapshot.snapshotHash !== 'string' || typeof snapshot.programme !== 'string') {
          return res.status(400).json({ ok: false, error: 'Invalid academic snapshot' });
        }

        const snapRes = await supabaseRequest('beta_academic_snapshots', 'POST', {
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
        });

        return res.status(snapRes.ok ? 200 : 502).json({ ok: snapRes.ok });
      }

      case 'event': {
        const eventName = String(body.eventName || '').slice(0, 64);
        if (!eventName) return res.status(400).json({ ok: false, error: 'Missing eventName' });

        const evtRes = await supabaseRequest('beta_events', 'POST', {
          anon_id: anonId,
          session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null,
          event_name: eventName,
          feature_area: typeof body.featureArea === 'string' ? body.featureArea.slice(0, 64) : null,
          metadata: sanitizeObject(body.metadata) || {},
          expires_at: expiresAt
        });

        return res.status(evtRes.ok ? 200 : 502).json({ ok: evtRes.ok });
      }

      case 'error': {
        const message = String(body.message || '').slice(0, 1000);
        if (!message) return res.status(400).json({ ok: false, error: 'Missing error message' });

        const errRes = await supabaseRequest('beta_errors', 'POST', {
          anon_id: anonId,
          session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null,
          error_type: String(body.errorType || 'runtime').slice(0, 64),
          message,
          source: typeof body.source === 'string' ? body.source.slice(0, 256) : null,
          stack_preview: typeof body.stackPreview === 'string' ? body.stackPreview.slice(0, 1000) : null,
          context: sanitizeObject(body.context) || {},
          expires_at: expiresAt
        });

        return res.status(errRes.ok ? 200 : 502).json({ ok: errRes.ok });
      }

      case 'feedback': {
        const message = String(body.message || '').trim().slice(0, 2000);
        if (!message) return res.status(400).json({ ok: false, error: 'Feedback message is required' });

        const rawRating = body.rating !== undefined && body.rating !== null ? Number(body.rating) : null;
        const rating = rawRating !== null && rawRating >= 1 && rawRating <= 5 ? Math.round(rawRating) : null;

        const fbRes = await supabaseRequest('beta_feedback', 'POST', {
          anon_id: anonId,
          session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null,
          category: String(body.category || 'general').slice(0, 32),
          rating,
          message,
          page_context: typeof body.pageContext === 'string' ? body.pageContext.slice(0, 64) : null,
          metadata: sanitizeObject(body.metadata) || {},
          expires_at: expiresAt
        });

        return res.status(fbRes.ok ? 200 : 502).json({ ok: fbRes.ok });
      }

      case 'delete_user_data': {
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
          tables.map(t => supabaseRequest(t, 'DELETE', undefined, `?anon_id=eq.${encodedId}`))
        );
        const allOk = results.every(r => r.ok);
        return res.status(allOk ? 200 : 502).json({ ok: allOk });
      }

      default:
        return res.status(400).json({ ok: false, error: 'Unknown action' });
    }
  } catch {
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
