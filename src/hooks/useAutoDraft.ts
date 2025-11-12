import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DraftData {
  title: string;
  description: string;
  category: string;
  urgency: string;
  is_anonymous: boolean;
}

export const useAutoDraft = (data: DraftData, enabled: boolean = true) => {
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const draftIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !user) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only save if there's actual content
    if (data.title.trim() || data.description.trim()) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const draftPayload = {
            student_id: user.id,
            title: data.title,
            description: data.description,
            category: data.category || null,
            urgency: data.urgency as any,
            is_anonymous: data.is_anonymous,
          };

          if (draftIdRef.current) {
            // Update existing draft
            await supabase
              .from("complaint_drafts")
              .update(draftPayload)
              .eq("id", draftIdRef.current);
          } else {
            // Create new draft
            const { data: newDraft } = await supabase
              .from("complaint_drafts")
              .insert([draftPayload])
              .select()
              .single();

            if (newDraft) {
              draftIdRef.current = newDraft.id;
            }
          }
        } catch (error) {
          console.error("Failed to save draft:", error);
        }
      }, 2000); // Save after 2 seconds of inactivity
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, user]);

  const clearDraft = async () => {
    if (draftIdRef.current) {
      await supabase
        .from("complaint_drafts")
        .delete()
        .eq("id", draftIdRef.current);
      draftIdRef.current = null;
    }
  };

  return { clearDraft, draftId: draftIdRef.current };
};
