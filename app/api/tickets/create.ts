import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, user_email, user_name, title, category, priority = 'medium' } = req.body;

    if (!user_id || !user_email || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          user_id,
          user_email,
          user_name,
          title,
          category: category || 'other',
          priority,
          status: 'open',
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}