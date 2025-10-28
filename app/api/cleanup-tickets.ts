import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Security - Check secret token (Header first, then query)
    const headerToken = req.headers['x-cleanup-token'];
    const queryToken = req.query.token;

    const token =
      (Array.isArray(headerToken) ? headerToken[0] : headerToken)?.toString() ??
      (Array.isArray(queryToken) ? queryToken[0] : queryToken)?.toString();

    const expectedToken = process.env.CLEANUP_SECRET_TOKEN;

    if (!expectedToken || token !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete tickets closed more than 30 days ago
    const { data, error } = await supabaseAdmin.rpc('cleanup_old_closed_tickets');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // data wird jetzt verwendet -> kein noUnusedLocals Fehler
    return res.status(200).json({
      success: true,
      message: 'Cleanup completed',
      result: data ?? null, // häufig: Anzahl gelöschter Zeilen
    });
  } catch (error) {
    console.error('Error cleaning up tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
