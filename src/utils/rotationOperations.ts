import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { HourlyRotation } from '@/types';

export interface SavedRotation {
  id: string;
  week_start_date: string;
  rotation_data: { [date: string]: HourlyRotation[] };
  created_at: string;
  updated_at: string;
}

// Fetch rotation for a specific week
export async function fetchRotation(weekStartDate: string): Promise<SavedRotation | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('rotations')
      .select('*')
      .eq('week_start_date', weekStartDate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rotation found for this week
        return null;
      }
      console.error('Error fetching rotation:', error);
      return null;
    }

    return data as SavedRotation;
  } catch (error) {
    console.error('Exception in fetchRotation:', error);
    return null;
  }
}

// Save or update rotation for a week
export async function saveRotation(
  weekStartDate: string,
  rotationData: { [date: string]: HourlyRotation[] }
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    // Check if rotation already exists
    const existing = await fetchRotation(weekStartDate);

    if (existing) {
      // Update existing rotation
      const { error } = await supabase
        .from('rotations')
        .update({
          rotation_data: rotationData,
          updated_at: new Date().toISOString(),
        })
        .eq('week_start_date', weekStartDate);

      if (error) {
        console.error('Error updating rotation:', error);
        return false;
      }
    } else {
      // Insert new rotation
      const { error } = await supabase
        .from('rotations')
        .insert({
          week_start_date: weekStartDate,
          rotation_data: rotationData,
        });

      if (error) {
        console.error('Error inserting rotation:', error);
        return false;
      }
    }

    console.log('✅ Rotation saved to Supabase for week:', weekStartDate);
    return true;
  } catch (error) {
    console.error('Exception in saveRotation:', error);
    return false;
  }
}

// Delete rotation for a specific week
export async function deleteRotation(weekStartDate: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('rotations')
      .delete()
      .eq('week_start_date', weekStartDate);

    if (error) {
      console.error('Error deleting rotation:', error);
      return false;
    }

    console.log('✅ Rotation deleted from Supabase for week:', weekStartDate);
    return true;
  } catch (error) {
    console.error('Exception in deleteRotation:', error);
    return false;
  }
}

// Subscribe to rotation changes
export function subscribeToRotations(
  weekStartDate: string,
  callback: (rotation: SavedRotation | null) => void
) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  console.log('🔄 Setting up real-time sync for rotations...');

  const channel = supabase
    .channel(`rotation_${weekStartDate}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rotations',
        filter: `week_start_date=eq.${weekStartDate}`,
      },
      async (payload) => {
        console.log('📡 Rotation update received:', payload.eventType);
        
        if (payload.eventType === 'DELETE') {
          callback(null);
        } else {
          // Fetch the updated rotation
          const rotation = await fetchRotation(weekStartDate);
          callback(rotation);
        }
      }
    )
    .subscribe((status) => {
      console.log('📡 Rotation subscription status:', status);
    });

  return channel;
}
