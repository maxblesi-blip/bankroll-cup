import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Client-side (Browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Server-side (Node.js)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Types
export interface Ticket {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  title: string;
  category: 'bug' | 'feature' | 'question' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  closed_at: string | null;
  deleted_at: string | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: 'user' | 'mod' | 'admin';
  message: string;
  image_url: string | null;
  created_at: string;
}
