import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Security - Check secret token
    const token = req.headers['x-cleanup-token'] || req.query.token;
    const expectedToken = process.env.CLEANUP_SECRET_TOKEN;

    if (!expectedToken || token !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete tickets closed more than 30 days ago
    const { data, error } = await supabaseAdmin.rpc('cleanup_old_closed_tickets');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Cleanup completed',
    });
  } catch (error) {
    console.error('Error cleaning up tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
