import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return response.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { id } = request.query;

  if (!id) {
    return response.status(400).json({ error: 'Missing Drawing ID' });
  }

  try {
    const { data, error } = await supabase
      .from('drawings')
      .select('content')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return response.status(404).json({ error: 'Drawing not found' });

    // Renvoie le JSON stocké dans la colonne content
    return response.status(200).json(data.content);
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}