export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
    }
  }

  const { name, email, organization, country, phone, message, company_url } = body;

  // Silently drop honeypot submissions
  if (company_url) return res.status(200).json({ ok: true });

  // Validate required fields
  if (!name || !email || !organization || !country) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email address' });
  }

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('MAKE_WEBHOOK_URL is not set');
    return res.status(500).json({ ok: false, error: 'Server configuration error' });
  }

  const payload = {
    name,
    email,
    organization,
    country,
    phone:     phone    || null,
    message:   message  || null,
    source:    'website',
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Webhook error:', response.status, await response.text());
      return res.status(502).json({ ok: false, error: 'Failed to forward lead' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook fetch error:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
