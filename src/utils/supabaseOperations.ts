import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { TeamMember } from '@/types';

// Fetch all team members from Supabase
export async function fetchTeamMembers(): Promise<TeamMember[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using localStorage');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error);
      return [];
    }

    // Transform database format to app format
    return (data || []).map(member => ({
      id: member.id,
      name: member.name,
      weeklySchedule: member.weekly_schedule,
      createdAt: new Date(member.created_at),
    }));
  } catch (error) {
    console.error('Error in fetchTeamMembers:', error);
    return [];
  }
}

// Add a new team member to Supabase
export async function addTeamMember(member: Omit<TeamMember, 'id' | 'createdAt'>): Promise<TeamMember | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('team_members')
      .insert([
        {
          name: member.name,
          weekly_schedule: member.weeklySchedule,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding team member:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      weeklySchedule: data.weekly_schedule,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('Error in addTeamMember:', error);
    return null;
  }
}

// Update a team member in Supabase
export async function updateTeamMember(member: TeamMember): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured');
    return false;
  }

  try {
    const { error } = await supabase
      .from('team_members')
      .update({
        name: member.name,
        weekly_schedule: member.weeklySchedule,
      })
      .eq('id', member.id);

    if (error) {
      console.error('Error updating team member:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTeamMember:', error);
    return false;
  }
}

// Delete a team member from Supabase
export async function deleteTeamMember(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured');
    return false;
  }

  try {
    console.log('Attempting to delete team member with id:', id);
    const { data, error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting team member:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      return false;
    }

    console.log('Successfully deleted team member:', data);
    return true;
  } catch (error) {
    console.error('Exception in deleteTeamMember:', error);
    return false;
  }
}

// Subscribe to real-time changes
export function subscribeToTeamMembers(callback: (members: TeamMember[]) => void) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  console.log('Setting up real-time sync for team members...');

  const channel = supabase
    .channel('team_members_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_members',
      },
      async (payload) => {
        console.log('Realtime update received:', payload?.eventType, payload?.new || payload?.old);
        // Fetch updated data when any change occurs
        const members = await fetchTeamMembers();
        console.log('Updated team members after realtime event:', members.length);
        callback(members);
      }
    )
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });

  return channel;
}
