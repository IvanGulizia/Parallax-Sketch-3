import { createClient } from '@supabase/supabase-js';

// Vercel injecte ces variables automatiquement si elles sont définies dans le tableau de bord
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return response.status(500).json({ error: 'Missing Supabase credentials in Vercel Settings' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { content } = request.body;

  if (!content) {
    return response.status(400).json({ error: 'Missing content payload' });
  }

  try {
    // Insertion dans la table 'drawings'
    const { data, error } = await supabase
      .from('drawings')
      .insert([{ content: content }])
      .select()
      .single();

    if (error) throw error;

    return response.status(200).json({ id: data.id });
  } catch (error: any) {
    console.error("Supabase Error:", error);
    return response.status(500).json({ error: error.message });
  }
}