import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  return neon(url);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const sql = getClient();

    if (req.method === 'GET') {
      const rows = await sql`SELECT key, value FROM inventory`;
      const result: Record<string, unknown> = {};
      for (const row of rows) result[row.key as string] = row.value;
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const { key, value } = req.body as { key: string; value: unknown };
      if (!key || value === undefined) return res.status(400).json({ error: 'key and value required' });

      await sql`
        INSERT INTO inventory (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[api/inventory]', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
