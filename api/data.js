const TABLE = '/rest/v1/app_state';

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('The timetable database is not configured.');
  return { url: url.replace(/\/$/, ''), key };
}

function bearer(req) {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}

async function databaseRequest(req, route, options = {}) {
  const { url, key } = config();
  const token = bearer(req);
  if (!token) throw Object.assign(new Error('Sign in to use the shared timetable.'), { status: 401 });
  const response = await fetch(url + TABLE + route, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.text();
  let data;
  try { data = body ? JSON.parse(body) : null; } catch { data = null; }
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? 401 : response.status;
    throw Object.assign(new Error(data?.message || data?.hint || 'The timetable database request failed.'), { status });
  }
  return data;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Authorization');
  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    if (req.method === 'GET') {
      const rows = await databaseRequest(req, '?id=eq.main&select=version,payload&limit=1');
      return res.status(200).json(rows?.[0] || { version: null, payload: null });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || !body.payload || body.payload.version !== 1 || !Number.isInteger(body.expectedVersion) && body.expectedVersion !== null) {
      return res.status(400).json({ error: 'Invalid timetable data or version.' });
    }
    const result = body.expectedVersion === null
      ? await databaseRequest(req, '?select=version,payload', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ id: 'main', version: 1, payload: body.payload })
        })
      : await databaseRequest(req, `?id=eq.main&version=eq.${body.expectedVersion}&select=version,payload`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ version: body.expectedVersion + 1, payload: body.payload, updated_at: new Date().toISOString() })
        });
    if (!result?.length) return res.status(409).json({ error: 'The shared timetable changed in another session. Reload to get the latest version.' });
    return res.status(200).json(result[0]);
  } catch (error) {
    const status = error.status || (error.message.includes('not configured') ? 503 : 500);
    return res.status(status).json({ error: error.message || 'Unexpected server error.' });
  }
};
