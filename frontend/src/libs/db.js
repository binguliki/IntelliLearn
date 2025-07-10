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

export async function upsertChatMemory(userId, memory) {
  const { error } = await supabase
    .from('Chat Memory')
    .upsert([
      { user_id: userId, memory }
    ]);
  return { error };
}

export async function deleteChatMemory(userId) {
  const { error } = await supabase
    .from('Chat Memory')
    .delete()
    .eq('user_id', userId);
  return { error };
}

export async function insertUser({ id, email, full_name }) {
  const { error } = await supabase
    .from('Users')
    .insert([
      { id, email, full_name }
    ]);
  return { error };
}
