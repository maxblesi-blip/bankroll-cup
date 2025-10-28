import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_role, status } = req.query;

    // Nur Admin/Mod
    if (user_role !== 'admin' && user_role !== 'mod') {
      return res.status(403).json({ error: 'Forbidden - only admins and mods' });
    }

    let query = supabase
      .from('tickets')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}