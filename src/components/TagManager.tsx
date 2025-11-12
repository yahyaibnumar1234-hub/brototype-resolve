import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tag {
  id: string;
  name: string;
}

interface TagManagerProps {
  complaintId: string;
}

export const TagManager = ({ complaintId }: TagManagerProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTags();
    fetchAvailableTags();
  }, [complaintId]);

  const fetchTags = async () => {
    const { data } = await supabase
      .from("complaint_tags")
      .select("tag_id, tags(id, name)")
      .eq("complaint_id", complaintId);

    if (data) {
      setTags(data.map((ct: any) => ct.tags).filter(Boolean));
    }
  };

  const fetchAvailableTags = async () => {
    const { data } = await supabase.from("tags").select("*").order("name");
    if (data) {
      setAvailableTags(data);
    }
  };

  const addTag = async (tagId: string) => {
    const { error } = await supabase.from("complaint_tags").insert({
      complaint_id: complaintId,
      tag_id: tagId,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Tag Already Added",
          description: "This tag is already on the complaint",
          variant: "destructive",
        });
      }
    } else {
      fetchTags();
    }
  };

  const removeTag = async (tagId: string) => {
    await supabase
      .from("complaint_tags")
      .delete()
      .eq("complaint_id", complaintId)
      .eq("tag_id", tagId);
    fetchTags();
  };

  const createAndAddTag = async () => {
    if (!newTagName.trim()) return;

    const { data: newTag, error } = await supabase
      .from("tags")
      .insert({ name: newTagName.trim().toLowerCase() })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Tag already exists, find it and add it
        const existing = availableTags.find(
          (t) => t.name === newTagName.trim().toLowerCase()
        );
        if (existing) {
          await addTag(existing.id);
        }
      }
    } else if (newTag) {
      await addTag(newTag.id);
      fetchAvailableTags();
    }

    setNewTagName("");
    setShowInput(false);
  };

  const unassignedTags = availableTags.filter(
    (at) => !tags.some((t) => t.id === at.id)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Tags</label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInput(!showInput)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-1">
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {showInput && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="New tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createAndAddTag()}
            />
            <Button size="sm" onClick={createAndAddTag}>
              Add
            </Button>
          </div>

          {unassignedTags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Or select existing:
              </p>
              <div className="flex flex-wrap gap-2">
                {unassignedTags.slice(0, 5).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => addTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
