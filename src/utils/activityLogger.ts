import { supabase } from "@/integrations/supabase/client";

export const logActivity = async (
  complaintId: string,
  actionType: string,
  description: string,
  metadata?: Record<string, any>
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  await supabase
    .from('activity_feed')
    .insert({
      complaint_id: complaintId,
      user_id: user.id,
      action_type: actionType,
      description,
      metadata: metadata || {},
    });
};
