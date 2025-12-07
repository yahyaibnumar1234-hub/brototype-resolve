import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the number of days from request body, default to 5
    const body = await req.json().catch(() => ({}));
    const staleDays = body.staleDays || 5;
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - staleDays);

    console.log(`Looking for stale complaints older than ${staleDays} days (before ${cutoffDate.toISOString()})`);

    // Find stale open complaints with no recent activity
    // A complaint is stale if:
    // 1. Status is "open" or "in_progress"
    // 2. Last updated more than staleDays ago
    // 3. No comments in the last staleDays
    const { data: staleComplaints, error: fetchError } = await supabase
      .from('complaints')
      .select(`
        id,
        title,
        updated_at,
        student_id,
        profiles!complaints_student_id_fkey (
          full_name,
          email
        )
      `)
      .in('status', ['open', 'in_progress'])
      .lt('updated_at', cutoffDate.toISOString());

    if (fetchError) {
      console.error('Error fetching stale complaints:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${staleComplaints?.length || 0} potentially stale complaints`);

    // Filter out complaints that have recent comments
    const complaintsToClose: typeof staleComplaints = [];
    
    for (const complaint of staleComplaints || []) {
      const { data: recentComments } = await supabase
        .from('comments')
        .select('id')
        .eq('complaint_id', complaint.id)
        .gte('created_at', cutoffDate.toISOString())
        .limit(1);

      if (!recentComments || recentComments.length === 0) {
        complaintsToClose.push(complaint);
      }
    }

    console.log(`${complaintsToClose.length} complaints will be auto-closed`);

    // Close stale complaints
    const closedIds: string[] = [];
    
    for (const complaint of complaintsToClose) {
      const { error: updateError } = await supabase
        .from('complaints')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', complaint.id);

      if (!updateError) {
        closedIds.push(complaint.id);

        // Add auto-close comment
        await supabase
          .from('comments')
          .insert({
            complaint_id: complaint.id,
            user_id: complaint.student_id, // System comment
            message: `This complaint was automatically closed due to ${staleDays} days of inactivity. If the issue persists, please reopen or create a new complaint.`,
          });

        // Log activity
        await supabase
          .from('activity_feed')
          .insert({
            action_type: 'auto_closed',
            description: `Complaint "${complaint.title}" was auto-closed due to inactivity`,
            complaint_id: complaint.id,
            user_id: complaint.student_id,
            metadata: {
              reason: 'stale_complaint',
              days_inactive: staleDays,
            },
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-closed ${closedIds.length} stale complaints`,
        closedCount: closedIds.length,
        closedIds,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-close function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
