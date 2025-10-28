import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Ticket ID required' });
  }

  // GET - Lade alle Messages für Ticket
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST - Sende neue Message
  if (req.method === 'POST') {
    try {
      const { user_id, user_name, user_role, message, image_url } = req.body;

      if (!user_id || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert([
          {
            ticket_id: id,
            user_id,
            user_name,
            user_role: user_role || 'user',
            message,
            image_url: image_url || null,
          },
        ])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Discord Notification
      if (process.env.DISCORD_WEBHOOK_URL) {
        await notifyDiscord(id, user_name, message);
      }

      return res.status(201).json(data);
    } catch (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function notifyDiscord(ticketId: string, userName: string, message: string) {
  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**Neuer Support Ticket Kommentar**`,
        embeds: [
          {
            title: `Ticket #${ticketId}`,
            description: message.substring(0, 200),
            fields: [
              {
                name: 'Von',
                value: userName,
                inline: true,
              },
            ],
            color: 3447003,
          },
        ],
      }),
    });
  } catch (error) {
    console.error('Discord notification failed:', error);
  }
}