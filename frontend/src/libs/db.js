import { supabase } from './supabase';

export async function fetchChatMemory(userId) {
  const { data, error } = await supabase
    .from('Chat Memory')
    .select('memory')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') return { memory: [], error }; 
  return { memory: data?.memory || [], error: null };
}

// Instead of updating always, we would create a user if they don't exist and update on collision.
export async function upsertChatMemory(userId, memory) {
  const { error } = await supabase
    .from('Chat Memory')
    .upsert(
      [{ user_id: userId, memory }],
      { onConflict: 'user_id' }
    );
  return { error };
}

export async function deleteChatMemory(userId) {
  try {
    const { error } = await supabase
      .from('Chat Memory')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Database error deleting chat memory:', error);
      return { error };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Unexpected error deleting chat memory:', error);
    return { error };
  }
}

export async function insertUser({ id, email, full_name }) {
  try {
    const { error } = await supabase
      .from('Users')
      .insert([
        { id, email, full_name }
      ]);
    
    if (error) {
      console.error('Database error inserting user:', error);
      return { error };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Unexpected error inserting user:', error);
    return { error };
  }
}

// Fetch all notes for a user
export async function fetchUserNotes(userId) {
  try {
    const { data, error } = await supabase
      .from('Notes')
      .select('notes')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Database error fetching notes:', error);
      return { notes: [], error };
    }
    return { notes: data?.notes || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching notes:', error);
    return { notes: [], error };
  }
}
