import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { status, user_role } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Ticket ID required' });
    }

    // Nur Admin/Mod
    if (user_role !== 'admin' && user_role !== 'mod') {
      return res.status(403).json({ error: 'Forbidden - only admins and mods' });
    }

    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = { status };

    // Wenn Status auf 'closed', setze closed_at
    if (status === 'closed') {
      updateData.closed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
