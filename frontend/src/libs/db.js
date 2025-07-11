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
  try {
    console.log('Upserting chat memory for user:', userId, 'with memory:', memory);
    
    const { data, error } = await supabase
      .from('Chat Memory')
      .upsert(
        [{ user_id: userId, memory }],
        { onConflict: 'user_id' }
      );
    
    if (error) {
      console.error('Database error upserting chat memory:', error);
      return { error };
    }
    
    console.log('Successfully upserted chat memory. Data:', data);
    return { error: null, data };
  } catch (error) {
    console.error('Unexpected error upserting chat memory:', error);
    return { error };
  }
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
