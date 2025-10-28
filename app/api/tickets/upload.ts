import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, fileName, ticketId, user_id } = req.body;

    if (!file || !fileName || !ticketId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Decode base64
    const buffer = Buffer.from(file, 'base64');

    // Upload to Supabase Storage
    const filePath = `tickets/${ticketId}/${user_id}/${Date.now()}-${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('ticket-images')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Get public URL
    const { data: publicData } = supabaseAdmin.storage
      .from('ticket-images')
      .getPublicUrl(filePath);

    return res.status(201).json({
      url: publicData.publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}